const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// GET all items for the logged-in user
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM todos WHERE user_id = ?', [req.user.id]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET a specific item by ID (only if it belongs to the user)
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM todos WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching todo:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST a new item (associated with the logged-in user)
router.post('/', async (req, res) => {
  try {
    const { title, description, status } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    const [result] = await db.query(
      'INSERT INTO todos (title, description, status, user_id) VALUES (?, ?, ?, ?)',
      [title, description, status || 'pending', req.user.id]
    );
    
    const [newTodo] = await db.query('SELECT * FROM todos WHERE id = ?', [result.insertId]);
    
    res.status(201).json({
      message: 'Todo created successfully',
      todo: newTodo[0]
    });
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT (update) an item (only if it belongs to the user)
router.put('/:id', async (req, res) => {
  try {
    const { title, description, status } = req.body;
    const todoId = req.params.id;
    
    // Check if todo exists and belongs to the user
    const [existingTodo] = await db.query('SELECT * FROM todos WHERE id = ? AND user_id = ?', [todoId, req.user.id]);
    
    if (existingTodo.length === 0) {
      return res.status(404).json({ message: 'Todo not found' });
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
    
    res.json({
      message: 'Todo updated successfully',
      todo: updatedTodo[0]
    });
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE an item (only if it belongs to the user)
router.delete('/:id', async (req, res) => {
  try {
    const todoId = req.params.id;
    
    // Check if todo exists and belongs to the user
    const [existingTodo] = await db.query('SELECT * FROM todos WHERE id = ? AND user_id = ?', [todoId, req.user.id]);
    
    if (existingTodo.length === 0) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    // Delete the todo
    await db.query('DELETE FROM todos WHERE id = ? AND user_id = ?', [todoId, req.user.id]);
    
    res.json({
      message: 'Todo deleted successfully',
      id: todoId
    });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;