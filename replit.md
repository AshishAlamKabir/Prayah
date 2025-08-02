# Prayas: Community Organization Platform

## Overview
Prayas is a full-stack web application designed as a digital hub for a study circle organization. Its primary purpose is to manage educational institutions, cultural programs, a book catalog, and community content. The platform aims to provide comprehensive administrative features and a distinct socialist-themed design to support its mission in education, culture, and community development. The project envisions a comprehensive system that streamlines operations and enhances community engagement for study circles.

## User Preferences
Preferred communication style: Simple, everyday language.
Language preference: Remove "revolutionary" language - Prayas is a study circle focused on education and community development, not political revolution.
Content preference: Replace community submission form with Prayas description and approved publications showcase on home page.

## System Architecture

The application employs a modern full-stack architecture, ensuring clear separation and efficient interaction between client and server components.

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query (React Query)
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Styling**: Tailwind CSS with a custom socialist-themed color palette (red and green)
- **Build Tool**: Vite
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM, hosted on Neon Database (serverless)
- **Schema Management**: Drizzle Kit for migrations
- **API Design**: RESTful JSON APIs
- **Storage Layer**: DatabaseStorage class implementing `IStorage` interface

### Development Environment
- **Development Server**: Vite dev server (frontend), `tsx` (backend hot reloading)
- **Type Checking**: Shared TypeScript configuration
- **Code Organization**: Monorepo structure with shared schema definitions
- **Path Aliases**: Configured for clean imports (`@/`, `@shared/`, `@assets/`)

### Key Components
- **Data Models**: Users (roles, subscriptions), User Sessions, Community Posts (approval workflow), Schools, Culture Categories, Books (e-commerce, PDF access), Published Works (admin approval), Orders.
- **Frontend Pages**: Home, Schools (directory & detail), Culture (showcase for various arts), Books (catalog), Store (e-commerce, subscriptions), Login/Register, Admin dashboard.
- **UI Components**: Full shadcn/ui library, custom `RevolutionaryCard`, validated form components, responsive layout components.

### Data Flow
- **Client-Server Communication**: RESTful API endpoints; TanStack Query for caching and synchronization; Zod schemas for validation; comprehensive error handling.
- **State Management**: Server state via TanStack Query; form state via React Hook Form.
- **Database Operations**: Drizzle ORM for type-safe queries; IStorage abstraction; Drizzle Kit for migrations; connection pooling.

### System Design Choices
- **UI/UX**: Socialist-themed design (red and green palette) using shadcn/ui templates.
- **Technical Implementations**: Comprehensive authentication with `bcrypt`, role-based access control, file upload systems (Multer), payment backend with Stripe and Razorpay integrations, email notifications (SendGrid).
- **Feature Specifications**:
    - **Payment System**: Supports book purchases, subscriptions, publication fees, school fees, and cultural program payments. Includes admin notifications and a payment method selector (Stripe/Razorpay).
    - **Book Publication**: User manuscript submission, admin review workflow (pending, approved, payment pending, rejected, published), secure PDF upload (50MB limit), and payment integration.
    - **Cultural Program Management**: Admin interface for program creation (instructor info, fees, scheduling), activity publishing, social media integration, and media uploads. Supports various program types and age groups.
    - **School Management**: Admin interface for creating school profiles (contact info, statistics, programs), notification system for announcements, and media gallery management. Supports multi-file uploads.
    - **E-commerce**: Full e-commerce platform for books with PDF access, subscription models, and order management.
    - **Authentication**: Two-tier system for regular users and administrators, with role-based redirection and secure token management.

## External Dependencies

- **Database**: Neon Database (serverless PostgreSQL)
- **UI Library**: Radix UI primitives
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **Forms**: React Hook Form
- **Payment Gateway**: Stripe, Razorpay (with UPI support)
- **Email Service**: SendGrid
- **File Upload**: Multer
- **Development Tools**: Replit Cartographer plugin, TypeScript, ESBuild (production bundling), `tsx` (server hot reloading).
- **Containerization**: Docker, Docker Compose (for PostgreSQL, Redis, Nginx, application containers).