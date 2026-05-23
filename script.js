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
    toggle.setAttribute('aria-label', 'Hide team members');
    toggle.setAttribute('aria-expanded', 'true');
  } else {
    wrap.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-label', 'Show team members');
    toggle.setAttribute('aria-expanded', 'false');
  }
}



//  SCANNER

let totalScans = 0, safeCount = 0, dangerCount = 0;

function isValidUrl(urlString) {
  try {
    new URL(urlString);
    return true;
  } catch (e) {
    return false;
  }
}

function formatAndValidateUrl(input) {
  if (!input || input.trim() === '') {
    return { valid: false, error: 'Enter a URL', url: null };
  }

  let url = input.trim();

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  if (!isValidUrl(url)) {
    return { valid: false, error: 'Invalid URL format. Please enter a valid website URL.', url: null };
  }

  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname) {
      return { valid: false, error: 'URL must include a domain name.', url: null };
    }
    return { valid: true, error: null, url: url };
  } catch (e) {
    return { valid: false, error: 'Invalid URL. Please check and try again.', url: null };
  }
}

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
  const icons = { safe: '✓', danger: '✕', loading: '', error: '!' };
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
        ${(type === 'safe' || type === 'danger') ? `
          <div class="export-btns" style="display:flex;gap:10px;margin-top:16px;">
            <button onclick="downloadPDF()" style="padding:10px 20px;cursor:pointer;border-radius:8px;border:none;background:#00ffb4;color:#0f172a;font-size:13px;font-weight:600;">⬇ Download PDF</button>
            <button onclick="downloadImage()" style="padding:10px 20px;cursor:pointer;border-radius:8px;border:none;background:#3b82f6;color:#ffffff;font-size:13px;font-weight:600;">⬇ Download Image</button>
          </div>` : ''}
      </div>
    </div>`;
}

async function checkSecurity() {
  const input = document.getElementById('urlInput').value;
  const validation = formatAndValidateUrl(input);

  if (!validation.valid) {
    showResult('error', 'Invalid Input', validation.error, '', []);
    return;
  }

  const url = validation.url;
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