# ✨ ADY SELECT — Customer Demand Assessment & VIP Wishlist App

A luxury, mobile-optimized product demand validation application created for **ADY SELECT (USA & Canada)**.

Designed to eliminate "form fatigue" and laziness: customers can pick their favorite categories, tap their must-have brands, request specific items, and join the VIP launch list in **under 45 seconds**.

All data is collected privately for store owners in a live analytics dashboard, with **1-click Excel/CSV export** and optional **real-time Google Sheets sync**.

---

## 🚀 Quick Start (Run Locally)

1. Open PowerShell or Terminal in this folder:
   ```bash
   cd "c:\Users\hp\Downloads\handaan-express (4)\ady-select-demand-app"
   ```

2. Start the application:
   ```bash
   node server.js
   ```

3. Open in your browser:
   * **Customer Survey (Link to send people):** `http://localhost:3000`
   * **Private Admin Dashboard & Spreadsheet:** `http://localhost:3000/admin`
     * **Default Admin PIN:** `ady2026`

---

## 💎 Features Built Specifically for ADY SELECT

### 1. Recreated Brand Identity (from your PDF)
* Official luxury typography: **ADY SELECT (USA & CANADA)**.
* Curated tagline: *"A curated brand guide for the online beauty, personal care, fragrance and lifestyle store."*
* Categories: `BEAUTY • CARE • FRAGRANCE • ESSENTIALS • STYLE`.
* Signature motto: *"Selected with love, for you."*
* Soft champagne, dusty rose gold, and warm obsidian styling.

### 2. "Lazy-Proof" Voting Flow (< 45 Seconds)
* **Step 1 (Categories):** Shoppers only tap the categories they care about (e.g., *Skincare* + *Fragrance*). They aren't forced to scroll through 80+ unrelated items.
* **Step 2 (Brand Wishlist):** One-tap interactive chips with instant heart indicators (`🤍` ➔ `❤️`). Includes launch priority tags (`🔥 Launch Priorities`) and Canadian gems (`🍁 Canadian Exclusives`), plus an instant real-time search bar.
* **Step 3 (VIP Perks & Special Requests):** Optional 1-line custom product wishlist (e.g. *"Summer Fridays Lip Butter Balm in Vanilla Beige"*, *"Sol de Janeiro 68"*, *"SKIMS bodysuit"*) and shopping frequency.
* **Celebration Screen:** Canvas confetti burst upon submission with instant summary and one-tap WhatsApp / Copy Link sharing.

### 3. Private Results & Spreadsheets
* **1-Click Download Excel/CSV:** Click the green **"Download Excel / CSV"** button in `/admin` to get an instant, UTF-8 formatted spreadsheet with timestamps, names, contact leads, shopping frequencies, and brand selections.
* **Live Analytics Dashboard:**
  * Total voter count
  * Total brand votes
  * Top 10 most demanded brands leaderboard with percentages
  * Category breakdown (Makeup vs Skincare vs Fragrance vs Essentials)
  * VIP Buyer Leads log
* **Google Sheets Real-Time Sync:**
  * Follow the 2-minute instructions in `google-sheets-script.js` to automatically stream every vote directly into your private Google Sheet in real time.

---

## 🌐 How to Send a Real Link to People (Free 2-Minute Deployment)

To share a live `https://...` link on Instagram, TikTok, WhatsApp, or iMessage:

### Option A: Render.com (Recommended Free Web Service)
1. Push this folder to a GitHub repository.
2. Sign up at [render.com](https://render.com) (free).
3. Click **New + > Web Service**, connect your repository.
4. Set:
   * **Build Command:** `npm install`
   * **Start Command:** `node server.js`
5. Click **Create Web Service**. Within 2 minutes, you will have a live public link like `https://ady-select.onrender.com`!

### Option B: Railway.app / Glitch.com
* Drag-and-drop or connect the repository to Railway or Glitch to receive an instant live URL.

---

## 🔒 Security & Admin PIN

* To change the default admin PIN (`ady2026`), set the environment variable:
  ```bash
  ADMIN_PIN="your_new_pin_here"
  ```
* Only people with the PIN can view results, access analytics, or download the spreadsheet.
