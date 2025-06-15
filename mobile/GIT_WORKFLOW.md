# Git Workflow for Multi-Agent Development

## 🔄 Overview

This document outlines the git workflow and coordination rules for multiple Claude agents working simultaneously on the USA Presence Calculator mobile frontend.

## 🌳 Branch Structure

```
main
├── feature/mobile/phase-1-infrastructure
│   ├── feature/mobile/phase-1.2-state-management
│   ├── feature/mobile/phase-1.2-database-layer
│   ├── feature/mobile/phase-1.2-navigation
│   └── feature/mobile/phase-1.3-design-system
├── feature/mobile/phase-2-auth
│   ├── feature/mobile/phase-2.1-passkey-auth
│   ├── feature/mobile/phase-2.1-magic-link
│   └── feature/mobile/phase-2.2-onboarding
├── feature/mobile/phase-3-dashboard
│   ├── feature/mobile/phase-3.1-layout
│   ├── feature/mobile/phase-3.2-interactions
│   └── feature/mobile/phase-3.3-compliance
└── ... (continues for each phase)
```

## 🚨 Critical Rules

### 1. Continuous Sync Protocol

**Before Starting Work:**
```bash
# Always start with latest changes
git checkout feature/mobile/phase-X.Y-[your-task]
git pull origin feature/mobile/phase-X.Y-[your-task]
git pull origin feature/mobile/phase-X-[main-phase]
git rebase feature/mobile/phase-X-[main-phase]
```

**After EVERY Atomic Commit:**
```bash
# Add your changes
git add [specific files]

# Commit with conventional message
git commit -m "feat(mobile): [specific change description]"

# Pull and resolve any conflicts
git pull --rebase origin feature/mobile/phase-X.Y-[your-task]

# Push immediately
git push origin feature/mobile/phase-X.Y-[your-task]
```

### 2. Commit Message Format

```
type(scope): description

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation only
- style: Code style (formatting, missing semicolons, etc)
- refactor: Code change that neither fixes bug nor adds feature
- test: Adding missing tests
- chore: Maintain (deps, build process, etc)

Examples:
- feat(mobile): implement user store with persistence
- fix(mobile): correct date picker validation
- chore(deps): add react-native-calendars
```

### 3. Package Installation Protocol

```bash
# ALWAYS pull latest package files first
git pull origin feature/mobile/phase-X.Y-[your-task]

# Install new package
pnpm add [package-name]@latest

# Commit and push IMMEDIATELY
git add package.json pnpm-lock.yaml
git commit -m "chore(deps): add [package-name] for [purpose]"
git push origin feature/mobile/phase-X.Y-[your-task]

# Notify other agents in coordination channel
```

## 📁 File Ownership Matrix

### Phase 1.2 - Infrastructure

**State Management Agent:**
```
/mobile/src/stores/
├── user.ts
├── trips.ts
├── ui.ts
├── sync.ts
└── index.ts
/mobile/src/hooks/
└── use-store.ts
```

**Database Layer Agent:**
```
/mobile/src/db/
├── schema.ts
├── migrations/
├── connection.ts
└── queries/
/mobile/src/services/database/
├── sync-queue.ts
├── encryption.ts
└── backup.ts
```

**Navigation Agent:**
```
/mobile/app/
├── (auth)/
├── (tabs)/
├── _layout.tsx
└── [...unmatched].tsx
/mobile/src/navigation/
├── types.ts
├── guards.ts
└── deep-links.ts
```

### Phase 1.3 - Design System

**Design System Agent:**
```
/mobile/src/components/
├── base/
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Card.tsx
├── feedback/
│   ├── Toast.tsx
│   └── Loading.tsx
└── animations/
    └── presets.ts
```

### Shared Files (Coordinate Before Editing)
```
/mobile/package.json
/mobile/tsconfig.json
/mobile/app.json
/mobile/tamagui.config.ts
/mobile/babel.config.js
/mobile/metro.config.js
```

## 🔄 Daily Workflow

### Morning Sync (Start of Day)
```bash
# 1. Fetch all remote changes
git fetch --all

# 2. Update your feature branch
git checkout feature/mobile/phase-X.Y-[your-task]
git pull origin feature/mobile/phase-X.Y-[your-task]

# 3. Rebase on main phase branch
git rebase feature/mobile/phase-X-[main-phase]

# 4. Push any rebase changes
git push --force-with-lease origin feature/mobile/phase-X.Y-[your-task]
```

### Hourly Micro-Sync
```bash
# Quick sync to catch others' changes
git pull --rebase origin feature/mobile/phase-X-[main-phase]
git push origin feature/mobile/phase-X.Y-[your-task]
```

### End of Day Protocol
```bash
# 1. Commit all work
git add -A
git commit -m "feat(mobile): [end of day commit description]"

# 2. Pull and push
git pull --rebase origin feature/mobile/phase-X.Y-[your-task]
git push origin feature/mobile/phase-X.Y-[your-task]

# 3. Update task checkboxes in DEVELOPMENT_PLAN.md
git add DEVELOPMENT_PLAN.md
git commit -m "docs: update progress for [your tasks]"
git push
```

## 🔀 Merge Strategy

### Daily Phase Merges
```bash
# Phase lead or designated agent merges subtasks daily
git checkout feature/mobile/phase-X-[main-phase]
git pull origin feature/mobile/phase-X-[main-phase]

# Merge each subtask
git merge --no-ff feature/mobile/phase-X.Y-[subtask]
git push origin feature/mobile/phase-X-[main-phase]
```

### Weekly Main Merges
```bash
# Only after phase is complete and tested
git checkout main
git pull origin main
git merge --no-ff feature/mobile/phase-X-[main-phase]
git push origin main
```

## 📝 Coordination Rules

### 1. Type Definitions
- Shared types go in `/mobile/src/types/[domain].ts`
- Create interface first, notify others
- Never modify existing interfaces without coordination

### 2. Constants
```typescript
// Always add to appropriate constant file
/mobile/src/constants/
├── api.ts        // API endpoints
├── navigation.ts // Route names
├── storage.ts    // DB/AsyncStorage keys
├── theme.ts      // UI theme (existing)
└── ui.ts         // Dimensions, durations
```

### 3. Import Order (Enforced)
```typescript
// 1. External packages
import React from 'react';
import { View } from 'react-native';

// 2. UI framework
import { Button } from 'tamagui';

// 3. Shared package
import { UserSchema } from '@shared/schemas';

// 4. Local types
import type { User } from '@/types/user';

// 5. Local components
import { Header } from '@/components/Header';

// 6. Local utilities
import { formatDate } from '@/utils/date';

// 7. Local stores
import { useUserStore } from '@/stores/user';
```

## 🚦 Conflict Resolution

### If Conflicts Occur:
1. **Stop and communicate** with the other agent
2. **Never force push** without coordination
3. **Resolve locally** before pushing
4. **Test thoroughly** after resolution

### Conflict Prevention:
1. Work only in assigned directories
2. Pull frequently (every hour minimum)
3. Keep commits small and focused
4. Communicate before modifying shared files

## 📊 Progress Tracking

### Update DEVELOPMENT_PLAN.md:
```bash
# After completing a task
- [x] Task description  # Add x to mark complete

# Commit the update
git add DEVELOPMENT_PLAN.md
git commit -m "docs: mark [task] as complete"
git push
```

### Communication Channels:
1. **PR Comments:** Technical discussions
2. **Commit Messages:** Clear change descriptions
3. **DEVELOPMENT_PLAN.md:** Progress tracking
4. **Branch Names:** Current work indicator

## 🔒 Safety Rules

1. **No Direct Main Commits:** Always use feature branches
2. **No Force Push:** Use `--force-with-lease` if necessary
3. **No Large Commits:** Break down into atomic changes
4. **No Silent Changes:** Always commit and push immediately
5. **No Assumption:** Communicate before making architectural decisions
6. **CRITICAL - NO BREAKING SHARED/API:** Both shared and API packages work perfectly on main branch. ANY breaking changes to these packages during mobile development is YOUR responsibility to fix immediately. Never assume test failures are pre-existing - they work on main!

## 📋 Checklist for New Task

- [ ] Create/checkout appropriate branch
- [ ] Pull latest changes from phase branch
- [ ] Work only in assigned directories
- [ ] Commit atomically with clear messages
- [ ] Push after every commit
- [ ] Update progress in DEVELOPMENT_PLAN.md
- [ ] Communicate blockers immediately

---

**Remember:** Over-communication is better than conflicts. When in doubt, ask!