# CTA A/B Testing Implementation

## Overview
This document outlines the implementation of 3 CTA variations on the Role Page based on `utm_medium` parameter for A/B testing.

## Test Variants

| Variant | utm_medium | CTA Text | Subtext Type | Subtext Content |
|---------|------------|----------|--------------|-----------------|
| **V1** | `static_scrum_12_v1` | "Claim Your Certificate Here" | Static | "Assessment Unlocks 100% increase in salary!" |
| **V2** | `static_scrum_12_v2` | "Start Global Certifications Test" | Static | "Assessment Unlocks 100% increase in salary!" |
| **V3** | `static_scrum_12_v3` | "Verify My Skills & Claim Certificate" | Animated | Rotating text (10 mins, 100% salaries, Global Standards) |
| **Default** | (none or other) | "Verify My Skills & Claim Certificate" | Animated | Rotating text (10 mins, 100% salaries, Global Standards) |

## Files Modified

### 1. `src/utils/localStorage.ts`
**Added:** `getCTAVariant()` function
- Returns CTA configuration based on `utm_medium` from localStorage
- Returns: `{ ctaText, useAnimatedSubtext, staticSubtext? }`
- Handles all 3 variants + default fallback

### 2. `src/components/landing/HeroSection.tsx`
**Changes:**
- Imports `getCTAVariant` from localStorage utils
- Calls `getCTAVariant()` to get variant config
- CTA button text: Uses `ctaVariant.ctaText`
- Subtext: Conditionally renders animated or static based on `ctaVariant.useAnimatedSubtext`

### 3. `src/components/landing/StickyMobileCTA.tsx`
**Changes:**
- Imports `getCTAVariant` from localStorage utils
- Calls `getCTAVariant()` to get variant config
- CTA button text: Uses `ctaVariant.ctaText`
- Subtext: Conditionally renders animated or static based on `ctaVariant.useAnimatedSubtext`

### 4. `src/components/landing/FinalCTASection.tsx`
**Changes:**
- Imports `getCTAVariant` from localStorage utils
- Calls `getCTAVariant()` to get variant config
- CTA button text: Uses `ctaVariant.ctaText`
- Note: This section doesn't have subtext, only CTA button

## Race Condition Prevention ✅

### How It's Prevented:
1. **App.tsx (HomeOrRole component)**:
   - Line 77-85: `useEffect` extracts and stores UTM params **synchronously** to localStorage
   - Line 100-101: **Then** renders `<RolePageVariant />` component

2. **Execution Order**:
   ```
   URL with ?utm_medium=static_scrum_12_v1
   ↓
   HomeOrRole component mounts
   ↓
   useEffect runs → extractUrlParams() → storeUrlParams() → localStorage.setItem() [SYNCHRONOUS]
   ↓
   Component renders → Returns <RolePageVariant />
   ↓
   Child components mount → getCTAVariant() reads from localStorage [DATA ALREADY THERE]
   ```

3. **Why It's Safe**:
   - `localStorage.setItem()` is synchronous (blocks until complete)
   - React processes effects before final DOM render
   - By the time child components mount, data is already in localStorage

## Testing Instructions

### Test URLs

**V1 - "Claim Your Certificate Here" (Static)**
```
http://localhost:5173/?role=Scrum%20Master&utm_medium=static_scrum_12_v1
```

**V2 - "Start Global Certifications Test" (Static)**
```
http://localhost:5173/?role=Scrum%20Master&utm_medium=static_scrum_12_v2
```

**V3 - "Verify My Skills & Claim Certificate" (Animated)**
```
http://localhost:5173/?role=Scrum%20Master&utm_medium=static_scrum_12_v3
```

**Default - "Verify My Skills & Claim Certificate" (Animated)**
```
http://localhost:5173/?role=Scrum%20Master
```

### What to Verify

For each test URL, check:

1. **Hero Section CTA**:
   - ✅ Button text matches the variant
   - ✅ Subtext displays correctly (static or animated)
   - ✅ Arrow (→) is appended to button text

2. **Sticky Mobile CTA** (scroll down on mobile view):
   - ✅ Button text matches the variant
   - ✅ Subtext displays correctly (static or animated)
   - ✅ Arrow (→) is appended to button text

3. **Final CTA Section** (bottom of page):
   - ✅ Button text matches the variant
   - ✅ Arrow (→) is appended to button text

4. **Browser Console**:
   - ✅ Check for `App: Stored URL parameters:` log
   - ✅ Verify utm_medium is correctly stored

5. **localStorage** (DevTools → Application → Local Storage):
   - ✅ Check `userData` key
   - ✅ Verify `urlParams.utm_medium` matches the URL

### Expected Results

**V1 & V2 (Static Subtext)**:
```
CTA: "Claim Your Certificate Here ->" or "Start Global Certifications Test ->"
Subtext: [📈 icon] "Assessment Unlocks 100% increase in salary!"
```

**V3 & Default (Animated Subtext)**:
```
CTA: "Verify My Skills & Claim Certificate ->"
Subtext: Rotating every 3 seconds:
  - [⏰ icon] "Takes less than 10 mins"
  - [📈 icon] "Unlocks 100% higher salaries"
  - [🌍 icon] "Based on Global Standards"
```

## Analytics Tracking

### Recommended Events to Track:
- `view_role_page` - Already tracked, include `utm_medium` in properties
- `click_begin_assessment` - Already tracked, include `utm_medium` and `cta_variant`

### Example:
```javascript
analytics.track('click_begin_assessment', {
    role_name: role,
    source: 'landing_page_variant',
    utm_medium: getUserData().urlParams?.utm_medium,
    cta_text: getCTAVariant().ctaText
});
```

## Rollback Plan

If issues arise, simply modify `getCTAVariant()` in `src/utils/localStorage.ts` to return the default variant for all cases:

```typescript
export const getCTAVariant = () => {
  return {
    ctaText: 'Verify My Skills & Claim Certificate',
    useAnimatedSubtext: true
  };
};
```

## Notes

- ✅ No breaking changes to existing functionality
- ✅ No API changes required
- ✅ All existing integrations remain intact
- ✅ Backward compatible (defaults to V3 behavior)
- ✅ No database changes needed
- ✅ Can be deployed immediately

## Success Metrics to Monitor

After deployment, track:
1. **Click-through Rate (CTR)** for each variant
2. **Assessment Start Rate** per variant
3. **Completion Rate** per variant
4. **Time to CTA Click** per variant
5. **Scroll Depth** correlation with CTR

## Next Steps

1. ✅ Implementation complete
2. 🔄 Test locally using the test URLs above
3. 🔄 Deploy to staging environment
4. 🔄 Run QA tests on staging
5. 🔄 Deploy to production
6. 🔄 Monitor analytics for 1-2 weeks
7. 🔄 Analyze results and pick winning variant
