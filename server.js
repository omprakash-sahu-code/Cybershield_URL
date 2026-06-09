const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

try {
  require("dotenv").config();
} catch {
  // dotenv is optional in this project environment.
}

const PORT = process.env.PORT || 3002;
const API_KEY = process.env.API_KEY;
const BASE_RETRY_DELAY_MS = 250;
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

function toPositiveInteger(value, fallback) {
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }

  return fallback;
}

function toNonNegativeInteger(value, fallback) {
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed >= 0) {
    return parsed;
  }

  return fallback;
}

function calculateRetryDelay(attempt) {
  return BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
}

const REQUEST_TIMEOUT_MS = toPositiveInteger(process.env.REQUEST_TIMEOUT_MS, 5000);
const REQUEST_RETRIES = toNonNegativeInteger(process.env.REQUEST_RETRIES, 2);
const DEFAULT_ALLOWED_ORIGINS = [
  "https://cybershield-url.netlify.app",
  "http://localhost:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500"
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getAllowedOrigins() {
  const configured = process.env.CORS_ORIGINS;

  if (!configured) {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  return configured
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function sanitizeErrorDetail(message, fallback) {
  if (process.env.NODE_ENV === "production") {
    return fallback;
  }

  return message;
}

function levenshteinDistance(a, b) {
  const tmp = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

const HOMOGLYPHS_MAP = {
  'a': ['а', 'à', 'á', 'â', 'ã', 'ä', 'å', 'ɑ'],
  'c': ['с', 'ć', 'ĉ', 'ċ', 'č'],
  'd': ['ԁ', 'ď', 'đ'],
  'e': ['е', 'è', 'é', 'ê', 'ë', 'ė', 'ě'],
  'g': ['ɡ', 'ğ', 'ĝ', 'ģ'],
  'h': ['һ', 'ĥ', 'ħ'],
  'i': ['і', 'í', 'ì', 'ï', 'ı'],
  'j': ['ј', 'ĵ'],
  'l': ['1', 'i', 'ł', 'ľ', 'ļ'],
  'o': ['о', '0', 'ò', 'ó', 'ô', 'õ', 'ö', 'ø'],
  'p': ['р', 'þ'],
  'q': ['զ'],
  's': ['ѕ', 'ś', 'ŝ', 'ş', 'š'],
  't': ['т', 'ť', 'ţ', 'ŧ'],
  'u': ['υ', 'ù', 'ú', 'û', 'ü', 'ų'],
  'w': ['ԝ', 'ŵ'],
  'x': ['х', 'ҳ'],
  'y': ['у', 'ý', 'ÿ'],
  'z': ['z', 'ź', 'ż', 'ž']
};

const KEYBOARD_PROXIMITY_MAP = {
  'a': ['q', 'w', 's', 'z'],
  'b': ['v', 'g', 'h', 'n'],
  'c': ['x', 'd', 'f', 'v'],
  'd': ['s', 'e', 'r', 'f', 'c', 'x'],
  'e': ['w', 'r', 'd', 's'],
  'f': ['d', 'r', 't', 'g', 'v', 'c'],
  'g': ['f', 't', 'y', 'h', 'b', 'v'],
  'h': ['g', 'y', 'u', 'j', 'n', 'b'],
  'i': ['u', 'o', 'k', 'j'],
  'j': ['h', 'u', 'i', 'k', 'm', 'n'],
  'k': ['j', 'i', 'o', 'l', 'm'],
  'l': ['k', 'o', 'p'],
  'm': ['n', 'j', 'k'],
  'n': ['b', 'h', 'j', 'm'],
  'o': ['i', 'p', 'l', 'k'],
  'p': ['o', 'l'],
  'q': ['1', '2', 'w', 'a'],
  'r': ['e', 'd', 'f', 't'],
  's': ['a', 'w', 'e', 'd', 'x', 'z'],
  't': ['r', 'f', 'g', 'y'],
  'u': ['y', 'h', 'j', 'i'],
  'v': ['c', 'f', 'g', 'b'],
  'w': ['q', 'a', 's', 'e'],
  'x': ['z', 's', 'd', 'c'],
  'y': ['t', 'g', 'h', 'u'],
  'z': ['a', 's', 'x']
};

const COMMON_TLDS_LIST = ['com', 'net', 'org', 'co', 'info', 'biz', 'xyz'];

function getPrimaryDomain(hostname) {
  if (!hostname) return { sld: "", tld: "", domain: "" };
  
  const host = hostname.toLowerCase().replace(/\.+$/, "");
  const parts = host.split(".");
  if (parts.length < 2) {
    return { sld: host, tld: "", domain: host };
  }
  
  const tldCandidates = ["com", "net", "org", "co", "gov", "edu", "mil"];
  const lastPart = parts[parts.length - 1];
  const secondLastPart = parts[parts.length - 2];
  
  if (parts.length >= 3 && tldCandidates.includes(secondLastPart) && lastPart.length === 2) {
    const sld = parts[parts.length - 3];
    const tld = `${secondLastPart}.${lastPart}`;
    return { sld, tld, domain: `${sld}.${tld}` };
  } else {
    const sld = secondLastPart;
    const tld = lastPart;
    return { sld, tld, domain: `${sld}.${tld}` };
  }
}

function generateTyposquattingVariants(sld, tld) {
  const homoglyphVariants = new Set();
  const hyphenVariants = new Set();
  const tldVariants = new Set();
  const substitutionVariants = new Set();

  // 1. Homoglyphs
  for (let i = 0; i < sld.length; i++) {
    const char = sld[i];
    if (HOMOGLYPHS_MAP[char]) {
      for (const replacement of HOMOGLYPHS_MAP[char]) {
        const variant = sld.substring(0, i) + replacement + sld.substring(i + 1);
        homoglyphVariants.add(variant);
      }
    }
  }

  // 2. Hyphen Injection (only between characters)
  for (let i = 1; i < sld.length; i++) {
    const variant = sld.substring(0, i) + '-' + sld.substring(i);
    hyphenVariants.add(variant);
  }

  // 3. TLD Swaps
  for (const newTld of COMMON_TLDS_LIST) {
    if (newTld !== tld) {
      tldVariants.add(newTld);
    }
  }

  // 4. Character Substitution
  for (let i = 0; i < sld.length; i++) {
    const char = sld[i];
    if (KEYBOARD_PROXIMITY_MAP[char]) {
      for (const replacement of KEYBOARD_PROXIMITY_MAP[char]) {
        const variant = sld.substring(0, i) + replacement + sld.substring(i + 1);
        substitutionVariants.add(variant);
      }
    }
  }

  const filterAndFormat = (variantsSet, category, isTld = false) => {
    const list = [];
    for (const v of variantsSet) {
      if (isTld) {
        const fullDomain = `${sld}.${v}`;
        list.push({ domain: fullDomain, category, distance: 0 });
      } else {
        const fullDomain = `${v}.${tld}`;
        const distance = levenshteinDistance(sld, v);
        if (distance <= 2) {
          list.push({ domain: fullDomain, category, distance });
        }
      }
    }
    return list;
  };

  const finalHomoglyphs = filterAndFormat(homoglyphVariants, 'homoglyph');
  const finalTlds = filterAndFormat(tldVariants, 'tld', true);
  const finalSubstitutions = filterAndFormat(substitutionVariants, 'substitution');
  const finalHyphens = filterAndFormat(hyphenVariants, 'hyphen');

  const cappedVariants = [];
  
  const takeN = (source, n) => {
    const taken = source.slice(0, n);
    cappedVariants.push(...taken);
  };

  // Prioritize homoglyphs (up to 8) and TLD swaps (up to 6)
  takeN(finalHomoglyphs, 8);
  takeN(finalTlds, 6);
  // Followed by character substitutions (up to 3) and hyphen injections (up to 3)
  takeN(finalSubstitutions, 3);
  takeN(finalHyphens, 3);

  // If total is less than 20 and we have leftovers, fill up to 20
  const remainingCount = 20 - cappedVariants.length;
  if (remainingCount > 0) {
    const allLeftovers = [
      ...finalHomoglyphs.slice(8),
      ...finalTlds.slice(6),
      ...finalSubstitutions.slice(3),
      ...finalHyphens.slice(3)
    ];
    cappedVariants.push(...allLeftovers.slice(0, remainingCount));
  }

  return cappedVariants;
}

async function callSafeBrowsingWithRetry(fetchImpl, apiKey, requestBody, timeoutMs, maxRetries) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(
        `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        }
      );

      if (response.ok) {
        return { ok: true, data: await response.json() };
      }

      const detail = await response.text();
      const shouldRetry = RETRYABLE_STATUS_CODES.has(response.status) && attempt < maxRetries;

      if (shouldRetry) {
        await sleep(calculateRetryDelay(attempt));
        continue;
      }

      return {
        ok: false,
        status: response.status,
        detail
      };
    } catch (error) {
      const isTimeout = error.name === "AbortError";
      const shouldRetry = attempt < maxRetries;

      if (shouldRetry) {
        await sleep(calculateRetryDelay(attempt));
        continue;
      }

      return {
        ok: false,
        fetchError: isTimeout
          ? `Google API request timed out after ${timeoutMs}ms`
          : "Google API network request failed"
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  return { ok: false, fetchError: "Google API request failed" };
}

const SYSTEM_INSTRUCTION = `You are CyberShield AI, an advanced digital fraud and scam detection assistant.
Your goal is to analyze messages, emails, SMS, job offers, investment pitches, or other text pasted by the user to determine if it is a scam.

Cover these main categories:
1. Phishing: Credential theft attempts, fake bank logins, malicious link clicks, weird domain patterns.
2. Fake Job Offers: Advance-fee recruitment scams, daily-tasks-for-pay scams, remote data entry traps, payment requests for kits.
3. OTP Fraud / UPI PIN Theft: Requests to share OTP code, PINs, card verification details, or social engineering to approve transfers.
4. Investment Scams: Crypto doubling programs, high-yield investment programs (HYIP), fake telegram channel recommendations, pump & dump schemes.
5. Impersonation Scams: Fake courier support (FedEx, DHL, India Post, customs duty), mock law enforcement/police warnings, fake friends/bosses asking for emergency money.

Analyze threat indicators like artificial urgency, fear tactics, grammatical errors, request for sensitive files/data, payment instructions, or unrecognized URLs.

Provide output conforming EXACTLY to the requested JSON schema.
- "classification": Assess if this message is safe, suspicious (has minor flags or questionable intent), or malicious (clear fraud signature).
- "scamType": Choose the matching scam category ("phishing", "fake_job", "otp_fraud", "investment_scam", "impersonation", "other", or "none" if safe).
- "confidence": Percentage score (0 to 100) representing threat analysis confidence.
- "explanation": Explain clearly why this message was classified this way. Highlight the specific threat indicators (e.g. urgent requests, unverified links) detected. If the user is asking general follow-up safety questions, answer them helpful and directly here.
- "actionableAdvice": Specific, actionable warning instructions (e.g. "Do NOT click the link", "Contact FedEx directly via their official number").`;

function createApp(options = {}) {
  const app = express();
  const fetchImpl = options.fetchImpl || fetch;
  const apiKey = options.apiKey || API_KEY;
  const geminiKey = options.geminiKey || process.env.GEMINI_API_KEY;
  const timeoutMs = toPositiveInteger(options.timeoutMs, REQUEST_TIMEOUT_MS);
  const retries = toNonNegativeInteger(options.retries, REQUEST_RETRIES);
  const allowedOrigins = options.allowedOrigins || getAllowedOrigins();

  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
  }));

  app.use(express.json());

  app.get("/", (req, res) => {
    res.json({ status: "CyberShield backend running", port: PORT });
  });

  app.post("/check", async (req, res) => {
    const userUrl = req.body.url;

    if (!userUrl || typeof userUrl !== "string") {
      return res.status(400).json({ error: "No URL provided or invalid format" });
    }

    if (userUrl.length > 2048) {
      return res.status(400).json({ error: "URL exceeds maximum length of 2048 characters" });
    }

    let urlObj;
    try {
      urlObj = new URL(userUrl);
    } catch {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    if (!apiKey) {
      return res.status(500).json({ error: "Missing API key configuration" });
    }

    console.log(`[SCAN] Checking: ${userUrl}`);

    // Parse host, SLD, and TLD for typosquatting check
    const hostname = urlObj.hostname;
    const { sld, tld } = getPrimaryDomain(hostname);
    const originalDomain = sld && tld ? `${sld}.${tld}` : hostname;
    const protocol = urlObj.protocol + "//";

    const variants = generateTyposquattingVariants(sld, tld);

    // Build the request threat entries (original URL first, then variants)
    const threatEntries = [{ url: userUrl }];
    for (const variant of variants) {
      threatEntries.push({ url: protocol + variant.domain });
    }

    const requestBody = {
      client: {
        clientId: "cybershield-hackathon",
        clientVersion: "2.0"
      },
      threatInfo: {
        threatTypes: [
          "MALWARE",
          "SOCIAL_ENGINEERING",
          "UNWANTED_SOFTWARE",
          "POTENTIALLY_HARMFUL_APPLICATION"
        ],
        platformTypes: ["ANY_PLATFORM"],
        threatEntryTypes: ["URL"],
        threatEntries: threatEntries
      }
    };

    const result = await callSafeBrowsingWithRetry(fetchImpl, apiKey, requestBody, timeoutMs, retries);

    if (!result.ok) {
      if (result.fetchError) {
        console.error("[FETCH ERROR]", result.fetchError);
        return res.status(500).json({
          error: "Backend fetch failed",
          detail: sanitizeErrorDetail(result.fetchError, "Failed to contact Safe Browsing API")
        });
      }

      console.error(`[API ERROR] Status ${result.status}:`, result.detail);
      return res.status(502).json({
        error: `Google API error: ${result.status}`,
        detail: sanitizeErrorDetail(result.detail, "Safe Browsing API request failed")
      });
    }

    const matches = result.data.matches || [];
    console.log(`[RESULT] Matches: ${matches.length}`);

    // Map threats
    const originalUrlLower = userUrl.toLowerCase().replace(/\/$/, "");
    const originalIsThreat = matches.some(m => {
      if (!m.threat || !m.threat.url) {
        return true; // fallback
      }
      return m.threat.url.toLowerCase().replace(/\/$/, "") === originalUrlLower;
    });

    const variantsWithThreat = variants.map(v => {
      const variantUrl = protocol + v.domain;
      const variantUrlLower = variantUrl.toLowerCase().replace(/\/$/, "");
      const isThreat = matches.some(m => {
        return m.threat && m.threat.url && m.threat.url.toLowerCase().replace(/\/$/, "") === variantUrlLower;
      });
      return {
        domain: v.domain,
        category: v.category,
        distance: v.distance,
        threat: isThreat ? "malicious" : "suspicious"
      };
    });

    return res.json({
      matches: result.data.matches || [],
      typosquatting: {
        original: {
          url: userUrl,
          domain: originalDomain,
          threat: originalIsThreat ? "malicious" : "safe"
        },
        variants: variantsWithThreat
      }
    });
  });

  app.post("/api/scam-detect", async (req, res) => {
    const { message, history } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "No message text provided or invalid format" });
    }

    if (!geminiKey) {
      return res.status(500).json({ error: "Missing Gemini API key configuration" });
    }

    console.log(`[SCAM DETECT] Analyzing message input`);

    const formattedContents = [];
    if (Array.isArray(history)) {
      history.forEach(h => {
        formattedContents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        });
      });
    }
    formattedContents.push({
      role: "user",
      parts: [{ text: message }]
    });

    try {
      const fetchImpl = options.fetchImpl || fetch;
      const response = await fetchImpl(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: formattedContents,
            systemInstruction: {
              parts: [{ text: SYSTEM_INSTRUCTION }]
            },
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "OBJECT",
                properties: {
                  classification: {
                    type: "STRING",
                    enum: ["safe", "suspicious", "malicious"]
                  },
                  scamType: {
                    type: "STRING",
                    enum: ["phishing", "fake_job", "otp_fraud", "investment_scam", "impersonation", "other", "none"]
                  },
                  confidence: {
                    type: "INTEGER"
                  },
                  explanation: {
                    type: "STRING"
                  },
                  actionableAdvice: {
                    type: "STRING"
                  }
                },
                required: ["classification", "scamType", "confidence", "explanation", "actionableAdvice"]
              }
            }
          })
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[GEMINI API ERROR] Status ${response.status}:`, errText);
        return res.status(502).json({
          error: `Gemini API error: ${response.status}`,
          detail: "Failed to communicate with LLM backend"
        });
      }

      const responseData = await response.json();
      
      if (
        responseData.candidates &&
        responseData.candidates[0] &&
        responseData.candidates[0].content &&
        responseData.candidates[0].content.parts &&
        responseData.candidates[0].content.parts[0]
      ) {
        const text = responseData.candidates[0].content.parts[0].text;
        try {
          const parsed = JSON.parse(text);
          return res.json(parsed);
        } catch (jsonErr) {
          console.error("[JSON PARSE ERROR] Text was:", text);
          return res.status(502).json({
            error: "Invalid JSON response structure from LLM",
            detail: "Failed to parse model response"
          });
        }
      }

      return res.status(502).json({
        error: "Empty content returned from LLM service",
        detail: "No candidates returned"
      });
    } catch (fetchErr) {
      console.error("[GEMINI FETCH ERROR]", fetchErr);
      return res.status(500).json({
        error: "Failed to fetch response from Gemini backend",
        detail: fetchErr.message
      });
    }
  });

  app.use((err, req, res, next) => {
    if (err && err.message === "Not allowed by CORS") {
      return res.status(403).json({ error: "CORS origin denied" });
    }

    return next(err);
  });

  return app;
}

const app = createApp();

if (require.main === module) {
  app.listen(PORT, () => {
    console.log("\n🛡️  CyberShield Backend");
    console.log(`🚀  Running at http://localhost:${PORT}`);
    console.log("📡  POST /check to scan a URL\n");
  });
}

module.exports = {
  app,
  createApp,
  callSafeBrowsingWithRetry,
  getAllowedOrigins
};
