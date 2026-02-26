Campus Event & RSVP Tracker
<p align="center"> <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" /> <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" /> <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" /> <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" /> </p> 

🏫 Overview

Campus Event & RSVP Tracker is a centralized web-based platform designed for university campuses to manage events, enforce real-time RSVP capacity limits, and digitally validate attendance using secure QR-based check-in.
Built as a scalable team project with structured authentication, role-based access control (RBAC), and analytics-driven administration.

✨ Features

•	🔎 Event discovery with filtering (date, category, organizer)

•	🎫 Smart RSVP with automatic seat limit enforcement

•	📱 Unique QR code generation & secure check-in validation

•	🔄 Event lifecycle management (Draft → Published → Ongoing → Completed → Cancelled)

•	📊 Admin dashboard with RSVP & attendance analytics

•	🔐 Security: JWT authentication + Role-Based Access Control


🛠 Tech Stack

Frontend

•	React.js
•	React Router
•	Tailwind CSS

Backend

•	Node.js
•	Express.js (REST API)

Database

•	Firebase Firestore / MongoDB
Authentication

•	JWT / Firebase Auth

⚙️ Setup

# Clone repository
git clone https://github.com/Henok-SE/Campus-Event-RSVP-Tracker.git
cd Campus-Event-RSVP-Tracker

# Install frontend
cd client && npm install

# Install backend
cd ../server && npm install

# Run backend
cd server && npm run dev

# Run frontend
cd client && npm start
Frontend: http://localhost:3000
Backend API: http://localhost:5000/api

📄 Project Charter

The official scope, objectives, stakeholder roles, timeline, and risk analysis are documented in the Project Charter.
📌 View Charter:
[Insert Project Charter Link Here]

🤝 Contributing

1.	Fork the repository
2.	Create branch
git checkout -b feature/your-feature-name
3.	Commit changes
git commit -m "Add feature"
4.	Push
git push origin feature/your-feature-name
5.	Open Pull Request
Best practice:
•	One feature per branch
•	Use pull requests for merging
•	Keep commits descriptive

📜 License
MIT License — see LICENSE file.

🙌 Acknowledgments
Developed by the PCIC student team, Hawassa University.
