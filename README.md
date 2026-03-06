# 🛠️ AI API Error & Log Analyzer

> An AI-powered tool that instantly decodes API errors and logs into plain-English explanations with root causes and step-by-step fixes.

![AI API Error Analyzer](https://img.shields.io/badge/Powered%20by-Claude%20AI-orange?style=flat-square)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-7-purple?style=flat-square)
![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square)

---

## 🔗 Live Demo

**[https://ai-api-error-analyzer.vercel.app](https://ai-api-error-analyzer.vercel.app)**

<img width="1920" height="1859" alt="image" src="https://github.com/user-attachments/assets/bf58a3cd-788d-44f3-9ee3-8c1c5181580b" />


---

## 📌 What It Does

Paste any API error message, HTTP response, stack trace, or log snippet and receive an instant structured breakdown:

| Output Field | Description |
|---|---|
| **Error Type** | Named label for the error |
| **Short Explanation** | Plain-English summary of what went wrong |
| **Possible Causes** | Numbered list of likely root causes |
| **Troubleshooting Steps** | Step-by-step actions to fix the issue |
| **Example Fix** | Code snippet or curl command showing the solution |

---

## ✨ Features

- ✅ Detects and analyzes common HTTP/API errors (400, 401, 403, 404, 429, 500, 502, 503)
- ✅ Handles CORS errors, JWT token issues, DNS failures, and connection timeouts
- ✅ Accepts raw logs, stack traces, JSON error bodies, and curl output
- ✅ AI-generated severity rating — Critical, High, Medium, or Low
- ✅ 5 pre-loaded example errors to try instantly
- ✅ One-click copy report for sharing in tickets or Slack
- ✅ No login required — fully public tool
- ✅ Dark terminal-style UI

---

## 🧰 Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | Frontend UI |
| Vite 7 | Build tool and dev server |
| Claude API (Anthropic) | AI error analysis |
| Vercel | Hosting and serverless functions |
| Vercel Serverless (`api/analyze.js`) | Secure API proxy |

---

## 🚀 Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- An [Anthropic API key](https://console.anthropic.com)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/b1polarbear1437/ai-api-error-analyzer.git

# 2. Navigate into the project folder
cd ai-api-error-analyzer

# 3. Install dependencies
npm install

# 4. Create a .env file in the project root
echo "ANTHROPIC_API_KEY=your-api-key-here" > .env

# 5. Start the development server
npm run dev
```

Then open **[http://localhost:5173](http://localhost:5173)** in your browser.

> ⚠️ Never commit your `.env` file. It is already listed in `.gitignore`.

---

## 📁 Project Structure

```
ai-api-error-analyzer/
├── api/
│   └── analyze.js          # Vercel serverless proxy (keeps API key secure)
├── src/
│   ├── ApiErrorAnalyzer.jsx # Main application component
│   ├── App.jsx
│   └── main.jsx
├── public/
├── .env                    # Local API key (never committed)
├── .gitignore
├── vercel.json             # Vercel routing config
├── vite.config.js
└── package.json
```

---

## 🔐 Environment Variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key from [console.anthropic.com](https://console.anthropic.com) |

For local development, add this to your `.env` file.  
For production, add it in **Vercel → Settings → Environment Variables**.

---

## 💰 API Cost Estimate

This tool uses `claude-sonnet-4-20250514`:

| | Rate |
|---|---|
| Input tokens | $3.00 per million |
| Output tokens | $15.00 per million |
| **Cost per request** | **~$0.007** |

With $5 in credits you get approximately **~650 requests**.

> 💡 To reduce costs, switch the model in `api/analyze.js` to `claude-haiku-4-5-20251001` ($1/$5 per million tokens) for ~3,000+ requests per $5.

---

## 🛡️ Security

- The Anthropic API key is stored **only** in Vercel's environment variables
- All API calls are routed through a **server-side proxy** (`api/analyze.js`) — the key is never exposed to the browser
- No user data is stored or logged
- The `.env` file is excluded from Git via `.gitignore`

---

## 📖 Supported Error Types

`400` `401` `403` `404` `408` `422` `429` `500` `502` `503` `CORS` `JWT` `DNS` `TIMEOUT`

---

## 👤 Author

**Reynaldo Valdez Jr**  
GitHub: [@b1polarbear1437](https://github.com/b1polarbear1437)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
