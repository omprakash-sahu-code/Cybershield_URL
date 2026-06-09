// ─────────────────────────────
// LOADER
// ─────────────────────────────

window.addEventListener('load', () => {

  setTimeout(() => {

    const loader = document.getElementById('loader');
    const main = document.getElementById('mainPage');

    loader.classList.add('fade-out');

    setTimeout(() => {
      loader.style.display = 'none';
      main.classList.remove('hidden');
    }, 500);

  }, 3200);

});

// ─────────────────────────────
// TEAM — collapsible
// ─────────────────────────────

const team = [
  { name: "Mrinal Roy", img: "Mrinal.jpg" },
  { name: "Rahul Sah", img: "Rahul.jpg" },
  { name: "Swastika Shaw", img: "Swastika.jpg" },
  { name: "Arpita Roy", img: "Arpita.jpg" },
  { name: "Disha Samanta", img: "Disha.jpg" },
];

(function buildTeam() {

  const grid = document.getElementById('teamGrid');

  grid.innerHTML = team.map(m => {

    const initials = m.name
      .split(' ')
      .map(w => w[0])
      .join('');

    return `
      <div class="member-card">

        <div class="member-avatar">

          <img
            src="${m.img}"
            alt="${m.name}"
            onerror="this.parentElement.innerHTML='${initials}'"
          >

        </div>

        <div class="member-name">
          ${m.name}
        </div>

      </div>
    `;

  }).join('');

})();

let teamOpen = false;

function toggleTeam() {

  teamOpen = !teamOpen;

  const wrap = document.getElementById('teamGridWrap');
  const toggle = document.getElementById('teamToggle');

  if (teamOpen) {

    wrap.classList.add('open');
    toggle.classList.add('open');

    toggle.setAttribute('aria-label', 'Hide team members');
    toggle.setAttribute('aria-expanded', 'true');

  } else {

    wrap.classList.remove('open');
    toggle.classList.remove('open');

    toggle.setAttribute('aria-label', 'Show team members');
    toggle.setAttribute('aria-expanded', 'false');
  }
}

// ─────────────────────────────
// SCANNER
// ─────────────────────────────

let totalScans = 0;
let safeCount = 0;
let dangerCount = 0;

// Validate URL

function isValidUrl(urlString) {

  try {
    const urlObj = new URL(urlString);
    const hostname = urlObj.hostname;

    // To allow local testing
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return true;
    }

    const parts = hostname.split('.');
    if (parts.length < 2) {
      return false;
    }

    const tld = parts[parts.length - 1];
    // TLD must be at least 2 chars & consist of only letters
    if (tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }

}

// Format & Validate URL

function formatAndValidateUrl(input) {

  if (!input || input.trim() === '') {

    return {
      valid: false,
      error: 'Enter a URL',
      url: null
    };

  }

  let url = input.trim();

  // Auto add HTTPS

  if (
    !url.startsWith('http://') &&
    !url.startsWith('https://')
  ) {
    url = 'https://' + url;
  }

  // Validate URL length
  if (url.length > 2048) {
    return {
      valid: false,
      error: 'URL exceeds maximum length of 2048 characters.',
      url: null
    };
  }

  if (!isValidUrl(url)) {

    return {
      valid: false,
      error: 'Invalid URL format. Please enter a valid website URL.',
      url: null
    };

  }

  try {

    const urlObj = new URL(url);

    if (!urlObj.hostname) {

      return {
        valid: false,
        error: 'URL must include a domain name.',
        url: null
      };

    }

    return {
      valid: true,
      error: null,
      url: url
    };

  } catch (e) {

    return {
      valid: false,
      error: 'Invalid URL. Please check and try again.',
      url: null
    };

  }

}

// Fill Example URL

function fillExample(url) {

  document.getElementById('urlInput').value = url;
  document.getElementById('urlInput').focus();

}

// Update Stats

function updateStats(type) {

  totalScans++;

  if (type === 'safe') {
    safeCount++;
  }

  if (type === 'danger') {
    dangerCount++;
  }

  document.getElementById('totalScans').textContent = totalScans;
  document.getElementById('safeCount').textContent = safeCount;
  document.getElementById('dangerCount').textContent = dangerCount;

}

function calculateRiskScore(url, isThreat) {
  let score = 0;
  const breakdown = [];

  // 1. Existing threat status
  if (isThreat) {
    score += 50;
    breakdown.push({ text: 'Google Safe Browsing flagged as threat', type: 'danger' });
  } else {
    breakdown.push({ text: 'Safe Browsing found no known threats', type: 'safe' });
  }

  // 2. HTTPS usage
  if (url.startsWith('https://')) {
    breakdown.push({ text: 'HTTPS enabled', type: 'safe' });
  } else {
    score += 20;
    breakdown.push({ text: 'Not using HTTPS (Insecure connection)', type: 'warning' });
  }

  // 3. URL length
  if (url.length > 75) {
    score += 15;
    breakdown.push({ text: 'URL length unusually high', type: 'warning' });
  } else {
    breakdown.push({ text: 'Standard URL length', type: 'safe' });
  }

  // 4. Suspicious characters
  const suspiciousChars = /[@!*'<>()]/;
  if (suspiciousChars.test(url)) {
    score += 15;
    breakdown.push({ text: 'Suspicious characters detected', type: 'warning' });
  }

  // 5. IP-based URL
  const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
  if (ipRegex.test(url)) {
    score += 20;
    breakdown.push({ text: 'IP-based domain detected', type: 'danger' });
  }

  // 6. Excessive subdomains
  try {
    const urlObj = new URL(url.startsWith('http') ? url : 'https://' + url);
    const parts = urlObj.hostname.split('.');
    if (parts.length > 3) {
      score += 10;
      breakdown.push({ text: 'Excessive subdomains used', type: 'warning' });
    } else {
      breakdown.push({ text: 'Domain structure appears normal', type: 'safe' });
    }
  } catch (e) {
    score += 20;
    breakdown.push({ text: 'Invalid or complex domain structure', type: 'danger' });
  }

  score = Math.min(100, score);

  let confidence = isThreat ? 99 : 88;
  if (!isThreat && score > 20) confidence -= 12;

  return { score, confidence, breakdown };
}

function showResult(type, title, desc, url, threats) {

  const icons = {
    safe: '✓',
    danger: '✕',
    loading: '',
    error: '!'
  };

  const isThreat = type === 'danger';
  let riskSectionHtml = '';
  let riskData = null;

  if ((type === 'safe' || type === 'danger') && url) {
    riskData = calculateRiskScore(url, isThreat);

    let meterColor = 'var(--accent-1)';
    if (riskData.score > 30) meterColor = '#fbbf24';
    if (riskData.score > 60) meterColor = '#f87171';

    let breakdownHtml = riskData.breakdown.map(item => {
      let icon = '';
      if (item.type === 'safe') icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00ffb4" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
      else if (item.type === 'warning') icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
      else if (item.type === 'danger') icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;

      return `<div class="breakdown-item ${item.type}">${icon} <span>${item.text}</span></div>`;
    }).join('');

    riskSectionHtml = `
      <div class="risk-analysis">
        <div class="risk-header">
          <div class="risk-stat">
            <div class="risk-stat-value" style="color: ${meterColor}"><span id="animated-score">0</span><span class="risk-stat-max">/100</span></div>
            <div class="risk-stat-label">Risk Score</div>
          </div>
          <div class="risk-stat">
            <div class="risk-stat-value"><span id="animated-confidence">0</span>%</div>
            <div class="risk-stat-label">Confidence</div>
          </div>
        </div>
        
        <div class="risk-meter-wrap">
          <div class="risk-meter-bar" style="width: 0%; background-color: ${meterColor};" data-target-width="${riskData.score}%"></div>
        </div>

        <div class="risk-breakdown">
          ${breakdownHtml}
        </div>
      </div>
    `;
  }

  document.getElementById('result').innerHTML = `

    <div class="result-card ${type}">

      <div class="result-icon">

        ${type === 'loading'
      ? '<div class="spinner"></div>'
      : type === 'scan-loading'
        ? ''
        : `<span>${icons[type]}</span>`
    }

      </div>

      <div class="result-body">
        <div class="result-title">${title}</div>
        <div class="result-desc">${desc}</div>
        ${url ? `<div class="result-url">${url}</div>` : ''}
        ${threats && threats.length
      ? `<div class="threat-tags">${threats.map(t =>
        `<span class="threat-tag">${t}</span>`).join('')}</div>`
      : ''}
        ${(type === 'safe' || type === 'danger') ? `
          <div class="export-btns">
            <button onclick="downloadPDF()" class="export-btn export-btn-pdf">⬇ Download PDF</button>
            <button onclick="downloadImage()" class="export-btn export-btn-img">⬇ Download Image</button>
          </div>` : ''}
      </div>
    </div>`;

  if (riskSectionHtml) {
    setTimeout(() => {
      const bar = document.querySelector('.risk-meter-bar');
      if (bar) {
        bar.style.width = bar.getAttribute('data-target-width');
      }

      const scoreEl = document.getElementById('animated-score');
      if (scoreEl && riskData) {
        let start = 0;
        const end = riskData.score;
        const duration = 1200;
        const interval = 20;
        const step = end / (duration / interval) || 0;
        const timer = setInterval(() => {
          start += step;
          if (start >= end) {
            start = end;
            clearInterval(timer);
          }
          scoreEl.textContent = Math.round(start);
        }, interval);
      }

      const confEl = document.getElementById('animated-confidence');
      if (confEl && riskData) {
        let startConf = 0;
        const endConf = riskData.confidence;
        const durationConf = 1200;
        const intervalConf = 20;
        const stepConf = endConf / (durationConf / intervalConf) || 0;
        const timerConf = setInterval(() => {
          startConf += stepConf;
          if (startConf >= endConf) {
            startConf = endConf;
            clearInterval(timerConf);
          }
          confEl.textContent = Math.round(startConf);
        }, intervalConf);
      }
    }, 50);
  }
}

// ─────────────────────────────
// MAIN SECURITY CHECK
// ─────────────────────────────

async function checkSecurity() {

  const input =
    document.getElementById('urlInput').value;

  const validation =
    formatAndValidateUrl(input);

  // Validation failed

  if (!validation.valid) {

    showResult(
      'error',
      'Invalid Input',
      validation.error,
      '',
      []
    );

    return;
  }

  const url = validation.url;

  const typoCard = document.getElementById('typosquattingCard');
  if (typoCard) {
    typoCard.classList.add('hidden');
  }

  const btn =
    document.getElementById('scanBtn');

  btn.disabled = true;

  // Loading State — enhanced scan animation

  document.getElementById('result').innerHTML = `
    <div class="result-card loading">
      <div class="result-body">
        <div class="scan-loading">
          <div class="scan-shield-wrap">
            <div class="scan-shield-ring-outer"></div>
            <div class="scan-shield-ring"></div>
            <div class="scan-shield-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-1)" stroke-width="1.8">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
          </div>
          <div>
            <div class="result-title" style="text-align:center;">Scanning URL...</div>
            <div class="result-url" style="text-align:center;margin-top:8px;">${url}</div>
          </div>
          <div class="scan-progress-wrap">
            <div class="scan-progress-bar">
              <div class="scan-progress-fill"></div>
            </div>
            <div class="scan-status-text">
              <span class="scan-status-step">Checking threat databases...</span>
            </div>
          </div>
        </div>
      </div>
    </div>`;

  // Animate status text steps
  const statusEl = document.querySelector('.scan-status-step');
  const steps = [
    'Connecting to Safe Browsing API...',
    'Analyzing URL patterns...',
    'Checking threat databases...',
    'Finalizing results...'
  ];
  let stepIndex = 0;
  const stepTimer = setInterval(() => {
    stepIndex++;
    if (stepIndex < steps.length && statusEl) {
      statusEl.textContent = steps[stepIndex];
    } else {
      clearInterval(stepTimer);
    }
  }, 800);

  try {
    const apiHost = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:3002'
      : 'https://cybershield-sxz0.onrender.com';
    const response = await fetch(`${apiHost}/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (!response.ok) throw new Error('Server error ' + response.status);
    const data = await response.json();
    if (data.error) throw new Error(data.error);

    if (data.matches && data.matches.length > 0) {
      const allThreats = data.matches.map(m => m.threatType);
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const hasPhishing = allThreats.includes('SOCIAL_ENGINEERING');
      const hasMalware = allThreats.includes('MALWARE');
      const hasUnwanted = allThreats.includes('UNWANTED_SOFTWARE');
      const hasHarmful = allThreats.includes('POTENTIALLY_HARMFUL_APPLICATION');
      const threats = [...new Set(allThreats.map(t => t.replace(/_/g, ' ')))];
      updateStats('danger');
      showResult('danger', 'Threat Detected!',
        `This URL is flagged as dangerous. Do not visit it.<br><br>
        <div class="breakdown">
          <div class="breakdown-item">
            ${isHttps ? '✅' : '⚠️'} <b>HTTPS:</b> ${isHttps ? 'Secure connection' : 'Not secure'}
          </div>
          <div class="breakdown-item">
            ${hasMalware ? '🔴' : '✅'} <b>Malware:</b> ${hasMalware ? 'Detected!' : 'No malware detected'}
          </div>
          <div class="breakdown-item">
            ${hasPhishing ? '🔴' : '✅'} <b>Phishing:</b> ${hasPhishing ? 'Phishing detected!' : 'No phishing detected'}
          </div>
          <div class="breakdown-item">
            ${hasUnwanted ? '🔴' : '✅'} <b>Unwanted Software:</b> ${hasUnwanted ? 'Detected!' : 'None detected'}
          </div>
          <div class="breakdown-item">
            ${hasHarmful ? '🔴' : '✅'} <b>Harmful App:</b> ${hasHarmful ? 'Detected!' : 'None detected'}
          </div>
        </div>`, url, threats);
    } else {
      updateStats('safe');
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const allThreats = data.matches ? data.matches.map(m => m.threatType) : [];
      const hasPhishing = allThreats.includes('SOCIAL_ENGINEERING');
      const hasMalware = allThreats.includes('MALWARE');
      const hasUnwanted = allThreats.includes('UNWANTED_SOFTWARE');
      const hasHarmful = allThreats.includes('POTENTIALLY_HARMFUL_APPLICATION');

      showResult('safe', 'URL is Safe',
        `No threats detected. Google Safe Browsing found no issues.<br><br>
        <div class="breakdown">
          <div class="breakdown-item">
            ${isHttps ? '✅' : '⚠️'} <b>HTTPS:</b> ${isHttps ? 'Secure connection' : 'Not secure — use with caution'}
          </div>
          <div class="breakdown-item">
            ${hasMalware ? '🔴' : '✅'} <b>Malware:</b> ${hasMalware ? 'Detected!' : 'No malware detected'}
          </div>
          <div class="breakdown-item">
            ${hasPhishing ? '🔴' : '✅'} <b>Phishing:</b> ${hasPhishing ? 'Phishing detected!' : 'No phishing detected'}
          </div>
          <div class="breakdown-item">
            ${hasUnwanted ? '🔴' : '✅'} <b>Unwanted Software:</b> ${hasUnwanted ? 'Detected!' : 'None detected'}
          </div>
          <div class="breakdown-item">
            ${hasHarmful ? '🔴' : '✅'} <b>Harmful App:</b> ${hasHarmful ? 'Detected!' : 'None detected'}
          </div>
        </div>`, url, []);
    }

    if (data.typosquatting) {
      const typoCard = document.getElementById('typosquattingCard');
      if (typoCard) {
        typoCard.classList.remove('hidden');
        renderFamilyTree(data.typosquatting);
      }
    }

  } catch (err) {
    showResult('error', 'Scan Error',
      `An unexpected error occurred.<br>
       <small style="color:#334155">Error: ${err.message}</small>`,
      '', []);
  } finally {
    btn.disabled = false;

  }

}

document.getElementById('urlInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') checkSecurity();
});
async function captureReport() {
  const card = document.querySelector('#result .result-card');
  if (!card) return null;

  const reportDiv = document.createElement('div');
  reportDiv.style.cssText = `
    position: fixed; top: -9999px; left: -9999px;
    width: 600px; padding: 32px;
    background: #1e293b; border-radius: 12px;
    font-family: sans-serif; color: #f1f5f9;
  `;
  reportDiv.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <div style="background:#0f766e;width:48px;height:48px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:24px;">🛡️</div>
      <div>
        <div style="font-size:20px;font-weight:700;color:#00ffb4;">CyberShield Report</div>
        <div style="font-size:12px;color:#94a3b8;">${new Date().toLocaleString()}</div>
      </div>
    </div>
    <div style="background:#0f172a;border-radius:8px;padding:16px;margin-bottom:16px;">
      ${card.querySelector('.result-title') ? `<div style="font-size:18px;font-weight:700;color:#00ffb4;margin-bottom:8px;">${card.querySelector('.result-title').innerText}</div>` : ''}
      ${card.querySelector('.result-url') ? `<div style="font-size:13px;color:#94a3b8;margin-bottom:12px;">${card.querySelector('.result-url').innerText}</div>` : ''}
      <div style="font-size:14px;color:#cbd5e1;line-height:1.8;">
        ${card.querySelector('.breakdown') ? card.querySelector('.breakdown').innerText.split('\n').filter(l => l.trim()).map(l => `<div style="padding:4px 0;border-bottom:1px solid #1e293b;">${l}</div>`).join('') : ''}
      </div>
    </div>
    ${card.querySelector('.threat-tags') ? `<div style="margin-top:12px;">${card.querySelector('.threat-tags').innerText.split('\n').map(t => `<span style="background:#7f1d1d;color:#fca5a5;padding:4px 10px;border-radius:20px;font-size:12px;margin-right:6px;">${t}</span>`).join('')}</div>` : ''}
  `;
  document.body.appendChild(reportDiv);
  const canvas = await html2canvas(reportDiv, { scale: 2, backgroundColor: '#1e293b' });
  document.body.removeChild(reportDiv);
  return canvas;
}

async function downloadImage() {
  const canvas = await captureReport();
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = 'cybershield-report.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

async function downloadPDF() {
  const canvas = await captureReport();
  if (!canvas) return;
  const imgData = canvas.toDataURL('image/png');
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const imgHeight = (canvas.height * pageWidth) / canvas.width;
  pdf.addImage(imgData, 'PNG', 0, 20, pageWidth, imgHeight);
  pdf.save('cybershield-report.pdf');
}

// ─────────────────────────────
// TYPOSQUATTING FAMILY TREE
// ─────────────────────────────

function renderFamilyTree(typosquattingData) {
  const container = document.getElementById('treeContainer');
  if (!container) return;

  container.innerHTML = '';

  const original = typosquattingData.original;
  const variants = typosquattingData.variants;

  if (!variants || variants.length === 0) {
    container.innerHTML = '<div style="padding: 40px; text-align: center; color: #94a3b8;">No typosquatting variants generated for this domain.</div>';
    return;
  }

  const categoriesMap = {
    homoglyph: { name: "Homoglyphs", children: [] },
    tld: { name: "TLD Swaps", children: [] },
    substitution: { name: "Substitutions", children: [] },
    hyphen: { name: "Hyphen Injections", children: [] }
  };

  variants.forEach(v => {
    if (categoriesMap[v.category]) {
      categoriesMap[v.category].children.push({
        name: v.domain,
        type: "variant",
        threat: v.threat,
        distance: v.distance,
        category: v.category
      });
    }
  });

  const rootChildren = Object.values(categoriesMap).filter(cat => cat.children.length > 0);

  const rootData = {
    name: original.domain,
    type: "original",
    threat: original.threat,
    children: rootChildren.map(cat => ({
      name: cat.name,
      type: "category",
      children: cat.children
    }))
  };

  const margin = { top: 20, right: 120, bottom: 20, left: 120 };
  const width = container.clientWidth || 800;
  const height = 450;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const svg = d3.select(container)
    .append("svg")
    .attr("width", "100%")
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("overflow", "visible")
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  let i = 0;
  const treemap = d3.tree().size([innerHeight, innerWidth]);

  const root = d3.hierarchy(rootData);
  root.x0 = innerHeight / 2;
  root.y0 = 0;

  let tooltip = document.getElementById("tree-tooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "tree-tooltip";
    tooltip.className = "tree-tooltip";
    tooltip.style.cssText = `
      position: absolute;
      opacity: 0;
      pointer-events: none;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 12px;
      color: #f1f5f9;
      font-size: 0.85rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      z-index: 1000;
      transition: opacity 0.2s ease;
      min-width: 220px;
    `;
    container.appendChild(tooltip);
  }

  function highlightHomoglyphs(domain, originalDomain) {
    let highlightedHtml = '';
    let hasHomoglyphHighlight = false;
    
    for (let idx = 0; idx < domain.length; idx++) {
      const char = domain[idx];
      const code = char.charCodeAt(0);
      
      const isNonAscii = code > 127;
      const isDifferent = originalDomain && originalDomain[idx] !== char;
      
      if (isNonAscii && isDifferent) {
        highlightedHtml += `<span style="color: #f87171; font-weight: bold; text-decoration: underline;" title="Unicode U+${code.toString(16).toUpperCase()}">${char}</span>`;
        hasHomoglyphHighlight = true;
      } else {
        highlightedHtml += char;
      }
    }
    return { html: highlightedHtml, detected: hasHomoglyphHighlight };
  }

  function showTooltip(event, data) {
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left + 15;
    const y = event.clientY - rect.top + 15;

    let threatText = "";
    let threatColor = "";
    let desc = "";

    if (data.type === "original") {
      threatText = data.threat === "malicious" ? "Malicious (Flagged)" : "Safe";
      threatColor = data.threat === "malicious" ? "#ef4444" : "#10b981";
      desc = "The original target domain analyzed by Google Safe Browsing.";
    } else {
      threatText = data.threat === "malicious" ? "Malicious (Flagged)" : "Suspicious Typosquatting Candidate";
      threatColor = data.threat === "malicious" ? "#ef4444" : "#f59e0b";
      
      const catDescriptions = {
        homoglyph: "Visual look-alike representations (IDN homograph attack vector) designed to deceive.",
        tld: "TLD replacement targeting keyboard extensions or common domain mistakes.",
        substitution: "Common keyboard layout substitutions targeting spelling typos.",
        hyphen: "Plausible spacing or prefix hyphen variations."
      };
      desc = catDescriptions[data.category] || "Variant domain variation.";
    }

    let displayName = data.name;
    let homoglyphNote = '';
    if (data.type === "variant" && data.category === "homoglyph") {
      const highlightResult = highlightHomoglyphs(data.name, original.domain);
      if (highlightResult.detected) {
        displayName = highlightResult.html;
        homoglyphNote = `<div style="font-size: 0.75rem; color: #f87171; margin-top: 8px; line-height: 1.3; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px;">⚠️ Underlined character is a look-alike Unicode homoglyph.</div>`;
      }
    }

    tooltip.innerHTML = `
      <div style="font-weight: bold; color: #fff; margin-bottom: 4px; word-break: break-all;">${displayName}</div>
      <div style="margin-bottom: 6px;">
        <span style="font-size: 0.75rem; background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; color: #cbd5e1;">
          ${data.type === "original" ? "Original Target" : "Variant"}
        </span>
      </div>
      <div style="margin-bottom: 6px; font-size: 0.8rem;">
        <b>Threat Level:</b> <span style="color: ${threatColor}; font-weight: bold;">${threatText}</span>
      </div>
      ${data.type !== "original" ? `<div style="margin-bottom: 6px; font-size: 0.8rem;"><b>Edit Distance:</b> Levenshtein ${data.distance}</div>` : ""}
      <div style="font-size: 0.75rem; color: #94a3b8; line-height: 1.4;">${desc}</div>
      ${homoglyphNote}
    `;

    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    tooltip.style.opacity = "1";
  }

  function hideTooltip() {
    tooltip.style.opacity = "0";
  }

  function update(source) {
    const treeData = treemap(root);
    const nodes = treeData.descendants();
    const links = treeData.descendants().slice(1);

    nodes.forEach(d => { d.y = d.depth * 180; });

    const node = svg.selectAll("g.node")
      .data(nodes, d => d.id || (d.id = ++i));

    const nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${source.y0},${source.x0})`)
      .on("click", (event, d) => {
        if (d.data.type === "category") {
          if (d.children) {
            d._children = d.children;
            d.children = null;
          } else {
            d.children = d._children;
            d._children = null;
          }
          update(d);
        }
      });

    nodeEnter.append("circle")
      .attr("class", d => `node-circle ${d.data.threat || ""} ${d.data.type}`)
      .attr("r", d => d.data.type === "original" ? 10 : d.data.type === "category" ? 7 : 5)
      .style("cursor", d => d.data.type === "category" ? "pointer" : "default")
      .style("fill", d => {
        if (d.data.type === "original") return "var(--accent-1)";
        if (d.data.type === "category") return "#94a3b8";
        if (d.data.threat === "malicious") return "#ef4444";
        if (d.data.threat === "suspicious") return "#f59e0b";
        return "#10b981";
      })
      .style("stroke", d => {
        if (d.data.type === "original") return "rgba(0, 255, 180, 0.4)";
        if (d.data.type === "category") return "rgba(255, 255, 255, 0.2)";
        return "none";
      })
      .style("stroke-width", "4px");

    nodeEnter.append("text")
      .attr("dy", ".35em")
      .attr("x", d => d.children || d._children ? -13 : 13)
      .attr("text-anchor", d => d.children || d._children ? "end" : "start")
      .text(d => d.data.name)
      .style("fill", "#f1f5f9")
      .style("font-family", "sans-serif")
      .style("font-size", d => d.data.type === "original" ? "12px" : d.data.type === "category" ? "11px" : "10px")
      .style("font-weight", d => d.data.type === "original" || d.data.type === "category" ? "bold" : "normal")
      .style("pointer-events", "none")
      .style("text-shadow", "0 1px 3px rgba(0,0,0,0.8)");

    const nodeUpdate = nodeEnter.merge(node);

    nodeUpdate.transition()
      .duration(500)
      .attr("transform", d => `translate(${d.y},${d.x})`);

    nodeUpdate.select("circle")
      .attr("r", d => d.data.type === "original" ? 10 : d.data.type === "category" ? 7 : 5)
      .style("fill", d => {
        if (d.data.type === "original") return "var(--accent-1)";
        if (d.data.type === "category") {
          return d._children ? "var(--accent-1)" : "#64748b";
        }
        if (d.data.threat === "malicious") return "#ef4444";
        if (d.data.threat === "suspicious") return "#f59e0b";
        return "#10b981";
      });

    const nodeExit = node.exit().transition()
      .duration(500)
      .attr("transform", d => `translate(${source.y},${source.x})`)
      .remove();

    nodeExit.select("circle").attr("r", 0);
    nodeExit.select("text").style("fill-opacity", 0);

    const link = svg.selectAll("path.link")
      .data(links, d => d.id);

    const linkEnter = link.enter().insert("path", "g")
      .attr("class", "link")
      .attr("d", d => {
        const o = { x: source.x0, y: source.y0 };
        return diagonal(o, o);
      })
      .style("fill", "none")
      .style("stroke", "rgba(148, 163, 184, 0.2)")
      .style("stroke-width", "1.5px");

    const linkUpdate = linkEnter.merge(link);

    linkUpdate.transition()
      .duration(500)
      .attr("d", d => diagonal(d, d.parent))
      .style("stroke", d => {
        if (d.data.threat === "malicious") return "rgba(239, 68, 68, 0.3)";
        if (d.data.threat === "suspicious") return "rgba(245, 158, 11, 0.3)";
        if (d.data.type === "category") return "rgba(148, 163, 184, 0.15)";
        return "rgba(16, 185, 129, 0.3)";
      });

    link.exit().transition()
      .duration(500)
      .attr("d", d => {
        const o = { x: source.x, y: source.y };
        return diagonal(o, o);
      })
      .remove();

    nodes.forEach(d => {
      d.x0 = d.x;
      d.y0 = d.y;
    });

    nodeUpdate
      .filter(d => d.data.type === "variant" || d.data.type === "original")
      .on("mouseover", (event, d) => {
        showTooltip(event, d.data);
      })
      .on("mouseout", () => {
        hideTooltip();
      });
  }

  function diagonal(s, d) {
    return `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`;
  }

  update(root);
}

// ─────────────────────────────
// THEME TOGGLE
// ─────────────────────────────

(function initTheme() {

  const btn = document.getElementById('themeToggle');
  const saved = localStorage.getItem('theme') || 'dark';

  applyTheme(saved);

  if (btn) {
    btn.addEventListener('click', () => {
      const isLight = document.documentElement.classList.contains('light-mode');
      applyTheme(isLight ? 'dark' : 'light');
    });
  }

  function applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
      if (btn) btn.textContent = '☀️';
    } else {
      document.documentElement.classList.remove('light-mode');
      if (btn) btn.textContent = '🌙';
    }
    localStorage.setItem('theme', theme);
  }

})();
