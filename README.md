# ElectroStore — Electronics E-Commerce Platform

ElectroStore is a production-ready, full-stack e-commerce web application scoped exclusively to electronics products (smartphones, laptops, audio devices, Smartwatch, accessories, and TVs & monitors). 

This platform features two completely separate, role-enforced authentication systems (customers and administrators) with dedicated dashboard controls and views.

---

## Project Structure

```text
├── backend/                  # Flask REST API
│   ├── routes/               # API route blueprints (auth, products, cart, orders, admin)
│   ├── app.py                # Server entry point & auto-seeding logic
│   ├── config.py             # Config loader mapping env variables
│   ├── models.py             # SQLAlchemy models (MySQL mapping)
│   ├── requirements.txt      # Python dependencies list
│   ├── .env.example          # Template environment config
│   └── .env                  # Local dev environment configuration
├── frontend/                 # Vite + React 18 SPA
│   ├── src/
│   │   ├── context/          # React AuthContext and CartContext states
│   │   ├── pages/            # View components (Home, Catalog, Detail, Admin panels...)
│   │   ├── services/         # Axios API clients & headers interceptors
│   │   ├── App.jsx           # Main routing navigation mapping
│   │   └── index.css         # Custom Plain CSS design token stylesheet
│   ├── index.html            # Web entry point with SEO optimized tags
│   └── package.json          # Node dependencies
└── schema.sql                # MySQL 8 table schema definitions & seed rows
```

---

## Seed Credentials

We have seeded the database with default accounts. You can log in using:

### Customer Account
- **Portal URL:** `/login`
- **Email:** `customer@electrostore.com`
- **Password:** `customerpassword`

### Admin Account
- **Portal URL:** `/admin/login` (evokes a navy control panel theme)
- **Email:** `admin@electrostore.com`
- **Password:** `adminpassword`

---

## Local Setup Instructions

### 1. Database Setup (MySQL 8+)

1. Ensure your MySQL server service (e.g. `MySQL80`) is running.
2. Open your MySQL client shell or workbench and execute `schema.sql` located at the root of the project to initialize the database tables and products seed:
   ```bash
   mysql -u root -p < schema.sql
   ```
   *Note: If you do not run `schema.sql` manually, the Flask backend will automatically create tables and seed users, categories, and products on startup, provided it has connection privileges.*

### 2. Backend Setup (Flask REST API)

1. Open a terminal in the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
5. Edit `.env` and replace `your_password_here` with your actual local MySQL root password:
   ```text
   DATABASE_URL=mysql+pymysql://root:your_mysql_password@localhost:3306/electrostore_db
   ```
6. Start the API server:
   ```bash
   python app.py
   ```
   The backend API will run on `http://localhost:5000`.

### 3. Frontend Setup (React SPA)

1. Open a terminal in the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install Node packages:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend app will run on `http://localhost:5173` (or equivalent URL displayed in the console).
   
npm run build; netlify deploy --prod --dir=dist

---

## Payment Gateway Integration Guide

The checkout system utilizes a mock payment workflow. The code is modularized to support Stripe, Razorpay, or PayPal integrations easily.

To swap the mock module with a live gateway:
1. Open the order controller file: [backend/routes/orders.py](file:///c:/Users/yoges/OneDrive/Desktop/project/backend/routes/orders.py).
2. Locate the `_process_payment` handler function:
   ```python
   def _process_payment(payment_method, amount):
       # Current mock processing...
   ```
3. Install your payment provider's SDK (e.g., `pip install stripe`).
4. Replace the logic within `_process_payment` to verify transactions via the provider's API. For instance, using Stripe Payment Intents:
   ```python
   import stripe
   stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
   
   # Confirm and capture card payment details received from the frontend payload
   ```
5. Update your React checkout page: [frontend/src/pages/Checkout.jsx](file:///c:/Users/yoges/OneDrive/Desktop/project/frontend/src/pages/Checkout.jsx) to collect live card details or trigger checkout modals from the provider.

deploy in netfy
