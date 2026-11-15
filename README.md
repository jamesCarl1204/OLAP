# OLAP – Our Lady of the Airways Parish Information Management System

OLAP is a parish information management system project for **Our Lady of the Airways Parish**. The current repository contains the public-facing frontend built with React and Vite.

The system is being designed to let parishioners submit service requests and appointment inquiries without creating an account, while authorized parish staff use the staff login to manage parish workflows.

> **Development status:** This repository currently contains the frontend interface. Backend APIs, database integration, and working authentication have not yet been implemented.

## Current Scope

### Implemented in this repository

- React-based frontend application
- Public landing page
- Shared public layout with header and footer
- About, services, and contact sections
- Staff-only login interface
- Certificate request interface for Baptismal and Confirmation records
- Reusable styling with CSS Modules and global styles

### Planned system features

- Public certificate requests for Baptismal, Confirmation, and Marriage records
- Public marriage booking and parish appointment inquiries
- Request tracking using a reference number
- Staff dashboard for processing requests and managing records
- Sacramental record management for Baptism, Confirmation, and Marriage
- Certificate preparation and PDF generation
- Payment verification when required
- Email notifications and request status updates
- Reports, analytics, and archived requests

The system has one internal account type: **Parish Staff**. Priest approval, if required by parish policy, will be handled through the parish's approved process outside the system unless a future requirement adds a dedicated priest account.

## Tech Stack

- React
- Vite
- React Router
- CSS Modules
- JavaScript

## Project Structure

```text
OLAP/
├── public/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── styles/
│   ├── data/
│   ├── layouts/
│   ├── components/
│   └── features/
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/jamesCarl1204/OLAP.git
cd OLAP
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```

Vite will display the local development URL in the terminal.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the frontend for production |
| `npm run preview` | Preview the production build |

## Before Production Use

The project will require parish requirements validation, secure staff authentication and authorization, database integration, backups, privacy controls, testing, and a deployment and maintenance plan.

## Author

**James Carl Chouuser**

[GitHub Profile](https://github.com/jamesCarl1204)
