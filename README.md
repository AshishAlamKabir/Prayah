# BookStore - E-commerce Book Platform

A comprehensive Flask-based e-commerce website for selling books with a complete admin dashboard.

## Features

### Public Store
- **Homepage**: Featured books with search functionality
- **Book Details**: Detailed book pages with add-to-cart functionality
- **Search & Filter**: Browse books by title, author, or genre
- **Shopping Cart**: Add/remove books and manage quantities
- **Checkout System**: Simple checkout process with order management

### Admin Dashboard
- **Secure Login**: Admin authentication (Username: `admin`, Password: `admin123`)
- **Book Management**: Add, edit, and delete books with cover image uploads
- **Inventory Management**: Track stock levels with low-stock alerts
- **Orders Management**: View and manage customer orders
- **CSV Export**: Export inventory reports for analysis

## Technology Stack

- **Backend**: Python Flask 3.1.1
- **Frontend**: HTML5, CSS3, Bootstrap 5.1.3, JavaScript
- **Database**: SQLite with automatic sample data
- **Authentication**: Session-based with secure password hashing
- **File Handling**: Local image uploads for book covers

## Quick Start

1. **Install Dependencies**:
   ```bash
   pip install flask werkzeug
   ```

2. **Run the Application**:
   ```bash
   python app.py
   ```

3. **Access the Application**:
   - **Public Store**: http://localhost:3000
   - **Admin Panel**: http://localhost:3000/admin/login

## Database Schema

The application uses SQLite with the following tables:
- `books`: Book information, pricing, and stock
- `admins`: Admin user credentials
- `orders`: Customer order information
- `order_items`: Individual items in orders

## File Structure

```
├── app.py                    # Main Flask application
├── bookstore.db             # SQLite database (auto-created)
├── templates/                # Jinja2 templates
│   ├── base.html            # Base template
│   ├── index.html           # Homepage
│   ├── book_detail.html     # Book details page
│   ├── search.html          # Search/browse page
│   ├── cart.html            # Shopping cart
│   ├── checkout.html        # Checkout process
│   └── admin/               # Admin templates
│       ├── base.html        # Admin base template
│       ├── login.html       # Admin login
│       ├── dashboard.html   # Admin dashboard
│       ├── books.html       # Book management
│       ├── add_book.html    # Add new book
│       ├── edit_book.html   # Edit book
│       ├── inventory.html   # Inventory management
│       └── orders.html      # Orders management
└── static/
    └── uploads/             # Book cover images
```

## Sample Data

The application includes 8 sample books across various genres:
- Fiction classics (The Great Gatsby, To Kill a Mockingbird, 1984)
- Romance (Pride and Prejudice)
- Technology (Python Programming)
- Business (Digital Marketing)
- History (World History Overview)
- Non-Fiction (Cooking Fundamentals)

## Admin Features

- **Dashboard Statistics**: Book count, stock levels, low stock alerts
- **Book Management**: Full CRUD operations with image uploads
- **Inventory Tracking**: Real-time stock management with visual indicators
- **Order Processing**: Customer order management and status updates
- **CSV Export**: Download inventory reports for external analysis

## Security Features

- **Password Hashing**: Secure password storage using Werkzeug
- **Session Management**: Secure admin authentication
- **File Upload Security**: Safe filename handling and file type validation
- **SQL Injection Protection**: Parameterized queries throughout

## Demo Access

- **Admin Login**: username `admin`, password `admin123`
- **Sample Data**: Pre-loaded with 8 books for testing

Perfect for small to medium bookstores looking for a complete e-commerce solution!