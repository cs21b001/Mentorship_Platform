# Mentorship Platform

A full-stack web application that connects mentors and mentees, facilitating meaningful mentorship relationships in professional development.

## 🌟 Features

- User authentication and authorization
- Profile creation and management
- Mentor/Mentee discovery with filtering capabilities
- Connection management system
- Real-time messaging (coming soon)
- Skills and interests matching
- Responsive design for all devices

## 🛠️ Technologies Used

### Frontend
- HTML5
- CSS3
- JavaScript (Vanilla)

### Backend
- Node.js
- Express.js
- MySQL
- Sequelize ORM
- JWT for authentication
- bcryptjs for password hashing

## 🚀 Live Demo

The application is deployed and can be accessed at:
- Frontend: https://mentorship-platform-frontend-two.vercel.app
- Backend API: https://mentorshipplatform-production.up.railway.app/api

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MySQL
- Git

### Environment Variables
Create a `.env` file in the backend directory with the following variables:
```
PORT=5000
DB_NAME=mentorship_platform
DB_USER=your_username
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306
JWT_SECRET=your_jwt_secret
```

### Backend Setup
1. Clone the repository
   ```bash
   git clone https://github.com/cs21b001/Mentorship_Platform
   cd Mentorship_Platform/backend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the server
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

### Frontend Setup
1. Navigate to the frontend directory
   ```bash
   cd ../frontend
   ```

2. The frontend is static HTML/CSS/JS and can be served using any web server. For development, you can use:
   - VS Code's Live Server extension
   - Python's simple HTTP server: `python -m http.server 5500`
   - Node's http-server: `npx http-server`

## 📝 API Documentation

### Authentication Endpoints
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user

### Profile Endpoints
- GET `/api/profile/me` - Get current user's profile
- POST `/api/profile` - Create/Update profile
- GET `/api/profile/:userId` - Get profile by user ID

### Connection Endpoints
- POST `/api/connections/request` - Send connection request
- PUT `/api/connections/accept/:connectionId` - Accept connection request
- PUT `/api/connections/reject/:connectionId` - Reject connection request
- GET `/api/connections` - Get user's connections

## 🔐 Security Features

- Password hashing using bcryptjs
- JWT-based authentication
- CORS protection
- Input validation and sanitization
- Protected API endpoints
- Secure HTTP-only cookies

## 🤝 Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/improvement`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/improvement`)
5. Create a Pull Request

## 👥 Authors

- Aman Kumar - Initial work
