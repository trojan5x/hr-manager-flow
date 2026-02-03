# Application Design Style Guide

This document outlines the design principles, color palettes, typography, and component styles used in the application. Use this guide to ensure consistency when developing new features or related applications.

## 1. Design Philosophy
The design language is **Modern**, **Premium**, and **High-Contrast**.
- **Dark Mode First:** The interface is predominantly dark (Deep Navy) with bright, neon accents (Lime, Blue).
- **Glassmorphism:** Surfaces often use semi-transparent backgrounds with backdrop blurs to create depth.
- **Glowing Elements:** Active states and highlights often feature glow effects `box-shadow` to simulate light.
- **Interactivity:** Elements respond to hover and focus with opacity changes, scaling, or border transitions.

## 2. Color Palette

### 2.1 Primary Colors
| Color Name | Hex Code | Utility Class | Usage |
| :--- | :--- | :--- | :--- |
| **Deep Navy** | `#021019` | `bg-[#021019]` / `text-[#021019]` | Main App Background, Primary Text on Light |
| **Lighter Navy**| `#052030` | `bg-[#052030]` | Secondary Backgrounds, Cards |
| **Brand Lime** | `#98D048` | `bg-[#98D048]` / `text-[#98D048]` | **Primary Action**, Active States, Highlights, Glows |
| **Accent Blue** | `#406AFF` | `bg-[#406AFF]` / `text-[#406AFF]` | Tags, Pills, Secondary Accents |

### 2.2 Functional Colors
| Color Name | Hex Code | Utility Class | Usage |
| :--- | :--- | :--- | :--- |
| **Brand Gold** | `#FFD54F` | `text-brand-gold` | Highlighted text in headings |
| **White** | `#FFFFFF` | `text-white` | Primary Text on Dark |
| **Gray 300** | `#D1D5DB` | `text-gray-300` | Secondary Description Text |
| **Glass White** | `rgba(255,255,255,0.05)` | `bg-white/5` | Card Backgrounds |

## 3. Typography

**Font Family:** `Inter`, sans-serif

| Element | Size | Weight | Color | Styles (Tailwind) |
| :--- | :--- | :--- | :--- | :--- |
| **Headings** | Variable | Bold (700) | White | `font-bold text-white` |
| **Body Text** | 14px - 16px | Regular (400) | Gray 300 | `text-sm/base text-gray-300` |
| **Labels** | 12px | Medium (500) | Lime | `text-xs font-medium uppercase tracking-wide text-[#98D048]` |
| **Buttons** | 14px - 16px | Semibold (600) | Variable | `font-semibold` |

## 4. UI Components

### 4.1 Buttons (`Button.tsx`)
Standard sizing: `px-6 py-3 rounded-lg`.

**Primary Button**
- **Bg:** `#98D048` (Lime)
- **Text:** `#021019` (Navy)
- **Hover:** Opacity 90%
- **Focus:** Ring Brand Lime
```jsx
<button className="bg-[#98D048] text-[#021019] px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all">
  Get Started
</button>
```

**Secondary Button**
- **Bg:** `#00385C`
- **Text:** White
- **Hover:** 80% Opacity
```jsx
<button className="bg-[#00385C] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#00385C]/80 transition-all">
  Learn More
</button>
```

**Outline Button**
- **Border:** 2px solid `#98D048`
- **Text:** `#98D048` (Lime)
- **Hover:** Bg `#98D048`, Text `#021019`
```jsx
<button className="border-2 border-[#98D048] text-[#98D048] px-6 py-3 rounded-lg font-semibold hover:bg-[#98D048] hover:text-[#021019] transition-all">
  View Details
</button>
```

### 4.2 Cards & Surfaces (`CertificationCard.tsx`)
Cards use a glassmorphism effect with borders that light up when selected.

**Base Card Style:**
- **Bg:** `bg-white/5` with `backdrop-blur-sm`
- **Border:** `border-white/20` (2px)
- **Radius:** `rounded-xl`
- **Padding:** `p-6`

**Active/Selected State:**
- **Bg:** `bg-[#98D048]/10` (Lime tint)
- **Border:** `border-[#98D048]` (Lime border)
- **Shadow:** `shadow-[0_0_20px_rgba(152,208,72,0.2)]` (Lime Glow)

```jsx
// Active Card Example
<div className="rounded-xl border-2 border-[#98D048] bg-[#98D048]/10 shadow-[0_0_20px_rgba(152,208,72,0.2)] p-6 backdrop-blur-sm">
  <h3 className="text-xl font-bold text-white">Card Title</h3>
  <p className="text-gray-300">Content goes here...</p>
</div>
```

### 4.3 Pills & Tags (`TagList.tsx`)
Used for frameworks, categories, or skills.
- **Bg:** `bg-[#406AFF]/10` (Blue tint)
- **Border:** `border-[#406AFF]/40`
- **Before/Text:** White or similar
- **Radius:** `rounded-[16px]` or `rounded-lg`

```jsx
<span className="px-3 py-1 bg-[#406AFF]/20 border border-[#406AFF]/40 rounded-lg text-xs text-white">
  Framework
</span>
```

### 4.4 Inputs & Form Elements
*(Inferred from general style)*
- **Bg:** `bg-white/5` or similar dark pane
- **Text:** White
- **Border:** `border-gray-700` or `border-white/20`
- **Focus:** `border-[#98D048]` ring

## 5. Animations & Transitions

**Durations:**
- Fast (Hover): `duration-200` or `duration-300`.
- Entrance: `0.5s` to `0.8s` (ease-out).

**Common Animations (`index.css` & `tailwind.config.js`):**
1.  **Fade In Up:** `animate-fade-in-up` (Translate Y 20px -> 0, Opacity 0 -> 1)
2.  **Pulsate Glow:** `animate-pulsate-glow` (For attention-grabbing elements using Lime shadow)
3.  **Scale In:** `animate-scale-in` (Scale 0.9 -> 1)
4.  **Infinite Scroll:** `animate-scroll-infinite` (Linear translation for tickers)

## 6. Icons
- **Library:** `lucide-react` is typically used.
- **Style:** Thin/Regular strokes.
- **Color:** White (default) or Brand Lime (`#98D048`) for accents.

## 7. Layout Guidelines
- **Container:** Centered content with max-width constraints (e.g., `max-w-7xl mx-auto`).
- **Spacing:** Generous padding (`py-12`, `py-20`) between sections to allow content to breathe.
- **Grid:** Responsive grids (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) with standard gaps (`gap-6` or `gap-8`).

---
*Generated by Antigravity based on codebase analysis.*
