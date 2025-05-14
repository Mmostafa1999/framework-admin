# Multiple Languages Next.js Project

This starter project demonstrates implementing multilingual support in Next.js 15 with App Router, featuring Arabic and English languages with proper RTL (Right-to-Left) support.

## Features

- Next.js 15 App Router architecture
- Multilingual support with next-intl
- RTL layout support for Arabic
- Tailwind CSS for styling
- Framer Motion animations
- TypeScript integration
- Firebase Authentication
- Firestore database
- Responsive design

## Prerequisites

- Node.js 18.17.0 or later
- npm, yarn, or pnpm package manager
- Firebase account

## Firebase Setup

1. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Authentication and Firestore in your Firebase project
3. Create a `.env.local` file in the project root with the following variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## Getting Started

Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

- `app/` - Next.js App Router pages and layouts
- `components/` - Reusable UI components
- `messages/` - Internationalization message files
- `lib/` - Utility functions and configuration
- `public/` - Static assets

## Authentication Features

The authentication system includes:

- User registration and login
- Role-based access control (Admin, User, Consultant, Client)
- Account status management (Active/Inactive)
- Multilingual user interface
- User profile management

## Firestore Data Structure

The application uses these Firestore collections:

- **users**: User profiles with authentication details
- **organizations**: Organization information and settings
- **projects**: Project data and configurations

## Building for Production

Build the application:

```bash
npm run build
# or
yarn build
# or
pnpm build
```

Start the production server:

```bash
npm start
# or
yarn start
# or
pnpm start
```

## Deployment Options

### Vercel (Recommended)

The easiest deployment option is [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js), created by the Next.js team.

### Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase Hosting:
```bash
firebase init hosting
```

4. Build and deploy:
```bash
npm run build
firebase deploy --only hosting
```

### Other Options

- **AWS Amplify**: For AWS infrastructure integration
- **Netlify**: For simple CI/CD workflows
- **DigitalOcean App Platform**: For DigitalOcean infrastructure

For more deployment options, see [Next.js deployment documentation](https://nextjs.org/docs/deployment).

## License

MIT
