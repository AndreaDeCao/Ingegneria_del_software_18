# Smart Hiking Planner

Smart Hiking Planner is a web application designed to help users explore and plan hiking activities in Trentino.
It provides personalized route recommendations based on user preferences and external conditions, along with interactive maps, offline GPX support, and social features for organizing and sharing outdoor experiences.

---

## Overview

This project has been developed as part of the **Software Engineering course**.
The goal is to design and develop a system that improves the hiking experience by combining route planning, real-time data, and community interaction.

---

## Features

* Search hiking routes with filters (difficulty, distance, elevation, duration)
* Interactive map with geolocation
* Download routes (GPX) for offline use
* Save favorite routes
* Personal hiking diary with notes and statistics
* Upload photos and contribute to trail information
* Create and manage group activities
* Notifications for participation requests and updates
* Report trail conditions (snow, obstacles, etc.)

---

## User Roles

* **Guest**
  Access to basic features such as route browsing and map visualization

* **Registered User**
  Full access: personalization, route saving, activity planning, social features

* **Administrator**
  Platform management and content moderation

---

## External Services

* Weather APIs for real-time and forecast data
* Map and geolocation services
* (Optional) services for estimating trail popularity

---

## Objectives

* Improve the hiking experience through smart recommendations
* Increase safety using updated environmental data
* Promote outdoor activities and user interaction

---

## Technologies (to be defined)

* Frontend: TBD
* Backend: TBD
* Database: TBD
* APIs: Weather, Maps, Geolocation

---

## Team

* Andrea De Cao
* Maya D’Onofrio
* Omar Balavac

---

## Project Info

* **Course:** Software Engineering

* **Deliverable:** D1
* **Deadline:** 27/03/2026

* **Deliverable:** Pitch
* **Deadline:** 01/04/2026

* **Deliverable:** D2
* **Deadline:** 24/04/2026

***

* **Deliverable:** D3
* **Deadline:** 15/05/2026

* **Deliverable:** D4
* **Deadline:** 07/06/2026

```
Ingegneria_del_software_18
├─ backend
│  ├─ .dockerignore
│  ├─ controllers
│  │  ├─ authController.js
│  │  ├─ treksController.js
│  │  └─ usersController.js
│  ├─ DockerFile
│  ├─ index.js
│  ├─ middleware
│  │  └─ requireAuth.js
│  ├─ models
│  │  ├─ treks.js
│  │  ├─ users.js
│  │  └─ users.tsx
│  ├─ routes
│  │  ├─ authRoutes.js
│  │  ├─ treksRoutes.js
│  │  └─ usersRoutes.js
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ services
│  └─ utils
├─ docker-compose.yml
├─ frontend
│  ├─ .dockerignore
│  ├─ DockerFile
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
│  │  ├─ logo_ing_sw.svg
│  │  ├─ moon.svg
│  │  └─ sun.svg
│  ├─ README.md
│  ├─ src
│  │  ├─ App.module.css
│  │  ├─ App.tsx
│  │  ├─ auth
│  │  │  ├─ api.ts
│  │  │  └─ AuthProvider.tsx
│  │  ├─ components
│  │  │  ├─ Navbar.module.css
│  │  │  ├─ Navbar.tsx
│  │  │  ├─ TrekCard.module.css
│  │  │  └─ TrekCard.tsx
│  │  ├─ hooks
│  │  │  └─ useTheme.ts
│  │  ├─ index.css
│  │  ├─ main.tsx
│  │  ├─ pages
│  │  │  ├─ Friends.tsx
│  │  │  ├─ Login.tsx
│  │  │  ├─ MyTreks.tsx
│  │  │  ├─ Register.tsx
│  │  │  └─ Treks.tsx
│  │  └─ types
│  │     ├─ Trek.ts
│  │     └─ User.ts
│  ├─ tsconfig.app.json
│  ├─ tsconfig.json
│  ├─ tsconfig.node.json
│  └─ vite.config.ts
├─ LICENSE
├─ package-lock.json
├─ package.json
├─ README.md
└─ temp
   └─ mail_sender.js

```