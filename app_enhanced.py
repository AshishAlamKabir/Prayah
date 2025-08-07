from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from werkzeug.utils import secure_filename
import os
import uuid
from datetime import datetime
import sys

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import our modules
try:
    from models.database import Database
    from utils.analytics import Analytics
    from admin.routes import admin
except ImportError as e:
    print(f"Import error: {e}")
    # Fallback to simple initialization if modules fail
    Database = None
    Analytics = None
    admin = None

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize database and analytics
db = Database()
analytics = Analytics()

# Register blueprints
app.register_blueprint(admin)

# Public routes
@app.route('/')
def index():
    conn = db.get_connection()
    books = conn.execute('''
        SELECT * FROM books 
        WHERE stock > 0 
        ORDER BY created_at DESC
    ''').fetchall()
    conn.close()
    return render_template('index.html', books=books)

@app.route('/book/<int:book_id>')
def book_detail(book_id):
    conn = db.get_connection()
    book = conn.execute('SELECT * FROM books WHERE id = ?', (book_id,)).fetchone()
    
    if book is None:
        flash('Book not found.', 'error')
        return redirect(url_for('index'))
    
    # Get related books (same genre, different book)
    related_books = conn.execute('''
        SELECT * FROM books 
        WHERE genre = ? AND id != ? AND stock > 0 
        ORDER BY RANDOM() 
        LIMIT 4
    ''', (book['genre'], book_id)).fetchall()
    
    conn.close()
    return render_template('book_detail.html', book=book, related_books=related_books)

@app.route('/search')
def search():
    query = request.args.get('q', '')
    genre = request.args.get('genre', '')
    author = request.args.get('author', '')
    min_price = request.args.get('min_price', '')
    max_price = request.args.get('max_price', '')
    sort_by = request.args.get('sort', 'title')
    
    conn = db.get_connection()
    
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
    
    if min_price:
        sql += " AND price >= ?"
        params.append(float(min_price))
    
    if max_price:
        sql += " AND price <= ?"
        params.append(float(max_price))
    
    # Sort options
    if sort_by == 'price_low':
        sql += " ORDER BY price ASC"
    elif sort_by == 'price_high':
        sql += " ORDER BY price DESC"
    elif sort_by == 'newest':
        sql += " ORDER BY created_at DESC"
    elif sort_by == 'author':
        sql += " ORDER BY author"
    else:
        sql += " ORDER BY title"
    
    books = conn.execute(sql, params).fetchall()
    
    # Get filter options
    genres = conn.execute('SELECT DISTINCT genre FROM books WHERE genre IS NOT NULL AND stock > 0').fetchall()
    authors = conn.execute('SELECT DISTINCT author FROM books WHERE stock > 0').fetchall()
    
    conn.close()
    
    return render_template('search.html', 
                         books=books, 
                         genres=genres, 
                         authors=authors,
                         query=query, 
                         selected_genre=genre, 
                         selected_author=author,
                         min_price=min_price,
                         max_price=max_price,
                         sort_by=sort_by)

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
    
    conn = db.get_connection()
    cart_items = []
    total = 0
    
    for book_id, quantity in session['cart'].items():
        book = conn.execute('SELECT * FROM books WHERE id = ?', (book_id,)).fetchone()
        if book and book['stock'] >= quantity:
            item_total = book['price'] * quantity
            cart_items.append({
                'book': book,
                'quantity': quantity,
                'total': item_total
            })
            total += item_total
        elif book:
            # Update cart if stock is insufficient
            session['cart'][book_id] = book['stock']
            if book['stock'] > 0:
                item_total = book['price'] * book['stock']
                cart_items.append({
                    'book': book,
                    'quantity': book['stock'],
                    'total': item_total
                })
                total += item_total
                flash(f'Quantity for "{book["title"]}" adjusted to available stock.', 'warning')
            else:
                del session['cart'][book_id]
                flash(f'"{book["title"]}" is out of stock and removed from cart.', 'warning')
    
    conn.close()
    return render_template('cart.html', cart_items=cart_items, total=total)

@app.route('/remove_from_cart', methods=['POST'])
def remove_from_cart():
    book_id = request.form.get('book_id')
    
    if 'cart' in session and book_id in session['cart']:
        del session['cart'][book_id]
        flash('Item removed from cart!', 'info')
    
    return redirect(url_for('view_cart'))

@app.route('/update_cart', methods=['POST'])
def update_cart():
    book_id = request.form.get('book_id')
    quantity = int(request.form.get('quantity', 1))
    
    if 'cart' in session and book_id in session['cart']:
        if quantity > 0:
            session['cart'][book_id] = quantity
            flash('Cart updated!', 'success')
        else:
            del session['cart'][book_id]
            flash('Item removed from cart!', 'info')
    
    return redirect(url_for('view_cart'))

@app.route('/checkout', methods=['GET', 'POST'])
def checkout():
    if 'cart' not in session or not session['cart']:
        flash('Your cart is empty.', 'error')
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        customer_name = request.form['customer_name']
        customer_email = request.form['customer_email']
        customer_phone = request.form.get('customer_phone', '')
        shipping_address = request.form.get('shipping_address', '')
        payment_method = request.form.get('payment_method', 'cash_on_delivery')
        
        conn = db.get_connection()
        
        # Calculate total and prepare items
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
                flash(f'Insufficient stock for "{book["title"]}" (Available: {book["stock"]})', 'error')
                conn.close()
                return redirect(url_for('view_cart'))
        
        # Create order
        order_id = str(uuid.uuid4())[:8].upper()
        conn.execute('''INSERT INTO orders (order_id, customer_name, customer_email, customer_phone, 
                                          shipping_address, total_amount, payment_method)
                       VALUES (?, ?, ?, ?, ?, ?, ?)''', 
                    (order_id, customer_name, customer_email, customer_phone, 
                     shipping_address, total, payment_method))
        
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
        
        # Add notification for admin
        db.add_notification('new_order', 'New Order Received', 
                          f'Order {order_id} placed by {customer_name} for ${total:.2f}')
        
        # Clear cart
        session.pop('cart', None)
        flash(f'Order {order_id} placed successfully! You will receive a confirmation email shortly.', 'success')
        return render_template('order_confirmation.html', order_id=order_id, total=total)
    
    # Calculate cart total for display
    conn = db.get_connection()
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
    return render_template('checkout.html', cart_items=cart_items, total=total)

# API endpoints for AJAX requests
@app.route('/api/cart/count')
def api_cart_count():
    count = sum(session.get('cart', {}).values())
    return jsonify({'count': count})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)