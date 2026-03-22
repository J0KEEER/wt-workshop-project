# 🎓 College ERP System

Welcome to the **College ERP System**! This is a modern, full-stack web application designed to streamline and manage various administrative and academic operations within a college environment.

## 🌟 Features

- **Dynamic Role-Based Login:**
  - 🎓 **Students:** Login seamlessly using your assigned Roll Number.
  - 👨‍🏫 **Faculty:** Secure access using your registered Email address.
  - *Note: User records are automatically provisioned upon the first successful login.*
- **Comprehensive Academic Models:** Efficiently manage Students, Faculty, Courses, Enrollments, Attendance, Fees, and Library Books.
- **Many-to-Many Relationships:** Flexible assignment of multiple faculty members to a single subject (`CourseFaculty`).
- **Real-Time Capabilities:** Integrated Socket.IO for instant updates and realtime communication.
- **Modern UI/UX:** 
  - Refined **Dark Mode** experience with smooth ripple effects and optimized chart legends.
  - Custom views with alphabetical sorting enabled by default.
  - Built following Vercel's React best practices for optimized frontend performance and component composition.

## 🛠️ Technology Stack

### Frontend (`/client`)
- **Framework:** React 18 powered by Vite
- **Routing:** React Router v6
- **Data Visualization:** Recharts
- **Icons:** Lucide React
- **HTTP Client:** Axios
- **Real-Time:** Socket.IO Client
- **Testing:** Jest & React Testing Library

### Backend (`/server`)
- **Runtime:** Node.js (with standard ES Modules support)
- **Framework:** Express.js
- **Database ORM:** Sequelize (SQLite by default)
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs
- **Real-Time:** Socket.IO
- **Validation:** express-validator
- **Utilities:** `xlsx` for spreadsheet processing

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### 1. Setup Backend
Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```

**Environment Variables:**
Create a `.env` file in the `server` directory and configure the necessary environment variables (e.g., `PORT`, `JWT_SECRET`).

**Start Backend Development Server:**
```bash
# (Optional) Seed the initial database
npm run seed

# Start the development server (auto-restarts on changes)
npm run dev
```
*The backend API will run on your configured port (typically `http://localhost:5000`).*

### 2. Setup Frontend
In a new terminal window, navigate to the client directory and install dependencies:
```bash
cd client
npm install
```

**Start Frontend Development Server:**
```bash
# Start the Vite development server
npm run dev
```
*The web app will be available at `http://localhost:5173`.*

## 🧪 Testing

The frontend is configured with Jest to ensure component reliability. To run the tests:

```bash
cd client
npm test
```

## 🧩 Architecture Notes
This project adheres to strict modular design:
- The backend has been completely refactored to use native ES Modules (`import`/`export`).
- UI models incorporate scalable Vercel composition patterns to handle complex component interactions without prop-drilling.
