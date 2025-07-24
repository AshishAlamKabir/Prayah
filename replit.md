# Prayas: Revolutionary Community Organization Platform

## Overview

Prayas is a full-stack web application for a revolutionary community organization focused on education, culture, and social change. The platform serves as a digital hub for managing schools, cultural programs, books, and community content with a socialist-themed design and comprehensive administrative features.

## User Preferences

Preferred communication style: Simple, everyday language.

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
The application manages six primary entity types:
- **Users**: Authentication and user management with roles (user, admin, moderator)
- **Community Posts**: User-submitted content with approval workflow (pending, approved, rejected)
- **Schools**: Educational institution profiles with programs, contact info, and statistics
- **Culture Categories**: Arts and cultural program categorization with icons and descriptions
- **Books**: Digital and physical book catalog with e-commerce features and PDF downloads
- **Published Works**: Organization's published materials and literature

### Frontend Pages
- **Home**: Organization overview with hero section, stats, features, and community submission form
- **Schools**: Directory of educational institutions with search functionality
- **Culture**: Art and culture programs showcase with categorized displays
- **Books**: E-commerce platform for revolutionary literature with search and filtering
- **Admin**: Content moderation dashboard for managing community posts and platform statistics

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

The architecture prioritizes developer experience, type safety, and maintainability while supporting the organization's revolutionary mission through carefully designed user interfaces and comprehensive content management capabilities.