# Funnel Comparison Dashboard Guide

## Overview
The new Funnel Comparison Dashboard allows you to create filter groups and compare funnel performance across different traffic sources, campaigns, or any custom UTM parameters.

## Access URLs

- **Original Dashboard**: `/admin/dashboard` - Single view with quick filters
- **Comparison Dashboard**: `/admin/comparison` - Advanced grouping and comparison features

## Features

### 1. **Filter Groups**
Create named filter groups with specific UTM parameters:
- **Group Name**: Descriptive name (e.g., "Google Ads", "LinkedIn Campaign", "Organic Traffic")
- **UTM Source**: Filter by utm_source parameter (optional)
- **UTM Medium**: Filter by utm_medium parameter (optional)
- Leave both blank for "All Traffic"

### 2. **View Modes**

#### Single View
- View metrics for one filter group at a time
- Shows detailed funnel breakdown with all stages
- Includes revenue and AOV metrics
- Quick switching between groups

#### Comparison Mode
- Compare multiple filter groups side-by-side
- Visual bar charts showing conversion rates
- Side-by-side metric comparison table
- Color-coded groups for easy identification

### 3. **Metrics Tracked**

**Funnel Stages:**
- Total Sessions
- Clicked Begin Assessment
- Started Assessment
- Completed Assessment
- Passed (>50%)
- Contact Submitted
- Payment Initiated
- Payment Success

**Revenue Metrics:**
- Total Revenue (₹)
- Average Order Value (AOV) (₹)

## How to Use

### Creating Filter Groups

1. Click **"Add Group"** button
2. Enter a descriptive name
3. (Optional) Enter UTM Source filter
4. (Optional) Enter UTM Medium filter
5. Click **"Save"**

**Examples:**
- **Google Ads**: Source = "google", Medium = "cpc"
- **Facebook Organic**: Source = "facebook", Medium = "organic"
- **Email Campaign**: Source = "newsletter", Medium = "email"
- **All Traffic**: Leave both fields blank

### Single View Mode

1. Select **"Single View"** toggle
2. Click on any filter group card to view its data
3. Click **"Refresh Data"** to load metrics
4. Review detailed funnel breakdown and metrics

### Comparison Mode

1. Select **"Compare Groups"** toggle
2. Click on multiple filter group cards to select them
3. Selected groups are highlighted with their color
4. Click **"Refresh Data"** to load comparison
5. Review:
   - **Comparison Table**: Exact numbers side-by-side
   - **Conversion Charts**: Visual representation of conversion rates

### Managing Groups

- **Edit**: Click on a group card to select/deselect it
- **Delete**: Click the ✕ button on a group card (must have at least one group)
- **Color Coding**: Each group automatically gets a unique color

## Tips

1. **Start Broad, Then Narrow**: Create an "All Traffic" group first to see baseline metrics
2. **Meaningful Names**: Use descriptive names that clearly identify the traffic source
3. **Compare Apples to Apples**: When comparing, ensure groups have similar time periods
4. **Revenue Tracking**: Revenue metrics respect the same UTM filters as funnel metrics
5. **Group Limit**: No hard limit, but recommend keeping it under 6 groups for readability

## Use Cases

### Campaign Performance
Compare different marketing campaigns:
- Google Ads vs Facebook Ads
- Email Campaign A vs Campaign B
- Organic vs Paid traffic

### Channel Analysis
Analyze performance by channel:
- Social Media (facebook, linkedin, twitter)
- Search (google, bing)
- Direct vs Referral

### A/B Testing
Compare different traffic sources:
- Landing Page Variant A vs Variant B
- Different UTM campaigns
- Geographic regions (if tracked in UTM)

## Color Legend

Each filter group is assigned a unique color:
- 🟢 Green (#98D048)
- 🔵 Blue (#38BDF8)
- 🟡 Yellow (#F59E0B)
- 🔴 Red (#EF4444)
- 🟣 Purple (#8B5CF6)
- 🌸 Pink (#EC4899)
- 🟦 Teal (#14B8A6)
- 🟠 Orange (#F97316)

## Performance Notes

- Each group fetches data independently
- Comparison mode loads multiple groups in parallel
- Recommended: Compare 2-4 groups at a time for optimal performance
- Data is cached per session for faster subsequent loads
