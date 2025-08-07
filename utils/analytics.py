import sqlite3
from datetime import datetime, timedelta

class Analytics:
    def __init__(self, db_path='bookstore.db'):
        self.db_path = db_path
    
    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def get_dashboard_stats(self):
        """Get comprehensive dashboard statistics"""
        conn = self.get_connection()
        
        # Basic stats
        total_books = conn.execute('SELECT COUNT(*) as count FROM books').fetchone()['count']
        total_stock = conn.execute('SELECT SUM(stock) as total FROM books').fetchone()['total'] or 0
        low_stock_books = conn.execute('SELECT COUNT(*) as count FROM books WHERE stock <= stock_threshold').fetchone()['count']
        out_of_stock = conn.execute('SELECT COUNT(*) as count FROM books WHERE stock = 0').fetchone()['count']
        
        # Order stats
        total_orders = conn.execute('SELECT COUNT(*) as count FROM orders').fetchone()['count']
        pending_orders = conn.execute('SELECT COUNT(*) as count FROM orders WHERE status = "pending"').fetchone()['count']
        today_orders = conn.execute('SELECT COUNT(*) as count FROM orders WHERE date(created_at) = date("now")').fetchone()['count']
        
        # Revenue stats
        total_revenue = conn.execute('SELECT SUM(total_amount) as revenue FROM orders WHERE status != "cancelled"').fetchone()['revenue'] or 0
        today_revenue = conn.execute('SELECT SUM(total_amount) as revenue FROM orders WHERE date(created_at) = date("now") AND status != "cancelled"').fetchone()['revenue'] or 0
        
        conn.close()
        
        return {
            'total_books': total_books,
            'total_stock': total_stock,
            'low_stock_books': low_stock_books,
            'out_of_stock': out_of_stock,
            'total_orders': total_orders,
            'pending_orders': pending_orders,
            'today_orders': today_orders,
            'total_revenue': round(total_revenue, 2),
            'today_revenue': round(today_revenue, 2)
        }
    
    def get_top_selling_books(self, limit=5):
        """Get top selling books"""
        conn = self.get_connection()
        top_books = conn.execute('''
            SELECT b.id, b.title, b.author, b.price, b.stock,
                   SUM(oi.quantity) as total_sold,
                   SUM(oi.quantity * oi.price) as total_revenue
            FROM books b
            JOIN order_items oi ON b.id = oi.book_id
            JOIN orders o ON oi.order_id = o.order_id
            WHERE o.status != 'cancelled'
            GROUP BY b.id
            ORDER BY total_sold DESC
            LIMIT ?
        ''', (limit,)).fetchall()
        conn.close()
        return top_books
    
    def get_low_stock_alerts(self):
        """Get books with low stock"""
        conn = self.get_connection()
        low_stock = conn.execute('''
            SELECT * FROM books 
            WHERE stock <= stock_threshold AND stock > 0
            ORDER BY stock ASC
        ''').fetchall()
        conn.close()
        return low_stock
    
    def get_out_of_stock_books(self):
        """Get out of stock books"""
        conn = self.get_connection()
        out_of_stock = conn.execute('''
            SELECT * FROM books 
            WHERE stock = 0
            ORDER BY title
        ''').fetchall()
        conn.close()
        return out_of_stock
    
    def get_recent_orders(self, limit=10):
        """Get recent orders with details"""
        conn = self.get_connection()
        recent_orders = conn.execute('''
            SELECT o.*, COUNT(oi.id) as item_count,
                   GROUP_CONCAT(b.title, ', ') as book_titles
            FROM orders o
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            LEFT JOIN books b ON oi.book_id = b.id
            GROUP BY o.id
            ORDER BY o.created_at DESC
            LIMIT ?
        ''', (limit,)).fetchall()
        conn.close()
        return recent_orders
    
    def get_sales_by_genre(self):
        """Get sales data by genre"""
        conn = self.get_connection()
        genre_sales = conn.execute('''
            SELECT b.genre, 
                   SUM(oi.quantity) as total_sold,
                   SUM(oi.quantity * oi.price) as total_revenue,
                   COUNT(DISTINCT b.id) as book_count
            FROM books b
            JOIN order_items oi ON b.id = oi.book_id
            JOIN orders o ON oi.order_id = o.order_id
            WHERE o.status != 'cancelled' AND b.genre IS NOT NULL
            GROUP BY b.genre
            ORDER BY total_revenue DESC
        ''').fetchall()
        conn.close()
        return genre_sales
    
    def get_monthly_sales_data(self, months=6):
        """Get monthly sales data for chart"""
        conn = self.get_connection()
        monthly_data = conn.execute('''
            SELECT 
                strftime('%Y-%m', created_at) as month,
                COUNT(*) as order_count,
                SUM(total_amount) as revenue
            FROM orders 
            WHERE created_at >= date('now', '-{} months')
            AND status != 'cancelled'
            GROUP BY strftime('%Y-%m', created_at)
            ORDER BY month
        '''.format(months)).fetchall()
        conn.close()
        return monthly_data
    
    def get_weekly_order_trends(self, weeks=8):
        """Get weekly order trends"""
        conn = self.get_connection()
        weekly_data = conn.execute('''
            SELECT 
                strftime('%Y-W%W', created_at) as week,
                COUNT(*) as order_count,
                SUM(total_amount) as revenue
            FROM orders 
            WHERE created_at >= date('now', '-{} days')
            AND status != 'cancelled'
            GROUP BY strftime('%Y-W%W', created_at)
            ORDER BY week
        '''.format(weeks * 7)).fetchall()
        conn.close()
        return weekly_data
    
    def export_analytics_data(self):
        """Export analytics data for CSV"""
        conn = self.get_connection()
        
        # Books with sales data
        books_data = conn.execute('''
            SELECT 
                b.id, b.title, b.author, b.genre, b.price, b.stock,
                COALESCE(SUM(oi.quantity), 0) as total_sold,
                COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue
            FROM books b
            LEFT JOIN order_items oi ON b.id = oi.book_id
            LEFT JOIN orders o ON oi.order_id = o.order_id AND o.status != 'cancelled'
            GROUP BY b.id
            ORDER BY total_revenue DESC
        ''').fetchall()
        
        # Orders data
        orders_data = conn.execute('''
            SELECT 
                o.order_id, o.customer_name, o.customer_email, 
                o.total_amount, o.status, o.created_at,
                COUNT(oi.id) as item_count
            FROM orders o
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            GROUP BY o.id
            ORDER BY o.created_at DESC
        ''').fetchall()
        
        conn.close()
        
        return {
            'books': books_data,
            'orders': orders_data
        }