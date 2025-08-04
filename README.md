# 📈 GrowwUp – Virtual Stock Market Simulator

**GrowwUp** is a real-time, beginner-friendly virtual stock trading simulator that allows users to understand the basics of the stock market without any financial risk. Designed as an experiential platform, it uses live NSE stock data, simulates buying/selling behavior, and provides portfolio tracking with personalized analysis.

---

## 🚀 Inspiration

As someone who started trading in my second year, I personally experienced the steep learning curve and confusion around basic market terminologies and trading strategies. GrowwUp is built to solve that gap — giving users a risk-free, real-world learning experience in the world of stock markets.

---

## 🎯 Features

- 📊 **Live NSE Stock Data** – Integrated using `nse-jugaad-data` (no paid API required)
- 🔁 **Real-Time Updates** – WebSocket-powered live price streaming
- 🚀 **Asynchronous FastAPI Backend** – Built with high-performance async I/O
- 🧠 **Portfolio Summary & Analyzer** – Get insights on portfolio performance and suggestions
- 🔄 **Order Management** – Simulate buy/sell operations with real-time timestamps
- ⚡ **TTL Cache** – Efficient caching of stock data to reduce latency and API load
- 🔐 **User Authentication** – Secure login/register system (planned)
- 📊 **Future Scope** – AI-driven stock suggestions, mutual funds, BSE & global trade support

---

## 🛠 Tech Stack

### ✅ Backend
- **Python 3.10**
- **FastAPI** – Async API framework
- **cachetools** – For TTL cache
- **nse-jugaad-data** – Live stock data from NSE
- **WebSockets** – For real-time communication
- **Uvicorn** – ASGI server

### ✅ Frontend
- **React.js 18**
- **WebSocket API / socket.io-client**
- **Chart.js**

### ✅ Node.js Utilities
- **Node.js 18**
- **Express.js 4.18** – Lightweight proxy APIs and utility endpoints

### ✅ Deployment
- **Render** – Backend hosting (due to support for rewrites/redirects)
- **AWS EC2** – For scalable and flexible hosting of backend services

---

## 💡 Future Scope

- 🧠 AI-powered suggestion engine (pros/cons before buying a stock)
- 📦 Mutual fund simulation
- 🌍 Support for BSE and global markets
- 🧑‍🤝‍🧑 Social trading (follow & clone portfolios)
- 🏆 Gamification (badges, leaderboards)

---

## 📁 Project Setup

### Backend (FastAPI + WebSocket)
```bash
cd Flask
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn combined_app:app --reload

```

### 🌲 Node/Express Services

```bash
cd backend
npm install
node index.js
```

### ⚛️ Frontend (React)

```bash
cd frontend
npm install
npm start
```
### 🙋‍♂️ Author
Devansh Mishra
Final Year Student, PICT Pune

Passionate about finance + tech, backend systems, and real-time apps

