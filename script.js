//  LOADER

window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('loader');
    const main   = document.getElementById('mainPage');
    loader.classList.add('fade-out');
    setTimeout(() => {
      loader.style.display = 'none';
      main.classList.remove('hidden');
    }, 500);
  }, 3200);
});


//  TEAM — collapsible

const team = [
  { name: "Mrinal Roy",    img: "Mrinal.jpg"   },
  { name: "Rahul Sah",     img: "Rahul.jpg"    },
  { name: "Swastika Shaw", img: "Swastika.jpg" },
  { name: "Arpita Roy",    img: "Arpita.jpg"   },
   {name: "Disha Samanta",     img: "Disha.jpg" },
];

(function buildTeam() {
  const grid = document.getElementById('teamGrid');
  grid.innerHTML = team.map(m => {
    const initials = m.name.split(' ').map(w => w[0]).join('');
    return `
      <div class="member-card">
        <div class="member-avatar">
          <img src="${m.img}" alt="${m.name}"
            onerror="this.parentElement.innerHTML='${initials}'">
        </div>
        <div class="member-name">${m.name}</div>
      </div>`;
  }).join('');
})();


let teamOpen = false;

function toggleTeam() {
  teamOpen = !teamOpen;
  const wrap   = document.getElementById('teamGridWrap');
  const toggle = document.getElementById('teamToggle');
  if (teamOpen) {
    wrap.classList.add('open');
    toggle.classList.add('open');
    toggle.setAttribute('aria-label', 'Hide team');
  } else {
    wrap.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-label', 'Show team');
  }
}



//  SCANNER

let totalScans = 0, safeCount = 0, dangerCount = 0;

function fillExample(url) {
  document.getElementById('urlInput').value = url;
  document.getElementById('urlInput').focus();
}

function updateStats(type) {
  totalScans++;
  if (type === 'safe')   safeCount++;
  if (type === 'danger') dangerCount++;
  document.getElementById('totalScans').textContent  = totalScans;
  document.getElementById('safeCount').textContent   = safeCount;
  document.getElementById('dangerCount').textContent = dangerCount;
}

function showResult(type, title, desc, url, threats) {

  const icons = {
    safe: '✓',
    danger: '✕',
    loading: '',
    error: '!'
  };

  // Map result type to human-readable label for screen readers
  const ariaLabels = {
    safe: 'Safe',
    danger: 'Danger',
    error: 'Error',
    loading: 'Loading'
  };

  const isThreat = type === 'danger';
  let riskSectionHtml = '';
  let riskData = null;

  if ((type === 'safe' || type === 'danger') && url) {
    riskData = calculateRiskScore(url, isThreat);

    let riskStatus = 'Safe';
    let meterColor = 'var(--accent-1)';
    if (riskData.score > 30) {
      riskStatus = 'Suspicious';
      meterColor = '#fbbf24';
    }
    if (riskData.score > 60) {
      riskStatus = 'Dangerous';
      meterColor = '#f87171';
    }

    let breakdownHtml = riskData.breakdown.map(item => {
      let icon = '';
      let iconLabel = '';
      if (item.type === 'safe') {
        icon = `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00ffb4" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
        iconLabel = 'Safe';
      } else if (item.type === 'warning') {
        icon = `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
        iconLabel = 'Warning';
      } else if (item.type === 'danger') {
        icon = `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
        iconLabel = 'Danger';
      }

      return `<div class="breakdown-item ${item.type}" role="listitem"><span class="sr-only">${iconLabel}:</span>${icon} <span>${item.text}</span></div>`;
    }).join('');

    riskSectionHtml = `
      <div class="risk-analysis" role="region" aria-label="Risk Analysis">
        <div class="risk-header">
          <div class="risk-stat">
            <div class="risk-stat-value" style="color: ${meterColor}"><span id="animated-score" aria-label="Risk score">0</span><span class="risk-stat-max" aria-hidden="true">/100</span></div>
            <div class="risk-stat-label">Risk Score</div>
          </div>
          <div class="risk-stat">
            <div class="risk-stat-value" style="color: ${meterColor}">${riskStatus}</div>
            <div class="risk-stat-label">Status</div>
          </div>
          <div class="risk-stat">
            <div class="risk-stat-value"><span id="animated-confidence" aria-label="Confidence percentage">0</span>%</div>
            <div class="risk-stat-label">Confidence</div>
          </div>
        </div>

        <div class="risk-meter-wrap" role="progressbar" aria-valuenow="${riskData.score}" aria-valuemin="0" aria-valuemax="100" aria-label="Risk level meter">
          <div class="risk-meter-bar" style="width: 0%; background-color: ${meterColor};" data-target-width="${riskData.score}%"></div>
        </div>

        <div class="risk-breakdown" role="list" aria-label="Risk breakdown details">
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
          : `<span>${icons[type]}</span>`}
      </div>
      <div class="result-body">
        <div class="result-title">${title}</div>
        <div class="result-desc">${desc}</div>
        ${url ? `<div class="result-url">${url}</div>` : ''}
        ${threats && threats.length
          ? `<div class="threat-tags">${threats.map(t =>
              `<span class="threat-tag">${t}</span>`).join('')}</div>`
          : ''}
      </div>
    </div>
    ${riskSectionHtml}`;

  // Move focus to result div so screen readers announce the outcome
  const resultEl = document.getElementById('result');
  resultEl.setAttribute('tabindex', '-1');
  resultEl.focus();

  if (riskSectionHtml) {
    // Append risk section inside result div, after the result card
    resultEl.insertAdjacentHTML('beforeend', riskSectionHtml);

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

async function checkSecurity() {
  const input = document.getElementById('urlInput').value.trim();
  if (!input) {
    showResult('error', 'Enter a URL', 'Please type a URL to scan above.', '', []);
    return;
  }

  let url = input;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  const btn = document.getElementById('scanBtn');
  btn.disabled = true;
  showResult('loading', 'Scanning...', 'Checking against threat databases. Please wait.', url, []);

  try {
    const response = await fetch('https://cybershield-sxz0.onrender.com/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (!response.ok) throw new Error('Server error ' + response.status);
    const data = await response.json();
    if (data.error) throw new Error(data.error);

    if (data.matches && data.matches.length > 0) {
      const threats = [...new Set(data.matches.map(m => m.threatType.replace(/_/g, ' ')))];
      updateStats('danger');
      showResult('danger', 'Threat Detected!',
        'This URL is flagged as dangerous. Do not visit it.', url, threats);
    } else {
      updateStats('safe');
      showResult('safe', 'URL is Safe',
        'No threats detected. Google Safe Browsing found no issues.', url, []);
    }

  } catch (err) {
    showResult('error', 'Backend Not Connected',
      `Make sure your backend server is running.<br>
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

  const riskAnalysisEl = document.querySelector('#result .risk-analysis');
  let riskAnalysisReportHtml = '';
  if (riskAnalysisEl) {
    const scoreVal = riskAnalysisEl.querySelector('#animated-score')?.innerText || '0';
    const statusVal = riskAnalysisEl.querySelectorAll('.risk-stat-value')[1]?.innerText || 'Safe';
    const confVal = riskAnalysisEl.querySelector('#animated-confidence')?.innerText || '0';
    const meterBarEl = riskAnalysisEl.querySelector('.risk-meter-bar');
    const meterColor = meterBarEl ? meterBarEl.style.backgroundColor : '#00ffb4';
    
    riskAnalysisReportHtml = `
      <div style="background:#0f172a;border-radius:8px;padding:16px;margin-bottom:16px;">
        <div style="font-size:16px;font-weight:700;color:#cbd5e1;margin-bottom:12px;">Threat Risk Analysis</div>
        <div style="display:flex;gap:24px;margin-bottom:12px;">
          <div style="flex:1;">
            <div style="font-weight:700;font-size:20px;color:${meterColor};">${scoreVal}/100</div>
            <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;margin-top:2px;">Risk Score</div>
          </div>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:20px;color:${meterColor};">${statusVal}</div>
            <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;margin-top:2px;">Status</div>
          </div>
          <div style="flex:1;">
            <div style="font-weight:700;font-size:20px;color:#cbd5e1;">${confVal}%</div>
            <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;margin-top:2px;">Confidence</div>
          </div>
        </div>
      </div>
    `;
  }

  const reportDiv = document.createElement('div');
  reportDiv.style.cssText = `
    position: fixed; top: -9999px; left: -9999px;
    width: 600px; padding: 32px;
    background: #1e293b; border-radius: 12px;
    font-family: sans-serif; color: #f1f5f9;
  `;
  reportDiv.setAttribute('aria-hidden', 'true');
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
    ${riskAnalysisReportHtml}
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
// DOMAIN REPUTATION
// ─────────────────────────────

async function showDomainReputation(url) {
  const resultEl = document.getElementById('result');

  // Remove existing domain card
  const existing = resultEl.querySelector('.domain-card');
  if (existing) existing.remove();

  // Placeholder while loading
  const placeholder = document.createElement('div');
  placeholder.className = 'domain-card loading-domain';
  placeholder.innerHTML = `<div class="domain-loading">🔍 Looking up domain info...</div>`;
  resultEl.insertAdjacentElement('beforeend', placeholder);

  try {
    const apiHost = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:3000'
      : 'https://cybershield-sxz0.onrender.com';

    const response = await fetch(`${apiHost}/domain-info?domain=${encodeURIComponent(url)}`);
    const data = await response.json();

    if (data.error) throw new Error(data.error);

    const trustColor = data.trustScore >= 70 ? '#00ffb4' : data.trustScore >= 40 ? '#fbbf24' : '#f87171';
    const trustLabel = data.trustScore >= 70 ? 'Trusted' : data.trustScore >= 40 ? 'Moderate' : 'Low Trust';

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A';

    placeholder.outerHTML = `
      <div class="domain-card" role="region" aria-label="Domain Reputation">
        <div class="domain-header">
          <span class="domain-header-icon" aria-hidden="true">🌐</span>
          <span class="domain-header-title">Domain Reputation</span>
          <span class="domain-trust-badge" style="color: ${trustColor}; border-color: ${trustColor};">
            ${trustLabel} · ${data.trustScore}/100
          </span>
        </div>
        <div class="domain-grid">
          <div class="domain-stat">
            <div class="domain-stat-label">Domain</div>
            <div class="domain-stat-value">${data.domain}</div>
          </div>
          <div class="domain-stat">
            <div class="domain-stat-label">Age</div>
            <div class="domain-stat-value">${data.ageYears !== null ? data.ageYears + ' years' : 'N/A'}</div>
          </div>
          <div class="domain-stat">
            <div class="domain-stat-label">Registered</div>
            <div class="domain-stat-value">${formatDate(data.registered)}</div>
          </div>
          <div class="domain-stat">
            <div class="domain-stat-label">Expires</div>
            <div class="domain-stat-value">${formatDate(data.expiry)}</div>
          </div>
          <div class="domain-stat">
            <div class="domain-stat-label">Registrar</div>
            <div class="domain-stat-value">${data.registrar || 'N/A'}</div>
          </div>
          <div class="domain-stat">
            <div class="domain-stat-label">Nameservers</div>
            <div class="domain-stat-value">${data.nameservers.length ? data.nameservers.join(', ') : 'N/A'}</div>
          </div>
        </div>
        ${data.status.length ? `
        <div class="domain-status">
          ${data.status.map(s => `<span class="domain-status-tag">${s}</span>`).join('')}
        </div>` : ''}
      </div>
    `;

  } catch (err) {
    placeholder.outerHTML = `
      <div class="domain-card domain-error" role="region" aria-label="Domain Reputation">
        <div class="domain-header">
          <span aria-hidden="true">🌐</span>
          <span class="domain-header-title">Domain Reputation</span>
        </div>
        <p class="domain-error-msg">Could not fetch domain info: ${err.message}</p>
      </div>
    `;
  }
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
      if (btn) {
        btn.textContent = '☀️';
        btn.setAttribute('aria-label', 'Switch to dark mode');
        btn.setAttribute('aria-pressed', 'false');
      }
    } else {
      document.documentElement.classList.remove('light-mode');
      if (btn) {
        btn.textContent = '🌙';
        btn.setAttribute('aria-label', 'Switch to light mode');
        btn.setAttribute('aria-pressed', 'true');
      }
    }
    localStorage.setItem('theme', theme);
  }

})();
