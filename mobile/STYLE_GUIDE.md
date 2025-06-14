# USA Presence Calculator: Experience Style Guide v2.0

**Version:** 2.0  
**Date:** June 14, 2025  
**Author:** Fabián López González (via Gemini)

## Guiding Philosophy: "Effortless Clarity, Soothing Confidence"

Our goal is to create an interface that feels like a calm, expert partner. It should be visually stunning not because it is loud, but because it is serene, responsive, and intuitive. Every design choice, micro-interaction, and "wow" effect must serve to either clarify information, soothe anxiety, or celebrate a milestone. This guide provides the system for achieving that vision.

## Part 1: The Sensory Foundation (The "Soothing" Core)

This section defines the baseline sensory experience of the application.

### 1.1. Color Palette: Atmospheric & Semantic

Colors are used to create a calm atmosphere and convey status instantly. The dominance of neutrals and a gentle blue is intentional.

| Role | Name | Light Mode HEX | Dark Mode HEX | Usage |
|------|------|----------------|---------------|--------|
| Background | Snow | #F7F8FA | #1C2A3A | Main app background |
| Foreground/Card | White | #FFFFFF | #2D3748 | Surface for widgets and modals |
| Text | Charcoal | #2D3748 | #F7F8FA | Headlines, body copy |
| Subtle Text | Stone | #A0AEC0 | #A0AEC0 | Secondary info, placeholders |
| Primary/Brand | Primary Blue | #3A86FF | #3A86FF | Buttons, links, active tabs |
| Success | Success Green | #34D399 | #34D399 | Progress bars, "on track" status |
| Warning | Warning Orange | #FB923C | #FB923C | "Heads up!" alerts, risk areas |
| Accent | Celebration Gold | #FFD700 | #FFD700 | Rarely! For major milestones. |

### 1.2. Typography: The Voice of Clarity

We use a single, highly-readable font family (recommendation: Inter). The type scale is relative, ensuring it respects user accessibility settings. Opacity is used to create a subtle emotional nuance and visual hierarchy.

**Implementation Note: The rem Unit**  
1rem is relative to a base size of 16px. Implement with a helper: `const rem = (v) => v * 16;`

| Element | Font Weight | Font Size (rem) | Letter Spacing (em) | Opacity (on Charcoal) |
|---------|-------------|-----------------|--------------------|--------------------|
| Display Title | Bold (700) | 2rem (32px) | -0.02em | 100% |
| Screen Title | Semi-Bold (600) | 1.5rem (24px) | -0.01em | 95% |
| Widget/Card Title | Medium (500) | 1.125rem (18px) | 0em | 95% |
| Body | Regular (400) | 1rem (16px) | 0em | 90% |
| Sub-text/Caption | Regular (400) | 0.875rem (14px) | 0.01em | 100% (on Stone color) |
| Button | Medium (500) | 1rem (16px) | 0.02em | 100% |

### 1.3. Spacing & Layout: The Rhythm of Breath

A rem-based 4px grid system ensures the layout has "breathing room" that scales with the user's text size, promoting calmness and focus.

| Unit Name | rem Value | px Equiv. | Usage |
|-----------|-----------|-----------|--------|
| space.xs | 0.25rem | 4px | Gaps between icons and text |
| space.sm | 0.5rem | 8px | Inner padding for small tags |
| space.md | 1rem | 16px | Standard padding for buttons & cards |
| space.lg | 1.5rem | 24px | Outer margins for screen content |
| space.xl | 2rem | 32px | Gaps between large sections |
| space.xxl | 3rem | 48px | Large vertical spacing |

**Layout Rule:** All screens must have a `space.lg` (1.5rem) horizontal padding.

### 1.4. Iconography

Icons must be simple, clear, and from a single, consistent library (recommendation: Feather Icons or Ionicons).

- **Style:** Line-based (outline), 2px stroke width.
- **Size:** 1.5rem (24x24px) for primary touch targets.
- **Color:** Use Charcoal for standard icons, Primary Blue for interactive/selected icons.

### 1.5. Haptics: The Reassuring Touch

Subtle haptic feedback confirms actions and makes the interface feel tangible.

- **Light Haptic:** For minor selections (toggling a switch, selecting a date).
- **Success Haptic:** For completing a key action (saving a trip, finishing onboarding).

**Rule:** NEVER use error or warning haptics. They are jarring and counter to the app's soothing mission.

## Part 2: Dynamic Identity (Motion & Interaction)

This is where the app comes alive. All animations use Moti and follow a specific motion philosophy.

### 2.1. Motion Philosophy: "Fluid & Purposeful"

Animations should mimic the physics of a gentle, fluid medium. Avoid harsh, snappy, or mechanical movements.

- **Default Easing:** Use a gentle spring (`type: 'spring'`) with low stiffness and damping for a natural, non-robotic feel.
- **Default Duration:** For timing-based animations, aim for 350-500ms to feel deliberate, not frantic.
- **Standard Enter Animation:** For elements appearing on screen, use a gentle fade-in and slide-up.

```typescript
from={{ opacity: 0, translateY: rem(0.5) }}
animate={{ opacity: 1, translateY: 0 }}
```

### 2.2. Component States & Microinteractions

**Buttons:**
- **Padding:** Vertical 0.75rem, Horizontal 1.5rem.
- **Border Radius:** 0.5rem (8px).
- **Interaction:** On press, the button scales to 0.97 and its opacity shifts to 0.9. A light haptic fires simultaneously. This makes the button feel physically responsive.

**Form Inputs:**
- **Padding:** 1rem for a generous touch area.
- **Border Radius:** 0.5rem (8px).
- **Interaction:** On focus, the border animates from 1px Stone to 2px Primary Blue, accompanied by a subtle "glow" boxShadow effect in the same blue.

**Dashboard Widgets / Cards:**
- **Padding:** 1rem internal padding.
- **Border Radius:** 1rem (16px) for a soft, modern look.
- **Shadow (Light Mode):** Use a soft, layered shadow.
  ```typescript
  shadowColor: '#A0AEC0',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 12
  ```

**Dashboard Numbers (The "Living" Data):**
- **Interaction:** When a number changes, the old value quickly fades/slides out as the new value fades/slides in. This provides clear, satisfying confirmation. Use `<MotiText />`.

## Part 3: Signature "Award-Worthy" Moments

These are specific, high-impact "wow" effects tied to key user journey milestones.

### 3.1. Signature Moment 1: "The First Glance" (Onboarding Completion)

**Scene:** The user finishes onboarding and sees their dashboard for the first time.

**The "Wow" Effect:** Animate the dashboard's arrival.
- The main progress bar/circle animates, drawing itself into view over ~800ms.
- The "Days Present" number rapidly animates from 0 to the calculated total, ending with a subtle scale-bounce.
- Other widgets fade in and slide up sequentially.

**Emotion:** Empowerment. "I understand you, and here is your journey, visualized and alive."

### 3.2. Signature Moment 2: "The Simulator's Ripple Effect"

**Scene:** The user interacts with the Travel Simulator.

**The "Wow" Effect:** A real-time cause-and-effect visualization.
- As dates are entered, a semi-transparent "ghost" overlay appears on the calendar.
- Simultaneously, the main progress bar smoothly animates to its projected position, showing a "ghost" segment of the trip's impact.
- A status label ("Status: Safe") fades in smoothly.
- Clearing the simulation gracefully animates everything back to its original state.

**Emotion:** Confidence. Transforms anxiety about the future into a powerful, clear planning session.

### 3.3. Signature Moment 3: "The Finish Line" (Meeting a Requirement)

**Scene:** The user crosses a major requirement threshold.

**The "Wow" Effect:** A moment of pure, uncluttered celebration.
- A push notification with the Celebration Gold icon arrives.
- Upon opening the app, a modal appears over the UI. A slow, elegant confetti animation plays behind this modal.
- The modal text is clean, large, and uses the Celebration Gold color for an icon or key phrase.
- A Success Haptic fires once.

**Emotion:** Accomplishment. A profound sense of validation and relief that honors the user's long journey.

## Part 4: Voice & Tone (Microcopy Guidelines)

The tone must be consistently positive, supportive, and human throughout the application.

### 4.1. Core Microcopy Examples

| Element | Copy Example | Rationale |
|---------|--------------|-----------|
| **Welcome** | "Welcome! Let's make your path to citizenship simple and clear." | Friendly, purpose-driven, and sets a positive tone from the start. |
| **Dashboard Greeting** | "Good morning, Maria. You're on track! Let's keep it that way." | Personalized, provides positive reinforcement, and feels encouraging. |
| **Celebratory Notification** | "Congratulations! You've met the presence requirement—time to apply!" | Celebratory and actionable, marking a significant user milestone. |
| **Risk Warning** | "Heads up! Your current trip is approaching 180 days. Plan your return to protect your continuous residence." | Proactive, clear, and helpful, but framed to avoid undue alarm. |
| **Simulator CTA** | "Plan your travels with confidence." | Focuses on the user benefit: alleviating anxiety and enabling confident planning. |
| **PDF Export CTA** | "Your professional report is ready—download or share." | Clear, concise, and explains the value and use case of the feature. |
| **Empty State** | "No trips yet! Tap the + button to log your first journey." | Encouraging and instructional without being condescending. |
| **Error State** | "Something went wrong. Let's try that again." | Human, supportive, and action-oriented rather than technical. |

### 4.2. Writing Principles

1. **Be Human:** Write like a supportive friend, not a government form.
2. **Be Clear:** Use plain language. Avoid legal jargon unless absolutely necessary.
3. **Be Encouraging:** Frame everything positively. Even warnings should feel helpful.
4. **Be Concise:** Mobile screens demand brevity. Every word must earn its place.

## Part 5: Component Behavior Specifications

### 5.1. Progress Bar/Circle

- **Animation:** Draws itself into view over ~800ms on dashboard load/update
- **Color States:**
  - Success Green (#34D399): When on track (≥ required days)
  - Primary Blue (#3A86FF): When in progress but not yet met
  - Warning Orange (#FB923C): When at risk (approaching critical thresholds)
- **Number Animation:** Count-up animation from 0 to actual value with easing
- **Interaction:** Tappable to reveal detailed breakdown

### 5.2. Calendar Component

- **Visual Coding:**
  - Green fill: Days of physical presence in the U.S.
  - Red fill: Days spent abroad
  - Dotted outline + transparency: Simulated future trips
  - Today marker: Bold border in Primary Blue
- **Navigation:** Smooth swipe gestures between months with spring physics
- **Interaction:** Single tap reveals day details; long press for quick actions

### 5.3. Trip List Items

- **Layout:** Card-based with generous touch targets (min 44px height)
- **Swipe Actions:** Swipe left to reveal delete (with confirmation)
- **Edit State:** Tap to expand inline editing without navigation
- **Visual Hierarchy:** Future trips slightly faded (90% opacity)

### 5.4. Notifications

- **Types:**
  - **Milestone:** Celebration Gold icon, success haptic
  - **Warning:** Warning Orange icon, no haptic (per soothing principle)
  - **Reminder:** Primary Blue icon, light haptic
- **Deep Linking:** All notifications must link to relevant app section
- **History:** Viewable in app with read/unread states

### 5.5. Toast Messages

- **Position:** Top of screen, below safe area
- **Duration:** 3 seconds for confirmations, 5 seconds for errors
- **Animation:** Slide down + fade in, with spring physics
- **Dismissible:** Swipe up to dismiss early

## Part 6: Accessibility Requirements

### 6.1. Visual Accessibility

- **Contrast Ratios:** 
  - Normal text: 4.5:1 minimum
  - Large text (18px+): 3:1 minimum
  - Interactive elements: 3:1 minimum against background
- **Color Independence:** Never rely solely on color to convey information
  - Calendar: Use patterns/icons in addition to colors
  - Status indicators: Include text labels or icons

### 6.2. Dynamic Type Support

- **Scaling:** All text must scale from 80% to 200% of base size
- **Layout:** No text truncation or overlapping at maximum size
- **Line Height:** Increase proportionally with text size

### 6.3. Screen Reader Support

- **Labels:** Every interactive element must have a descriptive label
- **Hints:** Complex interactions include hints (e.g., "Double tap to edit")
- **Announcements:** State changes announced (e.g., "Trip saved successfully")
- **Grouping:** Related elements grouped logically

### 6.4. Motion & Animation Settings

- **Reduce Motion:** Honor system preference to disable non-essential animations
- **Essential Motion:** Progress indicators and data updates remain functional
- **Alternative Feedback:** Replace motion with color changes or haptics

## Part 7: Screen-Specific Guidelines

### 7.1. Dashboard Screen

- **Hero Metric:** Physical presence progress dominates (40% of viewport)
- **Widget Layout:** 2-column grid for secondary metrics
- **Scroll Behavior:** Sticky header with primary metric visible during scroll
- **Loading State:** Skeleton screens with gentle shimmer effect

### 7.2. Trips & Simulator Screen

- **Tab Switching:** Segmented control with smooth slide animation
- **List Performance:** Virtualized scrolling for 100+ trips
- **Simulator Feedback:** Real-time updates with 100ms debounce
- **Conversion Flow:** Single tap to convert simulation to real trip

### 7.3. Calendar Screen

- **Default View:** Current month centered
- **Zoom Levels:** Month view (default) and year overview
- **Performance:** Lazy load months as user scrolls
- **Selection State:** Selected date highlighted with Primary Blue ring

## Part 8: Empty States & Error Handling

### 8.1. Empty States

Each empty state must include:
1. **Illustration:** Simple, friendly line art (not photos)
2. **Message:** Encouraging and instructional
3. **Action:** Clear CTA button when applicable

### 8.2. Error States

- **Network Errors:** "No connection, but your data is safe offline."
- **Sync Errors:** "Changes saved locally. We'll sync when you're back online."
- **Validation Errors:** Inline with specific, helpful messages
- **System Errors:** Apologetic tone with retry option

## Part 9: Performance Guidelines

### 9.1. Animation Performance

- **FPS Target:** 60fps for all animations
- **useNativeDriver:** Required for all transform and opacity animations
- **Complexity Budget:** Maximum 3 concurrent animations

### 9.2. Interaction Response Times

- **Tap Feedback:** < 100ms (haptic + visual)
- **Screen Transitions:** < 300ms
- **Data Updates:** < 1s with loading indicator
- **Heavy Operations:** Background with progress indicator