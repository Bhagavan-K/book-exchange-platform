# Book Exchange Platform

## Overview
The purpose of Book Exchange Application is designed to connect readers to exchange or lend books easily. The structured format and technologies used for this application aim to provide a seamless user interface. This will also include the high-level architecture, core features and technology stack. Functionalities like user authentication, book listing and search, exchange request management are designed to organize the interactions.

## Features

### Core Functionality
- User authentication with email and security questions
- Book listing and management
- Advanced book search with filters
- Exchange request notification
- Profile management with preferences
- Location-based book discovery

### Technical Highlights
- Secure JWT-based authentication
- Image upload for profile pictures
- Responsive design for all devices
- State management with React Context
- Form validation with Formik and Yup

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a .env file with the following variables:
   ```
   PORT=5001
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_email
   EMAIL_PASS=your_email_password
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a .env file:
   ```
   REACT_APP_API_URL=http://localhost:5001/api
   ```

4. Start the application:
   ```bash
   npm start
   ```

## Architecture

### Frontend
- React with TypeScript
- Material-UI for components
- Context API for state management
- Axios for API calls
- React Router for navigation

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Multer for file uploads
- Nodemailer for email notifications

### Security Features
- Password hashing with bcrypt
- JWT token authentication
- Security questions for password recovery
- Input validation and sanitization
- Protected API endpoints
- CORS configuration

## Project Structure

```
book-exchange-platform/
├── backend/
│   ├── src/
│   │   ├── __tests__/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── uploads/
│   ├── .env
│   ├── jest.config.js
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── __tests__/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── books/
│   │   │   ├── common/
│   │   │   ├── constants/
│   │   │   ├── exchange/
│   │   │   ├── layout/
│   │   │   ├── profile/
│   │   │   └── routing/
│   │   ├── context/
│   │   ├── services/
│   │   ├── theme/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
│
├── uploads/
├── .gitignore
├── LICENSE
└── README.md
```

## Available Scripts

### Backend
- `npm run dev`: Start development server
- `npm run build`: Build TypeScript code
- `npm start`: Start production server
- `npm test`: Run tests

### Frontend
- `npm start`: Start development server
- `npm test`: Run tests
- `npm run build`: Build for production
- `npm run eject`: Eject from Create React App

## Testing
- Frontend: Run `npm test` in the frontend directory
- Backend: Run `npm test` in the backend directory

## License
This project is licensed under the MIT License - see the LICENSE.md file for details