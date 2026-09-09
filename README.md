# USDT Staking Platform

A full-stack cryptocurrency staking platform with Next.js frontend and Node.js backend that allows users to deposit, withdraw, and stake USDT with admin approval workflow. Features a premium black + green gradient theme, glassmorphism effects, and comprehensive staking functionality.

## 🚀 Features

### Landing Page

- **Hero Section**: Compelling headline with animated call-to-action buttons
- **Feature Cards**: Safe & Secure, High Returns, Instant Withdrawals, Comprehensive Analytics
- **Stats Section**: Total Value Locked, Average APR, Active Users, Uptime
- **Animated Background**: Gradient waves and floating elements
- **Responsive Design**: Mobile-first approach with smooth animations

### Authentication Flow

- **Login Page**: Email/password with social login options
- **Signup Page**: Full registration with password validation
- **Glassmorphic Cards**: Premium UI with backdrop blur effects
- **Form Validation**: Real-time validation with visual feedback
- **Security Features**: Password requirements and 2FA options

### Dashboard

- **Sidebar Navigation**: Collapsible sidebar with smooth animations
- **Mobile Navigation**: Bottom tab bar for mobile devices
- **Account Overview**: Real-time balance, staking stats, and earnings
- **Deposit System**: Multi-token support with QR code generation
- **Withdraw System**: Multiple withdrawal methods with fee breakdown
- **Transaction History**: Interactive table with filtering and search
- **Analytics**: Portfolio growth charts and performance metrics
- **Settings**: Profile, security, notifications, and preferences

## 🎨 Design System

### Color Palette

- **Primary Black**: `#0B0F0E` (Deep black background)
- **Charcoal Gray**: `#1A1F1D` (Card backgrounds)
- **Emerald Green**: `#10B981` (Primary accent)
- **Neon Green**: `#00FF87` (Highlight color)
- **Cyan Blue**: `#06B6D4` (Secondary accent)

### Typography

- **Font Family**: Inter (clean, modern fintech standard)
- **Large Numbers**: Bold display for balances and stats
- **Captions**: Smaller text for labels and descriptions

### UI Components

- **Glassmorphism**: Backdrop blur with subtle borders
- **Glow Effects**: Neon green shadows and highlights
- **Gradient Buttons**: Emerald to green gradients with hover effects
- **Animated Cards**: Scale and glow effects on hover
- **Rounded Corners**: 2xl border radius for modern look

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with custom configuration
- **Animations**: Framer Motion for smooth transitions
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React for consistent iconography
- **UI Components**: Radix UI primitives
- **TypeScript**: Full type safety throughout

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB Atlas (Cloud)
- **Authentication**: JWT tokens with bcrypt
- **ODM**: Mongoose for data modeling
- **Logging**: Winston for application logs
- **Security**: CORS, rate limiting, input validation

## 📱 Responsive Design

- **Mobile-First**: Optimized for mobile devices
- **Breakpoints**: sm, md, lg, xl with fluid scaling
- **Navigation**: Collapsible sidebar on desktop, bottom tabs on mobile
- **Touch-Friendly**: Large touch targets and smooth gestures
- **Performance**: Optimized animations and lazy loading

## 🎭 Animations & Interactions

- **Page Transitions**: Smooth fade and slide animations
- **Hover Effects**: Scale, glow, and color transitions
- **Loading States**: Skeleton loaders and progress indicators
- **Micro-Interactions**: Button ripples and form feedback
- **Scroll Animations**: Elements animate into view
- **Floating Elements**: Background particles and shapes

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation & Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd usdt-staking-platform
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
npm install
```

4. Start the backend server:
```bash
cd backend
node server.js
```
Backend runs on: http://localhost:5001

5. Start the frontend (new terminal):
```bash
npm run dev
```
Frontend runs on: http://localhost:3000

## 🔐 Demo Accounts

**Admin Account:**
- Email: `admin@example.com`
- Password: `Admin123!@#`
- Access: Full admin panel with transaction management

**User Account:**
- Email: `user1@example.com`  
- Password: `User123!`
- Access: Regular user features (deposit, withdraw, stake)

## 🌐 API Integration

The platform includes a complete REST API with the following endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user profile

### Transactions
- `POST /api/transactions/deposit` - Create deposit request
- `POST /api/transactions/withdraw` - Create withdrawal request
- `POST /api/transactions/stake` - Stake available funds
- `GET /api/transactions/history` - Get transaction history

### Admin Panel
- `GET /api/admin/transactions/pending` - Get pending transactions
- `POST /api/admin/transactions/:id/approve` - Approve transaction
- `POST /api/admin/transactions/:id/reject` - Reject transaction
- `GET /api/admin/dashboard/stats` - Get platform statistics

## 💼 Business Logic

### User Workflow
1. **Register/Login** → Access dashboard
2. **Submit Deposit** → Admin approval required
3. **Funds Added** → Available for staking
4. **Stake Funds** → Earn 12.5% APR automatically  
5. **Submit Withdrawal** → Admin approval required
6. **Funds Deducted** → Transaction completed

### Admin Workflow
1. **Login as Admin** → Access admin panel
2. **Review Requests** → View pending deposits/withdrawals
3. **Approve/Reject** → Process with optional comments
4. **Auto-Update** → User wallets updated automatically

### Build for Production

```bash
# Frontend
npm run build
npm start

# Backend  
cd backend
npm start
```

## 📁 Project Structure

```
usdt/
├── app/
│   ├── dashboard/          # Dashboard pages
│   ├── login/             # Authentication pages
│   ├── signup/
│   ├── globals.css        # Global styles and theme
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── lib/
│   └── utils.ts           # Utility functions
├── public/                # Static assets
└── components.json        # ShadCN configuration
```

## 🎯 Key Features Implemented

### ✅ Landing Page

- Hero section with animated elements
- Feature showcase with glassmorphic cards
- Statistics display with neon effects
- Call-to-action sections
- Footer with navigation links

### ✅ Authentication

- Login page with form validation
- Signup page with password requirements
- Social login options
- Glassmorphic card design
- Smooth animations and transitions

### ✅ Dashboard

- Responsive sidebar navigation
- Mobile bottom navigation
- Account overview with stats
- Deposit system with multi-token support
- Withdraw system with fee breakdown
- Transaction history with filtering
- Analytics with performance metrics
- Settings with profile management

### ✅ Design System

- Black + green gradient theme
- Glassmorphism effects
- Neon glow animations
- Responsive typography
- Consistent spacing and colors

## 🔧 Customization

### Theme Colors

Edit `app/globals.css` to modify the color scheme:

```css
:root {
  --color-crypto-black: #0b0f0e;
  --color-crypto-emerald: #10b981;
  --color-crypto-neon: #00ff87;
  /* ... */
}
```

### Animations

Modify Framer Motion configurations in components:

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
```

## 📱 Mobile Optimization

- Bottom navigation bar for easy thumb navigation
- Touch-friendly button sizes (44px minimum)
- Optimized form layouts for mobile keyboards
- Swipe gestures for navigation
- Responsive charts and tables

## 🎨 Design Principles

1. **Premium Feel**: High-quality glassmorphism and gradients
2. **Trust & Security**: Professional color scheme and typography
3. **User Experience**: Intuitive navigation and clear information hierarchy
4. **Performance**: Smooth animations and fast loading
5. **Accessibility**: High contrast and readable text

## 🚀 Future Enhancements

- Real-time data integration
- Advanced charting with trading view
- Multi-language support
- Dark/light theme toggle
- Push notifications
- Advanced security features
- API integration for live data

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For support, email support@usdtstaking.com or join our Discord community.

---

Built with ❤️ using Next.js, Tailwind CSS, and Framer Motion.
