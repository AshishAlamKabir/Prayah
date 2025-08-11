# BookStore: E-commerce Book Platform

## Overview
BookStore is a comprehensive Flask-based e-commerce website focused on selling books, featuring a public bookstore with homepage, book details, cart/checkout system, search/filter capabilities, and a secure superadmin dashboard for inventory management. The platform uses Python Flask for backend, HTML/CSS/JavaScript for frontend, SQLite database, and includes features like book management, stock tracking, order processing, and CSV export functionality.

## User Preferences
Preferred communication style: Simple, everyday language.
Tech stack preference: TypeScript/React frontend with Node.js/Express backend.
Database preference: PostgreSQL (Neon Database) for scalability and reliability.
UI framework: Tailwind CSS with shadcn/ui components for modern design.
Security requirements: JWT-based authentication with role-based access control.
Features required: Complete educational management system with student lifecycle tracking.
Role-based access: Only PrayasAdmin has full super admin access; all other accounts are role-based with limited functionality according to their specific assignments.

## System Architecture

The application employs a comprehensive educational management platform with role-based access control, built on modern web technologies with secure authentication and granular permissions.

### Role-Based Access Control
**Super Administrator:**
- **PrayasAdmin**: Full system access - manages all schools, culture categories, users, and system settings

**School Administrators (Limited to specific schools):**
- **BokaghatAdmin**: Manages Bokaghat Jatiya Vidyalaya only
- **BrahmaputraAdmin**: Manages Brahmaputra Jatiya Vidyalaya only  
- **MohuramukhaAdmin**: Manages Mahuramukh Jatiya Vidyalaya only

**Culture Administrators (Limited to specific categories):**
- **MusicAdmin**: Manages Music programs and activities only
- **FineArtsAdmin**: Manages Fine Arts programs only
- **DanceAdmin**: Manages Dance programs only
- **PoetryAdmin**: Manages Poetry programs only
- **DramaAdmin**: Manages Drama programs only

All role-based accounts are restricted to their assigned sections and cannot access other areas of the system.

### Frontend Architecture
- **Templates**: Jinja2 templating engine with HTML5
- **Styling**: Bootstrap 5.1.3 for responsive design and components
- **Icons**: Font Awesome 6.0.0 for consistent iconography
- **JavaScript**: Vanilla JavaScript for interactive features
- **Layout**: Base template system with public and admin layouts

### Backend Architecture
- **Framework**: Python Flask 3.1.1 with Werkzeug 3.1.3
- **Database**: SQLite with raw SQL queries for simplicity
- **Authentication**: Session-based with secure password hashing (Werkzeug)
- **File Handling**: Werkzeug secure filename handling for book cover uploads
- **API Design**: Traditional web application with form-based interactions

### Development Environment
- **Development Server**: Flask development server with debug mode
- **File Organization**: Blueprint-style organization with templates and static folders
- **Database Management**: SQLite with automatic initialization and sample data
- **File Uploads**: Local storage in static/uploads directory

### Key Components
- **Data Models**: Books (title, author, description, price, stock, genre), Admin Users (secure authentication), Orders (customer info, items, status), Order Items (book-order relationships).
- **Public Pages**: Homepage (featured books), Book Details, Search/Filter, Shopping Cart, Checkout System.
- **Admin Pages**: Secure Login, Dashboard (statistics), Book Management (add/edit/delete), Inventory Management, Orders Management, CSV Export.
- **UI Components**: Bootstrap components, responsive cards, data tables, modals, forms with validation.

### Integration with Prayas Platform
- **Navigation Integration**: The "Books" tab in the Prayas navigation now links directly to the Flask BookStore (running on port 3000).
- **External Link**: Opens bookstore in new tab with external link indicator for seamless user experience.
- **Dual Platform**: Maintains both the educational Prayas platform (React/Node.js) and commercial BookStore (Flask/Python) as integrated services.

### Data Flow
- **Client-Server Communication**: RESTful API endpoints; TanStack Query for caching and synchronization; Zod schemas for validation; comprehensive error handling.
- **State Management**: Server state via TanStack Query; form state via React Hook Form.
- **Database Operations**: Drizzle ORM for type-safe queries; IStorage abstraction; Drizzle Kit for migrations; connection pooling.

### System Design Choices
- **UI/UX**: Logo-matched design with authentic red and green color palette derived from the official Prayas logo, implemented using CSS custom properties and shadcn/ui templates.
- **Technical Implementations**: Comprehensive authentication with `bcrypt`, role-based access control, file upload systems (Multer), payment backend with Stripe and Razorpay integrations, email notifications (SendGrid).
- **Feature Specifications**:
    - **Payment System**: Supports book purchases, subscriptions, publication fees, school fees, and cultural program payments. Includes admin notifications and a payment method selector (Stripe/Razorpay).
    - **Book Publication**: User manuscript submission, admin review workflow (pending, approved, payment pending, rejected, published), secure PDF upload (50MB limit), and payment integration.
    - **Cultural Program Management**: Admin interface for program creation (instructor info, fees, scheduling), activity publishing, social media integration, and media uploads. Supports various program types and age groups.
    - **School Management**: Admin interface for creating school profiles (contact info, statistics, programs), notification system for announcements, and media gallery management. Supports multi-file uploads.
    - **Fee Payment Access Control**: Super admin controlled system where payment functionality can be enabled/disabled per school. School admins are blocked from fee payment features when access is disabled by super admin.
    - **E-commerce Features**: Complete online bookstore with cart, checkout, order management, and payment processing.
    - **Admin System**: Secure admin authentication with comprehensive book and inventory management.
    - **Data Export**: CSV export functionality for inventory reports and business analytics.

## Security Architecture

### Encryption System - AES-256-GCM
- **Implementation Date**: August 4, 2025
- **Algorithm**: AES-256-GCM (Galois/Counter Mode) - Military-grade encryption
- **Key Management**: 256-bit encryption keys with secure generation scripts
- **Authentication**: JWT tokens with SHA-256 hashing
- **Data Protection**: All sensitive student, payment, and user data encrypted
- **Validation**: Automated system health checks on startup
- **Scripts Available**: Node.js and Python key generators, security checkers
- **Status**: ✅ Production-ready, FERPA-compliant for educational data

### Available Security Tools
- `scripts/generate-keys.js` - Node.js key generation
- `scripts/generate-keys.py` - Python key generation (compatible with user's existing script)
- `scripts/check-keys.js` - Security status verification
- `examples/encryption-demo.js` - Live encryption demonstration

## External Dependencies

- **Database**: Neon Database (serverless PostgreSQL)
- **UI Library**: Radix UI primitives
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **Forms**: React Hook Form
- **Payment Gateway**: Stripe, Razorpay (with UPI support)
- **Email Service**: SendGrid
- **File Upload**: Multer
- **Encryption**: Native Node.js crypto module with AES-256-GCM
- **Development Tools**: Replit Cartographer plugin, TypeScript, ESBuild (production bundling), `tsx` (server hot reloading).
- **Containerization**: Docker, Docker Compose (for PostgreSQL, Redis, Nginx, application containers).