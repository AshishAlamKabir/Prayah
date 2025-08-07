import sqlite3
import os
from datetime import datetime
from werkzeug.security import generate_password_hash

class Database:
    def __init__(self, db_path='bookstore.db'):
        self.db_path = db_path
        self.init_db()
    
    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def init_db(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        
        # Books table
        c.execute('''CREATE TABLE IF NOT EXISTS books (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        title TEXT NOT NULL,
                        author TEXT NOT NULL,
                        description TEXT,
                        price REAL NOT NULL,
                        stock INTEGER NOT NULL DEFAULT 0,
                        genre TEXT,
                        image_filename TEXT,
                        stock_threshold INTEGER DEFAULT 5,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )''')
        
        # Admin users table
        c.execute('''CREATE TABLE IF NOT EXISTS admins (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        username TEXT UNIQUE NOT NULL,
                        password_hash TEXT NOT NULL,
                        email TEXT,
                        role TEXT DEFAULT 'admin',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )''')
        
        # Orders table
        c.execute('''CREATE TABLE IF NOT EXISTS orders (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        order_id TEXT UNIQUE NOT NULL,
                        customer_name TEXT NOT NULL,
                        customer_email TEXT NOT NULL,
                        customer_phone TEXT,
                        shipping_address TEXT,
                        total_amount REAL NOT NULL,
                        status TEXT DEFAULT 'pending',
                        payment_method TEXT DEFAULT 'cash_on_delivery',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )''')
        
        # Order items table
        c.execute('''CREATE TABLE IF NOT EXISTS order_items (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        order_id TEXT NOT NULL,
                        book_id INTEGER NOT NULL,
                        quantity INTEGER NOT NULL,
                        price REAL NOT NULL,
                        FOREIGN KEY (book_id) REFERENCES books (id),
                        FOREIGN KEY (order_id) REFERENCES orders (order_id)
                    )''')
        
        # Notifications table
        c.execute('''CREATE TABLE IF NOT EXISTS notifications (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        type TEXT NOT NULL,
                        title TEXT NOT NULL,
                        message TEXT NOT NULL,
                        is_read BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )''')
        
        # Sales analytics table
        c.execute('''CREATE TABLE IF NOT EXISTS sales_analytics (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        book_id INTEGER,
                        quantity_sold INTEGER DEFAULT 0,
                        revenue REAL DEFAULT 0,
                        date DATE DEFAULT CURRENT_DATE,
                        FOREIGN KEY (book_id) REFERENCES books (id)
                    )''')
        
        # Create default admin if doesn't exist
        c.execute('SELECT COUNT(*) FROM admins')
        if c.fetchone()[0] == 0:
            admin_password = generate_password_hash('admin123')
            c.execute('''INSERT INTO admins (username, password_hash, email, role) 
                        VALUES (?, ?, ?, ?)''', 
                     ('admin', admin_password, 'admin@bookstore.com', 'superadmin'))
        
        # Add sample books if none exist
        c.execute('SELECT COUNT(*) FROM books')
        if c.fetchone()[0] == 0:
            sample_books = [
                ('The Great Gatsby', 'F. Scott Fitzgerald', 'A classic American novel set in the Jazz Age, exploring themes of wealth, love, and the American Dream.', 12.99, 25, 'Fiction', 5),
                ('To Kill a Mockingbird', 'Harper Lee', 'A gripping tale of racial injustice and childhood innocence in the American South.', 13.99, 18, 'Fiction', 5),
                ('1984', 'George Orwell', 'A dystopian social science fiction novel about totalitarian control and surveillance.', 14.99, 30, 'Science Fiction', 10),
                ('Pride and Prejudice', 'Jane Austen', 'A romantic novel of manners set in Georgian England.', 11.99, 22, 'Romance', 8),
                ('The Python Programming Language', 'Guido van Rossum', 'Complete guide to Python programming for beginners and professionals.', 49.99, 3, 'Technology', 5),
                ('Digital Marketing Essentials', 'Sarah Johnson', 'Modern strategies for digital marketing in the social media age.', 29.99, 2, 'Business', 5),
                ('World History: A Complete Overview', 'Dr. Michael Brown', 'Comprehensive overview of world history from ancient times to present.', 39.99, 1, 'History', 3),
                ('Cooking Fundamentals', 'Chef Maria Lopez', 'Learn the basics of cooking with step-by-step instructions and recipes.', 24.99, 20, 'Non-Fiction', 7),
                ('Advanced JavaScript', 'John Developer', 'Master modern JavaScript with ES6+ features and best practices.', 45.99, 15, 'Technology', 6),
                ('Business Strategy 2024', 'MBA Expert', 'Latest business strategies for modern entrepreneurs and managers.', 35.99, 8, 'Business', 5)
            ]
            
            for book in sample_books:
                c.execute('''INSERT INTO books (title, author, description, price, stock, genre, stock_threshold)
                            VALUES (?, ?, ?, ?, ?, ?, ?)''', book)
        
        conn.commit()
        conn.close()
    
    def add_notification(self, notification_type, title, message):
        """Add a new notification"""
        conn = self.get_connection()
        conn.execute('''INSERT INTO notifications (type, title, message) 
                       VALUES (?, ?, ?)''', (notification_type, title, message))
        conn.commit()
        conn.close()
    
    def get_unread_notifications_count(self):
        """Get count of unread notifications"""
        conn = self.get_connection()
        count = conn.execute('SELECT COUNT(*) FROM notifications WHERE is_read = FALSE').fetchone()[0]
        conn.close()
        return count
    
    def get_recent_notifications(self, limit=10):
        """Get recent notifications"""
        conn = self.get_connection()
        notifications = conn.execute('''
            SELECT * FROM notifications 
            ORDER BY created_at DESC 
            LIMIT ?
        ''', (limit,)).fetchall()
        conn.close()
        return notifications
    
    def mark_notification_read(self, notification_id):
        """Mark notification as read"""
        conn = self.get_connection()
        conn.execute('UPDATE notifications SET is_read = TRUE WHERE id = ?', (notification_id,))
        conn.commit()
        conn.close()