# Campus Event & RSVP Tracker

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" />
</p>

---

## 🏫 Overview

**Campus Event & RSVP Tracker** is a centralized, web-based platform for managing university events, enforcing RSVP capacity limits in real time, and validating attendance digitally with secure, QR-based check-in.<br>
Built to scale for teams and institutions, it features robust authentication, role-based access control (RBAC), and insightful analytics for administrators.

---

## ✨ Features

- **🔎 Event Discovery** — Find events with filters for date, category, and organizer.
- **🎫 Smart RSVP** — Real-time seat limit enforcement for stress-free planning.
- **📱 QR Code Check-in** — Unique QR code generation for each RSVP and fast, secure attendance validation.
- **🔄 Event Lifecycle Management** — Easily move events between Draft 🚧, Published 📢, Ongoing 💡, Completed ✅, and Cancelled ❌ states.
- **📊 Analytics Dashboard** — Admin access to RSVP stats and attendance analytics.
- **🔐 Security** — JWT authentication & role-based access controls for granular permissions.

---

## 🛠 Tech Stack

#### **Frontend**
- [React.js](https://react.dev/)
- [React Router](https://reactrouter.com/)
- [Tailwind CSS](https://tailwindcss.com/)

#### **Backend**
- [Node.js](https://nodejs.org/)
- [Express.js](https://expressjs.com/) (REST API)

#### **Database**
- [Firebase Firestore](https://firebase.google.com/docs/firestore) / [MongoDB](https://www.mongodb.com/)

#### **Authentication**
- JWT / Firebase Auth

---

## ⚙️ Setup & Installation

```bash
# 1. Clone the repository
git clone https://github.com/Henok-SE/Campus-Event-RSVP-Tracker.git
cd Campus-Event-RSVP-Tracker

# 2. Install frontend dependencies
cd client
npm install

# 3. Install backend dependencies
cd ../server
npm install

# 4. Run backend server
npm run dev

# 5. Run frontend
cd ../client
npm start
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:5000/api](http://localhost:5000/api)

---

## 📄 Project Charter

For full details on the project's scope, objectives, stakeholders, timeline, and risk analysis, see the Project Charter.

**📌 [View the Project Charter →](#)** <!-- Replace "#" with actual link when available -->

---

## 🤝 Contributing

We love contributions! To get started:

1. **Fork** this repository
2. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit your changes**
   ```bash
   git commit -m "Add feature"
   ```
4. **Push to your branch**
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open a Pull Request** to the `main` branch

**Guidelines**:
- One feature or fix per branch
- Use descriptive commit messages
- All merges via Pull Request

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

## 🙌 Acknowledgments

Developed by the PCIC student team, Hawassa University.

---
