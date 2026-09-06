// ADY SELECT — Admin Dashboard & Export Controller

document.addEventListener('DOMContentLoaded', () => {
  let adminPin = sessionStorage.getItem('ady_admin_pin') || '';
  let dashboardData = null;

  // DOM Elements
  const pinGateModal = document.getElementById('pinGateModal');
  const adminContent = document.getElementById('adminContent');
  const pinForm = document.getElementById('pinForm');
  const adminPinInput = document.getElementById('adminPinInput');
  const pinError = document.getElementById('pinError');
  const logoutBtn = document.getElementById('logoutBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const copySummaryBtn = document.getElementById('copySummaryBtn');

  // Metrics
  const metricTotalResponses = document.getElementById('metricTotalResponses');
  const metricTotalVotes = document.getElementById('metricTotalVotes');
  const metricVipLeads = document.getElementById('metricVipLeads');
  const metricTopBrand = document.getElementById('metricTopBrand');

  // Lists
  const rankingsContainer = document.getElementById('rankingsContainer');
  const categoryBarsContainer = document.getElementById('categoryBarsContainer');
  const requestsContainer = document.getElementById('requestsContainer');
  const responsesTableBody = document.getElementById('responsesTableBody');
  const tableSearchInput = document.getElementById('tableSearchInput');

  // Webhook
  const webhookForm = document.getElementById('webhookForm');
  const webhookUrlInput = document.getElementById('webhookUrlInput');
  const webhookStatus = document.getElementById('webhookStatus');

  // Check stored PIN
  if (adminPin) {
    loadDashboard(adminPin);
  }

  // PIN Form Submit
  pinForm.addEventListener('submit', async e => {
    e.preventDefault();
    const pin = adminPinInput.value.trim();
    if (!pin) return;

    const ok = await loadDashboard(pin);
    if (!ok) {
      pinError.style.display = 'block';
      adminPinInput.value = '';
      adminPinInput.focus();
    }
  });

  // Logout
  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('ady_admin_pin');
    adminPin = '';
    adminContent.style.display = 'none';
    pinGateModal.style.display = 'flex';
    adminPinInput.value = '';
    pinError.style.display = 'none';
  });

  // Export CSV
  exportCsvBtn.addEventListener('click', () => {
    if (!adminPin) return;
    window.location.href = `/api/admin/export-csv?pin=${encodeURIComponent(adminPin)}`;
  });

  // Copy Summary for WhatsApp / Notes
  copySummaryBtn.addEventListener('click', () => {
    if (!dashboardData || !dashboardData.topBrands || dashboardData.topBrands.length === 0) {
      alert('No votes recorded yet to summarize.');
      return;
    }

    const top10 = dashboardData.topBrands.slice(0, 10);
    const textLines = [
      '✨ *ADY SELECT — CUSTOMER DEMAND TOP 10 BRANDS*',
      `📊 Total Responses: ${dashboardData.totalResponses} | Total Brand Votes: ${dashboardData.totalBrandPicks}`,
      '',
    ];

    top10.forEach((item, index) => {
      textLines.push(`${index + 1}. *${item.brand}* — ${item.count} votes (${item.percentage}%)`);
    });

    textLines.push('');
    textLines.push('📦 Prioritize these brands for the upcoming USA & Canada shipment.');

    navigator.clipboard.writeText(textLines.join('\n')).then(() => {
      alert('Copied Top 10 Summary to clipboard! You can paste it directly into WhatsApp or Notes.');
    });
  });

  // Table Search Filter
  tableSearchInput.addEventListener('input', () => {
    if (dashboardData && dashboardData.recentSubmissions) {
      renderTable(dashboardData.recentSubmissions, tableSearchInput.value);
    }
  });

  // Webhook Form Save
  webhookForm.addEventListener('submit', async e => {
    e.preventDefault();
    const url = webhookUrlInput.value.trim();
    try {
      const res = await fetch(`/api/admin/settings?pin=${encodeURIComponent(adminPin)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleSheetWebhook: url }),
      });
      const data = await res.json();
      if (data.success) {
        webhookStatus.textContent = '✅ Webhook URL saved successfully!';
        webhookStatus.style.color = '#2E7D32';
      } else {
        webhookStatus.textContent = '❌ Failed to save webhook.';
        webhookStatus.style.color = '#C0392B';
      }
    } catch (err) {
      webhookStatus.textContent = '❌ Connection error.';
      webhookStatus.style.color = '#C0392B';
    }
  });

  // Load Dashboard Data
  async function loadDashboard(pin) {
    try {
      const res = await fetch(`/api/admin/stats?pin=${encodeURIComponent(pin)}`);
      if (res.status === 401) return false;

      const result = await res.json();
      if (!result.success) return false;

      // Authenticated successfully
      adminPin = pin;
      sessionStorage.setItem('ady_admin_pin', pin);
      dashboardData = result.stats;

      pinGateModal.style.display = 'none';
      adminContent.style.display = 'block';

      renderDashboard(result.stats);
      return true;
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      return false;
    }
  }

  function renderDashboard(stats) {
    // 1. Metrics
    metricTotalResponses.textContent = stats.totalResponses;
    metricTotalVotes.textContent = stats.totalBrandPicks;
    metricVipLeads.textContent = stats.vipLeadsCount;

    if (stats.topBrands && stats.topBrands.length > 0) {
      metricTopBrand.textContent = stats.topBrands[0].brand;
    } else {
      metricTopBrand.textContent = '—';
    }

    // 2. Rankings Leaderboard
    renderRankings(stats.topBrands, stats.totalResponses);

    // 3. Category Bars
    renderCategories(stats.categoryVotes, stats.totalBrandPicks);

    // 4. Custom Requests
    renderRequests(stats.recentCustomRequests);

    // 5. Responses Table
    renderTable(stats.recentSubmissions, '');
  }

  function renderRankings(topBrands, totalResponses) {
    rankingsContainer.innerHTML = '';
    if (!topBrands || topBrands.length === 0) {
      rankingsContainer.innerHTML = `<div class="empty-state">No brand votes recorded yet.</div>`;
      return;
    }

    const maxCount = topBrands[0].count || 1;

    topBrands.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'ranking-item';

      const barWidth = Math.round((item.count / maxCount) * 100);

      row.innerHTML = `
        <div class="rank-badge">${index + 1}</div>
        <div class="rank-info">
          <div class="rank-top-line">
            <span class="rank-brand">${escapeHtml(item.brand)}</span>
            <span class="rank-votes"><strong>${item.count}</strong> votes (${item.percentage}%)</span>
          </div>
          <div class="rank-bar-track">
            <div class="rank-bar-fill" style="width: ${barWidth}%;"></div>
          </div>
        </div>
      `;

      rankingsContainer.appendChild(row);
    });
  }

  function renderCategories(categoryVotes, totalVotes) {
    categoryBarsContainer.innerHTML = '';
    if (!categoryVotes || categoryVotes.length === 0) {
      categoryBarsContainer.innerHTML = `<div class="empty-state">No category data.</div>`;
      return;
    }

    const sortedCats = [...categoryVotes].sort((a, b) => b.count - a.count);
    const maxCat = sortedCats[0].count || 1;

    sortedCats.forEach(cat => {
      const item = document.createElement('div');
      item.className = 'cat-bar-item';

      const width = Math.round((cat.count / maxCat) * 100);

      item.innerHTML = `
        <div class="cat-bar-name" title="${cat.name}">${cat.icon || '📦'} ${cat.name}</div>
        <div class="cat-bar-track">
          <div class="cat-bar-fill" style="width: ${width}%;"></div>
        </div>
        <div class="cat-bar-count">${cat.count}</div>
      `;

      categoryBarsContainer.appendChild(item);
    });
  }

  function renderRequests(requests) {
    requestsContainer.innerHTML = '';
    if (!requests || requests.length === 0) {
      requestsContainer.innerHTML = `<div class="empty-state">No specific product requests yet.</div>`;
      return;
    }

    requests.forEach(req => {
      const card = document.createElement('div');
      card.className = 'request-card';
      const dateStr = req.date ? new Date(req.date).toLocaleDateString() : '';

      card.innerHTML = `
        <div class="request-text">"${escapeHtml(req.request)}"</div>
        <div class="request-meta">From: <strong>${escapeHtml(req.name)}</strong> (${escapeHtml(req.contact)}) • ${dateStr}</div>
      `;

      requestsContainer.appendChild(card);
    });
  }

  function renderTable(submissions, searchFilter) {
    responsesTableBody.innerHTML = '';
    const query = (searchFilter || '').toLowerCase().trim();

    const filtered = (submissions || []).filter(sub => {
      if (!query) return true;
      const name = (sub.respondentName || '').toLowerCase();
      const contact = (sub.contactInfo || '').toLowerCase();
      const custom = (sub.customRequests || '').toLowerCase();
      const brands = (sub.selectedBrands || []).map(b => (typeof b === 'string' ? b : b.name).toLowerCase()).join(' ');
      return name.includes(query) || contact.includes(query) || custom.includes(query) || brands.includes(query);
    });

    if (filtered.length === 0) {
      responsesTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="table-empty">No matching submissions found.</td>
        </tr>
      `;
      return;
    }

    filtered.forEach(sub => {
      const tr = document.createElement('tr');
      const dateStr = sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() + ' ' + new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

      const brandsHtml = (sub.selectedBrands || [])
        .map(b => `<span class="table-tag">${escapeHtml(typeof b === 'string' ? b : b.name)}</span>`)
        .join('');

      tr.innerHTML = `
        <td style="white-space: nowrap; color: var(--text-muted);">${dateStr}</td>
        <td><strong>${escapeHtml(sub.respondentName)}</strong></td>
        <td><code>${escapeHtml(sub.contactInfo)}</code></td>
        <td><span style="font-size: 0.78rem;">${escapeHtml(sub.shoppingFrequency)}</span></td>
        <td style="max-width: 320px;">${brandsHtml}</td>
        <td style="max-width: 220px; font-style: italic;">${escapeHtml(sub.customRequests || '—')}</td>
        <td>
          <button type="button" class="btn-delete-row" title="Delete submission" data-id="${sub.id}">🗑️</button>
        </td>
      `;

      const deleteBtn = tr.querySelector('.btn-delete-row');
      deleteBtn.addEventListener('click', () => {
        if (confirm(`Delete response from ${sub.respondentName}?`)) {
          deleteResponse(sub.id);
        }
      });

      responsesTableBody.appendChild(tr);
    });
  }

  async function deleteResponse(id) {
    try {
      const res = await fetch(`/api/admin/response/${encodeURIComponent(id)}?pin=${encodeURIComponent(adminPin)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        loadDashboard(adminPin);
      }
    } catch (e) {
      alert('Failed to delete response.');
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }
});
