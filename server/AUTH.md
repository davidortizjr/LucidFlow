# LucidFlow Authentication System

## Overview
This document provides information about the authentication system for LucidFlow, including test credentials and API endpoints.

## Test Accounts

### Admin Account
- **Email**: elena@lucidflow.com
- **Password**: Elena2024@
- **Role**: ADMIN

### Manager Account
- **Email**: marcus@lucidflow.com
- **Password**: Marcus2024@
- **Role**: MANAGER

### Member Accounts
1. **Sarah Williams**
   - Email: sarah@lucidflow.com
   - Password: Sarah2024@
   - Role: MEMBER

2. **David Wilson**
   - Email: david@lucidflow.com
   - Password: David2024@
   - Role: MEMBER

3. **Amina Okafor**
   - Email: amina@lucidflow.com
   - Password: Amina2024@
   - Role: MEMBER

## API Endpoints

### Authentication Routes

#### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "name": "New User"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "user-xxx",
    "email": "newuser@example.com",
    "name": "New User",
    "role": "MEMBER"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST `/api/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "elena@lucidflow.com",
  "password": "Elena2024@"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "user-1",
    "email": "elena@lucidflow.com",
    "name": "Elena Rodriguez",
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena",
    "role": "ADMIN"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### GET `/api/auth/me`
Get the current authenticated user's profile.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "id": "user-1",
  "email": "elena@lucidflow.com",
  "name": "Elena Rodriguez",
  "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena",
  "role": "ADMIN",
  "status": "online"
}
```

#### POST `/api/auth/logout`
Logout the current user (token cleanup happens client-side).

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

## Security Features

### Password Security
- Passwords are hashed using **bcryptjs** with 10 salt rounds
- Never stored or transmitted in plain text
- Compared securely during authentication

### JWT Tokens
- Tokens expire after **7 days**
- Include user ID in the payload
- Signed with a secret key (set via `JWT_SECRET` environment variable)
- Must be sent in the `Authorization: Bearer {token}` header for protected routes

### Protected Routes
Routes that require authentication use the `authenticateToken` middleware:
- `GET /api/auth/me` - View current user
- Add this middleware to other routes as needed for authorization

## Environment Configuration

Add these variables to your `.env` file:

```env
# JWT Configuration
JWT_SECRET="your-super-secret-key-at-least-32-characters-long"

# Token expiration is set to 7 days in the auth middleware
```

## Frontend Integration

### Storing Token
After login, store the token in localStorage or sessionStorage:

```typescript
// After successful login
localStorage.setItem('token', response.token);
```

### Sending Token with Requests
Include the token in the Authorization header:

```typescript
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
};
```

### Sample Login Flow
```typescript
// 1. Login
const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'elena@lucidflow.com',
    password: 'Elena2024@'
  })
});

const { user, token } = await loginResponse.json();
localStorage.setItem('token', token);

// 2. Make authenticated request
const meResponse = await fetch('http://localhost:3000/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const currentUser = await meResponse.json();

// 3. Logout
localStorage.removeItem('token');
```

## Testing

### With cURL
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"elena@lucidflow.com","password":"Elena2024@"}'

# Get current user (replace TOKEN with actual token)
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer TOKEN"

# Register new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!","name":"Test User"}'
```

### With Postman
1. Create a new POST request to `http://localhost:3000/api/auth/login`
2. Set Body to JSON with email and password
3. Copy the `token` from the response
4. Create a new GET request to `http://localhost:3000/api/auth/me`
5. Go to the Authorization tab, select "Bearer Token"
6. Paste the token in the Token field

## Troubleshooting

### "Invalid or expired token"
- Token has expired (valid for 7 days)
- Token is malformed
- Solution: Login again to get a fresh token

### "Invalid email or password"
- User doesn't exist
- Password is incorrect
- Note: Error message intentionally generic for security

### "Email already registered"
- An account with this email already exists
- Use a different email or login instead

## Production Recommendations

1. **Change JWT_SECRET**: Use a strong, random string (at least 32 characters)
2. **HTTPS Only**: Always use HTTPS in production
3. **Secure Cookies**: Consider using httpOnly cookies instead of localStorage
4. **Token Refresh**: Implement token refresh mechanism for better security
5. **Rate Limiting**: Add rate limiting to `/api/auth/login` to prevent brute force
6. **Audit Logging**: Log authentication events
7. **Password Policy**: Enforce strong password requirements
8. **MFA**: Consider implementing multi-factor authentication

## Architecture

```
Authentication Flow
├── User submits email/password
├── Server validates credentials
├── Password checked against bcryptjs hash
├── JWT token generated (valid 7 days)
├── Token returned to client
├── Client stores token (localStorage/sessionStorage)
├── Client includes token in Authorization header
├── Server verifies token with authenticateToken middleware
└── Protected route executed if token valid
```
