const mysql = require('mysql2/promise');

// Create database connection
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  port: 3306,
  database: 'pos_system'
};

let db;

// Initialize database connection
const initializeDatabase = async () => {
  try {
    // First connect without database to create it if it doesn't exist
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port
    });
    
    await connection.execute('CREATE DATABASE IF NOT EXISTS pos_system');
    await connection.end();
    
    // Now connect to the database
    db = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database.');
    
    return db;
  } catch (err) {
    console.error('Error connecting to MySQL database:', err.message);
    throw err;
  }
};

class Database {
  constructor() {
    this.db = null;
  }

  // Initialize database connection and tables
  async initialize() {
    this.db = await initializeDatabase();
    await this.initializeTables();
  }

  // Initialize database tables
  async initializeTables() {
    try {
      // Partners table
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS partners (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          type ENUM('investor', 'supplier') NOT NULL,
          phone_no VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      // Investments table
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS investments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          partner_id INT NOT NULL,
          partner_name VARCHAR(255) NOT NULL,
          type ENUM('invest', 'withdraw') NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (partner_id) REFERENCES partners (id)
        )
      `);

      // Add notes column to existing investments table if it doesn't exist
      try {
        await this.db.execute(`
          ALTER TABLE investments ADD COLUMN notes TEXT
        `);
      } catch (err) {
        // Column already exists, ignore error
        if (!err.message.includes('Duplicate column name')) {
          console.log('Note: investments table notes column may already exist');
        }
      }

      // Inventory table
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS inventory (
          id INT AUTO_INCREMENT PRIMARY KEY,
          item_name VARCHAR(255) NOT NULL,
          sku VARCHAR(100) UNIQUE NOT NULL,
          category VARCHAR(255),
          supplier VARCHAR(255),
          buy_price DECIMAL(10,2) NOT NULL,
          sell_price DECIMAL(10,2) NOT NULL,
          quantity INT NOT NULL DEFAULT 0,
          min_stock INT DEFAULT 0,
          description TEXT,
          barcode VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      // Add missing columns to existing inventory table if they don't exist
      try {
        await this.db.execute('ALTER TABLE inventory ADD COLUMN category VARCHAR(255)');
      } catch (err) {
        // Column already exists, ignore error
      }
      
      try {
        await this.db.execute('ALTER TABLE inventory ADD COLUMN supplier VARCHAR(255)');
      } catch (err) {
        // Column already exists, ignore error
      }
      
      try {
        await this.db.execute('ALTER TABLE inventory ADD COLUMN min_stock INT DEFAULT 0');
      } catch (err) {
        // Column already exists, ignore error
      }
      
      try {
        await this.db.execute('ALTER TABLE inventory ADD COLUMN description TEXT');
      } catch (err) {
        // Column already exists, ignore error
      }
      
      try {
        await this.db.execute('ALTER TABLE inventory ADD COLUMN barcode VARCHAR(255)');
      } catch (err) {
        // Column already exists, ignore error
      }

      // Sales table (invoice header)
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS sales (
          id INT AUTO_INCREMENT PRIMARY KEY,
          invoice VARCHAR(100) UNIQUE NOT NULL,
          date DATE NOT NULL,
          customer_name VARCHAR(255),
          customer_phone VARCHAR(50),
          subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
          tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          total_amount DECIMAL(10,2) NOT NULL,
          paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          status ENUM('paid', 'unpaid', 'partial') NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      // Sales items table (invoice line items)
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS sales_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          sale_id INT NOT NULL,
          item_id INT NOT NULL,
          item_name VARCHAR(255) NOT NULL,
          sku VARCHAR(100) NOT NULL,
          quantity INT NOT NULL,
          unit_price DECIMAL(10,2) NOT NULL,
          line_total DECIMAL(10,2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE,
          FOREIGN KEY (item_id) REFERENCES inventory (id)
        )
      `);

      console.log('Database tables initialized.');
    } catch (err) {
      console.error('Error creating tables:', err);
      throw err;
    }
  }

  getDb() {
    return this.db;
  }

  async close() {
    if (this.db) {
      try {
        await this.db.end();
        console.log('Database connection closed.');
      } catch (err) {
        console.error('Error closing database:', err.message);
      }
    }
  }
}

module.exports = Database;