# AI-Based Attendance System for Rural Schools

An offline-first, AI-assisted school attendance management system designed to simplify attendance recording in rural schools with limited or unreliable internet connectivity.

[![Next.js](https://img.shields.io/badge/Next.js-App%20Router-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-Styling-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb)](https://www.mongodb.com/)
[![PWA](https://img.shields.io/badge/PWA-Offline%20First-purple)](https://web.dev/explore/progressive-web-apps)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Project Objectives](#3-project-objectives)
4. [Proposed Features](#4-proposed-features)
5. [User Roles](#5-user-roles)
6. [Technology Stack](#6-technology-stack)
7. [System Architecture](#7-system-architecture)
8. [Application Workflow](#8-application-workflow)
9. [AI Implementation](#9-ai-implementation)
10. [Offline Functionality](#10-offline-functionality)
11. [Database Design](#11-database-design)
12. [Project Structure](#12-project-structure)
13. [Installation and Setup](#13-installation-and-setup)
14. [Environment Variables](#14-environment-variables)
15. [API Structure](#15-api-structure)
16. [Development Roadmap](#16-development-roadmap)
17. [Testing Strategy](#17-testing-strategy)
18. [Security and Privacy](#18-security-and-privacy)
19. [Future Enhancements](#19-future-enhancements)
20. [Contribution Guidelines](#20-contribution-guidelines)
21. [License](#21-license)

---

## 1. Project Overview

The AI-Based Attendance System for Rural Schools is a Progressive Web Application (PWA) that uses artificial intelligence and offline-first technologies to simplify school attendance management.

Teachers can capture classroom photographs using their mobile devices. The AI system assists in detecting and identifying enrolled students, while teachers verify the suggested matches before attendance is recorded.

The application is designed to operate even without an internet connection. Attendance records are stored locally on the teacher's device and synchronized with the central database when connectivity becomes available.

The primary focus is to provide a reliable, accessible and efficient attendance management solution for schools in rural and low-connectivity areas.

### Core Concept

**Capture → Detect → Identify → Verify → Record → Synchronize**

---

## 2. Problem Statement

Rural schools frequently face challenges in maintaining accurate and timely attendance records.

Some of the major challenges include:

- Unreliable or unavailable internet connectivity.
- Time-consuming manual attendance processes.
- Difficulty maintaining and managing student attendance records.
- Delays in sharing attendance information with school administrators.
- Limited access to digital school management infrastructure.
- Risk of data loss and inconsistent record maintenance.

Traditional online attendance systems may become unusable when internet connectivity is unavailable.

This project addresses these challenges through an offline-first attendance application with AI-assisted student identification and automatic data synchronization.

---

## 3. Project Objectives

The main objectives are:

1. Develop an installable and responsive school attendance PWA.
2. Simplify attendance recording through classroom photographs.
3. Integrate AI-based face detection and student identification.
4. Allow teachers to verify AI-generated identification suggestions.
5. Store attendance records locally without requiring internet access.
6. Synchronize pending attendance records with a central database when connectivity returns.
7. Provide administrators with centralized attendance monitoring.
8. Generate class-wise and student-wise attendance reports.
9. Minimize data loss and duplicate attendance records.
10. Build a scalable and secure solution suitable for rural schools.

---

## 4. Proposed Features

### 4.1 Authentication and Authorization

- Secure teacher and administrator login.
- Role-based access control.
- Protected dashboard routes.
- Secure session management.
- Logout functionality.

### 4.2 Teacher Dashboard

- View assigned classes and sections.
- View daily attendance statistics.
- Start a new attendance session.
- Capture classroom photographs.
- Review AI-generated student identification.
- Confirm or manually correct attendance.
- View attendance history.
- Check synchronization status.

### 4.3 Student Management

- Register new students.
- Update student information.
- Assign students to classes and sections.
- Manage student enrollment status.
- Maintain student profiles.
- Enroll students for AI-assisted identification.

### 4.4 Class and Teacher Management

- Create and manage classes.
- Create sections.
- Assign teachers to classes.
- Manage student-class relationships.
- Maintain school information.

### 4.5 AI-Based Student Identification

- Detect multiple faces in classroom photographs.
- Extract facial features.
- Generate face embeddings.
- Compare detected faces with enrolled student profiles.
- Generate similarity scores.
- Identify unknown or unmatched faces.
- Provide identification suggestions for teacher verification.

### 4.6 Offline Attendance

- Access essential application functionality without internet.
- Store attendance records in IndexedDB.
- Maintain a local synchronization queue.
- Access locally cached student and class information.
- Display online/offline connectivity status.
- Prevent duplicate attendance submissions.

### 4.7 Automatic Synchronization

- Detect network connectivity changes.
- Identify pending attendance records.
- Upload pending records to the central server.
- Retry failed synchronization requests.
- Handle duplicate submissions safely.
- Maintain synchronization history.
- Provide manual synchronization as a fallback.

### 4.8 Admin Dashboard

- View school-wide attendance statistics.
- Manage teachers and students.
- Monitor class-wise attendance.
- View daily and monthly attendance reports.
- Track synchronization status.
- Export attendance reports.

---

## 5. User Roles

The application will initially support two major roles.

### Administrator

The administrator manages the school attendance system.

Responsibilities:

- Manage school information.
- Register and manage teachers.
- Register and manage students.
- Create classes and sections.
- Assign teachers to classes.
- Monitor attendance records.
- Generate attendance reports.

### Teacher

The teacher manages daily classroom attendance.

Responsibilities:

- Log into the application.
- Access assigned classes.
- Capture classroom photographs.
- Review AI identification suggestions.
- Confirm or correct attendance.
- Record attendance manually when required.
- Access attendance history.
- Synchronize offline records.

---

## 6. Technology Stack

The project will use the following technologies.

| Technology | Purpose |
|---|---|
| Next.js | Full-stack application framework |
| React.js | User interface development |
| TypeScript | Type-safe development |
| Tailwind CSS | Responsive UI styling |
| MongoDB | Central database |
| Mongoose | MongoDB object modeling |
| IndexedDB | Local offline data storage |
| Dexie.js | IndexedDB management |
| Python | AI service development |
| FastAPI | AI backend API |
| MediaPipe / ONNX Runtime | Face detection and model inference |
| PWA | Installable offline-first application |
| Service Worker | Application resource caching |
| Git and GitHub | Version control |
| Docker | Application containerization |
| Docker Compose | Multi-container management |

### Technology Architecture

**Frontend:** Next.js + React + TypeScript + Tailwind CSS

**Backend:** Next.js Route Handlers

**AI Service:** Python + FastAPI

**Central Database:** MongoDB

**Local Database:** IndexedDB + Dexie.js

**Offline Support:** PWA + Service Worker

**Containerization:** Docker + Docker Compose

**Deployment:** Vercel or suitable cloud/server infrastructure

---

## 7. System Architecture

The application follows an offline-first architecture with separate responsibilities for the frontend, AI processing, local storage and central backend.

```text
                  TEACHER / ADMIN
                        |
                        |
                  NEXT.JS PWA
                        |
           +------------+------------+
           |                         |
      AI PROCESSING              LOCAL STORAGE
           |                         |
      Python / FastAPI          IndexedDB
      Face Detection            Student Data
      Face Embeddings           Attendance
      Face Matching             Pending Sync
           |                         |
           +------------+------------+
                        |
                  INTERNET CHECK
                        |
                WHEN CONNECTIVITY
                     RETURNS
                        |
                 SYNC SERVICE
                        |
                NEXT.JS BACKEND
                        |
                     MONGODB
                        |
                ADMIN DASHBOARD
                        |
                ATTENDANCE REPORTS
```

### Architecture Explanation

**Frontend Layer**

Provides the user interface for teachers and administrators.

**AI Layer**

Processes classroom photographs and generates student identification suggestions.

**Local Storage Layer**

Stores necessary application data and pending attendance records on the device.

**Synchronization Layer**

Transfers unsynchronized attendance records to the central backend.

**Backend Layer**

Handles authentication, validation, attendance processing and database operations.

**Database Layer**

Maintains centralized student, teacher, class and attendance information.

---

## 8. Application Workflow

The proposed attendance workflow is:

### Step 1: Teacher Authentication

The teacher logs into the application using authorized credentials.

### Step 2: Class Selection

The teacher selects the class, section and attendance session.

### Step 3: Classroom Photograph

The teacher captures a classroom photograph using the device camera.

### Step 4: AI Processing

The AI system:

- Detects visible faces.
- Extracts facial embeddings.
- Compares embeddings with enrolled student profiles.
- Generates identification suggestions.
- Flags unmatched faces.

### Step 5: Teacher Verification

The teacher reviews the suggested student identities and confirms or corrects the results.

AI identification alone will not automatically finalize attendance.

### Step 6: Attendance Recording

Confirmed attendance records are stored locally or sent to the backend depending on connectivity.

### Step 7: Offline Storage

When internet connectivity is unavailable, attendance records are stored in IndexedDB.

### Step 8: Synchronization

When connectivity returns, pending records are synchronized with the central database.

### Step 9: Attendance Reports

Administrators can view synchronized attendance information through the admin dashboard.

---

## 9. AI Implementation

AI is one of the major components of this project.

The system will use a face recognition pipeline to assist teachers in identifying students.

### AI Pipeline

**1. Face Detection**

Detect the location of faces in classroom photographs.

Possible technology:
- MediaPipe Face Detection.
- ONNX-compatible face detection models.

**2. Face Embedding Extraction**

Convert detected facial images into numerical feature vectors.

Possible models:
- ArcFace-compatible models.
- MobileFaceNet.

**3. Face Matching**

Compare the extracted embeddings with previously enrolled student embeddings.

A similarity metric such as cosine similarity can be used.

**4. Confidence and Unknown Detection**

Generate matching scores and flag uncertain or unknown identities for manual review.

**5. Teacher Verification**

The teacher approves or corrects the suggested identities before attendance is finalized.

### Important AI Considerations

- Recognition accuracy must be evaluated using representative classroom test data.
- Lighting, camera quality and face angles can affect results.
- Similarity thresholds must be validated rather than selected arbitrarily.
- Manual attendance must remain available.
- AI predictions must not independently determine student absence.

AI processing should preferably happen locally on the device where practical, so the application does not depend on internet connectivity for identification.

---

## 10. Offline Functionality

Offline support is one of the most important requirements.

The application will use Progressive Web Application technologies to support essential attendance functionality without continuous internet connectivity.

### Technologies

- Service Worker.
- Web App Manifest.
- IndexedDB.
- Dexie.js.
- Background synchronization where supported.

### Local Database Structure

```text
IndexedDB
|
+-- students
|
+-- classes
|
+-- enrollments
|
+-- attendance
|
+-- pendingSync
|
+-- faceProfiles
|
+-- appSettings
```

### Offline Workflow

1. Teacher opens the previously installed application.
2. Essential application resources load from the cache.
3. Teacher selects an assigned class.
4. Teacher captures a photograph.
5. AI processes the photograph locally when supported.
6. Teacher verifies the identification results.
7. Attendance is saved in IndexedDB.
8. A pending synchronization entry is created.
9. The application detects connectivity restoration.
10. Pending records are uploaded to the central server.
11. Successfully synchronized records are marked as synced.

### Synchronization Requirements

- Unique identifiers for attendance records.
- Duplicate submission prevention.
- Retry mechanism for failed requests.
- Server-side validation.
- Conflict handling.
- Synchronization logs.
- Manual Sync Now functionality.

The application must not depend exclusively on browser background-sync support. Synchronization should also be attempted when the application opens, becomes active or regains connectivity.

---

## 11. Database Design

MongoDB will be used as the central database.

The proposed collections are:

| Collection | Description |
|---|---|
| Schools | School information |
| Teachers | Teacher accounts |
| Students | Student profiles |
| Classes | Class and section information |
| Enrollments | Student-class relationships |
| Attendance | Daily attendance records |
| Devices | Authorized device information |
| SyncLogs | Synchronization history |

### Example Student Document

```json
{
  "_id": "student_001",
  "name": "Rahul Sharma",
  "rollNumber": "101",
  "schoolId": "school_001",
  "classId": "class_001",
  "section": "A",
  "isActive": true
}
```

### Example Attendance Document

```json
{
  "_id": "attendance_001",
  "studentId": "student_001",
  "schoolId": "school_001",
  "classId": "class_001",
  "date": "2026-11-13",
  "status": "present",
  "markedBy": "teacher_001",
  "source": "ai_assisted",
  "syncStatus": "synced"
}
```

These are illustrative data structures. Actual database schemas will be finalized during backend development.

---

## 12. Project Structure

The planned project structure is:

```text
rural-attendance-system/
|
+-- app/
|   |
|   +-- login/
|   |
|   +-- teacher/
|   |   +-- dashboard/
|   |   +-- attendance/
|   |   +-- students/
|   |   +-- history/
|   |
|   +-- admin/
|   |   +-- dashboard/
|   |   +-- students/
|   |   +-- teachers/
|   |   +-- classes/
|   |   +-- reports/
|   |
|   +-- api/
|       +-- auth/
|       +-- students/
|       +-- teachers/
|       +-- classes/
|       +-- attendance/
|       +-- sync/
|
+-- components/
|   +-- ui/
|   +-- dashboard/
|   +-- attendance/
|   +-- camera/
|   +-- forms/
|
+-- lib/
|   +-- mongodb.ts
|   +-- auth.ts
|   +-- dexie.ts
|   +-- sync.ts
|
+-- models/
|   +-- Student.ts
|   +-- Teacher.ts
|   +-- Class.ts
|   +-- Attendance.ts
|
+-- services/
|   +-- attendance.service.ts
|   +-- student.service.ts
|   +-- ai.service.ts
|
+-- hooks/
|   +-- useOnlineStatus.ts
|   +-- useSync.ts
|
+-- types/
|
+-- public/
|   +-- icons/
|   +-- models/
|
+-- ai-service/
|   +-- app.py
|   +-- models/
|   +-- requirements.txt
|   +-- Dockerfile
|
+-- .env.example
+-- .gitignore
+-- package.json
+-- README.md
+-- docker-compose.yml
```

This is the intended structure. Directories will be introduced as development progresses.

---

## 13. Installation and Setup

### Prerequisites

Install the following tools:

- Node.js (LTS version recommended).
- npm.
- Git.
- Visual Studio Code.
- MongoDB Atlas account or local MongoDB installation.

Python and Docker will be required when their respective modules are introduced.

### Step 1: Clone the Repository

```bash
git clone https://github.com/peswani-mayank/rural-attendance-system.git
```

### Step 2: Navigate to the Project

```bash
cd rural-attendance-system
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Configure Environment Variables

Create a `.env.local` file in the project root.

Add the required environment variables when the backend is implemented.

### Step 5: Start the Development Server

```bash
npm run dev
```

### Step 6: Open the Application

Visit:

```text
http://localhost:3000
```

---

## 14. Environment Variables

Create a `.env.local` file.

Example configuration:

```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_long_random_secret

# AI Service
AI_SERVICE_URL=http://localhost:8000
```

These are planned configuration variables. Only configure the services that have actually been implemented.

Never commit `.env.local` or real credentials to GitHub.

Use `.env.example` to document the required variable names without exposing secrets.

---

## 15. API Structure

The backend will use Next.js Route Handlers for application APIs.

Proposed API endpoints:

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/login` | Teacher/Admin login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user information |

### Students

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/students` | Get students |
| POST | `/api/students` | Register student |
| GET | `/api/students/[id]` | Get student details |
| PUT | `/api/students/[id]` | Update student |
| DELETE | `/api/students/[id]` | Deactivate/delete student |

### Teachers

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/teachers` | Get teachers |
| POST | `/api/teachers` | Register teacher |
| PUT | `/api/teachers/[id]` | Update teacher |

### Classes

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/classes` | Get classes |
| POST | `/api/classes` | Create class |
| PUT | `/api/classes/[id]` | Update class |

### Attendance

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/attendance` | Get attendance records |
| POST | `/api/attendance` | Record attendance |
| PUT | `/api/attendance/[id]` | Update attendance |
| GET | `/api/attendance/reports` | Generate reports |

### Synchronization

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/sync` | Upload pending records |
| GET | `/api/sync/status` | Check sync status |

All endpoints are planned and will be implemented incrementally.

---

## 16. Development Roadmap

Development will be divided into the following phases.

### Phase 1: Project Setup and Planning

- Initialize Next.js application.
- Configure TypeScript and Tailwind CSS.
- Establish GitHub repository.
- Plan application architecture.
- Create project folder structure.

### Phase 2: Frontend Development

- Build authentication interface.
- Develop teacher dashboard.
- Develop admin dashboard.
- Build student management pages.
- Build class management pages.
- Create attendance interface.

### Phase 3: Backend Development

- Configure MongoDB.
- Create database schemas.
- Implement authentication.
- Develop student APIs.
- Develop teacher APIs.
- Develop class APIs.
- Implement attendance APIs.

### Phase 4: Camera and Attendance Integration

- Implement camera access.
- Capture classroom photographs.
- Display captured images.
- Build attendance verification interface.
- Implement manual attendance fallback.

### Phase 5: AI Integration

- Implement face detection.
- Enroll student face profiles with appropriate authorization.
- Extract face embeddings.
- Implement face matching.
- Generate identification suggestions.
- Implement unknown-face handling.
- Integrate teacher verification.

### Phase 6: Offline PWA Development

- Configure web app manifest.
- Implement Service Worker.
- Cache essential application resources.
- Configure IndexedDB.
- Implement offline attendance.
- Build pending synchronization queue.

### Phase 7: Synchronization

- Develop synchronization APIs.
- Implement automatic synchronization attempts.
- Prevent duplicate records.
- Handle synchronization failures.
- Implement retry logic.
- Maintain sync history.

### Phase 8: Docker and Deployment

- Learn Docker fundamentals.
- Create Dockerfiles.
- Configure Docker Compose.
- Containerize application services.
- Test the complete application.
- Deploy the application.

---

## 17. Testing Strategy

The system will require testing across different scenarios.

### Functional Testing

- Authentication.
- Student registration.
- Teacher management.
- Class management.
- Attendance recording.
- Attendance reporting.

### AI Testing

- Multiple face detection.
- Recognition accuracy.
- Unknown face detection.
- Different lighting conditions.
- Different camera angles.
- Teacher correction workflow.

### Offline Testing

- Open application without internet.
- Access locally cached resources.
- Record attendance offline.
- Verify local data persistence.
- Restore internet connectivity.
- Synchronize pending records.
- Test failed synchronization and retries.

### Security Testing

- Authentication validation.
- Role-based authorization.
- API access control.
- Data encryption.
- Session security.
- Protection against duplicate and unauthorized attendance submissions.

---

## 18. Security and Privacy

This application may process photographs and biometric information belonging to schoolchildren. Privacy and security are essential requirements.

The project will follow these principles:

- Obtain appropriate school authorization and parental/guardian consent.
- Collect only necessary information.
- Protect student information through access controls.
- Encrypt sensitive data in transit and at rest.
- Restrict access to biometric profiles.
- Avoid unnecessary storage of original classroom photographs.
- Define biometric data retention and deletion policies.
- Provide manual attendance alternatives.
- Never treat an AI prediction as definitive proof of attendance.
- Maintain audit logs for sensitive operations.

Biometric data must not be exposed in public APIs, logs or GitHub repositories.

The application should be evaluated against applicable data protection and child privacy requirements before real-world deployment.

---

## 19. Future Enhancements

Potential future improvements include:

- Parent attendance notifications.
- SMS notifications for parents.
- Multilingual support for regional languages.
- Advanced attendance analytics.
- School performance reports.
- Low-bandwidth image processing.
- Multiple school support.
- Additional administrative roles.
- Improved AI models for low-quality classroom images.
- Integration with existing school management platforms.
- Advanced synchronization monitoring.

---

## 20. Contribution Guidelines

Contributions and suggestions are welcome.

To contribute:

1. Fork the repository.
2. Create a feature branch.
3. Implement your changes.
4. Test your implementation.
5. Commit your changes.
6. Push your branch.
7. Open a Pull Request.

Example:

```bash
git checkout -b feature/your-feature-name

git add .

git commit -m "Add: your feature description"

git push origin feature/your-feature-name
```

---

## 21. License

This project is currently under development.

A suitable open-source license will be selected before public distribution.

---

## Project Status

**Current Development Stage: Initial Project Setup**

The Next.js application has been initialized, & the project repository has been created on GitHub.

The remaining modules will be implemented progressively.

| Component | Status |
|---|---|
| Next.js project setup | Completed |
| GitHub repository | Created |
| Frontend dashboard | Planned |
| Authentication | Planned |
| Student management | Planned |
| Attendance management | Planned |
| MongoDB integration | Planned |
| Camera integration | Planned |
| AI face recognition | Planned |
| Offline PWA | Planned |
| Automatic synchronization | Planned |
| Docker integration | Planned |

---

## Repository

GitHub: https://github.com/peswani-mayank/rural-attendance-system

**Built with the goal of making school attendance smarter, more accessible and reliable, even in areas with limited internet connectivity.**
