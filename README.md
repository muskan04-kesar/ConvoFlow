# 💬 ConvoFlow — Real-Time Chat Application

ConvoFlow is a real-time messaging application built to explore **distributed systems concepts** using **Kafka**, **Socket.IO**, **MongoDB**, and **Redis**.  
It focuses on reliable message delivery, ordering, idempotency, and real-time user experience.

---

## 🚀 Features

- 🔴 Real-time messaging using Socket.IO
- 📨 Kafka-based message queue for reliable delivery
- 🧠 Idempotent message processing (no duplicates)
- ⏱ Message ordering using Kafka keys
- 👀 Typing indicators
- ✔️ Message delivery status (sent / delivered / read)
- 🧾 Chat history persistence with MongoDB
- 🔔 Unread message count using Redis
- 🧩 Scalable consumer group architecture

---

## 🛠 Tech Stack

**Frontend**
- React
- Socket.IO Client

**Backend**
- Node.js
- Express
- Socket.IO
- KafkaJS

**Databases**
- MongoDB (message storage)
- Redis (presence & unread counts)

**Messaging**
- Apache Kafka (Docker)
Client (React)
↓ Socket.IO
Backend API
↓ Kafka Producer
Kafka Topic (chat-messages)
↓ Kafka Consumer
MongoDB + Redis
↓ Socket.IO Emit
Client Updates
---

---

## 🔐 Message Reliability Design

To ensure **exactly-once behavior** at the application level:

- Each message includes a `messageId` (UUID)
- MongoDB enforces uniqueness on `messageId`
- Kafka consumer commits offsets **only after successful processing**
- Duplicate Kafka deliveries are safely ignored

This prevents:
- duplicate messages
- infinite consumer loops
- inconsistent unread counts

---

## 🧪 Running Locally

### 1️⃣ Prerequisites
- Node.js
- Docker & Docker Compose
- MongoDB
- Redis

---

### 2️⃣ Start Kafka (Docker)
```bash
docker-compose up -d
Backend
npm install
npm start
frontend
npm install
npm run dev 


## 🧠 System Architecture

