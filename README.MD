# 📊 Portfolio Tracker (Vercel App)

A lightweight web app to **visualize your stock portfolio** using a CSV file.
Supports **live prices, PnL tracking, allocation charts, and historical performance**.

---

## 🚀 Features

* 📁 Upload or auto-load portfolio via CSV
* 📈 Live price fetching (Yahoo / Upstox)
* 💰 Profit & Loss (absolute + %)
* 🧁 Portfolio allocation (pie chart)
* 📉 Historical performance charts
* 🔄 One-click refresh
* ⚡ Fast, serverless (Vercel)

---

## 📂 CSV Format

Your portfolio file should look like:

```
ticker,quantity,average_buy_price,buy_date,upstox_ticker
RELIANCE.NS,10,2500,2024-01-01,
TCS.NS,5,3200,2024-02-01,
ABC-SM,100,50,2024-03-01,INE0XXXXXXX
```

### Notes:

* `upstox_ticker` → required for SME stocks (`-SM`)
* Multiple rows per ticker supported

---

## 🛠️ Setup (Local Development)

### 1️⃣ Clone the repo

```
git clone https://github.com/<your-username>/portfolio-tracker.git
cd portfolio-tracker
```

---

### 2️⃣ Install dependencies

```
npm install
```

---

### 3️⃣ Run locally (Vercel dev)

```
npx vercel dev
```

---

### 🌐 App will run at:

```
http://localhost:3000
```

---

## 📡 API Usage

### 🔹 Yahoo Finance

Used for standard tickers like:

* `RELIANCE.NS`
* `TCS.NS`

---

### 🔹 Upstox API

Used for SME tickers (`-SM`):

```
https://api.upstox.com/v2/historical-candle/NSE_EQ|<upstox_ticker>/day/<end_date>/<start_date>
```

---

## 🔄 Refresh Data

Use the **🔄 Refresh** button in the UI to:

* Fetch latest prices
* Recalculate PnL
* Update charts

---

## 📁 Project Structure

```
/portfolio-tracker
  ├── index.html
  ├── /api
  │     └── (serverless functions if any)
  ├── /data
  │     └── my_portfolio.csv
  ├── /assets
  ├── package.json
```

---

## 🚀 Deploy to Vercel

### Option 1: CLI

```
npm install -g vercel
vercel
```

---

### Option 2: GitHub

1. Push repo to GitHub
2. Import into Vercel
3. Deploy automatically

---

## ⚠️ Common Issues

### ❌ `vercel dev must not recursively invoke itself`

👉 Fix:

* Remove `"dev": "vercel dev"` from `package.json`
* Or avoid calling `vercel dev` inside scripts

---

### ❌ CORS issues (Upstox)

👉 Use:

* Proxy (if needed)
* Or fallback to Yahoo Finance

---

### ❌ CSV not loading

* Ensure file exists in `/data`
* Check path is correct
* Verify no extra spaces in headers

---

## 💡 Future Improvements

* 📊 Benchmark comparison (Nifty 50)
* 📅 XIRR / CAGR calculations
* 🔔 Price alerts
* 📱 PWA (installable app)

---

## 🧑‍💻 Author

Built for personal portfolio tracking and experimentation.

---

## ⭐ Contribute

PRs and suggestions welcome!
