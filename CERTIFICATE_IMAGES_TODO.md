# Certificate Images - To Be Updated

## Current Certificate Images (Scrum-focused)
Location: `src/assets/certificateImages/`

Currently contains:
- `psm-1.png` - Scrum Master Basic
- `psm-2.png` - Scrum Master Advanced
- `pmpx.png` - Project Management
- `prince2x.png` - Prince2x
- `ai-in-scrum.png` - AI for Scrum

## Required New Certificate Images (Data Analytics-focused)

Please replace the above images with the following:

### 1. **cdapx-1.png** (or cdapx-i.png)
- **Full Name**: Certified Data Analyst Pro I
- **Short Name**: CDAPx I
- **Purpose**: First level data analytics certification

### 2. **cdapx-2.png** (or cdapx-ii.png)
- **Full Name**: Certified Data Analyst Pro II
- **Short Name**: CDAPx II
- **Purpose**: Advanced level data analytics certification

### 3. **cbapx.png**
- **Full Name**: Certified Business Analyst Pro
- **Short Name**: CBAPx
- **Purpose**: Business analysis certification

### 4. **pmpx.png** ✅ (Keep this one)
- **Full Name**: Project Management Pro
- **Short Name**: PMPx
- **Purpose**: Project management certification
- **Note**: This file already exists, just verify the content is appropriate

### 5. **ai-in-data-analysis.png**
- **Full Name**: AI for Data Analyst Professionals
- **Short Name**: AI in Data Analysis
- **Purpose**: AI specialization for data analysts

## Files That Reference Certificate Images

### 1. HeroSection.tsx
```typescript
// Lines 9-14 - Import certificate images
import psm1 from '../../assets/certificateImages/psm-1.png';
import psm2 from '../../assets/certificateImages/psm-2.png';
import pmpx from '../../assets/certificateImages/pmpx.png';
import prince2x from '../../assets/certificateImages/prince2x.png';
import aiInScrum from '../../assets/certificateImages/ai-in-scrum.png';
```

**Needs to be changed to:**
```typescript
import cdapx1 from '../../assets/certificateImages/cdapx-1.png';
import cdapx2 from '../../assets/certificateImages/cdapx-2.png';
import cbapx from '../../assets/certificateImages/cbapx.png';
import pmpx from '../../assets/certificateImages/pmpx.png';
import aiInDataAnalysis from '../../assets/certificateImages/ai-in-data-analysis.png';
```

### 2. HeroSectionV2.tsx
```typescript
// Lines 7-11 - Import certificate images (similar structure)
// NOTE: This file has different variable names but needs same images
```

## Where Certificate Names Appear

### Certificate Fan Component
The certificate fan displays these short names:
- CDAPx I
- CDAPx II
- CBAPx
- PMPx
- AI in Data Analysis

### Role Page Subtitle
The main role page mentions:
- "CDAPx I & II, CBAPx & PMPx"

## Action Items

- [ ] Create/obtain 5 certificate images with correct branding
- [ ] Name them according to the convention above
- [ ] Place in `src/assets/certificateImages/` directory
- [ ] Update import statements in HeroSection.tsx
- [ ] Update import statements in HeroSectionV2.tsx
- [ ] Update the certificateImages array in both files
- [ ] Test the certificate fan animation with new images

## Design Specifications (Recommended)

For consistency, certificate images should:
- Be PNG format with transparent background
- Have similar dimensions (e.g., 800x600px or 1000x750px)
- Include:
  - Certificate border/frame
  - Certification name prominently displayed
  - Your logo/branding
  - Placeholder for recipient name
  - Appropriate imagery related to data analytics

## Testing After Update

After adding new images, verify:
1. Certificate fan animation works smoothly
2. All 5 certificates are visible
3. Images are sharp on retina displays
4. Loading performance is acceptable
5. Mobile view displays correctly

---
**Status**: Waiting for certificate images
**Priority**: Medium (functionality works, just needs visual update)
**Last Updated**: 2026-01-23
