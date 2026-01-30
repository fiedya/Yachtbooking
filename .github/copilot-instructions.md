# Yacht Booking App - AI Agent Instructions

## Project Overview

A React Native/Expo yacht booking platform with Firebase backend. The app manages user authentication, yacht listings, booking approvals, and real-time calendar reservations with role-based admin features.

**Stack**: Expo Router (file-based), React Native, Firebase (Auth + Firestore + Storage), TypeScript

## Architecture

### Navigation & Auth Flow

- **App Router**: File-based routing via `expo-router` - screens in `app/` directory
- **Auth Flow**: `index.tsx` → `auth.tsx` → `onboarding.tsx` → `wait-for-verification.tsx` → `post-auth.tsx` → `(tabs)/`
- **Role-Based Access**: `ModeProvider` (user/admin) + `AuthProvider` determine visible tab screens
  - Regular users see: `news`, `yachts`, `calendar`, `book`, `profile`
  - Admins see: `admin/` subtabs (users-to-verify, bookings-to-approve, all-users, user-details)

### Context Providers (App Root)

Located in `app/providers/`:

- **AuthProvider**: Listens to Firebase Auth + Firestore user profiles, manages `user` state
- **ModeProvider**: Tracks `mode` ('user'|'admin') based on Firestore `role` field
- **Pattern**: Both use React Context + `onSnapshot()` for real-time subscriptions

### Data Layer & Services

Services follow **fetch + subscribe** pattern:

- **[authService.ts](src/services/authService.ts)**: Phone auth wrapper (signInWithPhone, confirmCode, signOut)
- **[userService.ts](src/services/userService.ts)**: User CRUD + subscribeToUser (real-time profile updates)
- **[yachtService.ts](src/services/yachtService.ts)**: getYachts + subscribeToYachts (real-time listing)
- **[booking.service.ts](src/services/booking.service.ts)**: createBooking (creates 'pending' status)
- **[calendarService.ts](src/services/calendarService.ts)**: subscribeToBookings (time-range filter: start < end AND end > start)

### Data Models

In `src/entities/`:

- **Booking**: {id, userId, userName, yachtId, yachtName, start, end, status: 'pending'|'approved'|'rejected', createdAt}
- **User**: {uid, phone, name, surname, role: 'user'|'admin', status: 'to-verify'|'verified', photoUrl, createdAt}
- **Yacht**: {id, name, description, price, capacity, photoUrls}

### Theme & Styling

- **Colors** ([src/theme/colors.ts](src/theme/colors.ts)): Primary dark blue #003366, secondary orange #FF7A00
- **Utilities**: `src/theme/` contains typography, spacing, header, styles exports
- **Pattern**: Theme values imported as `from '@/src/theme/colors'` etc.

## Critical Developer Workflows

### Running the App

```bash
npm install                # Install dependencies
npx expo start             # Start dev server (choose a/i/w for Android/iOS/Web)
npm run android            # Build & run on Android emulator
npm run ios                # Build & run on iOS simulator
npm run lint               # Run ESLint
```

### Firebase Setup

- **Config**: `google-services.json` in `android/app/` (for Android)
- **Firestore Collections**: `users`, `yachts`, `bookings`
- **Auth**: Phone-based authentication via Firebase Auth
- **Storage**: Used for user photos + yacht images (see [imageUploadService.ts](src/services/imageUploadService.ts))

### Building for Deployment

```bash
eas build --platform android   # Build APK via EAS
eas submit --platform android  # Upload to Play Store
```

## Project-Specific Patterns & Conventions

### Firebase Timestamp Handling

- Dates stored as `firestore.Timestamp.fromDate()` in Firestore
- Retrieved as Timestamp objects - convert with `.toDate()` where needed
- Calendar queries use `Timestamp` for range filtering (see [calendarService.ts](src/services/calendarService.ts))

### Real-Time Subscriptions

- Services return **unsubscribe functions** from `onSnapshot()`
- Always cleanup: Store unsub in `useEffect` return or variable
- Example: `useEffect(() => { const unsub = subscribeToUser(...); return unsub; }, [])`

### User Status Flow

1. Created with `status: 'to-verify'` → Admins verify on `users-to-verify` screen
2. Changes to `status: 'verified'` → User sees `wait-for-verification` until refresh
3. **Admin** role requires manual role update in Firestore `users` collection

### Image Uploads

- Service in [imageUploadService.ts](src/services/imageUploadService.ts)
- Integrates with `expo-image-picker` for selection
- Uploads to Firebase Storage (referenced by URL in Firestore docs)

### Type Safety

- Entity types in `src/entities/` (Booking, User, Yacht)
- Services accept/return typed parameters
- Firestore `.data() as Omit<Type, 'id'>` pattern for safe casting

## Integration Points & Dependencies

### External APIs & Services

- **Firebase**: Auth (phone), Firestore (database), Storage (images)
- **Expo**: Router, Image, ImagePicker, Haptics, Linking
- **React Navigation**: Tab navigation + native stack
- **react-native-big-calendar**: Calendar UI component
- **dayjs**: Date formatting

### Cross-Component Communication

- **Top-level Context** (AuthProvider, ModeProvider) → drilled through providers
- **Firestore subscriptions** → Real-time data pushed to components via `onChange` callbacks
- **No centralized state management** (Redux/Zustand) - Context + subscriptions handle state

## Common Tasks & Where to Find Code

| Task                       | File(s)                                                                                |
| -------------------------- | -------------------------------------------------------------------------------------- |
| Add new user field         | [userService.ts](src/services/userService.ts) (create/update) + `src/entities/user.ts` |
| Create new booking flow    | [booking.service.ts](src/services/booking.service.ts) + screen component               |
| Add admin permission check | [AuthProvider.tsx](app/providers/AuthProvider.tsx) + check `profile.role`              |
| Modify calendar filter     | [calendarService.ts](src/services/calendarService.ts) (where clause)                   |
| Change theme colors        | [src/theme/colors.ts](src/theme/colors.ts)                                             |
| Add new tab screen         | `app/(tabs)/newscreen.tsx` + update `(tabs)/_layout.tsx`                               |
| Add admin screen           | `app/(tabs)/admin/newscreen.tsx` + update `admin/_layout.tsx`                          |

## Key Anti-Patterns to Avoid

- ❌ Storing Timestamps as raw JS `Date` in Firestore - use `firestore.Timestamp.fromDate()`
- ❌ Not cleaning up Firestore subscriptions in useEffect cleanup
- ❌ Assuming `onSnapshot()` data is available immediately - handle loading states
- ❌ Hardcoding Firebase paths - use typed service functions
- ❌ Direct Firestore queries in components - delegate to service layer
