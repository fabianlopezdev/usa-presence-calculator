# 🚨 MANDATORY AGENT STARTUP CHECKLIST

**STOP! Before doing ANY work, you MUST:**

1. ✅ Read `/.claude-settings.json` for ALL coding conventions
2. ✅ Read `/CLAUDE.md` for project-wide rules
3. ✅ Read `/mobile/GIT_WORKFLOW.md` completely
4. ✅ Read `/mobile/DEVELOPMENT_PLAN.md` to see current progress
5. ✅ Read `/mobile/STYLE_GUIDE.md` for UI implementation rules
6. ✅ Check your assigned phase and tasks below
7. ✅ Run the startup sync commands

## 🎯 Your Assignment

### Find Your Role:
```
Phase 1.2 Assignments:
- Agent A: State Management (stores/*)
- Agent B: Database Layer (db/*)
- Agent C: Navigation (app/*)
- Agent D: Design System (components/*)

Phase 2.1 Assignments:
- Agent E: Passkey Auth
- Agent F: Magic Link Auth
[etc...]
```

## 🚀 Startup Commands (RUN THESE FIRST!)

```bash
# 1. Check current branch and sync status
git status
git branch -a

# 2. Fetch latest changes
git fetch --all

# 3. Checkout your branch (replace X.Y with your phase/task)
git checkout feature/mobile/phase-X.Y-[your-task]
# If branch doesn't exist:
git checkout -b feature/mobile/phase-X.Y-[your-task] origin/feature/mobile/phase-X-[main-phase]

# 4. Pull latest changes
git pull origin feature/mobile/phase-X.Y-[your-task]
git pull origin feature/mobile/phase-X-[main-phase]
git rebase feature/mobile/phase-X-[main-phase]

# 5. Check for conflicts or issues
git status

# 6. Install dependencies if needed
pnpm install
```

## 📋 Rules Reminder

### Critical .claude-settings.json Rules:
- 🔴 **NEVER install packages without permission** - Ask first!
- 🔴 **ALWAYS use path aliases** (@/components, @/stores, @shared/schemas)
- 🔴 **NO relative imports** (../../../ is forbidden)
- 🔴 **NO comments** - Code must be self-documenting
- 🔴 **ALL constants in /constants folder** - No hardcoded values
- 🔴 **Import order is MANDATORY** (see below)
- 🔴 **One-line commits** following conventional format
- 🔴 **Descriptive names only** - No abbreviations

### Import Order (ENFORCED):
```typescript
// 1. External packages (alphabetical)
import React, { useState } from 'react';
import { View, Text } from 'react-native';

// 2. UI framework imports
import { Button, Card } from 'tamagui';

// 3. Shared package imports
import { UserSchema } from '@shared/schemas';

// 4. Local type imports
import type { User } from '@/types/user';

// 5. Local component imports
import { Header } from '@/components/Header';

// 6. Local utility imports
import { formatDate } from '@/utils/date';

// 7. Local store imports
import { useUserStore } from '@/stores/user';
```

### EVERY Commit Must:
```bash
# ALWAYS run checks BEFORE committing!
pnpm lint && pnpm typecheck && pnpm test

# Only if all checks pass:
git add [specific files only]
git commit -m "type(mobile): specific description"
git pull --rebase origin feature/mobile/phase-X.Y-[your-task]
git push origin feature/mobile/phase-X.Y-[your-task]
```

### NEVER:
- ❌ Work on main branch
- ❌ Edit files outside your assigned directories
- ❌ Make large commits
- ❌ Install packages without pulling latest package.json first
- ❌ Force push without coordination
- ❌ Use relative imports or hardcoded values
- ❌ Skip the import order rules

### ALWAYS:
- ✅ Pull before starting work
- ✅ Push immediately after commit
- ✅ Update DEVELOPMENT_PLAN.md checkboxes
- ✅ Follow import order rules
- ✅ Use path aliases (@/components, not ../components)
- ✅ Put constants in appropriate files
- ✅ Write self-documenting code

## 🔍 Quick Status Check

Run this to see what others are working on:
```bash
# See recent commits
git log --oneline -10

# See who modified what
git log --name-status --oneline -5

# Check your current task status
grep -A 5 -B 5 "\[ \]" DEVELOPMENT_PLAN.md | grep -A 5 -B 5 "[your-task-keyword]"
```

## 🆘 If You're Unsure

1. Check existing code patterns in the codebase
2. Read the technical documents
3. Look at recent commits for examples
4. Ask for clarification rather than guessing

## 📝 End of Session

Before stopping work:
```bash
# Commit all changes
git add -A
git status  # Review what you're committing
git commit -m "feat(mobile): [session summary]"
git push

# Update progress
# Edit DEVELOPMENT_PLAN.md to check completed tasks
git add DEVELOPMENT_PLAN.md
git commit -m "docs: update progress for [tasks completed]"
git push

# Leave notes for next agent
echo "Session notes: [what you did, any blockers]" >> SESSION_NOTES.md
git add SESSION_NOTES.md
git commit -m "docs: session notes for [date]"
git push
```

---
⚠️ **FAILURE TO FOLLOW THESE RULES WILL CAUSE CONFLICTS AND DELAYS**