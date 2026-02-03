# Casha - Personal Expense Tracker

A modern, full-stack expense tracking application with AI-powered insights, built with React, Express, and PostgreSQL.

## Features

- **Expense Management** - Track daily expenses with categories, descriptions, and dates
- **Budget Tracking** - Set monthly budgets (overall and per-category) with progress visualization
- **Income Sources** - Manage multiple income sources with different frequencies
- **AI Chat Assistant** - Get personalized financial advice powered by AI (OpenRouter/Claude)
- **AI Insights & Recommendations** - Automated spending analysis and daily tips
- **Multi-Currency Support** - USD, EUR, GBP, PKR, INR, and more
- **Dark/Light Theme** - Full theme support with system preference detection
- **Password Reset** - Email-based password recovery with secure tokens
- **Demo Data Seeding** - Quick setup with sample data for testing
- **Mobile Ready** - Capacitor support for Android builds

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite for build tooling
- TailwindCSS for styling
- React Router for navigation
- Framer Motion for animations
- Recharts for data visualization

### Backend
- Express.js + TypeScript
- PostgreSQL database (Docker)
- Drizzle ORM
- JWT authentication (access + refresh tokens)
- Nodemailer for emails
- Server-Sent Events (SSE) for AI streaming

### Infrastructure
- Docker & Docker Compose for PostgreSQL
- pnpm workspaces (monorepo)

## Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd Expense-tracker-main
pnpm install
```

### 2. Start PostgreSQL Database

```bash
docker-compose up -d
```

This starts PostgreSQL on port 5432 with:
- Database: `casha`
- User: `casha`
- Password: `casha_dev_password`

### 3. Configure Environment Variables

Create `apps/tracker-api/.env`:

```env
# Server
NODE_ENV=development
API_PORT=3001
FRONTEND_URL=http://localhost:5173

# PostgreSQL
DATABASE_URL=postgresql://casha:casha_dev_password@localhost:5432/casha

# JWT Authentication
JWT_SECRET=your-secret-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-key-minimum-32-chars
JWT_REFRESH_EXPIRES_IN=30d

# AI Integration (Required for AI features)
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=anthropic/claude-3-haiku
APP_URL=http://localhost:3001

# Email Configuration (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=your-email@gmail.com
```

### 4. Push Database Schema

```bash
cd apps/tracker-api
pnpm db:push
```

### 5. Start Development Servers

```bash
# Terminal 1 - Backend
cd apps/tracker-api
pnpm dev

# Terminal 2 - Frontend
cd apps/frontend
pnpm dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## Project Structure

```
Expense-tracker-main/
├── apps/
│   ├── frontend/              # React frontend
│   │   ├── src/
│   │   │   ├── app/           # Route-based pages
│   │   │   │   ├── (authenticated)/  # Protected pages
│   │   │   │   └── (public)/         # Public pages
│   │   │   ├── components/
│   │   │   │   ├── atoms/     # Basic UI (Button, Card, Input)
│   │   │   │   ├── molecules/ # Composite (FormField, StatCard)
│   │   │   │   ├── organisms/ # Complex (Forms, Modals, Lists)
│   │   │   │   └── templates/ # Layouts (AuthLayout, AppShell)
│   │   │   └── lib/
│   │   │       ├── api/       # API client & repositories
│   │   │       ├── context/   # React contexts
│   │   │       ├── hooks/     # Custom hooks
│   │   │       └── utils/     # Utilities
│   │   └── ...
│   │
│   └── tracker-api/           # Express backend
│       ├── src/
│       │   ├── config/        # Environment configuration
│       │   ├── db/            # Drizzle schema & connection
│       │   ├── middleware/    # Auth, validation, rate limiting
│       │   ├── routes/        # API endpoints
│       │   ├── services/      # Business logic
│       │   └── validation/    # Zod schemas
│       └── ...
│
├── packages/
│   └── shared/                # Shared types & utilities
│
├── docker-compose.yml         # PostgreSQL container
└── pnpm-workspace.yaml        # Monorepo configuration
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/me` | Update profile (name, photo) |
| POST | `/api/auth/change-password` | Change password |
| POST | `/api/auth/forgot-password` | Request password reset email |
| GET | `/api/auth/verify-reset-token` | Verify reset token validity |
| POST | `/api/auth/reset-password` | Reset password with token |

### Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | List expenses (paginated, filterable) |
| POST | `/api/expenses` | Create expense |
| GET | `/api/expenses/:id` | Get single expense |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List user's categories |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |

### Budgets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budgets` | List budgets with spending progress |
| POST | `/api/budgets` | Create budget |
| PUT | `/api/budgets/:id` | Update budget |
| DELETE | `/api/budgets/:id` | Delete budget |

### Income Sources
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/income-sources` | List income sources |
| POST | `/api/income-sources` | Create income source |
| PUT | `/api/income-sources/:id` | Update income source |
| DELETE | `/api/income-sources/:id` | Delete income source |

### Insights
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/insights/summary` | Spending summary for period |
| GET | `/api/insights/categories` | Category breakdown |
| GET | `/api/insights/daily` | Daily spending data |
| GET | `/api/insights/trends` | Period-over-period comparison |
| POST | `/api/insights/advice` | Get AI-powered advice |

### Chat (AI Assistant)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/conversations` | List conversations |
| POST | `/api/chat/conversations` | Create conversation |
| GET | `/api/chat/conversations/:id` | Get conversation with messages |
| PUT | `/api/chat/conversations/:id` | Update conversation title |
| DELETE | `/api/chat/conversations/:id` | Delete conversation |
| POST | `/api/chat/conversations/:id/messages` | Add message |
| POST | `/api/chat/stream` | Stream AI response (SSE) |

### Recommendations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recommendations/today` | Get today's recommendations |
| GET | `/api/recommendations/recent` | Get recent recommendations |
| POST | `/api/recommendations/generate` | Generate new recommendations |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/seed` | Seed demo data for testing |
| GET | `/health` | Health check endpoint |

## Email Configuration

Password reset requires SMTP configuration. Choose one of these options:

### Gmail (with App Password)
1. Enable 2-Step Verification on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Create an app password for "Mail"
4. Use the 16-character password (remove spaces) in `SMTP_PASS`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcdabcdabcdabcd
SMTP_FROM=your-email@gmail.com
```

### Other Providers
| Provider | Host | Port |
|----------|------|------|
| Outlook | smtp-mail.outlook.com | 587 |
| SendGrid | smtp.sendgrid.net | 587 |
| Mailgun | smtp.mailgun.org | 587 |
| Mailtrap (testing) | sandbox.smtp.mailtrap.io | 2525 |

## AI Configuration

The app uses [OpenRouter](https://openrouter.ai) for AI features:

1. Create an account at https://openrouter.ai
2. Get your API key
3. Add to `.env`:
   ```env
   OPENROUTER_API_KEY=sk-or-v1-...
   OPENROUTER_MODEL=anthropic/claude-3-haiku
   ```

Recommended models:
- `anthropic/claude-3-haiku` - Fast and affordable (recommended)
- `anthropic/claude-3-sonnet` - More capable
- `openai/gpt-4o-mini` - Alternative option

## Database Commands

```bash
cd apps/tracker-api

# Push schema changes to database
pnpm db:push

# Generate migrations
pnpm db:generate

# Run migrations
pnpm db:migrate

# Open Drizzle Studio (database GUI)
pnpm db:studio
```

## Demo Data

To quickly populate your account with sample data:

1. Register and log in
2. Go to Settings > Security
3. Click "Load Demo Data"

This creates:
- 40 sample expenses across different categories
- 7 category budgets + overall budget
- 3 income sources

## Mobile App (Android)

### Prerequisites
- Android Studio installed
- Android SDK configured

### Build Steps

1. Set production API URL:
   ```bash
   # apps/frontend/.env
   VITE_API_URL=https://your-api-server.com
   ```

2. Build and sync:
   ```bash
   pnpm --filter frontend cap:build
   ```

3. Open in Android Studio:
   ```bash
   pnpm --filter frontend cap:android
   ```

4. Run on device/emulator from Android Studio

### Local Testing on Device
1. Find your computer's IP address
2. Set `VITE_API_URL=http://192.168.x.x:3001`
3. Ensure phone and computer are on same network
4. Rebuild: `pnpm --filter frontend cap:build`

## Design System

Casha uses a **Bento Grid** design language:

- Modular card-based layouts
- 16px border radius
- Subtle shadows for depth
- Inter font family
- Primary color: Purple/Violet gradient

### Component Architecture (Atomic Design)
- **Atoms**: BentoCard, Button, Input, Badge, Avatar, Skeleton
- **Molecules**: FormField, StatCard, ExpenseItem
- **Organisms**: LoginForm, Sidebar, ExpenseList, ChatInterface
- **Templates**: AuthLayout, AppShell, ProtectedRoute

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm install` | Install all dependencies |
| `pnpm dev` | Start all services (if configured) |
| `pnpm build` | Build all packages |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm lint` | Run ESLint |

### Per-App Scripts
```bash
# Frontend
cd apps/frontend
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm preview      # Preview production build

# Backend
cd apps/tracker-api
pnpm dev          # Start with hot reload
pnpm build        # Compile TypeScript
pnpm start        # Run compiled code
pnpm db:push      # Push schema to database
pnpm db:studio    # Open database GUI
```

## Troubleshooting

### Port already in use
```bash
# Find process using port 3001
netstat -ano | findstr :3001

# Kill process (Windows)
taskkill /F /PID <PID>
```

### Database connection failed
- Ensure Docker is running: `docker ps`
- Check PostgreSQL container: `docker-compose logs db`
- Verify DATABASE_URL in `.env`

### Email not sending
- Check SMTP credentials
- For Gmail, ensure you're using an App Password, not your regular password
- Check backend console for error messages

### AI features not working
- Verify OPENROUTER_API_KEY is set
- Check API key is valid at https://openrouter.ai
- Check backend console for API errors

## License

MIT
