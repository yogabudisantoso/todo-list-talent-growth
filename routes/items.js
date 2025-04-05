const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET all items
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM todos');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET a specific item by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM todos WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching todo:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST a new item
router.post('/', async (req, res) => {
  try {
    const { title, description, status } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    const [result] = await db.query(
      'INSERT INTO todos (title, description, status) VALUES (?, ?, ?)',
      [title, description, status || 'pending']
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

// PUT (update) an item
router.put('/:id', async (req, res) => {
  try {
    const { title, description, status } = req.body;
    const todoId = req.params.id;
    
    // Check if todo exists
    const [existingTodo] = await db.query('SELECT * FROM todos WHERE id = ?', [todoId]);
    
    if (existingTodo.length === 0) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    // Update the todo
    await db.query(
      'UPDATE todos SET title = ?, description = ?, status = ? WHERE id = ?',
      [
        title || existingTodo[0].title,
        description !== undefined ? description : existingTodo[0].description,
        status || existingTodo[0].status,
        todoId
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

// DELETE an item
router.delete('/:id', async (req, res) => {
  try {
    const todoId = req.params.id;
    
    // Check if todo exists
    const [existingTodo] = await db.query('SELECT * FROM todos WHERE id = ?', [todoId]);
    
    if (existingTodo.length === 0) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    // Delete the todo
    await db.query('DELETE FROM todos WHERE id = ?', [todoId]);
    
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