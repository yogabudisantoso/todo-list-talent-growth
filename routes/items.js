const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// GET all items for the logged-in user with pagination
router.get('/', async (req, res) => {
  try {
    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // Get total count of items for the user
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM todos WHERE user_id = ?', 
      [req.user.id]
    );
    const total = countResult[0].total;
    
    // Calculate total pages
    const totalPages = Math.ceil(total / limit);
    
    // Get paginated items
    const [items] = await db.query(
      'SELECT * FROM todos WHERE user_id = ? LIMIT ? OFFSET ?',
      [req.user.id, limit, offset]
    );
    
    // Format the items to match the requested structure
    const formattedItems = items.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      status: item.status,
      createdAt: item.created_at
    }));
    
    // Return paginated response with metadata
    res.json({
      status: "success",
      message: "Todo items retrieved successfully",
      data: formattedItems,
      pagination: {
        total,
        page,
        totalPages,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ 
      status: "error", 
      message: "Something went wrong",
      error: {
        code: 500,
        details: "Error fetching todo items: " + error.message
      }
    });
  }
});

// GET a specific item by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM todos WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        status: "error",
        message: "Resource not found",
        error: {
          code: 404,
          details: "Todo item not found"
        }
      });
    }
    
    // Format the response
    const todo = {
      id: rows[0].id,
      title: rows[0].title,
      description: rows[0].description,
      status: rows[0].status,
      createdAt: rows[0].created_at
    };
    
    res.json({
      status: "success",
      message: "Todo item retrieved successfully",
      data: todo
    });
  } catch (error) {
    console.error('Error fetching todo:', error);
    res.status(500).json({ 
      status: "error", 
      message: "Something went wrong",
      error: {
        code: 500,
        details: "Error fetching todo item: " + error.message
      }
    });
  }
});

// POST a new item
router.post('/', async (req, res) => {
  try {
    const { title, description, status } = req.body;
    
    if (!title) {
      return res.status(400).json({ 
        status: "error",
        message: "Validation failed",
        error: {
          code: 400,
          details: "Title is required"
        }
      });
    }
    
    const [result] = await db.query(
      'INSERT INTO todos (title, description, status, user_id) VALUES (?, ?, ?, ?)',
      [title, description, status || 'pending', req.user.id]
    );
    
    const [newTodo] = await db.query('SELECT * FROM todos WHERE id = ?', [result.insertId]);
    
    res.status(201).json({
      status: "success",
      message: "Todo item created successfully",
      data: {
        id: newTodo[0].id,
        title: newTodo[0].title,
        description: newTodo[0].description,
        status: newTodo[0].status,
        createdAt: newTodo[0].created_at,
        userId: newTodo[0].user_id
      }
    });
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ 
      status: "error", 
      message: "Something went wrong",
      error: {
        code: 500,
        details: "Error creating todo item: " + error.message
      }
    });
  }
});

// PUT (update) an item
router.put('/:id', async (req, res) => {
  try {
    const { title, description, status } = req.body;
    const todoId = req.params.id;
    
    // Check if todo exists and belongs to the user
    const [existingTodo] = await db.query('SELECT * FROM todos WHERE id = ? AND user_id = ?', [todoId, req.user.id]);
    
    if (existingTodo.length === 0) {
      return res.status(404).json({ 
        status: "error",
        message: "Resource not found",
        error: {
          code: 404,
          details: "Todo item not found"
        }
      });
    }
    
    // Update the todo
    await db.query(
      'UPDATE todos SET title = ?, description = ?, status = ? WHERE id = ? AND user_id = ?',
      [
        title || existingTodo[0].title,
        description !== undefined ? description : existingTodo[0].description,
        status || existingTodo[0].status,
        todoId,
        req.user.id
      ]
    );
    
    // Get the updated todo
    const [updatedTodo] = await db.query('SELECT * FROM todos WHERE id = ?', [todoId]);
    
    // Format the response
    const todo = {
      id: updatedTodo[0].id,
      title: updatedTodo[0].title,
      description: updatedTodo[0].description,
      status: updatedTodo[0].status,
      createdAt: updatedTodo[0].created_at,
      updatedAt: updatedTodo[0].updated_at
    };
    
    res.json({
      status: "success",
      message: "Todo item updated successfully",
      data: todo
    });
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ 
      status: "error", 
      message: "Something went wrong",
      error: {
        code: 500,
        details: "Error updating todo item: " + error.message
      }
    });
  }
});

// DELETE an item
router.delete('/:id', async (req, res) => {
  try {
    const todoId = req.params.id;
    
    // Check if todo exists and belongs to the user
    const [existingTodo] = await db.query('SELECT * FROM todos WHERE id = ? AND user_id = ?', [todoId, req.user.id]);
    
    if (existingTodo.length === 0) {
      return res.status(404).json({ 
        status: "error",
        message: "Resource not found",
        error: {
          code: 404,
          details: "Todo item not found"
        }
      });
    }
    
    // Delete the todo
    await db.query('DELETE FROM todos WHERE id = ? AND user_id = ?', [todoId, req.user.id]);
    
    res.json({
      status: "success",
      message: "Todo item deleted successfully",
      data: {
        id: todoId
      }
    });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ 
      status: "error", 
      message: "Something went wrong",
      error: {
        code: 500,
        details: "Error deleting todo item: " + error.message
      }
    });
  }
});

module.exports = router;