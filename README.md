# 🏠 RoomEase - Smart Roommate Management

RoomEase is a comprehensive roommate management application designed specifically for students in Kenya, with optional support for international users. It helps roommates manage chores, responsibilities, finances, and communication through a trust-based system and gamified coordination.

## ✨ Features

### 🎯 Core Modules

- **🔐 Authentication & Roommate Invites**
  - Email/phone login with Firebase Auth
  - QR-based room invitations
  - Room "join or create" logic
  - Trust score-based profiles

- **📋 Chore Board**
  - Create, assign, and track chores
  - Weekly rotation logic for recurring tasks
  - Mark as done, confirm, or dispute system
  - Real-time updates and notifications
  - Trust system integration for accountability

- **🤝 Trust System**
  - Starts at 100 points, adjusts based on behavior
  - Drops on confirmed disputes or false claims
  - Visual trust bar component
  - Privilege restrictions for low trust scores
  - Auto-assistance for critical trust levels

- **🍳 Menus & Recipes**
  - Shared weekly menu planning
  - Recipe creation and sharing with photos
  - Cooking responsibility assignment
  - Dietary preferences and tags
  - Budget-based menu suggestions

- **🛒 Shopping List**
  - Collaborative grocery lists
  - Receipt tracking with photos
  - Expense splitting and confirmation
  - Auto-removal after purchase

- **💰 Bills & Finances**
  - Bill splitting (equal or custom percentages)
  - M-Pesa integration for Kenya
  - Stripe and PayPal support for international users
  - Transaction history and reminders
  - Monthly spending summaries

- **🔔 Notifications & Reminders**
  - Push notifications via Firebase Cloud Messaging
  - Daily/weekly task summaries
  - Bill payment reminders
  - Trust score change alerts

- **📝 Notes & Communication**
  - Shared communication board
  - Priority levels and tagging
  - Voice notes and photo attachments
  - Comment threads for discussions

- **📊 User Dashboard**
  - Today's tasks and priorities
  - Trust score overview and history
  - Spending summaries and statistics
  - Quick actions and shortcuts

- **⚙️ Room Settings & Management**
  - Member management and permissions
  - Room code generation and QR codes
  - Trust score monitoring
  - Theme and language preferences

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Authentication**: Firebase Auth (email, phone, Google)
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Notifications**: Firebase Cloud Messaging
- **Payments**: M-Pesa Daraja API, Stripe, PayPal
- **State Management**: Zustand + React Query
- **Offline Support**: PWA with service workers
- **UI Components**: Headless UI + Heroicons
- **Animations**: Framer Motion

## 📱 Mobile-First Design

- Responsive design optimized for 5"–6.5" Android screens
- Progressive Web App (PWA) capabilities
- Offline-first architecture with sync
- Touch-friendly interface with proper touch targets
- Safe area support for modern mobile devices

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Firebase project with Firestore, Auth, and Storage enabled
- M-Pesa developer account (for Kenya integration)
- Optional: Stripe/PayPal accounts for international payments

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/roomease-mvp.git
   cd roomease-mvp
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your configuration values:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   # ... other Firebase config
   
   # M-Pesa Configuration
   MPESA_CONSUMER_KEY=your_consumer_key
   MPESA_CONSUMER_SECRET=your_consumer_secret
   MPESA_BUSINESS_SHORT_CODE=your_shortcode
   MPESA_PASSKEY=your_passkey
   ```

4. **Firebase Setup**
   - Create a new Firebase project
   - Enable Authentication (Email/Password, Phone, Google)
   - Create Firestore database in production mode
   - Enable Storage
   - Set up Cloud Messaging
   - Configure security rules (see `firebase/` directory)

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
roomease-mvp/
├── app/                    # Next.js 14 app directory
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   ├── chores/           # Chore management
│   ├── bills/            # Bill tracking
│   ├── recipes/          # Recipe management
│   ├── shopping/         # Shopping lists
│   ├── notes/            # Communication board
│   ├── rooms/            # Room management
│   └── settings/         # User settings
├── components/            # Reusable UI components
│   ├── providers/        # Context providers
│   ├── TrustBar.tsx     # Trust system components
│   ├── TaskCard.tsx     # Chore display components
│   └── ...
├── lib/                  # Core utilities and logic
│   ├── firebase.ts      # Firebase configuration
│   ├── trust.ts         # Trust system logic
│   ├── payments.ts      # Payment processing
│   └── ...
├── types/               # TypeScript type definitions
├── public/              # Static assets and PWA files
└── styles/              # Global styles and Tailwind config
```

## 🔧 Configuration

### Firebase Security Rules

**Firestore Rules** (`firestore.rules`):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Room members can read/write room data
    match /rooms/{roomId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.members;
    }
    
    // Room-specific collections
    match /chores/{choreId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in get(/databases/$(database)/documents/rooms/$(resource.data.roomId)).data.members;
    }
    
    // Similar rules for bills, recipes, notes, etc.
  }
}
```

**Storage Rules** (`storage.rules`):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /rooms/{roomId}/{allPaths=**} {
      allow read, write: if request.auth != null;
      // Add room membership check in production
    }
  }
}
```

### M-Pesa Integration

1. Register for M-Pesa developer account at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Create an app and get your Consumer Key and Secret
3. Set up STK Push and configure callback URLs
4. Test in sandbox environment before going live

### PWA Configuration

The app is configured as a Progressive Web App with:
- Service worker for offline functionality
- Web app manifest for installation
- Background sync for offline actions
- Push notifications support

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run e2e tests
npm run test:e2e
```

## 📦 Deployment

### Vercel (Recommended)

1. **Connect to Vercel**
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Environment Variables**
   Add all environment variables in Vercel dashboard

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Docker Deployment

```bash
# Build image
docker build -t roomease .

# Run container
docker run -p 3000:3000 roomease
```

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🌍 Internationalization

The app supports multiple languages:
- English (default)
- Swahili (Kiswahili)

Language files are located in `locales/` directory. To add a new language:

1. Create language file: `locales/[lang].json`
2. Add translations for all keys
3. Update language selector in settings

## 🔐 Security Considerations

- All sensitive operations require authentication
- Trust system prevents abuse through scoring
- Input validation on all forms
- Rate limiting on API endpoints
- HTTPS enforcement in production
- Secure Firebase rules
- Environment variables for secrets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use semantic commit messages
- Write tests for new features
- Update documentation
- Ensure mobile responsiveness
- Test offline functionality

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Firebase for backend services
- Safaricom for M-Pesa API
- Tailwind CSS for styling
- Next.js team for the framework
- All contributors and testers

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email: support@roomease.app
- Documentation: [docs.roomease.app](https://docs.roomease.app)

## 🗺️ Roadmap

### Phase 1 (Current)
- [x] Core MVP features
- [x] Trust system
- [x] M-Pesa integration
- [x] PWA functionality

### Phase 2 (Planned)
- [ ] Advanced analytics
- [ ] Multi-room support
- [ ] Gamification features
- [ ] AI-powered suggestions
- [ ] Integration with local services

### Phase 3 (Future)
- [ ] Mobile app (React Native)
- [ ] Advanced trust algorithms
- [ ] Marketplace integration
- [ ] Social features
- [ ] API for third-party integrations

---

Made with ❤️ for students in Kenya and beyond. 🇰🇪