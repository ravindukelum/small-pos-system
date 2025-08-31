const express = require('express');
const database = require('../database/db');
const router = express.Router();

// Create database instance
const dbInstance = new database();
let db;

// Initialize database connection
dbInstance.initialize().then(() => {
  db = dbInstance.getDb();
}).catch(err => {
  console.error('Failed to initialize database in partners route:', err);
});

// Get all partners
router.get('/', async (req, res) => {
  try {
    const sql = 'SELECT * FROM partners ORDER BY created_at DESC';
    const [rows] = await db.execute(sql);
    res.json({ partners: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get partner by ID
router.get('/:id', async (req, res) => {
  try {
    const sql = 'SELECT * FROM partners WHERE id = ?';
    const [rows] = await db.execute(sql, [req.params.id]);
    if (rows.length === 0) {
      res.status(404).json({ error: 'Partner not found' });
      return;
    }
    res.json({ partner: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new partner
router.post('/', async (req, res) => {
  const { name, type, phone_no } = req.body;
  
  if (!name || !type) {
    res.status(400).json({ error: 'Name and type are required' });
    return;
  }
  
  if (!['investor', 'supplier'].includes(type)) {
    res.status(400).json({ error: 'Type must be either investor or supplier' });
    return;
  }
  
  try {
    const sql = 'INSERT INTO partners (name, type, phone_no) VALUES (?, ?, ?)';
    const [result] = await db.execute(sql, [name, type, phone_no]);
    
    res.status(201).json({
      message: 'Partner created successfully',
      partner: { id: result.insertId, name, type, phone_no }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update partner
router.put('/:id', async (req, res) => {
  const { name, type, phone_no } = req.body;
  
  if (!name || !type) {
    res.status(400).json({ error: 'Name and type are required' });
    return;
  }
  
  if (!['investor', 'supplier'].includes(type)) {
    res.status(400).json({ error: 'Type must be either investor or supplier' });
    return;
  }
  
  try {
    const sql = 'UPDATE partners SET name = ?, type = ?, phone_no = ? WHERE id = ?';
    const [result] = await db.execute(sql, [name, type, phone_no, req.params.id]);
    
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Partner not found' });
      return;
    }
    res.json({ message: 'Partner updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete partner
router.delete('/:id', async (req, res) => {
  try {
    const sql = 'DELETE FROM partners WHERE id = ?';
    const [result] = await db.execute(sql, [req.params.id]);
    
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Partner not found' });
      return;
    }
    res.json({ message: 'Partner deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;