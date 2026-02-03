# Casha - Expense Tracker Features

## Dashboard
- Personalized greeting with user's name
- Total monthly spending with month-over-month trend comparison
- Budget remaining indicator with percentage utilized
- Days remaining in current month
- Budget progress cards showing up to 4 category budgets
- Recent expenses list (last 4 transactions)
- AI-powered spending insights and recommendations
- "Ask Before You Buy" quick access button

## Expense Management
- Add, edit, and delete expenses
- Search expenses by description or category
- Filter by category with clear filters option
- Pagination (10 items per page)
- Recurring expense support (weekly/monthly)
- Bill tracking with due dates
- Category color indicators and badges
- Transaction date tracking
- Total spending summary
- Category names displayed (not IDs)

## Budget Management
- Set overall monthly/weekly budget
- Create category-specific budgets
- Visual progress bars for budget utilization
- Budget status indicators (exceeded, warning, on track)
- Remaining balance display
- Edit and delete budgets
- Real-time spending calculation

## Analytics & Insights
- Toggle between weekly and monthly views
- Spending trend comparison vs previous period
- Highest spending category identification
- Category usage count
- Average daily spend calculation
- Spending breakdown by category with percentages
- AI-powered recommendations with severity levels (success, warning, info)
- Visual charts (area, bar, donut)

## Smart Features (USPs)

### AI Chat Assistant
- Natural language financial Q&A
- Context-aware responses using your data
- Real-time streaming responses
- Multiple conversation history
- Auto-generated conversation titles
- Currency-aware responses

### Ask Before You Buy
- AI-powered purchase advisor
- Analyzes if purchase fits current budget
- Considers spending patterns and goals
- Quick access from dashboard
- YES/NO/MAYBE verdict with explanation

### Smart Receipt Scanner
- Capture receipts with camera
- Auto-extract amount, vendor, and date using Tesseract OCR
- Pre-fill expense form with extracted data
- On-device processing (no cloud required)
- Manual review and edit option

### Bill Due Reminders
- Track recurring bills with due dates
- Local notifications before bills are due
- Configurable reminder days (1-7 days before)
- Upcoming bills overview

### Subscription Tracker
- Dedicated view for all subscriptions
- Monthly/yearly cost summary
- Usage alerts for potentially unused subscriptions
- Mark as reviewed feature
- AI insights on subscription optimization

### Android Widget
- Home screen widget showing budget remaining
- Real-time sync with app data
- Quick glance at daily spending status
- Progress bar visualization

## User Settings

### Profile
- Update display name
- Upload profile photo (stored in database, up to 5MB)
- View email address
- Avatar with photo or initials fallback

### Notifications
- Budget alerts toggle
- Weekly summary toggle
- AI insights notifications toggle
- Recurring expense reminders toggle

### Appearance
- Light theme
- Dark theme
- System theme (follows OS preference)
- Currency selection (USD, EUR, GBP, PKR, INR, JPY, CAD, AUD)

### Security
- Change password
- Load demo data for testing
- Delete account option

## Authentication
- User registration with validation
- Email/password login
- Forgot password with email reset link
- Password reset with secure tokens
- JWT-based session management (access + refresh tokens)
- Automatic token refresh
- Protected routes
- Auto-logout on session expiry

## Password Reset Flow
1. Click "Forgot password?" on login page
2. Enter your email address
3. Receive email with reset link (valid for 1 hour)
4. Click link to open reset form
5. Enter new password with validation
6. Redirect to login on success

## Demo Data
Quick-start with sample data for testing:
- 40 sample expenses across categories
- 7 category budgets + overall budget
- 3 income sources
- Access via Settings > Security > Load Demo Data

## Technical Features
- Responsive design (mobile, tablet, desktop)
- Collapsible sidebar navigation
- Skeleton loading states
- Toast notifications for user feedback
- Form validation with error messages
- Real-time search filtering
- Data isolation between user accounts
- Automatic cache invalidation on logout
- Rate limiting (1000 req/min general, 60 req/min AI)
- PostgreSQL database with Docker
- SMTP email support (Gmail, Outlook, etc.)
