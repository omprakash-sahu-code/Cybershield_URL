# 🛡️ CyberShield URL Scanner
![Cybershield Loading](assets/cybershield.png)

🚀 **CyberShield** 
* **is a real-time URL security scanner that helps users detect whether a website is safe or potentially harmful before visiting it**.

🔗 **Live Demo:**
https://mrinalray.github.io/Cybershield_URL/

---

## 📌 Features

* 🔍 **Real-time URL scanning**
* 📸 **Drag-and-Drop Screenshot Scanner** — Drop or upload screenshots containing URLs; the system automatically extracts them using Gemini AI and scans them.
* 💬 **AI Scam Detector Chat** — Interactive chat assistant to analyze suspicious messages, emails, or job pitches.
* 🛡️ **Detects phishing, malware, and social engineering threats**
* ⚡ **Fast and responsive UI**
* 🌐 **Uses Google Safe Browsing API**
* ✅ **Simple and user-friendly interface**

---

## 🧠 How It Works
![Main Page View](assets/cybershield_main_page.png)

1. 🔗 **Enter URL or Upload Screenshot**  
   - Users can manually enter a URL or drag & drop a screenshot containing a URL.
   - For screenshots, the backend extracts the URL automatically using Gemini AI OCR.
   The user inputs a website link into the scanner.

2. ⚡ **Send Request**  
   The application sends the URL to the security API.

3. 🛡️ **Threat Analysis**  
   Google Safe Browsing analyzes the URL for:
   - Phishing attacks  
   - Malware  
   - Social engineering threats  

4. 📊 **Display Result**  
   The system shows a clear result:
   - ✅ **Safe** — No threats detected  
   - ⚠️ **Potential Threat** — Risky or malicious content found  

---

---
---

## 🧠 Tech Stack

| Layer        | Technology |
|-------------|-----------|
| Frontend     | HTML5 |
| Styling      | CSS3 (Custom Properties, Responsive Design) |
| Logic        | JavaScript (Vanilla JS) |
| Backend      | Node.js (API Handling) |
| Security API | Google Safe Browsing API |
| Deployment   | Render / Netlify / GitHub Pages |

---
---

## 📸 Preview

![CyberShield Preview](assets/cybershield_result.png)

---

## 🔑 API Integration

This project integrates two primary security/AI services:

1. **Google Safe Browsing API** (Detects malicious threat URLs)
   - **How to generate key**:
     1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
     2. Enable the **Safe Browsing API**.
     3. Go to **APIs & Services > Credentials** and generate an API key.
     4. Save the key as `API_KEY` in your `.env` file.

2. **Gemini API** (Powers the Scam Detector Chat & Screenshot URL OCR Scanner)
   - **How to generate key**:
     1. Go to [Google AI Studio](https://aistudio.google.com/).
     2. Click on **Get API Key** and create a new key.
     3. Save the key as `GEMINI_API_KEY` in your `.env` file.

---

## ⚙️ Setup Instructions

1. Clone the repository:

```bash
git clone https://github.com/mrinalray/Cybershield_URL.git
```

2. Navigate to the project folder:

```bash
cd Cybershield_URL
```

3. Configure your environment variables. Copy the template `.env.example` to `.env`:

```bash
cp .env.example .env
```

Open `.env` and fill in your generated `API_KEY` and `GEMINI_API_KEY`.

4. Start the backend:

```bash
node server.js
```

5. Run frontend:

* Open `index.html` in browser

---

## ⚠️ Important Notes

* Do NOT expose your API key publicly
* Use environment variables for production
* This is a client-side demo (for hackathon/project use)

---

## 🚀 Future Improvements

* 🔐 Email breach checker integration (HIBP API)
* 📊 Threat analytics dashboard
  - View past scan results
  - Track phishing and malware detection trends
  - Visualize data with charts and logs
  - Export logs for offline analysis
* 🌍 Browser extension support
* 🤖 AI-based threat detection

---

## 📈 Threat Analytics Dashboard (Proposed)

CyberShield will be extended with a dedicated analytics dashboard for monitoring historical URL scans and threat patterns.
This feature will allow users to:
* View past scan results and outcomes
* Track the frequency of phishing and malware detections
* Visualize trends using charts such as bar and line graphs
* Export scan logs for further analysis

Proposed implementation strategy:
* Create `dashboard.html` as a new dashboard page
* Use `Chart.js` or `D3.js` for interactive visualizations
* Store scan results in local storage for the demo
* Prepare backend database support for future persistence
* Add a navigation link from the main page to the dashboard

---

## 👨‍💻 Author

**Mrinal Roy**

* GitHub: https://github.com/mrinalray
  
**Rahul Sah**
  * GitHub: https://github.com/real-rahul1
  

---

## ⭐ Support

If you like this project:

* ⭐ Star the repo
* 🍴 Fork it
* 📢 Share with others

---

## 📜 License

This project is for educational and demonstration purposes.
