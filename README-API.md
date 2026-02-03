# API Configuration

This document explains how to configure the API endpoints for different environments.

## Development Environment

The application is currently configured to use the localhost API:

```
API_BASE_URL = 'http://localhost:3000/api'
```

## Popular Roles API

The homepage fetches popular roles from:

```
GET http://localhost:3000/api/popular-roles?limit=20&offset=0
```

Expected response format:
```json
{
  "status": "success",
  "data": {
    "roles": [
      "Accountant",
      "Backend Engineer", 
      "Brand Manager",
      // ... more roles
    ],
    "pagination": {
      "total": 36,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  },
  "message": "Popular roles retrieved successfully"
}
```

## Role Search API (Type-ahead Suggestions)

The search input uses type-ahead functionality with:

```
GET http://localhost:3000/api/popular-roles/search?q=engineer&limit=10
```

Expected response format:
```json
{
  "status": "success",
  "data": {
    "roles": [
      "Backend Engineer",
      "DevOps Engineer",
      "Machine Learning Engineer"
    ],
    "query": "engineer",
    "totalMatches": 3
  },
  "message": "Search results retrieved successfully"
}
```

### Features:
- **Debounced Search**: 300ms delay to prevent excessive API calls
- **Keyboard Navigation**: Arrow keys to navigate, Enter to select, Escape to close
- **Smart Loading**: Shows loading spinner during search
- **Minimum Query Length**: Requires at least 2 characters
- **Suggestion Limit**: Shows up to 8 suggestions in dropdown

## Production Deployment

To deploy to production, update the `API_BASE_URL` constant in `src/services/api.ts`:

```typescript
// Change this line for production deployment
const API_BASE_URL = 'https://your-production-api.com/api';
```

## URL Parameter Handling

The application now handles URL parameters at the App routing level for consistent behavior:

### Supported Parameters:
- **email**: User email address
- **utm_source**: Campaign source tracking
- **utm_medium**: Campaign medium tracking  
- **utm_campaign**: Campaign name tracking
- **utm_content**: Campaign content tracking
- **utm_term**: Campaign term tracking
- **role**: User's desired role (pre-fills search or shows role page)

### Examples:
```
# Homepage with UTM tracking
http://localhost:5173/?email=user@example.com&utm_source=certified

# Role page with UTM tracking - BOTH WORK NOW!
http://localhost:5173/?role=Project%20Manager&email=user@example.com&utm_source=certified
```

### Storage Format:
All parameters are stored in `localStorage` under `userData` key:
```json
{
  "email": "user@example.com",
  "urlParams": {
    "utm_source": "certified",
    "utm_medium": "email",
    "utm_campaign": "spring_2024"
  },
  "role": "Project Manager",
  "timestamp": 1672531200000,
  "contactDetails": {
    "email": "user@example.com", 
    "phone": "+1234567890"
  }
}
```

**Note**: Email is now stored as a top-level field, separate from UTM parameters for better organization and easier access.

### Features:
- **Universal Tracking**: UTM parameters captured regardless of Homepage vs RolePage
- **Role Persistence**: Role stored in localStorage for later use
- **Search Pre-fill**: Homepage search input pre-filled with stored/URL role
- **Backwards Compatible**: Existing functionality unchanged

## Error Handling

The API service includes comprehensive error handling:
- Falls back to default roles if API call fails
- Logs errors for debugging
- Graceful degradation ensures UI remains functional

## Legacy API Support

The AI content generation continues to use the existing Xano API endpoint for backwards compatibility.
