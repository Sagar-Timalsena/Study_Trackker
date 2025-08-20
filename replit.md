# Study Tracker Application

## Overview

Study Tracker is a full-stack web application designed to help students track their academic progress and connect with friends. The application provides comprehensive study session tracking, subject management, progress reporting, and social features to motivate students in their academic journey.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side is built with React and TypeScript, utilizing modern frontend patterns:
- **UI Framework**: React with TypeScript for type safety
- **Styling**: Tailwind CSS for utility-first styling with custom design system variables
- **Component Library**: shadcn/ui components built on Radix UI primitives for accessibility
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe forms

### Backend Architecture
The server-side follows a RESTful API design:
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Replit's OIDC authentication system with Passport.js
- **Session Management**: Express sessions with PostgreSQL storage
- **API Design**: RESTful endpoints organized by domain (auth, subjects, friends, reports)

### Data Layer
- **Database**: PostgreSQL as the primary database
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle migrations for database versioning
- **Connection**: Neon serverless PostgreSQL with connection pooling

### Key Features Architecture

#### Authentication System
- Replit OIDC integration for secure authentication
- Session-based authentication with PostgreSQL session store
- Middleware-based route protection
- User profile management with customizable privacy settings

#### Study Tracking System
- Subject management with customizable icons and colors
- Study session recording with time tracking
- Weekly goals and progress monitoring
- Dashboard analytics with visual progress charts

#### Social Features
- Friend invitation system via email
- Weekly leaderboards for motivation
- Privacy controls for sharing progress
- Activity feeds and notifications

#### Reporting System
- Flexible date range reporting (daily, weekly, monthly, yearly)
- Subject-wise progress breakdown
- Visual charts and statistics
- Export capabilities for study data

### Development Architecture
- **Build System**: Vite for fast development and optimized production builds
- **Development Server**: Hot module replacement with Vite middleware
- **Error Handling**: Comprehensive error boundaries and API error handling
- **Logging**: Structured logging for API requests and responses

### Code Organization
- **Monorepo Structure**: Shared types and schemas between client and server
- **Type Safety**: End-to-end TypeScript with shared schema validation
- **Component Architecture**: Reusable UI components with consistent design patterns
- **Custom Hooks**: Abstracted business logic in React hooks
- **Service Layer**: Separated business logic from route handlers

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Type-safe ORM for database operations
- **express**: Web application framework for Node.js
- **passport**: Authentication middleware for Node.js

### UI and Styling
- **@radix-ui/***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Utility for creating variant-based component APIs
- **lucide-react**: Icon library for React components

### Development Tools
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **@replit/vite-plugin-***: Replit-specific development plugins

### Authentication
- **openid-client**: OpenID Connect client implementation
- **express-session**: Session middleware for Express
- **connect-pg-simple**: PostgreSQL session store

### Data Management
- **@tanstack/react-query**: Data fetching and caching library
- **react-hook-form**: Form handling library
- **zod**: Schema validation library
- **drizzle-zod**: Integration between Drizzle ORM and Zod

### Email Services
- **nodemailer**: Email sending capability for notifications and invitations

### Utilities
- **date-fns**: Date utility library
- **wouter**: Lightweight routing library
- **clsx**: Utility for constructing className strings