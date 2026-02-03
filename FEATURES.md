# Casha - Personal Expense Tracker

## Product Overview

**Casha** is a modern, full-featured expense tracking application with AI-powered financial insights and real-time budget management. It combines traditional financial management tools with cutting-edge AI capabilities to provide personalized financial guidance.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + TailwindCSS + Recharts |
| Backend | Express.js + TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| Auth | JWT (access + refresh tokens) + bcrypt |
| AI/LLM | OpenRouter API (Claude, GPT) |
| Email | Nodemailer (SMTP) |
| Mobile | Capacitor v8 (Android) |
| Monorepo | pnpm workspaces |

---

## Feature List

### Core Financial Features

#### Expense Tracking
- Add, edit, delete expenses with full CRUD operations
- Categorize expenses with custom categories
- Search and filter by category, date range, amount
- Pagination support with configurable page size
- Recent expenses quick view (5 items)
- Real-time polling (30-second refresh)
- Recurring expense support (weekly/monthly)
- Bill tracking with due dates

#### Budget Management
- Create monthly/weekly budgets
- Overall budget (all categories combined)
- Category-specific budget limits
- Visual budget progress indicators
- Track spent vs. remaining amounts
- Home widget sync for budget display
- Real-time progress updates (1-minute refresh)
- Budget status alerts (on track, warning, exceeded)

#### Category Management
- Create custom expense categories
- Assign colors and icons to categories
- Set per-category budget limits
- View category-wise spending breakdown
- Default categories: Food, Transportation, Entertainment, Shopping, Utilities, Health

#### Income Tracking
- Add multiple income sources
- Support for Monthly, Yearly, One-time frequencies
- Calculate monthly equivalent amounts
- Track total monthly income
- Display income vs. expense balance

#### Bill Management
- Mark expenses as recurring bills
- Set recurring intervals (weekly, monthly)
- Configure due dates
- Reminder notifications (configurable days before due)

---

### AI-Powered Features

#### Smart Chat Interface
- GPT-like conversational AI for financial questions
- Real-time streaming responses (SSE)
- Multiple conversation support with history
- Context-aware AI using user's financial data:
  - Recent expenses (last 10)
  - Top spending categories
  - Budget vs. spending status
  - Spending trend analysis
  - User's currency preference
- Auto-title generation for conversations
- Quick suggestion prompts
- Conversation rename and delete

#### AI Insights & Analytics
- Spending summary with budget tracking
- Period comparison (week vs. month views)
- Trend analysis: UP/DOWN/STABLE detection
- Category spending breakdown with percentages
- AI-powered personalized recommendations
- 2-minute refresh interval

#### Daily Recommendations
- AI-generated daily personalized tips
- Context-aware based on spending habits
- Spending trend analysis
- Offline caching support
- Weekly lookback (7-day history)
- Severity levels (success, warning, info)

#### Ask Before You Buy
- Quick purchase decision advisor
- Real-time AI analysis of affordability
- Considers budget, spent amount, remaining funds
- Provides YES/NO/MAYBE verdict
- 2-3 sentence recommendation

---

### Visualization & Analytics

#### Dashboard
- Bento grid layout with modular cards
- Spending summary card with trends
- Budget progress cards with visual indicators
- Recent expense list preview
- Trend indicators (up/down arrows)
- Daily recommendations widget
- "Ask Before Buy" quick access
- Personalized greeting

#### Insights Page
- Weekly or Monthly views toggle
- Spending summary visualization
- Category spending pie/donut charts
- Trend comparison graphs
- Period-to-period change percentages
- Average daily spend calculation
- AI-powered advice cards

#### Charts
- Area charts (spending trends)
- Bar charts (category comparisons)
- Donut charts (category distribution)
- Progress bars (budget utilization)
- Daily spending line graphs
- Powered by Recharts

---

### Mobile & Native Features

#### Mobile App (Capacitor)
- Android native app
- Camera integration
- Network status detection
- Keyboard height detection
- Local notifications
- Offline preferences storage

#### Receipt Scanner (OCR)
- Capture receipt photos via camera
- Upload receipt images from files
- Tesseract.js OCR processing
- Real-time OCR progress tracking
- Automatic extraction of:
  - Amount/price
  - Date
  - Description/items
- Manual review and edit
- Pre-fill expense form with extracted data

---

### User Management

#### Authentication
- Email/password registration
- JWT token-based sessions (access + refresh tokens)
- Automatic token refresh (6-minute interval)
- Auto-logout on token expiration
- Secure password hashing (bcrypt)

#### Password Reset
- Forgot password email link
- Secure reset tokens with 1-hour expiration
- Email delivery via SMTP (Gmail, Outlook, etc.)
- Token verification before reset
- Beautiful HTML email templates

#### Settings & Preferences
- Profile management (name, photo upload)
- Profile photo stored in PostgreSQL (up to 5MB)
- Notification toggles:
  - Budget alerts
  - Weekly summary
  - AI insights
  - Recurring bill reminders
- Light/Dark/System theme modes
- Currency selection (USD, EUR, GBP, PKR, INR, JPY, CAD, AUD)
- Password change functionality
- Demo data seeding for testing
- Account deletion

#### Onboarding Flow
- 5-step wizard:
  1. Welcome introduction
  2. Income setup
  3. Budget configuration
  4. Category customization
  5. Completion summary
- Progress bar
- Skip functionality
- Form validation at each step

---

### Navigation & UI

#### Routes
| Path | Description |
|------|-------------|
| `/login` | Login page |
| `/register` | Registration page |
| `/forgot-password` | Password reset request |
| `/reset-password` | Password reset form |
| `/dashboard` | Main dashboard |
| `/expenses` | Expense list & management |
| `/budgets` | Budget management |
| `/insights` | Analytics & AI insights |
| `/chat` | AI chat interface |
| `/subscriptions` | Subscription tracker |
| `/settings` | User preferences |
| `/onboarding` | First-time setup |

#### Design System
- Bento card pattern with modular layouts
- 16px border radius styling
- Purple/Violet gradient color scheme
- Inter font typography
- Responsive grid system
- Framer Motion animations
- Page transitions

---

### Data & Performance

#### Real-Time Sync (Polling Intervals)
| Data Type | Interval |
|-----------|----------|
| Expenses | 30 seconds |
| Budgets | 1 minute |
| Categories | 5 minutes |
| Income | 5 minutes |
| Insights | 2 minutes |
| Chat messages | 10 seconds |
| Conversations | 1 minute |

#### Data Isolation
- User-specific data isolation
- Cache invalidation on user change
- Automatic state reset on logout
- No data leakage between accounts

#### Offline Support
- Network status detection
- Offline mode indicators
- Cached data during offline periods
- Automatic reconnection handling
- Graceful feature degradation

#### Performance
- Memoization (useMemo, useCallback)
- Code splitting
- Vite HMR
- Drizzle ORM optimization
- Rate limiting on API endpoints (1000 req/min general, 60 req/min AI)

---

## Unique Selling Points

1. **AI-Powered Chat** - Natural language financial assistant with context
2. **Receipt Scanner** - OCR-based automatic expense extraction
3. **Smart Purchase Advisor** - Real-time AI decision support
4. **Daily Recommendations** - Personalized financial tips
5. **Budget Alerts** - Proactive budget monitoring
6. **Mobile Native** - Capacitor Android app
7. **Offline Support** - Works without internet
8. **Real-Time Sync** - Automatic data polling
9. **Bento Grid Design** - Modern card-based UI
10. **Password Reset** - Email-based account recovery
11. **Multi-Currency** - Global currency support
12. **Demo Data** - Quick testing with sample data

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh tokens
- `GET /api/auth/me` - Get profile
- `PUT /api/auth/me` - Update profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request reset email
- `GET /api/auth/verify-reset-token` - Verify reset token
- `POST /api/auth/reset-password` - Reset password

### Core Resources
- `GET/POST/PUT/DELETE /api/expenses`
- `GET/POST/PUT/DELETE /api/categories`
- `GET/POST/PUT/DELETE /api/budgets`
- `GET/POST/PUT/DELETE /api/income-sources`

### Chat
- `GET/POST /api/chat/conversations`
- `GET/PUT/DELETE /api/chat/conversations/:id`
- `POST /api/chat/conversations/:id/messages`
- `POST /api/chat/stream` - SSE streaming

### Insights
- `GET /api/insights/summary`
- `GET /api/insights/categories`
- `GET /api/insights/daily`
- `GET /api/insights/trends`
- `POST /api/insights/advice`

### Recommendations
- `GET /api/recommendations/today`
- `GET /api/recommendations/recent`
- `POST /api/recommendations/generate`

### Other
- `POST /api/seed` - Seed demo data
- `GET /health` - Health check
