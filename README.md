# 🎵 Melora — Modern Music Streaming Web App

Melora is a modern full-stack music streaming web application inspired by popular platforms such as Spotify. It provides a premium dark-themed interface where users can discover, search, and listen to music while interacting with albums and playlists.

The project is built with a React frontend and a Node.js/Express backend, with MongoDB used for data persistence.

## ✨ Features

### 👤 Authentication

* User registration and login
* JWT-based authentication
* Secure password hashing using bcrypt
* Role-based users such as User and Artist
* Protected API routes

### 🎧 Music

* Browse available songs
* Search songs by title
* Recently played music
* Track song play counts
* Like/favorite songs
* Album support
* Music playback interface

### 💿 Albums

* Create albums
* Associate songs with albums
* Browse albums
* View songs belonging to albums

### 🔎 Search

Users can search the music library and discover songs based on their titles.

### 🎨 Frontend

* Spotify-inspired premium UI
* Responsive design
* Dark music-player experience
* Music cards and album sections
* Navigation between pages
* React-based component architecture

## 🛠️ Tech Stack

### Frontend

* React
* TypeScript
* Vite
* React Router / Wouter
* Axios
* CSS

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT
* bcrypt
* Express Validator
* Cookie Parser
* CORS

### Deployment

* Frontend: Vercel
* Backend: Render
* Database: MongoDB Atlas

## 📁 Project Structure

```text
Melora/
│
├── Backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.tsx
│   ├── package.json
│   └── .env
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:

* Node.js
* npm
* MongoDB Atlas account
* Git

### 1. Clone the repository

```bash
git clone https://github.com/lasya7102/Melora.git
cd Melora
```

### 2. Setup Backend

```bash
cd Backend
npm install
```

Create a `.env` file:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Add any other environment variables required by the backend services.

Start the backend:

```bash
npm run dev
```

The backend will run locally on the configured port.

### 3. Setup Frontend

Open another terminal:

```bash
cd Frontend
npm install
```

Create:

```text
.env
```

Add your backend API URL:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Vite will provide the local development URL in the terminal.

## 🔐 Environment Variables

Do **not** commit `.env` files to GitHub.

Example:

```env
# Backend
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret

# Frontend
VITE_API_BASE_URL=http://localhost:5000/api
```

For production deployment, configure environment variables directly in the deployment platform.

## 🌐 Deployment

### Backend

The backend can be deployed on Render.

Configure:

* Root Directory: `Backend`
* Build Command:

```bash
npm install
```

* Start Command:

```bash
npm start
```

or the start command defined in `package.json`.

Add the required environment variables in Render.

### Frontend

The React frontend can be deployed on Vercel.

Configure:

* Root Directory: `Frontend`
* Framework Preset: Vite
* Build Command:

```bash
npm run build
```

* Output Directory:

```text
dist
```

Set:

```env
VITE_API_BASE_URL=https://your-backend-url/api
```

## 🔄 Application Flow

```text
User
  ↓
React Frontend
  ↓
Axios API Requests
  ↓
Node.js + Express Backend
  ↓
Authentication / Controllers / Services
  ↓
MongoDB Atlas
```

For music playback:

```text
User selects song
        ↓
Frontend requests music data
        ↓
Backend returns song information
        ↓
Audio player loads the music
        ↓
Play count / recently played data updated
```

## 🔒 Security

The application uses several security mechanisms:

* Password hashing with bcrypt
* JWT authentication
* HTTP cookies for authentication where applicable
* Protected routes
* Input validation
* CORS configuration
* Environment variables for sensitive configuration

## 🎯 Future Improvements

Possible future enhancements include:

* Personalized recommendations
* Playlist creation
* Artist profiles
* Follow artists
* Advanced music search
* Queue management
* Shuffle and repeat modes
* Lyrics
* Social sharing
* Improved recommendation algorithms
* Progressive Web App support

## 👩‍💻 Author

**Lasya**

B.Tech Computer Science & Engineering Student

GitHub: `https://github.com/lasya7102`

## ⭐ Support

If you find this project useful, consider giving the repository a ⭐ on GitHub.
