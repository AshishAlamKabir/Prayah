# Prayas: Revolutionary Community Organization Platform

## Overview

Prayas is a full-stack web application for a study circle organization focused on education, culture, and community development. The platform serves as a digital hub for managing schools, cultural programs, books, and community content with a socialist-themed design and comprehensive administrative features.

## User Preferences

Preferred communication style: Simple, everyday language.
Language preference: Remove "revolutionary" language - Prayas is a study circle focused on education and community development, not political revolution.
Content preference: Replace community submission form with Prayas description and approved publications showcase on home page.

## System Architecture

The application follows a modern full-stack architecture with clear separation between client and server components:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with custom socialist-themed color palette (red and green theme)
- **Build Tool**: Vite for fast development and optimized production builds
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **API Design**: RESTful JSON APIs with comprehensive error handling
- **Storage Layer**: DatabaseStorage class implementing IStorage interface

### Development Environment
- **Development Server**: Vite dev server with HMR for frontend, tsx for backend hot reloading
- **Type Checking**: Shared TypeScript configuration across client/server/shared code
- **Code Organization**: Monorepo structure with shared schema definitions
- **Path Aliases**: Configured for clean imports (@/, @shared/, @assets/)

## Key Components

### Data Models
The application manages eight primary entity types:
- **Users**: Authentication and user management with roles (user, admin, moderator), subscription status
- **User Sessions**: Secure session management with token-based authentication
- **Community Posts**: User-submitted content with approval workflow (pending, approved, rejected)
- **Schools**: Educational institution profiles with programs, contact info, statistics, and media galleries
- **Culture Categories**: Arts and cultural program categorization with YouTube channel integration
- **Books**: Digital and physical book catalog with e-commerce features, PDF downloads, and subscription controls
- **Published Works**: Organization's published materials with admin approval workflow
- **Orders**: E-commerce order management with subscription tracking

### Frontend Pages
- **Home**: Organization overview with hero section, stats, features, and community submission form
- **Schools**: Directory of educational institutions with search functionality
- **School Detail**: Individual school pages with media galleries, programs, achievements, and contact information
- **Culture**: Art and culture programs showcase with categorized displays
- **Music**: Dedicated music programs page with YouTube channel integration
- **Fine Arts**: Visual arts programs with gallery and workshop information
- **Dance/Drama/Poems**: Performing arts section with video galleries and poetry corner
- **Books**: Public book catalog with basic information and search
- **Store**: Full e-commerce platform with subscription model and PDF access
- **Login/Register**: Authentication pages with form validation
- **Admin**: Content moderation dashboard for managing community posts, published works approval, and platform statistics

### UI Components
- Complete shadcn/ui component library with custom revolutionary theming
- Custom RevolutionaryCard component for consistent styling
- Form components with validation and error handling
- Layout components (Header, Footer) with responsive navigation
- Section components for modular page construction

## Data Flow

### Client-Server Communication
- RESTful API endpoints for all data operations
- TanStack Query for caching, synchronization, and optimistic updates
- Zod schemas for runtime validation on both client and server
- Error boundaries and comprehensive error handling

### State Management
- Server state managed by TanStack Query with automatic caching
- Form state handled by React Hook Form
- No complex client-side state management needed due to server-centric approach

### Database Operations
- Drizzle ORM with type-safe database queries
- Database storage layer abstraction through IStorage interface
- Migration system using Drizzle Kit
- Connection pooling with Neon Database

## External Dependencies

### Core Technologies
- **Database**: Neon Database (serverless PostgreSQL)
- **UI Library**: Radix UI primitives for accessible components
- **Styling**: Tailwind CSS with PostCSS processing
- **Validation**: Zod for schema validation across the stack
- **Forms**: React Hook Form with Zod resolvers

### Development Tools
- **Replit Integration**: Cartographer plugin and runtime error overlay for development
- **TypeScript**: Strict type checking across the entire codebase
- **ESBuild**: For production server bundling
- **Hot Reloading**: tsx for server-side development

### Third-Party Services
- **Neon Database**: Serverless PostgreSQL hosting
- **WebSocket Support**: For real-time database connections

## Deployment Strategy

### Build Process
- Frontend: Vite build system generating optimized static assets
- Backend: ESBuild bundling server code for Node.js deployment
- Assets: Static file serving with proper caching headers

### Production Configuration
- Environment-based configuration for database connections
- Separate development and production builds
- Asset optimization and minification
- TypeScript compilation checking before deployment

### Database Management
- Schema migrations using Drizzle Kit
- Connection pooling for performance
- Environment variable configuration for database URL

The architecture prioritizes developer experience, type safety, and maintainability while supporting the study circle's educational mission through carefully designed user interfaces and comprehensive content management capabilities.

## Recent Changes

### Comprehensive Book Publication System (July 26, 2025)
✓ **Complete Publication Workflow**: Built comprehensive manuscript submission system where users can submit PDFs for review
✓ **Admin Review Interface**: Created admin dashboard with tabs for pending, approved, payment pending, rejected, and published submissions
✓ **User Submission Portal**: Added dedicated /publish route with detailed form for manuscript submission with PDF upload
✓ **Payment Integration Ready**: System prepared for Stripe payment processing after admin approval
✓ **Email Notification System**: Infrastructure ready for SendGrid email notifications at each workflow stage
✓ **Database Schema**: Added publicationSubmissions table with full workflow tracking and payment status
✓ **File Upload System**: Secure PDF manuscript upload with validation and file size limits
✓ **Status Management**: Complete status tracking from pending → approved → payment → published
✓ **Admin Actions**: Approve/reject submissions with custom notes and publication fee setting
✓ **User Dashboard Integration**: Authors can track their submission status and payment requirements

### Comprehensive Cultural Program Management System (July 26, 2025)
✓ **Complete Culture Management Interface**: Built comprehensive admin interface with 4 main sections (Overview, Add Program, Activities, Social Media)
✓ **Program Creation System**: Added detailed program creation with instructor info, fees, scheduling, and capacity management
✓ **Activity & Event System**: Implemented activity publishing system for cultural events, performances, competitions, and workshops
✓ **Social Media Integration**: Added comprehensive social media linking (Facebook, Instagram, YouTube, Twitter, Website)
✓ **Media Upload Functionality**: Complete file upload system supporting images, videos, PDFs for program documentation
✓ **Database Schema Updates**: Added culturePrograms and cultureActivities tables with full relationship mapping
✓ **Admin API Endpoints**: Created secure admin-only endpoints for culture program and activity management
✓ **Program Type Classification**: Support for regular classes, workshops, master classes, competitions, and performances
✓ **Age Group Management**: Flexible age group targeting (children, teens, adults, seniors, all ages)
✓ **Fee Structure Management**: Monthly and registration fee tracking with capacity limits
✓ **Achievement Tracking**: Awards and recognition documentation for cultural activities

### Comprehensive School Management System Implementation (July 26, 2025)
✓ **Complete School Management Interface**: Built comprehensive admin interface with 4 main sections (Overview, Add School, Notifications, Media Gallery)
✓ **School Creation System**: Added form-based school creation with contact info, statistics, programs, and facilities management
✓ **Notification & Activity System**: Implemented notification creation system for school announcements, events, and activities
✓ **Media Upload Functionality**: Added complete file upload system supporting images, videos, PDFs, and documents
✓ **Database Schema Updates**: Added schoolNotifications table with full relationship mapping and validation schemas
✓ **Admin API Endpoints**: Created secure admin-only endpoints for school and notification management with file processing
✓ **Multi-File Upload Support**: Implemented drag-and-drop file upload with preview and removal functionality
✓ **Priority & Type Management**: Added notification priority levels (low, medium, high, urgent) and types (announcement, event, admission, etc.)
✓ **School-Specific Notifications**: Support for targeting specific schools or broadcasting to all schools
✓ **Media Gallery Management**: Created infrastructure for viewing and managing all uploaded media files

### Navigation Streamlining & Author/Editor Option (July 26, 2025)
✓ **Navigation Cleanup**: Removed separate "Books" section from main navigation - all book functionality now in "Store"
✓ **Admin Access Streamlined**: Removed "Admin" tab from main navigation - admin access through user dropdown only
✓ **Author/Editor Role Selection**: Added contributorRole field allowing users to specify role as Author, Editor, or Author & Editor
✓ **Enhanced Book Display**: Updated book listings to show contributor role information
✓ **Database Schema Updates**: Added contributorRole to both books and publishedWorks tables
✓ **Clean Navigation**: Main navigation now shows only Home, Schools, Art & Culture, Community, and Store

### Enhanced Admin Book Management System (July 26, 2025)
✓ **File Upload Support**: Added multer-based file upload system for book cover images and PDF files
✓ **Book Type Classification**: Added bookType field to distinguish between paperback, PDF, and both formats
✓ **Cover Image Upload**: Admin can now upload image files directly instead of providing URLs
✓ **PDF File Upload**: Support for uploading PDF files for digital book access
✓ **File Storage**: Configured secure file storage in uploads directory with proper validation
✓ **Enhanced UI**: Updated admin interface with file upload fields and book type selection
✓ **Database Schema**: Added bookType column to books table with paperback/pdf/both options
✓ **Editor Field Added**: Added optional editor field to books table and admin interface
✓ **Display Updates**: Updated all book display components to show editor information when available

### Cultural Academy Names Update (July 26, 2025)
✓ **Traditional Academy Names**: Updated to specific traditional names per user requirements
✓ **Prayas Sangeet-kala**: Music academy for traditional and contemporary music programs
✓ **Prayas Kabya Kanan**: Poetry academy for literature and traditional verse forms
✓ **Prayas Natya Bidyalay**: Drama academy for theater and stage performance
✓ **Prayas Chitra Kala Bidyalay**: Fine arts academy for visual arts and traditional art forms
✓ **Prayas Satriya Nritya Kala Kendra**: Dance academy for classical and folk dance including Satriya
✓ **Database Updates**: Updated culture_categories table with traditional academy names
✓ **Frontend Updates**: Updated all individual academy pages to display traditional names
✓ **Dynamic Content**: Main culture page now uses database content to display updated names

### Two-Tier Authentication System Implementation (July 25, 2025)
✓ **Dual Account Types**: Implemented separate login flows for regular users and admin accounts
✓ **Regular User Account**: Created "testuser" account (testuser123) with user-level access and dashboard
✓ **Admin Account**: Enhanced "Prayasadmin" account (Prayas2025!) with full operational privileges
✓ **Role-Based Redirection**: Login automatically redirects to appropriate dashboard based on user role
✓ **Authentication Fixes**: Resolved token storage inconsistencies and logout functionality issues
✓ **Header Navigation**: Updated with visible Login/Register buttons and role-specific dropdown menus
✓ **Access Control**: Admin dashboard restricted to admin-only accounts, user dashboard for regular users

### Admin Account Creation & Enhancement (July 25, 2025)
✓ Created dedicated admin account "Prayasadmin" with operational privileges
✓ Enhanced admin dashboard with 4 specialized tabs: Publications, Book Management, Content Management, Analytics
✓ Added operational tools for publication approval, book uploads, school management, and content updates
✓ Implemented proper admin role checking and authentication middleware
✓ Optimized all logo files by 93-98% for faster loading performance
✓ Fixed school logo display issues across all pages with consistent 96px sizing

### Home Page Content Update (July 25, 2025)  
✓ Replaced community submission form with comprehensive Prayas study circle description
✓ Added goals and objectives section highlighting educational focus
✓ Created dedicated approved publications section with download functionality
✓ Updated language throughout platform to remove "revolutionary" terminology
✓ Enhanced PublicationsSection component with proper styling and download tracking

### Major Feature Enhancement (July 24, 2025)
✓ Implemented comprehensive authentication system with bcrypt password hashing
✓ Added user registration and login with session management
✓ Created detailed school pages with media galleries, programs, and contact information
✓ Built specialized art & culture sections (Music, Fine Arts, Dance/Drama/Poems) with YouTube integration
✓ Developed full e-commerce functionality for books with PDF access and subscription model
✓ Added admin approval workflow for published works
✓ Enhanced database schema with users, sessions, orders, and subscription management
✓ Implemented premium subscription system with access controls
✓ Updated header with authentication controls and user management
✓ Created comprehensive routing system for all new features

### Database Connection Fix (July 24, 2025)
✓ Fixed WebSocket connection issues with Neon Database
✓ Enhanced database configuration with connection pooling and timeout settings
✓ Added pipeline connect and secure WebSocket configuration
✓ Application now running successfully on port 5000
✓ All API endpoints tested and working correctly