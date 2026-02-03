# Tactical Implementation Guide: Landing Page Design Specs

## 🎨 Design System (Based on Executive Brief)

### Color Palette
```css
/* Backgrounds */
--bg-deep-ocean: #001C2C;
--bg-dark-blue: #00385C;
--gradient-radial: radial-gradient(circle at top, #00385C, #001C2C);

/* Accents */
--accent-neon-green: #98D048;
--accent-cyan: #38BDF8;

/* Text */
--text-primary: #FFFFFF;
--text-secondary: rgba(255, 255, 255, 0.8);
--text-muted: rgba(255, 255, 255, 0.6);

/* Status */
--status-success: #98D048;
--status-warning: #FCD34D;
--status-active: #38BDF8;
```

### Typography
```css
/* Font Family */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;

/* Hierarchy */
--h1: 3.5rem / 3.75rem (56px/60px) - Bold
--h2: 2.5rem / 3rem (40px/48px) - SemiBold
--h3: 1.875rem / 2.25rem (30px/36px) - SemiBold
--h4: 1.5rem / 2rem (24px/32px) - Medium
--body-lg: 1.125rem / 1.75rem (18px/28px) - Regular
--body: 1rem / 1.5rem (16px/24px) - Regular
--body-sm: 0.875rem / 1.25rem (14px/20px) - Regular
--micro: 0.75rem / 1rem (12px/16px) - Medium
```

### Glassmorphism Effects
```css
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.glass-button {
  background: rgba(152, 208, 72, 0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(152, 208, 72, 0.3);
}
```

### Animations
```css
/* Pulsate Glow for Primary CTA */
@keyframes pulsate-glow {
  0%, 100% {
    box-shadow: 
      0 0 20px rgba(152, 208, 72, 0.4),
      0 0 40px rgba(152, 208, 72, 0.2);
  }
  50% {
    box-shadow: 
      0 0 30px rgba(152, 208, 72, 0.6),
      0 0 60px rgba(152, 208, 72, 0.3);
  }
}

/* Fade In Up for Sections */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 📐 Component Wireframes

### 1. Hero Section (Above Fold)
```
┌─────────────────────────────────────────────────────────────┐
│ [Urgency Banner - Sticky, Red/Orange, Full Width]          │
│ ⚠️ TIME-SENSITIVE: Assessment expires in 23h 14m           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    [Logo + Trust Badge]                     │
│              PMPx   |   🏆 Backed by Google                 │
│                                                             │
│                   [Main Headline - H1]                      │
│     Your Experience Deserves Evidence — Get Your            │
│         Strategic PM Scorecard in 45 Minutes                │
│                                                             │
│                  [Subheadline - Body-LG]                    │
│  You've delivered projects worth crores. Managed teams.     │
│  Now translate that into data recruiters trust.             │
│                                                             │
│    [Micro-copy with Icons - Body-SM, Cyan Color]           │
│   ⏱️ 45-min simulation • 📊 Instant scorecard • 🎯 Global   │
│                                                             │
│         [Primary CTA - Large, Pulsating Glow]              │
│         ┌───────────────────────────────────┐              │
│         │    Access My Assessment   →       │              │
│         └───────────────────────────────────┘              │
│            (Green #98D048, 56px height)                     │
│                                                             │
│     [Post-CTA Micro-copy - Text-Muted]                     │
│   ✓ No credit card • ✓ Instant results • ✓ 24h access     │
│                                                             │
│           [Trust Bar - Horizontal Icons]                    │
│  ✓ Backed by Google  |  ✓ Recognized by PMI & SHRM        │
│                                                             │
│         [Live Activity Counter - Glassmorphism]            │
│    🟢 89 senior PMs currently validating expertise          │
│                                                             │
│              [Hero Image/Visual - Right Side]              │
│       [Certificate Fan mockup or Dashboard preview]        │
└─────────────────────────────────────────────────────────────┘
```

**Implementation Notes:**
- **Mobile:** Stack elements vertically, hero image moves below CTA
- **Urgency Banner:** Sticky on scroll, countdown updates every second
- **CTA:** On hover, scale to 105%, increase glow intensity
- **Activity Counter:** Random number between 80-120, updates every 8-12 seconds

---

### 2. Problem Agitation Section
```
┌─────────────────────────────────────────────────────────────┐
│                     [Section Header - H2]                    │
│      The Experience Paradox Costing You ₹40L+ Annually      │
│                                                              │
│                    [Body Copy - Body]                        │
│  You have the scars. The war stories. The instincts...      │
│                                                              │
│                  [Pain Points - 3 Columns]                   │
│  ┌───────────────┬───────────────┬───────────────┐         │
│  │ ❌ Salary Gap  │ ❌ Time Lost  │ ❌ Zero Trust  │         │
│  │ ₹40-80L annual│ 6-12 months   │ No leverage in │         │
│  │ ceiling delta │ stagnation    │ reviews        │         │
│  └───────────────┴───────────────┴───────────────┘         │
│                                                              │
│                [Closing Statement - Body-LG]                 │
│  The solution isn't more courses. It's codification.        │
└─────────────────────────────────────────────────────────────┘
```

**Design Specs:**
- Background: Slightly darker than hero (#001018)
- Pain point cards: Glass effect with red accent border-left (2px, #EF4444)
- Mobile: Stack 3 columns vertically

---

### 3. How It Works Section
```
┌─────────────────────────────────────────────────────────────┐
│                     [Section Header - H2]                    │
│   From Tribal Knowledge to Global Standard — In 3 Steps     │
│                                                              │
│              [Process Steps - 3 Cards with Numbers]         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1️⃣ [Step Number - Large, Cyan Glow]                 │  │
│  │  Strategic Simulation                                 │  │
│  │  Solve a real PM crisis scenario: Budget overruns... │  │
│  │  [Icon: Simulation dashboard mockup]                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  2️⃣                                                   │  │
│  │  Instant Scorecard                                    │  │
│  │  Get quantified ratings across 8 competencies...     │  │
│  │  [Icon: Radar chart visualization]                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  3️⃣                                                   │  │
│  │  Certification Pathway                                │  │
│  │  Personalized bundle: PMPx + PScrumX + PRINCE2x      │  │
│  │  [Icon: Certificate fan visual]                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Design Specs:**
- Cards: Glassmorphism with left-side vertical accent (4px, green gradient)
- Step numbers: 48px font size, cyan glow effect
- Icons: Subtle animations on scroll-into-view (fade-in-up)
- Mobile: Full-width cards, 16px vertical spacing

---

### 4. Benefit Breakdown Section
```
┌─────────────────────────────────────────────────────────────┐
│                     [Section Header - H2]                    │
│            Your Scorecard = Your New Leverage                │
│                                                              │
│           [3 Use Cases - Icon + Headline + Body]            │
│                                                              │
│  🛡️ Silence the Doubters                                    │
│  When a 28-year-old questions your approach, show your      │
│  94% Risk Management score.                                  │
│                                                              │
│  🎯 Win the Recruiter Game                                   │
│  ATS systems scan for keywords. Your certificate adds:      │
│  Scrum, PRINCE2, Waterfall, Hybrid PM...                    │
│                                                              │
│  📊 Performance Review Armor                                 │
│  Your manager says you 'lack strategic thinking.'           │
│  You show: Strategic Planning - 89th percentile globally.   │
│                                                              │
│            [Sample Scorecard Visual]                         │
│  ┌────────────────────────────────────────────────┐        │
│  │  [Blurred preview of actual scorecard with]    │        │
│  │  [radar chart + percentile bars + framework]   │        │
│  │  [mapping - watermarked "SAMPLE"]              │        │
│  └────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

**Design Specs:**
- Use case icons: 36px, cyan color (#38BDF8)
- Sample scorecard: Glass card with blur-effect on data, "SAMPLE" watermark diagonally
- Hover state: Remove blur slightly (preview tease)

---

### 5. Social Proof Section
```
┌─────────────────────────────────────────────────────────────┐
│                     [Section Header - H2]                    │
│      Why 1,200+ Senior PMs Chose Strategic Validation       │
│                                                              │
│                  [Testimonial Cards - 3 Grid]                │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  [Photo - 64px circle] [Name + Title + Company]    │    │
│  │                                                      │    │
│  │  "After 15 years in operations, this was the       │    │
│  │   first time I had hard data to prove my strategic │    │
│  │   thinking. I used my scorecard in my next         │    │
│  │   interview — and got the VP offer."               │    │
│  │                                                      │    │
│  │  — Rajesh Mehta, VP Operations, Tata Steel         │    │
│  │                                                      │    │
│  │  📊 Score: 92% Strategic • 88% Risk                │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  [Repeat for 2 more testimonials]                           │
│                                                              │
│                   [Company Logos Bar]                        │
│  Professionals from these organizations validated:          │
│  [Google] [Amazon] [Tata] [Infosys] [Wipro] [Reliance]     │
└─────────────────────────────────────────────────────────────┘
```

**Design Specs:**
- Testimonial cards: Glass effect with green accent top-border (2px)
- Photos: Grayscale filter with subtle cyan border
- Quote text: Italic, slightly larger (18px)
- Score badges: Pill-shaped, green background with white text
- Company logos: 40px height, grayscale with opacity 0.7
- Mobile: Single column, full-width cards

---

### 6. Trust Reinforcement Section
```
┌─────────────────────────────────────────────────────────────┐
│                     [Section Header - H2]                    │
│        Built for Senior Professionals, Not Freshers         │
│                                                              │
│                   [3-Column Stats Grid]                      │
│                                                              │
│  ┌───────────────┬───────────────┬───────────────┐         │
│  │  Only 34%     │  Average      │  92% report   │         │
│  │  pass on      │  participant  │  securing     │         │
│  │  first        │  has 12.3     │  interviews   │         │
│  │  attempt      │  years exp.   │  within 30d   │         │
│  └───────────────┴───────────────┴───────────────┘         │
│                                                              │
│              [Authority Badges - Horizontal]                 │
│  ┌──────────┬──────────┬──────────┬──────────┐            │
│  │ [PMI]    │ [SHRM]   │ [Scrum]  │ [Google] │            │
│  │ Logo     │ Logo     │ Alliance │ Startups │            │
│  └──────────┴──────────┴──────────┴──────────┘            │
└─────────────────────────────────────────────────────────────┘
```

**Design Specs:**
- Stat cards: Dark background (#00141F) with green glow on hover
- Large numbers: 48px font size, bold, green color
- Authority badges: 80px width, centered, grayscale with color on hover

---

### 7. FAQ Section
```
┌─────────────────────────────────────────────────────────────┐
│                     [Section Header - H2]                    │
│                  Common Questions                            │
│                                                              │
│             [Accordion List - 4-6 Questions]                 │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ ▶ Is this another online course?               [+] │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ ▼ I don't have 40 hours for this.              [-] │    │
│  │                                                      │    │
│  │   The simulation takes 45 minutes. If you choose   │    │
│  │   to pursue certification after seeing your        │    │
│  │   scorecard, the learning modules are self-paced   │    │
│  │   (3-8 hours total).                               │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  [Continue accordion pattern...]                            │
└─────────────────────────────────────────────────────────────┘
```

**Design Specs:**
- Accordion: Glass card with border-left green accent when expanded
- Icons: Rotate 90deg on expand
- Answer text: Fade-in animation (200ms)
- Mobile: Full width, 12px vertical spacing

---

### 8. Final CTA Section
```
┌─────────────────────────────────────────────────────────────┐
│                 [Urgency Header - H2 + Icon]                 │
│     ⏱️ Your Assessment Access Expires in 22h 14m            │
│                                                              │
│                    [Body Copy - Body-LG]                     │
│  In the next 45 minutes, you can:                           │
│  • Discover your strategic PM percentile ranking            │
│  • Get proof of competencies recruiters scan for            │
│  • Receive a personalized certification roadmap             │
│                                                              │
│  Or you can let the link expire and stay in the             │
│  "experience black hole" for another 6 months.              │
│                                                              │
│         [Primary CTA - Extra Large]                         │
│         ┌───────────────────────────────────┐              │
│         │  Begin Strategic Assessment  →    │              │
│         └───────────────────────────────────┘              │
│            (72px height, full pulsate glow)                  │
│                                                              │
│              [Post-CTA Reassurance - Micro]                  │
│  ✓ No credit card required for assessment                   │
│  ✓ Scorecard delivered instantly                            │
│  ✓ Certification optional (purchase after results)          │
│                                                              │
│                 [Security Badge]                             │
│       🔒 Secure environment | Privacy guaranteed             │
└─────────────────────────────────────────────────────────────┘
```

**Design Specs:**
- Background: Darker gradient (#000811 to #001C2C)
- Countdown: Large (32px), bold, cyan color, updates every second
- CTA: Maximum glow intensity, slight scale animation on hover (108%)
- Reassurance text: Checkmarks in green, text in muted white

---

## 📱 Mobile-Specific Components

### Sticky Bottom CTA Bar (Mobile Only)
```
┌─────────────────────────────────────────────┐
│  ⏱️ 22h 14m left | [Begin Assessment →]    │
└─────────────────────────────────────────────┘
```

**Specs:**
- Position: Fixed bottom, 100% width
- Height: 64px
- Background: Glassmorphism with green glow top-border
- CTA Button: Inline, 60% width, green (#98D048)
- Z-index: 1000 (above all content)
- Appears after: User scrolls past hero section (50vh)

---

## ⚡ Performance Optimizations

### Critical CSS (Inline in <head>)
```html
<style>
  /* Above-fold critical styles */
  body { background: #001C2C; color: #fff; font-family: Inter, sans-serif; }
  .hero { min-height: 100vh; display: flex; align-items: center; }
  .cta-primary { 
    background: #98D048; 
    color: #001C2C; 
    padding: 16px 48px; 
    font-size: 18px; 
    border-radius: 8px;
  }
</style>
```

### Lazy Loading Strategy
- Hero image: `loading="eager"` (priority)
- Testimonial photos: `loading="lazy"`
- Company logos: `loading="lazy"`
- Certificate mockups: `loading="lazy"`

### Animation Performance
```css
/* Use transform/opacity for 60fps animations */
.fade-in-up {
  animation: fadeInUp 0.6s ease-out;
  will-change: transform, opacity; /* GPU acceleration */
}

/* Disable animations on low-end devices */
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; }
}
```

---

## 🧪 A/B Testing Framework

### Elements to Test (Priority Order)

**Test 1: Headline Variation**
- A: "Your Experience Deserves Evidence"
- B: "Stop Explaining Your Experience — Start Proving It"
- C: "Not All PM Experience is Equal — Prove You're in the Top 34%"

**Test 2: CTA Text**
- A: "Access My Assessment"
- B: "Validate My Expertise"
- C: "Claim My Assessment"

**Test 3: Hero Visual**
- A: Certificate fan mockup
- B: Scorecard dashboard preview (blurred)
- C: Professional photo + data overlay

**Test 4: Social Proof Placement**
- A: After problem section
- B: Immediately after hero
- C: Before final CTA

---

## 🔧 Implementation Checklist

### React Component Structure
```
LandingPage/
├── components/
│   ├── UrgencyBanner.jsx (sticky, countdown timer)
│   ├── HeroSection.jsx
│   ├── ProblemSection.jsx
│   ├── ProcessSection.jsx
│   ├── BenefitSection.jsx
│   ├── SocialProof.jsx
│   ├── TrustSignals.jsx
│   ├── FAQ.jsx
│   ├── FinalCTA.jsx
│   └── StickyMobileCTA.jsx (mobile only)
├── hooks/
│   ├── useCountdown.js (24-hour timer)
│   ├── useLiveCounter.js (fake live users)
│   └── useScrollProgress.js (sticky CTA trigger)
├── utils/
│   └── analytics.js (conversion tracking)
└── LandingPage.jsx (main orchestrator)
```

### Required Integrations
- [ ] Analytics: Track scroll depth, CTA clicks, time-on-page
- [ ] Countdown timer: Synced with WhatsApp message timestamp
- [ ] Live counter: Random number generator (80-120 range)
- [ ] Form validation: Email format check
- [ ] Loading states: Skeleton screens during data fetch
- [ ] Error handling: Graceful fallbacks for image load failures

---

## 📊 Success Metrics

### Primary Conversion Events
1. **Hero CTA Click** → Assessment Start
2. **Assessment Completion** → Scorecard View
3. **Scorecard View** → Certification Purchase

### Secondary Engagement Metrics
- Time to scroll: Avg. time before reaching problem section
- FAQ open rate: % of visitors expanding accordion
- Mobile sticky CTA click rate
- Social proof section dwell time

### A/B Test Success Criteria
- Minimum 500 visitors per variation
- 95% statistical significance
- Primary metric: CTA click-through rate
- Secondary metric: Time-on-page

---

This guide provides everything needed for pixel-perfect implementation matching your brand identity while maximizing conversion potential.
