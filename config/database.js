const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// Create a connection pool with correct credentials
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '', // Try with empty password if yours isn't working
  database: process.env.DB_NAME || 'todo_list_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Modified initialization to handle authentication errors
const initializeDatabase = async () => {
  try {
    // First try to connect without specifying a database
    const connection = mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    // Create database if it doesn't exist
    connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'todo_list_db'}`, (err) => {
      if (err) {
        console.error('Error creating database:', err);
        return;
      }
      console.log('Database created or already exists');
      
      // Use the database
      connection.query(`USE ${process.env.DB_NAME || 'todo_list_db'}`, (err) => {
        if (err) {
          console.error('Error using database:', err);
          return;
        }
        
        // Create todos table if it doesn't exist
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS todos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            status ENUM('pending', 'in-progress', 'completed') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `;
        
        connection.query(createTableQuery, (err) => {
          if (err) {
            console.error('Error creating table:', err);
            return;
          }
          console.log('Table created or already exists');
          connection.end();
        });
      });
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    console.log('Please check your MySQL credentials in the .env file');
  }
};

// Initialize the database
initializeDatabase();

// Export the pool with promise support
module.exports = pool.promise();