from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import sqlite3
import os
import csv
from datetime import datetime
from functools import wraps
import uuid

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Database setup
def init_db():
    conn = sqlite3.connect('bookstore.db')
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
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )''')
    
    # Admin users table
    c.execute('''CREATE TABLE IF NOT EXISTS admins (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )''')
    
    # Orders table
    c.execute('''CREATE TABLE IF NOT EXISTS orders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    order_id TEXT UNIQUE NOT NULL,
                    customer_name TEXT NOT NULL,
                    customer_email TEXT NOT NULL,
                    total_amount REAL NOT NULL,
                    status TEXT DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )''')
    
    # Order items table
    c.execute('''CREATE TABLE IF NOT EXISTS order_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    order_id TEXT NOT NULL,
                    book_id INTEGER NOT NULL,
                    quantity INTEGER NOT NULL,
                    price REAL NOT NULL,
                    FOREIGN KEY (book_id) REFERENCES books (id)
                )''')
    
    # Create default admin if doesn't exist
    c.execute('SELECT COUNT(*) FROM admins')
    if c.fetchone()[0] == 0:
        admin_password = generate_password_hash('admin123')
        c.execute('INSERT INTO admins (username, password_hash) VALUES (?, ?)', 
                 ('admin', admin_password))
    
    # Add sample books if none exist
    c.execute('SELECT COUNT(*) FROM books')
    if c.fetchone()[0] == 0:
        sample_books = [
            ('The Great Gatsby', 'F. Scott Fitzgerald', 'A classic American novel set in the Jazz Age, exploring themes of wealth, love, and the American Dream.', 12.99, 25, 'Fiction'),
            ('To Kill a Mockingbird', 'Harper Lee', 'A gripping tale of racial injustice and childhood innocence in the American South.', 13.99, 18, 'Fiction'),
            ('1984', 'George Orwell', 'A dystopian social science fiction novel about totalitarian control and surveillance.', 14.99, 30, 'Science Fiction'),
            ('Pride and Prejudice', 'Jane Austen', 'A romantic novel of manners set in Georgian England.', 11.99, 22, 'Romance'),
            ('The Python Programming Language', 'Guido van Rossum', 'Complete guide to Python programming for beginners and professionals.', 49.99, 15, 'Technology'),
            ('Digital Marketing Essentials', 'Sarah Johnson', 'Modern strategies for digital marketing in the social media age.', 29.99, 12, 'Business'),
            ('World History: A Complete Overview', 'Dr. Michael Brown', 'Comprehensive overview of world history from ancient times to present.', 39.99, 8, 'History'),
            ('Cooking Fundamentals', 'Chef Maria Lopez', 'Learn the basics of cooking with step-by-step instructions and recipes.', 24.99, 20, 'Non-Fiction')
        ]
        
        for book in sample_books:
            c.execute('''INSERT INTO books (title, author, description, price, stock, genre)
                        VALUES (?, ?, ?, ?, ?, ?)''', book)
    
    conn.commit()
    conn.close()

# Authentication decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'admin_id' not in session:
            flash('Please log in to access the admin panel.', 'error')
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated_function

# Helper functions
def get_db_connection():
    conn = sqlite3.connect('bookstore.db')
    conn.row_factory = sqlite3.Row
    return conn

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Public routes
@app.route('/')
def index():
    conn = get_db_connection()
    books = conn.execute('''
        SELECT * FROM books 
        WHERE stock > 0 
        ORDER BY created_at DESC
    ''').fetchall()
    conn.close()
    return render_template('index.html', books=books)

@app.route('/book/<int:book_id>')
def book_detail(book_id):
    conn = get_db_connection()
    book = conn.execute('SELECT * FROM books WHERE id = ?', (book_id,)).fetchone()
    conn.close()
    
    if book is None:
        flash('Book not found.', 'error')
        return redirect(url_for('index'))
    
    return render_template('book_detail.html', book=book)

@app.route('/search')
def search():
    query = request.args.get('q', '')
    genre = request.args.get('genre', '')
    author = request.args.get('author', '')
    
    conn = get_db_connection()
    
    sql = "SELECT * FROM books WHERE stock > 0"
    params = []
    
    if query:
        sql += " AND (title LIKE ? OR author LIKE ? OR description LIKE ?)"
        search_term = f"%{query}%"
        params.extend([search_term, search_term, search_term])
    
    if genre:
        sql += " AND genre LIKE ?"
        params.append(f"%{genre}%")
    
    if author:
        sql += " AND author LIKE ?"
        params.append(f"%{author}%")
    
    sql += " ORDER BY title"
    
    books = conn.execute(sql, params).fetchall()
    
    # Get unique genres and authors for filters
    genres = conn.execute('SELECT DISTINCT genre FROM books WHERE genre IS NOT NULL').fetchall()
    authors = conn.execute('SELECT DISTINCT author FROM books').fetchall()
    
    conn.close()
    
    return render_template('search.html', books=books, genres=genres, authors=authors, 
                         query=query, selected_genre=genre, selected_author=author)

@app.route('/add_to_cart', methods=['POST'])
def add_to_cart():
    book_id = request.form.get('book_id')
    quantity = int(request.form.get('quantity', 1))
    
    if 'cart' not in session:
        session['cart'] = {}
    
    cart = session['cart']
    if book_id in cart:
        cart[book_id] += quantity
    else:
        cart[book_id] = quantity
    
    session['cart'] = cart
    flash('Book added to cart!', 'success')
    return redirect(request.referrer or url_for('index'))

@app.route('/cart')
def view_cart():
    if 'cart' not in session or not session['cart']:
        return render_template('cart.html', cart_items=[], total=0)
    
    conn = get_db_connection()
    cart_items = []
    total = 0
    
    for book_id, quantity in session['cart'].items():
        book = conn.execute('SELECT * FROM books WHERE id = ?', (book_id,)).fetchone()
        if book:
            item_total = book['price'] * quantity
            cart_items.append({
                'book': book,
                'quantity': quantity,
                'total': item_total
            })
            total += item_total
    
    conn.close()
    return render_template('cart.html', cart_items=cart_items, total=total)

@app.route('/checkout', methods=['GET', 'POST'])
def checkout():
    if 'cart' not in session or not session['cart']:
        flash('Your cart is empty.', 'error')
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        customer_name = request.form['customer_name']
        customer_email = request.form['customer_email']
        
        conn = get_db_connection()
        
        # Calculate total
        total = 0
        cart_items = []
        for book_id, quantity in session['cart'].items():
            book = conn.execute('SELECT * FROM books WHERE id = ?', (book_id,)).fetchone()
            if book and book['stock'] >= quantity:
                item_total = book['price'] * quantity
                cart_items.append({
                    'book_id': book_id,
                    'quantity': quantity,
                    'price': book['price']
                })
                total += item_total
            else:
                flash(f'Insufficient stock for {book["title"]}', 'error')
                conn.close()
                return redirect(url_for('view_cart'))
        
        # Create order
        order_id = str(uuid.uuid4())[:8].upper()
        conn.execute('''INSERT INTO orders (order_id, customer_name, customer_email, total_amount)
                       VALUES (?, ?, ?, ?)''', (order_id, customer_name, customer_email, total))
        
        # Add order items and update stock
        for item in cart_items:
            conn.execute('''INSERT INTO order_items (order_id, book_id, quantity, price)
                           VALUES (?, ?, ?, ?)''', 
                        (order_id, item['book_id'], item['quantity'], item['price']))
            
            # Update stock
            conn.execute('UPDATE books SET stock = stock - ? WHERE id = ?',
                        (item['quantity'], item['book_id']))
        
        conn.commit()
        conn.close()
        
        # Clear cart
        session.pop('cart', None)
        flash(f'Order {order_id} placed successfully!', 'success')
        return redirect(url_for('index'))
    
    return render_template('checkout.html')

# Admin routes
@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        conn = get_db_connection()
        admin = conn.execute('SELECT * FROM admins WHERE username = ?', (username,)).fetchone()
        conn.close()
        
        if admin and check_password_hash(admin['password_hash'], password):
            session['admin_id'] = admin['id']
            session['admin_username'] = admin['username']
            flash('Welcome to the admin panel!', 'success')
            return redirect(url_for('admin_dashboard'))
        else:
            flash('Invalid username or password.', 'error')
    
    return render_template('admin/login.html')

@app.route('/admin/logout')
def admin_logout():
    session.pop('admin_id', None)
    session.pop('admin_username', None)
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

@app.route('/admin')
@login_required
def admin_dashboard():
    conn = get_db_connection()
    
    # Get statistics
    total_books = conn.execute('SELECT COUNT(*) as count FROM books').fetchone()['count']
    total_stock = conn.execute('SELECT SUM(stock) as total FROM books').fetchone()['total'] or 0
    low_stock_books = conn.execute('SELECT COUNT(*) as count FROM books WHERE stock < 5').fetchone()['count']
    recent_orders = conn.execute('SELECT COUNT(*) as count FROM orders WHERE date(created_at) = date("now")').fetchone()['count']
    
    stats = {
        'total_books': total_books,
        'total_stock': total_stock,
        'low_stock_books': low_stock_books,
        'recent_orders': recent_orders
    }
    
    conn.close()
    return render_template('admin/dashboard.html', stats=stats)

@app.route('/admin/books')
@login_required
def admin_books():
    conn = get_db_connection()
    books = conn.execute('SELECT * FROM books ORDER BY created_at DESC').fetchall()
    conn.close()
    return render_template('admin/books.html', books=books)

@app.route('/admin/books/add', methods=['GET', 'POST'])
@login_required
def admin_add_book():
    if request.method == 'POST':
        title = request.form['title']
        author = request.form['author']
        description = request.form['description']
        price = float(request.form['price'])
        stock = int(request.form['stock'])
        genre = request.form['genre']
        
        image_filename = None
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                # Add timestamp to avoid conflicts
                name, ext = os.path.splitext(filename)
                image_filename = f"{name}_{int(datetime.now().timestamp())}{ext}"
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], image_filename))
        
        conn = get_db_connection()
        conn.execute('''INSERT INTO books (title, author, description, price, stock, genre, image_filename)
                       VALUES (?, ?, ?, ?, ?, ?, ?)''',
                    (title, author, description, price, stock, genre, image_filename))
        conn.commit()
        conn.close()
        
        flash('Book added successfully!', 'success')
        return redirect(url_for('admin_books'))
    
    return render_template('admin/add_book.html')

@app.route('/admin/books/<int:book_id>/edit', methods=['GET', 'POST'])
@login_required
def admin_edit_book(book_id):
    conn = get_db_connection()
    book = conn.execute('SELECT * FROM books WHERE id = ?', (book_id,)).fetchone()
    
    if book is None:
        flash('Book not found.', 'error')
        return redirect(url_for('admin_books'))
    
    if request.method == 'POST':
        title = request.form['title']
        author = request.form['author']
        description = request.form['description']
        price = float(request.form['price'])
        stock = int(request.form['stock'])
        genre = request.form['genre']
        
        image_filename = book['image_filename']
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename and allowed_file(file.filename):
                # Delete old image if exists
                if image_filename:
                    old_path = os.path.join(app.config['UPLOAD_FOLDER'], image_filename)
                    if os.path.exists(old_path):
                        os.remove(old_path)
                
                filename = secure_filename(file.filename)
                name, ext = os.path.splitext(filename)
                image_filename = f"{name}_{int(datetime.now().timestamp())}{ext}"
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], image_filename))
        
        conn.execute('''UPDATE books SET title=?, author=?, description=?, price=?, stock=?, genre=?, image_filename=?
                       WHERE id=?''',
                    (title, author, description, price, stock, genre, image_filename, book_id))
        conn.commit()
        conn.close()
        
        flash('Book updated successfully!', 'success')
        return redirect(url_for('admin_books'))
    
    conn.close()
    return render_template('admin/edit_book.html', book=book)

@app.route('/admin/books/<int:book_id>/delete', methods=['POST'])
@login_required
def admin_delete_book(book_id):
    conn = get_db_connection()
    book = conn.execute('SELECT * FROM books WHERE id = ?', (book_id,)).fetchone()
    
    if book:
        # Delete image file if exists
        if book['image_filename']:
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], book['image_filename'])
            if os.path.exists(image_path):
                os.remove(image_path)
        
        conn.execute('DELETE FROM books WHERE id = ?', (book_id,))
        conn.commit()
        flash('Book deleted successfully!', 'success')
    else:
        flash('Book not found.', 'error')
    
    conn.close()
    return redirect(url_for('admin_books'))

@app.route('/admin/inventory')
@login_required
def admin_inventory():
    conn = get_db_connection()
    books = conn.execute('SELECT * FROM books ORDER BY stock ASC, title').fetchall()
    conn.close()
    return render_template('admin/inventory.html', books=books)

@app.route('/admin/inventory/export')
@login_required
def admin_export_inventory():
    conn = get_db_connection()
    books = conn.execute('SELECT * FROM books ORDER BY title').fetchall()
    conn.close()
    
    # Create CSV response
    output = []
    output.append(['ID', 'Title', 'Author', 'Genre', 'Price', 'Stock', 'Created Date'])
    
    for book in books:
        output.append([
            book['id'],
            book['title'],
            book['author'],
            book['genre'] or '',
            book['price'],
            book['stock'],
            book['created_at']
        ])
    
    # Generate CSV file
    import io
    csv_output = io.StringIO()
    csv_writer = csv.writer(csv_output)
    csv_writer.writerows(output)
    
    from flask import Response
    return Response(
        csv_output.getvalue(),
        mimetype="text/csv",
        headers={"Content-disposition": f"attachment; filename=inventory_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
    )

@app.route('/admin/orders')
@login_required
def admin_orders():
    conn = get_db_connection()
    orders = conn.execute('''
        SELECT o.*, COUNT(oi.id) as item_count
        FROM orders o
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        GROUP BY o.id
        ORDER BY o.created_at DESC
    ''').fetchall()
    conn.close()
    return render_template('admin/orders.html', orders=orders)

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=3000, debug=True)