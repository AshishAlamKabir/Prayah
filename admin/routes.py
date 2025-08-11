from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from werkzeug.security import check_password_hash
from werkzeug.utils import secure_filename
from functools import wraps
import os
import csv
import io
from datetime import datetime
from flask import Response, current_app

from models.database import Database
from utils.analytics import Analytics

admin = Blueprint('admin', __name__, url_prefix='/admin')
db = Database()
analytics = Analytics()

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'admin_id' not in session:
            flash('Please log in to access the admin panel.', 'error')
            return redirect(url_for('admin.login'))
        return f(*args, **kwargs)
    return decorated_function

def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@admin.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        conn = db.get_connection()
        admin_user = conn.execute('SELECT * FROM admins WHERE username = ?', (username,)).fetchone()
        conn.close()
        
        if admin_user and check_password_hash(admin_user['password_hash'], password):
            session['admin_id'] = admin_user['id']
            session['admin_username'] = admin_user['username']
            session['admin_role'] = admin_user['role']
            flash('Welcome to the admin panel!', 'success')
            return redirect(url_for('admin.dashboard'))
        else:
            flash('Invalid username or password.', 'error')
    
    return render_template('admin/login.html')

@admin.route('/logout')
def logout():
    session.pop('admin_id', None)
    session.pop('admin_username', None)
    session.pop('admin_role', None)
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

@admin.route('/')
@admin.route('/dashboard')
@login_required
def dashboard():
    stats = analytics.get_dashboard_stats()
    top_books = analytics.get_top_selling_books(5)
    low_stock = analytics.get_low_stock_alerts()
    recent_orders = analytics.get_recent_orders(5)
    unread_notifications = db.get_unread_notifications_count()
    
    return render_template('admin/dashboard.html', 
                         stats=stats, 
                         top_books=top_books,
                         low_stock=low_stock,
                         recent_orders=recent_orders,
                         unread_notifications=unread_notifications)

@admin.route('/analytics')
@login_required
def analytics_page():
    stats = analytics.get_dashboard_stats()
    top_books = analytics.get_top_selling_books(10)
    genre_sales = analytics.get_sales_by_genre()
    monthly_data = analytics.get_monthly_sales_data(12)
    weekly_data = analytics.get_weekly_order_trends(12)
    
    return render_template('admin/analytics.html',
                         stats=stats,
                         top_books=top_books,
                         genre_sales=genre_sales,
                         monthly_data=monthly_data,
                         weekly_data=weekly_data)

@admin.route('/notifications')
@login_required
def notifications():
    notifications_list = db.get_recent_notifications(50)
    return render_template('admin/notifications.html', notifications=notifications_list)

@admin.route('/notifications/<int:notification_id>/read', methods=['POST'])
@login_required
def mark_notification_read(notification_id):
    db.mark_notification_read(notification_id)
    return jsonify({'success': True})

@admin.route('/books')
@login_required
def books():
    conn = db.get_connection()
    books = conn.execute('SELECT * FROM books ORDER BY created_at DESC').fetchall()
    conn.close()
    return render_template('admin/books.html', books=books)

@admin.route('/books/add', methods=['GET', 'POST'])
@login_required
def add_book():
    if request.method == 'POST':
        title = request.form['title']
        author = request.form['author']
        description = request.form.get('description', '')
        # Validate price input to prevent NaN injection
        price_str = request.form['price'].strip()
        if price_str.lower() in ['nan', 'inf', '-inf', 'infinity', '-infinity']:
            flash('Invalid price value provided.', 'error')
            return render_template('admin/add_book.html')
        try:
            price = float(price_str)
            if price < 0:
                flash('Price must be a positive number.', 'error')
                return render_template('admin/add_book.html')
        except ValueError:
            flash('Price must be a valid number.', 'error')
            return render_template('admin/add_book.html')
        # Validate stock input
        try:
            stock = int(request.form['stock'])
            if stock < 0:
                flash('Stock must be a non-negative integer.', 'error')
                return render_template('admin/add_book.html')
        except ValueError:
            flash('Stock must be a valid integer.', 'error')
            return render_template('admin/add_book.html')
        genre = request.form.get('genre', '')
        # Validate stock_threshold input
        try:
            stock_threshold = int(request.form.get('stock_threshold', '5'))
            if stock_threshold < 0:
                flash('Stock threshold must be a non-negative integer.', 'error')
                return render_template('admin/add_book.html')
        except ValueError:
            flash('Stock threshold must be a valid integer.', 'error')
            return render_template('admin/add_book.html')
        
        image_filename = None
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                name, ext = os.path.splitext(filename)
                image_filename = f"{name}_{int(datetime.now().timestamp())}{ext}"
                file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], image_filename))
        
        conn = db.get_connection()
        conn.execute('''INSERT INTO books (title, author, description, price, stock, genre, image_filename, stock_threshold)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                    (title, author, description, price, stock, genre, image_filename, stock_threshold))
        conn.commit()
        conn.close()
        
        # Add notification
        db.add_notification('book_added', 'New Book Added', f'"{title}" by {author} has been added to the catalog.')
        
        flash(f'Book "{title}" added successfully!', 'success')
        return redirect(url_for('admin.books'))
    
    return render_template('admin/add_book.html')

@admin.route('/books/<int:book_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_book(book_id):
    conn = db.get_connection()
    book = conn.execute('SELECT * FROM books WHERE id = ?', (book_id,)).fetchone()
    
    if book is None:
        flash('Book not found.', 'error')
        return redirect(url_for('admin.books'))
    
    if request.method == 'POST':
        title = request.form['title']
        author = request.form['author']
        description = request.form.get('description', '')
        # Validate price input to prevent NaN injection
        price_str = request.form['price'].strip()
        if price_str.lower() in ['nan', 'inf', '-inf', 'infinity', '-infinity']:
            flash('Invalid price value provided.', 'error')
            return render_template('admin/edit_book.html', book=book)
        try:
            price = float(price_str)
            if price < 0:
                flash('Price must be a positive number.', 'error')
                return render_template('admin/edit_book.html', book=book)
        except ValueError:
            flash('Price must be a valid number.', 'error')
            return render_template('admin/edit_book.html', book=book)
        # Validate stock input
        try:
            stock = int(request.form['stock'])
            if stock < 0:
                flash('Stock must be a non-negative integer.', 'error')
                return render_template('admin/edit_book.html', book=book)
        except ValueError:
            flash('Stock must be a valid integer.', 'error')
            return render_template('admin/edit_book.html', book=book)
        genre = request.form.get('genre', '')
        # Validate stock_threshold input
        try:
            stock_threshold = int(request.form.get('stock_threshold', '5'))
            if stock_threshold < 0:
                flash('Stock threshold must be a non-negative integer.', 'error')
                return render_template('admin/edit_book.html', book=book)
        except ValueError:
            flash('Stock threshold must be a valid integer.', 'error')
            return render_template('admin/edit_book.html', book=book)
        
        image_filename = book['image_filename']
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename and allowed_file(file.filename):
                # Delete old image if exists
                if image_filename:
                    old_path = os.path.join(current_app.config['UPLOAD_FOLDER'], image_filename)
                    if os.path.exists(old_path):
                        os.remove(old_path)
                
                filename = secure_filename(file.filename)
                name, ext = os.path.splitext(filename)
                image_filename = f"{name}_{int(datetime.now().timestamp())}{ext}"
                file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], image_filename))
        
        # Check for low stock alert
        old_stock = book['stock']
        if stock <= stock_threshold and old_stock > stock_threshold:
            db.add_notification('low_stock', 'Low Stock Alert', f'"{title}" is now low on stock ({stock} remaining).')
        
        conn.execute('''UPDATE books SET title=?, author=?, description=?, price=?, stock=?, genre=?, image_filename=?, stock_threshold=?, updated_at=CURRENT_TIMESTAMP
                       WHERE id=?''',
                    (title, author, description, price, stock, genre, image_filename, stock_threshold, book_id))
        conn.commit()
        conn.close()
        
        flash(f'Book "{title}" updated successfully!', 'success')
        return redirect(url_for('admin.books'))
    
    conn.close()
    return render_template('admin/edit_book.html', book=book)

@admin.route('/books/<int:book_id>/delete', methods=['POST'])
@login_required
def delete_book(book_id):
    conn = db.get_connection()
    book = conn.execute('SELECT * FROM books WHERE id = ?', (book_id,)).fetchone()
    
    if book:
        # Delete image file if exists
        if book['image_filename']:
            image_path = os.path.join(current_app.config['UPLOAD_FOLDER'], book['image_filename'])
            if os.path.exists(image_path):
                os.remove(image_path)
        
        conn.execute('DELETE FROM books WHERE id = ?', (book_id,))
        conn.commit()
        
        # Add notification
        db.add_notification('book_deleted', 'Book Deleted', f'"{book["title"]}" has been removed from the catalog.')
        
        flash(f'Book "{book["title"]}" deleted successfully!', 'success')
    else:
        flash('Book not found.', 'error')
    
    conn.close()
    return redirect(url_for('admin.books'))

@admin.route('/inventory')
@login_required
def inventory():
    conn = db.get_connection()
    books = conn.execute('SELECT * FROM books ORDER BY stock ASC, title').fetchall()
    low_stock = analytics.get_low_stock_alerts()
    out_of_stock = analytics.get_out_of_stock_books()
    conn.close()
    
    return render_template('admin/inventory.html', 
                         books=books, 
                         low_stock=low_stock,
                         out_of_stock=out_of_stock)

@admin.route('/inventory/export')
@login_required
def export_inventory():
    export_data = analytics.export_analytics_data()
    books = export_data['books']
    
    output = []
    output.append(['ID', 'Title', 'Author', 'Genre', 'Price', 'Stock', 'Stock Threshold', 'Total Sold', 'Total Revenue'])
    
    for book in books:
        output.append([
            book['id'], book['title'], book['author'], book['genre'] or '',
            book['price'], book['stock'], book.get('stock_threshold', 5),
            book['total_sold'], round(book['total_revenue'], 2)
        ])
    
    csv_output = io.StringIO()
    csv_writer = csv.writer(csv_output)
    csv_writer.writerows(output)
    
    return Response(
        csv_output.getvalue(),
        mimetype="text/csv",
        headers={"Content-disposition": f"attachment; filename=inventory_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
    )

@admin.route('/orders')
@login_required
def orders():
    conn = db.get_connection()
    orders = conn.execute('''
        SELECT o.*, COUNT(oi.id) as item_count,
               GROUP_CONCAT(b.title, ' | ') as book_titles
        FROM orders o
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        LEFT JOIN books b ON oi.book_id = b.id
        GROUP BY o.id
        ORDER BY o.created_at DESC
    ''').fetchall()
    conn.close()
    return render_template('admin/orders.html', orders=orders)

@admin.route('/orders/<order_id>')
@login_required
def order_detail(order_id):
    conn = db.get_connection()
    
    order = conn.execute('SELECT * FROM orders WHERE order_id = ?', (order_id,)).fetchone()
    if not order:
        flash('Order not found.', 'error')
        return redirect(url_for('admin.orders'))
    
    order_items = conn.execute('''
        SELECT oi.*, b.title, b.author, b.image_filename
        FROM order_items oi
        JOIN books b ON oi.book_id = b.id
        WHERE oi.order_id = ?
    ''', (order_id,)).fetchall()
    
    conn.close()
    return render_template('admin/order_detail.html', order=order, order_items=order_items)

@admin.route('/orders/<order_id>/update-status', methods=['POST'])
@login_required
def update_order_status(order_id):
    new_status = request.form.get('status')
    
    conn = db.get_connection()
    conn.execute('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?', 
                (new_status, order_id))
    conn.commit()
    
    # Add notification
    db.add_notification('order_updated', 'Order Status Updated', f'Order {order_id} status changed to {new_status.title()}.')
    
    conn.close()
    flash(f'Order {order_id} status updated to {new_status.title()}!', 'success')
    return redirect(url_for('admin.orders'))

@admin.route('/api/notifications/unread-count')
@login_required
def api_unread_notifications_count():
    count = db.get_unread_notifications_count()
    return jsonify({'count': count})

@admin.route('/api/chart-data/monthly-sales')
@login_required
def api_monthly_sales_data():
    data = analytics.get_monthly_sales_data(12)
    return jsonify([dict(row) for row in data])

@admin.route('/api/chart-data/genre-sales')
@login_required
def api_genre_sales_data():
    data = analytics.get_sales_by_genre()
    return jsonify([dict(row) for row in data])