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
  console.error('Failed to initialize database in returns route:', err);
});

// Get all returns with sale information
router.get('/', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Database not initialized' });
    }
    
    // Check and recreate returns table if needed
    try {
      const describeTableSql = "DESCRIBE returns";
      const [tableStructure] = await db.execute(describeTableSql);
      console.log('Returns table structure:', tableStructure);
      
      // Check if sale_id column exists
      const hasSaleId = tableStructure.some(col => col.Field === 'sale_id');
      if (!hasSaleId) {
        console.log('sale_id column missing, recreating returns table...');
        try {
          // Drop foreign key constraints first
          await db.execute('DROP TABLE IF EXISTS return_items');
          await db.execute('DROP TABLE IF EXISTS returns');
          
          const createTableSql = `
            CREATE TABLE returns (
              id INT AUTO_INCREMENT PRIMARY KEY,
              sale_id INT NOT NULL,
              reason VARCHAR(255) NOT NULL,
              refund_amount DECIMAL(10,2) NOT NULL,
              items_data TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE
            )
          `;
          await db.execute(createTableSql);
          console.log('Returns table recreated successfully');
        } catch (dropError) {
          console.log('Error recreating table:', dropError.message);
        }
      }
    } catch (describeError) {
      console.log('Error checking table structure:', describeError.message);
      // If table doesn't exist, create it
      try {
        const createTableSql = `
          CREATE TABLE IF NOT EXISTS returns (
            id INT AUTO_INCREMENT PRIMARY KEY,
            sale_id INT NOT NULL,
            reason VARCHAR(255) NOT NULL,
            refund_amount DECIMAL(10,2) NOT NULL,
            items_data TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE
          )
        `;
        await db.execute(createTableSql);
        console.log('Returns table created successfully');
      } catch (createError) {
        console.log('Error creating returns table:', createError.message);
        return res.status(500).json({ error: 'Failed to create returns table' });
      }
    }
    
    // First try a simple query to test the table
    const testSql = 'SELECT COUNT(*) as count FROM returns';
    await db.execute(testSql);
    
    const sql = `
      SELECT 
        returns.*,
        sales.invoice,
        sales.customer_name,
        sales.total_amount as original_amount
      FROM returns
      LEFT JOIN sales ON returns.sale_id = sales.id
      ORDER BY returns.created_at DESC
    `;
    const [rows] = await db.execute(sql);
    res.json({ returns: rows });
  } catch (err) {
    console.error('Returns route error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get return by ID
router.get('/:id', async (req, res) => {
  try {
    const sql = `
      SELECT 
        returns.*,
        sales.invoice,
        sales.customer_name,
        sales.total_amount as original_amount
      FROM returns
      LEFT JOIN sales ON returns.sale_id = sales.id
      WHERE returns.id = ?
    `;
    const [rows] = await db.execute(sql, [req.params.id]);
    
    if (rows.length === 0) {
      res.status(404).json({ error: 'Return not found' });
      return;
    }
    
    res.json({ return: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get returns by sale ID
router.get('/sale/:saleId', async (req, res) => {
  try {
    const sql = `
      SELECT 
        returns.*,
        sales.invoice,
        sales.customer_name,
        sales.total_amount as original_amount
      FROM returns
      LEFT JOIN sales ON returns.sale_id = sales.id
      WHERE returns.sale_id = ?
      ORDER BY returns.created_at DESC
    `;
    const [rows] = await db.execute(sql, [req.params.saleId]);
    res.json({ returns: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new return
router.post('/', async (req, res) => {
  const { sale_id, reason, refund_amount, items } = req.body;
  
  if (!sale_id || !reason) {
    res.status(400).json({ error: 'Sale ID and reason are required' });
    return;
  }
  
  try {
    // Check if sale exists
    const saleCheckSql = 'SELECT * FROM sales WHERE id = ?';
    const [saleRows] = await db.execute(saleCheckSql, [sale_id]);
    
    if (saleRows.length === 0) {
      res.status(404).json({ error: 'Sale not found' });
      return;
    }
    
    const sale = saleRows[0];
    const finalRefundAmount = refund_amount || sale.total_amount;
    
    // Insert return record
    const insertSql = `
      INSERT INTO returns (sale_id, reason, refund_amount, items_data, created_at) 
      VALUES (?, ?, ?, ?, NOW())
    `;
    
    const [result] = await db.execute(insertSql, [
      sale_id,
      reason,
      finalRefundAmount,
      JSON.stringify(items || [])
    ]);
    
    // Update sale status to indicate return processed
    const updateSaleSql = 'UPDATE sales SET notes = CONCAT(COALESCE(notes, ""), "\nReturn processed: ", ?) WHERE id = ?';
    await db.execute(updateSaleSql, [reason, sale_id]);
    
    res.status(201).json({ 
      message: 'Return created successfully', 
      returnId: result.insertId,
      refundAmount: finalRefundAmount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update return
router.put('/:id', async (req, res) => {
  const { reason, refund_amount, items } = req.body;
  
  try {
    const sql = `
      UPDATE returns 
      SET reason = ?, refund_amount = ?, items_data = ?, updated_at = NOW()
      WHERE id = ?
    `;
    
    const [result] = await db.execute(sql, [
      reason,
      refund_amount,
      JSON.stringify(items || []),
      req.params.id
    ]);
    
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Return not found' });
      return;
    }
    
    res.json({ message: 'Return updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete return
router.delete('/:id', async (req, res) => {
  try {
    const sql = 'DELETE FROM returns WHERE id = ?';
    const [result] = await db.execute(sql, [req.params.id]);
    
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Return not found' });
      return;
    }
    
    res.json({ message: 'Return deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;