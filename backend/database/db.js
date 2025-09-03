const mysql = require('mysql2/promise');
require('dotenv').config();

// Determine database type and configuration
const isPostgreSQL = process.env.DATABASE_URL ? true : false;
let dbConfig;

if (isPostgreSQL) {
  // PostgreSQL configuration for Render
  const { Pool } = require('pg');
  dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };
} else {
  // MySQL configuration for local development
  dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'pos_system'
  };
}

let db;

// Initialize database connection
const initializeDatabase = async () => {
  try {
    if (isPostgreSQL) {
      // PostgreSQL connection
      const { Pool } = require('pg');
      db = new Pool(dbConfig);
      console.log('Connected to PostgreSQL database.');
    } else {
      // MySQL connection
      // First connect without database to create it if it doesn't exist
      const connection = await mysql.createConnection({
        host: dbConfig.host,
        user: dbConfig.user,
        password: dbConfig.password,
        port: dbConfig.port
      });
      
      await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
      await connection.end();
      
      // Now connect to the database
      db = await mysql.createConnection(dbConfig);
      console.log('Connected to MySQL database.');
    }
    
    return db;
  } catch (err) {
    console.error('Error connecting to database:', err.message);
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

  // Execute query for both MySQL and PostgreSQL
  async executeQuery(sql, params = []) {
    if (isPostgreSQL) {
      const result = await this.db.query(sql, params);
      return result;
    } else {
      const [result] = await this.db.execute(sql, params);
      return result;
    }
  }

  // Initialize database tables
  async initializeTables() {
    try {
      // Partners table
      const partnersTableSQL = isPostgreSQL ? `
        CREATE TABLE IF NOT EXISTS partners (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(20) CHECK (type IN ('investor', 'supplier')) NOT NULL,
          phone_no VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      ` : `
        CREATE TABLE IF NOT EXISTS partners (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          type ENUM('investor', 'supplier') NOT NULL,
          phone_no VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `;
      
      await this.executeQuery(partnersTableSQL);

      // Investments table
      const investmentsTableSQL = isPostgreSQL ? `
        CREATE TABLE IF NOT EXISTS investments (
          id SERIAL PRIMARY KEY,
          partner_id INT NOT NULL,
          partner_name VARCHAR(255) NOT NULL,
          type VARCHAR(20) CHECK (type IN ('invest', 'withdraw')) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (partner_id) REFERENCES partners (id)
        )
      ` : `
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
      `;
      
      await this.executeQuery(investmentsTableSQL);

      // Add notes column to existing investments table if it doesn't exist
      if (!isPostgreSQL) {
        try {
          await this.executeQuery(`ALTER TABLE investments ADD COLUMN notes TEXT`);
        } catch (err) {
          // Column already exists, ignore error
          if (!err.message.includes('Duplicate column name')) {
            console.log('Note: investments table notes column may already exist');
          }
        }
      }

      // Inventory table
      const inventoryTableSQL = isPostgreSQL ? `
        CREATE TABLE IF NOT EXISTS inventory (
          id SERIAL PRIMARY KEY,
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
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      ` : `
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
      `;
      
      await this.executeQuery(inventoryTableSQL);
      
      // Add missing columns to existing inventory table if they don't exist (MySQL only)
      if (!isPostgreSQL) {
        try {
          await this.executeQuery('ALTER TABLE inventory ADD COLUMN category VARCHAR(255)');
        } catch (err) {
          // Column already exists, ignore error
        }
        
        try {
          await this.executeQuery('ALTER TABLE inventory ADD COLUMN supplier VARCHAR(255)');
        } catch (err) {
          // Column already exists, ignore error
        }
        
        try {
          await this.executeQuery('ALTER TABLE inventory ADD COLUMN min_stock INT DEFAULT 0');
        } catch (err) {
          // Column already exists, ignore error
        }
        
        try {
          await this.executeQuery('ALTER TABLE inventory ADD COLUMN description TEXT');
        } catch (err) {
          // Column already exists, ignore error
        }
        
        try {
          await this.executeQuery('ALTER TABLE inventory ADD COLUMN barcode VARCHAR(255)');
        } catch (err) {
          // Column already exists, ignore error
        }
      }

      // Sales table (invoice header)
      const salesTableSQL = isPostgreSQL ? `
        CREATE TABLE IF NOT EXISTS sales (
          id SERIAL PRIMARY KEY,
          invoice VARCHAR(100) UNIQUE NOT NULL,
          date DATE NOT NULL,
          customer_name VARCHAR(255),
          customer_phone VARCHAR(50),
          subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
          tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          total_amount DECIMAL(10,2) NOT NULL,
          paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          status VARCHAR(20) CHECK (status IN ('paid', 'unpaid', 'partial')) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      ` : `
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
      `;
      
      await this.executeQuery(salesTableSQL);

      // Sales items table (invoice line items)
      const salesItemsTableSQL = isPostgreSQL ? `
        CREATE TABLE IF NOT EXISTS sales_items (
          id SERIAL PRIMARY KEY,
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
      ` : `
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
      `;
      
      await this.executeQuery(salesItemsTableSQL);

      // Returns table
      const returnsTableSQL = isPostgreSQL ? `
        CREATE TABLE IF NOT EXISTS returns (
          id SERIAL PRIMARY KEY,
          sale_id INT NOT NULL,
          reason VARCHAR(255) NOT NULL,
          refund_amount DECIMAL(10,2) NOT NULL,
          items_data TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE
        )
      ` : `
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
      
      await this.executeQuery(returnsTableSQL);

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