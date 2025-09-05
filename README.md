# ZyncUp - Group Schedule Synchronization App

ZyncUp is a powerful scheduling application that helps groups of friends find common free time slots across different time zones. It integrates with Google Calendar to automatically sync schedules and considers each user's wake and sleep times.

## Features

- User authentication and profile management
- Time zone support
- Google Calendar integration
- Group creation and management
- Automatic schedule synchronization
- Smart free time slot detection
- Cross-time zone scheduling

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Google Cloud Platform account with Calendar API enabled
- Gmail account for email notifications

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/zyncup.git
cd zyncup
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/zyncup
JWT_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_app_password
```

4. Set up Google Calendar API:
   - Go to Google Cloud Console
   - Create a new project
   - Enable Google Calendar API
   - Create OAuth 2.0 credentials
   - Add the redirect URI
   - Copy the client ID and client secret to your `.env` file

5. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- POST `/api/users/register` - Register a new user
- POST `/api/users/login` - Login user

### Profile
- GET `/api/users/profile` - Get user profile
- PATCH `/api/users/profile` - Update user profile

### Groups
- POST `/api/groups` - Create a new group
- GET `/api/groups` - Get user's groups
- GET `/api/groups/:groupId` - Get specific group
- POST `/api/groups/:groupId/invite` - Invite user to group
- POST `/api/groups/:groupId/accept` - Accept group invitation

### Calendar
- GET `/api/calendar/auth/google` - Get Google Calendar auth URL
- GET `/api/calendar/auth/google/callback` - Handle Google Calendar callback
- GET `/api/calendar/group/:groupId/free-slots` - Get group's common free slots

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
