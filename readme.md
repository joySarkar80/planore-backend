# 🚀 Krowdly Backend

A secure and scalable Event Management REST API built with **Node.js**, **Express.js**, **TypeScript**, **Prisma ORM**, **PostgreSQL**, and **JWT Authentication**.

Krowdly allows users to create, manage, discover, and participate in both public and private events. The platform supports invitations, participant approval workflows, event reviews, payment processing, and role-based administration.

---

## ✨ Features

### 🔐 Authentication & Authorization

* JWT Access Token Authentication
* Refresh Token Support
* Role-Based Access Control (RBAC)
* Protected Routes
* User & Admin Roles

### 👤 User Management

* Register Account
* Login
* Update Profile
* View Profile
* Admin User Management
* Ban / Unban Users

### 🎉 Event Management

* Create Event
* Update Event
* Delete Event
* View Event Details
* Browse Events
* Featured Event System
* Event Approval Workflow

### 🎟 Event Participation

Supports:

* Public Free Events
* Public Paid Events
* Private Free Events
* Private Paid Events

### 📨 Invitation System

Event hosts can:

* Search Users
* Invite Users
* Manage Invitations

Invitees can:

* Accept Invitation
* Decline Invitation
* Pay & Accept Invitation

### ✅ Participant Management

Hosts can:

* Approve Participants
* Reject Participants
* Remove Participants
* View Participants

### 🚫 Host Ban System

Hosts can:

* Ban Participants
* Unban Participants
* View Banned Users

### ⭐ Reviews & Ratings

Users can:

* Create Reviews
* Update Reviews
* Delete Reviews
* View Event Reviews

### 💳 Payment Integration

* Stripe Checkout
* Stripe Webhook Support
* Paid Event Registration

### 📊 Dashboard Analytics

* Hosted Events
* Joined Events
* Reviews
* Registration Statistics

### 👑 Admin Features

Admins can:

* Approve Events
* Reject Events
* Delete Events
* Manage Users
* Monitor Platform Activities

---

## 🛠 Tech Stack

### Backend

* Node.js
* Express.js
* TypeScript

### Database

* PostgreSQL

### ORM

* Prisma ORM

### Authentication

* JWT
* Refresh Token

### Validation

* Zod

### Payments

* Stripe

---

## 📂 Project Structure

```bash
src
├── app
│   ├── modules
│   │   ├── Auth
│   │   ├── User
│   │   ├── Event
│   │   ├── Registration
│   │   ├── Invitation
│   │   ├── Review
│   │   ├── Payment
│   │   ├── FeaturedEvent
│   │   ├── HostBan
│   │   └── Stats
│   │
│   ├── middlewares
│   ├── errors
│   ├── config
│   ├── utils
│   └── routes
│
├── prisma
├── uploads
└── server.ts
```

---

## 🔄 Event Participation Flow

### Public Free Event

```text
Join Event
     ↓
Approved Instantly
```

### Public Paid Event

```text
Pay Registration Fee
          ↓
Pending Approval
          ↓
Host Approval
```

### Private Free Event

```text
Request To Join
        ↓
Pending Approval
        ↓
Host Approval
```

### Private Paid Event

```text
Pay Registration Fee
          ↓
Pending Approval
          ↓
Host Approval
```

---

## 📨 Invitation Workflow

```text
Host Invites User
        ↓
User Accepts Invitation
        ↓
If Paid Event
        ↓
Payment Required
        ↓
Pending Approval
        ↓
Host Approval
```

---

## 🔑 Main API Modules

| Module          | Description                    |
| --------------- | ------------------------------ |
| Auth            | Authentication & Authorization |
| Users           | User Management                |
| Events          | Event CRUD Operations          |
| Registrations   | Event Participation            |
| Invitations     | Invitation Management          |
| Reviews         | Event Reviews & Ratings        |
| Payments        | Stripe Integration             |
| Featured Events | Homepage Featured Event        |
| Host Ban        | Participant Ban System         |
| Dashboard       | Statistics & Analytics         |

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory.

```env
NODE_ENV=development

PORT=5000

DATABASE_URL=

JWT_ACCESS_SECRET=
JWT_ACCESS_EXPIRES_IN=

JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES_IN=

BCRYPT_SALT_ROUNDS=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

CLIENT_URL=
```

---

## 🚀 Installation

### Clone Repository

```bash
git clone https://github.com/your-username/krowdly-backend.git
```

### Install Dependencies

```bash
npm install
```

### Generate Prisma Client

```bash
npx prisma generate
```

### Run Database Migration

```bash
npx prisma migrate dev
```

### Start Development Server

```bash
npm run dev
```

### Build Project

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

---

## 🔒 Security Features

* JWT Authentication
* Refresh Token System
* Password Hashing with Bcrypt
* Protected Routes
* Role-Based Authorization
* Input Validation
* Centralized Error Handling

---

## 🎯 Future Improvements

* Email Notifications
* Event Reminder System
* Real-time Updates
* Multi Payment Gateway Support
* Event Bookmarking
* Event Reporting System
* Push Notifications

---

## 📄 License

This project is licensed under the MIT License.

---

### Developed for Modern Event Management 🚀
