# WhatsAppFinanceTrack is a smart financial tracking platform designed for simplicity and automation.  
Users can send their daily expenses through **WhatsApp messages or photos**, and the system automatically extracts, categorizes, and records the data into a clean and modern **dashboard**.  

---

## 🚀 Overview

TrackyFinance helps users in Brazil (and worldwide) manage their finances effortlessly by combining **AI-powered text and image recognition** with a modern, data-driven interface.

**Core idea:**  
> “Just send your expenses on WhatsApp — we’ll handle the rest.”

The system supports:
- Automatic data extraction from WhatsApp messages and receipt photos  
- Expense categorization  
- Real-time analytics and visualization  
- Manual expense entry for full control  

---

## 🎨 Design

- **Main color:** 🟧 `#FFA94D`  
- **Secondary colors:** white `#FFFFFF`, dark gray `#2C2C2C`, light gray `#F5F5F5`  
- **Typography:** Inter / Poppins / Nunito  
- **UI principles:**  
  - Rounded corners  
  - Subtle shadows  
  - Smooth animations  
  - Mobile-first responsive layout  
  - Focus on simplicity and clarity  

---

## ⚙️ Features

### 🔐 Authentication
- Register and login (email + password)
- Secure JWT session management
- Password reset via email
- Optional Google Sign-In

### 💬 WhatsApp Integration
- Connect a WhatsApp Business account  
- Send messages like “Spent 45.90 on lunch at McDonald's”  
- Or send receipt photos — OCR extracts text automatically  
- Expense data is parsed, categorized, and added to the user’s dashboard  
- Automatic WhatsApp replies confirm the operation  

### 💵 Expense Management
- Add, edit, or delete expenses manually  
- Auto-categorization (Food, Transport, Shopping, Bills, etc.)  
- Recurring expense suggestions  
- CSV/PDF export  

### 📊 Dashboard
- Monthly and yearly summaries  
- Expense distribution by category (charts)  
- Timeline of expenses  
- List of recent transactions  
- Smart budget insights  

### ⚙️ Settings
- Manage categories and budgets  
- Manage WhatsApp integration  
- Update profile and preferences  
- Currency: BRL (default), with multi-currency support  

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | React (Vite or Next.js) + TailwindCSS + Recharts |
| **Backend** | Node.js + Express |
| **Database** | PostgreSQL (or Supabase) |
| **AI/Automation** | OCR (Tesseract or Google Cloud Vision) + NLP (OpenAI or custom model) |
| **Messaging** | WhatsApp Business API |
| **Auth** | JWT + bcrypt password hashing |
| **Payments (optional)** | Stripe / Mercado Pago |

---

## 🧩 API Endpoints

| Method | Endpoint | Description |
|---------|-----------|-------------|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login user |
| `GET` | `/expenses` | Get all user expenses |
| `POST` | `/expenses` | Add new expense |
| `PUT` | `/expenses/:id` | Update expense |
| `DELETE` | `/expenses/:id` | Delete expense |
| `POST` | `/whatsapp/webhook` | Handle WhatsApp messages |
| `GET` | `/reports/monthly` | Get monthly report data |

---

## 🗄️ Database Schema (simplified)

```sql
Users(id, name, email, password_hash, created_at)
Expenses(id, user_id, amount, category, description, date, image_url, created_at)
Categories(id, user_id, name)
WhatsAppSessions(id, user_id, phone_number, session_token, connected_at)
🛠️ Setup & Installation
1️⃣ Clone the repo
bash
Copy code
git clone https://github.com/yourusername/trackyfinance.git
cd trackyfinance
2️⃣ Install dependencies
bash
Copy code
npm install
3️⃣ Set environment variables
Create a .env file with:

ini
Copy code
DATABASE_URL=postgresql://user:password@localhost:5432/trackyfinance
JWT_SECRET=your_jwt_secret
WHATSAPP_API_KEY=your_whatsapp_api_key
OCR_API_KEY=your_ocr_api_key
OPENAI_API_KEY=your_openai_key
4️⃣ Run the server
bash
Copy code
npm run dev
5️⃣ Access the app
Visit: http://localhost:3000

📈 Roadmap
 Core UI design and dashboard

 Authentication system

 Basic expense CRUD

 WhatsApp integration

 OCR and NLP automation

 Premium subscription system

 Mobile app (React Native)

🧑‍💻 Contributing
Contributions are welcome!

Fork the project

Create a new branch (feature/new-feature)

Commit your changes

Push and open a Pull Request

Please make sure to run code linters and tests before submitting PRs.

⚖️ License
This project is licensed under the MIT License — see the LICENSE file for details.

🌍 About
Developed by Bruno Silva 🇨🇻
Created for entrepreneurs and individuals who want a simple, automated way to stay on top of their spending.

“Your finances, organized — one WhatsApp message at a time.”
