# USA Presence Calculator - Mobile Frontend Development Plan

## 🎯 Overview
This plan outlines the comprehensive development of the mobile frontend for the USA Presence Calculator app, following the established style guide, UX specifications, and architectural decisions.

## 📋 Phase 1: Foundation & Infrastructure (Week 1)

### 1.1 Project Setup & Configuration ✅ COMPLETED
- [x] Mobile directory structure created
- [x] Expo SDK 53 configured with TypeScript
- [x] Tamagui UI framework integrated with style guide colors/tokens
- [x] Metro bundler configured for monorepo
- [x] iOS and Android prebuild completed
- [x] Husky pre-commit hooks configured

### 1.2 Core Infrastructure Setup (3-4 days)
**Goal:** Establish the foundational architecture and utilities

#### State Management with Zustand
- [ ] Create store structure following offline-first principles
- [ ] Implement user store (profile, settings, auth state)
- [ ] Implement trips store (CRUD operations, optimistic updates)
- [ ] Implement UI store (navigation, loading states, modals)
- [ ] Setup persistence with expo-sqlite adapter
- [ ] Create store hooks with TypeScript

#### Local Database Layer
- [ ] Setup expo-sqlite with migrations
- [ ] Create database schema matching backend structure
- [ ] Implement database utilities (connection, transactions)
- [ ] Create data access layer with Drizzle ORM
- [ ] Setup offline queue for sync operations
- [ ] Implement encryption for sensitive data

#### Navigation Structure
- [ ] Configure Expo Router with typed routes
- [ ] Setup tab navigation (Dashboard, Trips, Calendar, More)
- [ ] Implement auth flow navigation guards
- [ ] Create deep linking configuration
- [ ] Setup navigation state persistence

### 1.3 Design System Implementation (2-3 days)
**Goal:** Build reusable components following the style guide

#### Core Components
- [ ] Button component with all states (press, disabled, loading)
- [ ] Input component with focus animations
- [ ] Card component with shadow and animations
- [ ] Typography components (DisplayTitle, ScreenTitle, etc.)
- [ ] Loading states (skeleton screens, spinners)
- [ ] Empty states with illustrations
- [ ] Error states with retry actions

#### Animation Utilities
- [ ] Create Moti animation presets (gentle, enterGently, quick)
- [ ] Implement haptic feedback utilities
- [ ] Create number animation component
- [ ] Setup reduce motion preferences

## 📱 Phase 2: Authentication & Onboarding (Week 2)

### 2.1 Authentication Implementation (3 days)
**Goal:** Secure authentication with passkeys and magic links

#### Passkey Authentication
- [ ] Implement WebAuthn registration flow
- [ ] Create passkey authentication UI
- [ ] Handle biometric prompts
- [ ] Implement credential management
- [ ] Setup secure token storage

#### Magic Link Fallback
- [ ] Create email input screen
- [ ] Implement magic link request
- [ ] Handle deep link authentication
- [ ] Create verification flow UI

#### Session Management
- [ ] Implement JWT token handling
- [ ] Create refresh token logic
- [ ] Setup auto-logout on expiry
- [ ] Handle offline authentication

### 2.2 Onboarding Flow (2-3 days)
**Goal:** Smooth, reassuring first-time experience

#### Welcome & Setup
- [ ] Create welcome screen with animations
- [ ] Implement green card date picker
- [ ] Create eligibility category selector
- [ ] Build feature introduction carousel
- [ ] Implement "First Glance" animation

#### Data Migration
- [ ] Create import from calendar option
- [ ] Build bulk trip entry interface
- [ ] Implement progress indicators
- [ ] Create skip/complete options

## 🏠 Phase 3: Dashboard & Home Screen (Week 3)

### 3.1 Dashboard Layout (2 days)
**Goal:** Widget-inspired dashboard with at-a-glance status

#### Main Progress Widget
- [ ] Create circular/bar progress component
- [ ] Implement animated number counting
- [ ] Add color states (safe/warning/danger)
- [ ] Create tap-to-expand details

#### Status Cards
- [ ] Physical presence summary card
- [ ] Continuous residence status
- [ ] Upcoming milestones widget
- [ ] Early filing countdown
- [ ] Travel budget indicator

### 3.2 Dashboard Interactions (2 days)
**Goal:** Living, breathing data visualization

#### Animations & Feedback
- [ ] Implement pull-to-refresh
- [ ] Create data update animations
- [ ] Add celebration animations
- [ ] Implement warning transitions
- [ ] Setup haptic feedback

#### Quick Actions
- [ ] Add trip floating action button
- [ ] Quick simulator access
- [ ] Today's status indicator
- [ ] Notification badge system

### 3.3 Compliance Widgets (2 days)
**Goal:** LPR status protection features

#### Compliance Dashboard
- [ ] Removal of conditions countdown
- [ ] Green card renewal tracker
- [ ] Selective service indicator
- [ ] Tax reminder widget
- [ ] Unified compliance score

## ✈️ Phase 4: Trip Management (Week 4)

### 4.1 Trip List & History (2 days)
**Goal:** Beautiful, functional trip management

#### Trip List View
- [ ] Create trip list with cards
- [ ] Implement swipe actions
- [ ] Add search/filter functionality
- [ ] Create sorting options
- [ ] Implement pagination

#### Trip Details
- [ ] Expandable trip cards
- [ ] Inline editing capability
- [ ] Delete with confirmation
- [ ] Trip impact visualization

### 4.2 Add Trip Flow (2 days)
**Goal:** Effortless trip logging

#### Manual Entry
- [ ] Create date picker with validation
- [ ] Location input with autocomplete
- [ ] Purpose/notes field
- [ ] Save with success animation

#### OCR Scanner
- [ ] Camera permission flow
- [ ] Ticket scanning interface
- [ ] Date extraction display
- [ ] Correction/confirmation UI

### 4.3 Travel Simulator (2 days)
**Goal:** Confidence through planning

#### Simulator Interface
- [ ] Create simulator toggle/tab
- [ ] Future date inputs
- [ ] Real-time calculation display
- [ ] Risk assessment visualization

#### Ripple Effect Animation
- [ ] Calendar ghost overlay
- [ ] Progress bar preview
- [ ] Status change animations
- [ ] Convert to real trip flow

## 📅 Phase 5: Calendar Visualization (Week 5)

### 5.1 Calendar Component (3 days)
**Goal:** Clear, beautiful presence visualization

#### Calendar Display
- [ ] Customize react-native-calendars
- [ ] Implement color coding system
- [ ] Add pattern overlays for accessibility
- [ ] Create month/year navigation

#### Calendar Interactions
- [ ] Day tap for details
- [ ] Pinch to zoom (month/year view)
- [ ] Swipe navigation
- [ ] Today indicator

### 5.2 Calendar Features (2 days)
**Goal:** Rich calendar functionality

#### Visual Features
- [ ] Trip duration bars
- [ ] Milestone markers
- [ ] Risk period highlighting
- [ ] Legend component

#### Data Integration
- [ ] Sync with trip data
- [ ] Show simulated trips
- [ ] Calculate streaks
- [ ] Display analytics

## 🔔 Phase 6: Notifications & Feedback (Week 6)

### 6.1 Push Notifications (2 days)
**Goal:** Proactive, supportive guidance

#### Notification Setup
- [ ] Permission request flow
- [ ] Notification scheduling
- [ ] Deep link handling
- [ ] Notification history

#### Notification Types
- [ ] Milestone celebrations
- [ ] Risk warnings
- [ ] Compliance reminders
- [ ] Travel analytics

### 6.2 In-App Feedback (2 days)
**Goal:** Delightful microinteractions

#### Toast System
- [ ] Create toast component
- [ ] Success/warning/info states
- [ ] Swipe to dismiss
- [ ] Action buttons

#### Celebrations
- [ ] Confetti animation component
- [ ] Success haptics
- [ ] Achievement modals
- [ ] Progress celebrations

### 6.3 Educational Content (1 day)
**Goal:** Clear, accessible information

#### Help System
- [ ] Contextual help tooltips
- [ ] Educational articles view
- [ ] FAQ accordion
- [ ] Video tutorials

## 📄 Phase 7: Export & Reporting (Week 7)

### 7.1 PDF Generation (2 days)
**Goal:** Professional documentation

#### Report Generator
- [ ] Create PDF template
- [ ] Implement data compilation
- [ ] Add charts/visualizations
- [ ] Generate with expo-print

#### Report Features
- [ ] Custom date ranges
- [ ] Trip summary table
- [ ] Presence calculations
- [ ] Legal disclaimers

### 7.2 Sharing & Export (1 day)
**Goal:** Easy document sharing

#### Export Options
- [ ] Save to device
- [ ] Share via apps
- [ ] Email directly
- [ ] Cloud storage

## 🔧 Phase 8: Settings & Profile (Week 8)

### 8.1 Settings Screen (2 days)
**Goal:** Comprehensive preferences

#### User Settings
- [ ] Profile management
- [ ] Notification preferences
- [ ] Theme selection
- [ ] Language settings
- [ ] Biometric toggle

#### App Settings
- [ ] Data & privacy
- [ ] Backup/restore
- [ ] Sync preferences
- [ ] Debug options

### 8.2 More Tab Features (2 days)
**Goal:** Additional functionality

#### More Menu
- [ ] About section
- [ ] Privacy policy
- [ ] Terms of service
- [ ] Support/feedback
- [ ] Rate app prompt

## 🚀 Phase 9: Polish & Optimization (Week 9)

### 9.1 Performance (3 days)
**Goal:** Smooth 60fps experience

#### Optimization
- [ ] Implement React.memo
- [ ] Optimize re-renders
- [ ] Lazy load screens
- [ ] Image optimization
- [ ] Animation performance

### 9.2 Accessibility (2 days)
**Goal:** WCAG 2.1 AA compliance

#### Accessibility Features
- [ ] Screen reader testing
- [ ] Dynamic type support
- [ ] Color contrast audit
- [ ] Focus management
- [ ] Reduce motion

## 🧪 Phase 10: Testing & Launch Prep (Week 10)

### 10.1 Testing (3 days)
**Goal:** Comprehensive quality assurance

#### Test Coverage
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests
- [ ] E2E test scenarios
- [ ] Manual QA checklist

### 10.2 Launch Preparation (2 days)
**Goal:** App store ready

#### Store Assets
- [ ] App icons (all sizes)
- [ ] Screenshots
- [ ] Store descriptions
- [ ] Feature graphics
- [ ] Demo video

## 📊 Success Metrics

1. **Performance:** App loads < 3s, TTI < 1.5s
2. **Quality:** Zero crashes, 4.5+ star rating
3. **Engagement:** 60%+ use simulator in first month
4. **Completion:** All core features from PRD implemented

## 🚨 Critical Path

1. State management + Database (blocks all features)
2. Authentication (blocks user data)
3. Dashboard (core user value)
4. Trip management (primary functionality)
5. Calendar (key differentiator)

## 📝 Development Guidelines

- Follow TDD methodology for business logic
- Commit after each completed subtask
- Create feature branches: `feature/mobile/[feature-name]`
- Use TypeScript strict mode
- Follow style guide for all UI
- Prioritize offline functionality
- Test on both iOS and Android
- Regular user testing and feedback

## 🔄 Progress Tracking

**Overall Progress:** █░░░░░░░░░ 10% (Phase 1.1 completed)

**Current Phase:** Phase 1.2 - Core Infrastructure Setup
**Next Milestone:** State Management Implementation
**Estimated Completion:** 10 weeks from start

---

**Last Updated:** December 14, 2024
**Total Tasks:** 170
**Completed:** 6
**In Progress:** 0
**Remaining:** 164