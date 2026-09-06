const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PIN = process.env.ADMIN_PIN || 'ady2026';

// Environment & Paths
const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = path.join(__dirname, 'data');
const TMP_DATA_DIR = isVercel ? path.join('/tmp', 'data') : DATA_DIR;
const BRANDS_FILE = path.join(DATA_DIR, 'brands.json');
const RESPONSES_FILE = path.join(TMP_DATA_DIR, 'responses.json');
const SETTINGS_FILE = path.join(TMP_DATA_DIR, 'settings.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data folder and files exist safely
try {
  if (!fs.existsSync(TMP_DATA_DIR)) {
    fs.mkdirSync(TMP_DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(RESPONSES_FILE)) {
    fs.writeFileSync(RESPONSES_FILE, '[]', 'utf8');
  }
  if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ googleSheetWebhook: '' }, null, 2), 'utf8');
  }
} catch (err) {
  console.warn('Filesystem init notice:', err.message);
}

// Helpers
function readJson(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
    return defaultValue;
  }
}

function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err.message);
    return false;
  }
}

// Routes
// 1. Get Brands & Categories Catalog
app.get('/api/brands', (req, res) => {
  const brands = readJson(BRANDS_FILE, []);
  res.json({ success: true, categories: brands });
});

// 2. Submit Demand / Wishlist Response
app.post('/api/submit', async (req, res) => {
  try {
    const {
      respondentName,
      contactInfo,
      selectedCategories = [],
      selectedBrands = [],
      shoppingFrequency,
      customRequests,
    } = req.body;

    if (!selectedBrands || selectedBrands.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please select at least one brand you are interested in.',
      });
    }

    const responses = readJson(RESPONSES_FILE, []);
    const newSubmission = {
      id: 'ADY-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 5).toUpperCase(),
      createdAt: new Date().toISOString(),
      respondentName: (respondentName || '').trim() || 'Anonymous VIP',
      contactInfo: (contactInfo || '').trim() || 'N/A',
      selectedCategories: Array.isArray(selectedCategories) ? selectedCategories : [],
      selectedBrands: Array.isArray(selectedBrands) ? selectedBrands : [],
      shoppingFrequency: shoppingFrequency || 'Not specified',
      customRequests: (customRequests || '').trim() || '',
    };

    responses.push(newSubmission);
    writeJson(RESPONSES_FILE, responses);

    // Optional background webhook sync to Google Sheets if configured
    const settings = readJson(SETTINGS_FILE, { googleSheetWebhook: '' });
    if (settings.googleSheetWebhook) {
      triggerGoogleSheetWebhook(settings.googleSheetWebhook, newSubmission).catch(err => {
        console.warn('Google Sheet Webhook notification failed:', err.message);
      });
    }

    res.json({
      success: true,
      id: newSubmission.id,
      message: 'Thank you! Your preferences have been added to our USA & Canada drop queue.',
    });
  } catch (err) {
    console.error('Submission error:', err);
    res.status(500).json({ success: false, error: 'Failed to record response. Please try again.' });
  }
});

// 3. Admin Authentication & Dashboard Stats
app.get('/api/admin/stats', (req, res) => {
  const pin = req.query.pin || req.headers['x-admin-pin'];
  if (pin !== ADMIN_PIN) {
    return res.status(401).json({ success: false, error: 'Invalid Admin PIN' });
  }

  const responses = readJson(RESPONSES_FILE, []);
  const brandsCatalog = readJson(BRANDS_FILE, []);

  // Compute stats
  const totalResponses = responses.length;
  const brandVotes = {};
  const categoryVotes = {};
  let totalBrandPicks = 0;
  let vipLeadsCount = 0;

  // Initialize category counters
  brandsCatalog.forEach(cat => {
    categoryVotes[cat.id] = { name: cat.name, icon: cat.icon, count: 0 };
  });

  responses.forEach(r => {
    if (r.contactInfo && r.contactInfo !== 'N/A') {
      vipLeadsCount++;
    }

    (r.selectedCategories || []).forEach(catId => {
      if (categoryVotes[catId]) {
        categoryVotes[catId].count++;
      }
    });

    (r.selectedBrands || []).forEach(brandItem => {
      const brandName = typeof brandItem === 'string' ? brandItem : brandItem.name;
      const categoryId = typeof brandItem === 'object' ? brandItem.category : 'other';

      brandVotes[brandName] = (brandVotes[brandName] || 0) + 1;
      totalBrandPicks++;

      // If categoryVotes has this category, increment
      if (categoryVotes[categoryId]) {
        categoryVotes[categoryId].count++;
      }
    });
  });

  // Top brands ranking
  const topBrands = Object.entries(brandVotes)
    .map(([brand, count]) => ({
      brand,
      count,
      percentage: totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Recent wishlists with text
  const recentCustomRequests = responses
    .filter(r => r.customRequests && r.customRequests.trim().length > 0)
    .map(r => ({
      name: r.respondentName,
      contact: r.contactInfo,
      request: r.customRequests,
      date: r.createdAt,
    }))
    .reverse();

  const settings = readJson(SETTINGS_FILE, { googleSheetWebhook: '' });

  res.json({
    success: true,
    stats: {
      totalResponses,
      totalBrandPicks,
      vipLeadsCount,
      topBrands,
      categoryVotes: Object.values(categoryVotes),
      recentCustomRequests,
      webhookConfigured: Boolean(settings.googleSheetWebhook),
      recentSubmissions: [...responses].reverse(),
    },
  });
});

// 4. Admin Export to CSV / Excel
app.get('/api/admin/export-csv', (req, res) => {
  const pin = req.query.pin;
  if (pin !== ADMIN_PIN) {
    return res.status(401).send('Unauthorized. Invalid PIN.');
  }

  const responses = readJson(RESPONSES_FILE, []);

  // CSV Headers
  const headers = [
    'Submission ID',
    'Date & Time (UTC)',
    'Respondent Name',
    'Contact / VIP Info',
    'Shopping Frequency',
    'Categories Selected',
    'Total Brands Chosen',
    'Selected Brands',
    'Custom Wishlist / Special Requests',
  ];

  const escapeCsv = val => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = responses.map(r => {
    const brandsList = (r.selectedBrands || [])
      .map(b => (typeof b === 'string' ? b : b.name))
      .join('; ');

    const categoriesList = (r.selectedCategories || []).join('; ');

    return [
      escapeCsv(r.id),
      escapeCsv(r.createdAt ? new Date(r.createdAt).toLocaleString() : ''),
      escapeCsv(r.respondentName),
      escapeCsv(r.contactInfo),
      escapeCsv(r.shoppingFrequency),
      escapeCsv(categoriesList),
      r.selectedBrands ? r.selectedBrands.length : 0,
      escapeCsv(brandsList),
      escapeCsv(r.customRequests),
    ].join(',');
  });

  // Include UTF-8 BOM so Excel opens it with correct character encoding
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const filename = `Ady_Select_Demand_Assessment_${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(csvContent);
});

// 5. Admin Webhook Settings Save / Update
app.post('/api/admin/settings', (req, res) => {
  const pin = req.query.pin || req.headers['x-admin-pin'];
  if (pin !== ADMIN_PIN) {
    return res.status(401).json({ success: false, error: 'Invalid PIN' });
  }

  const { googleSheetWebhook } = req.body;
  const settings = {
    googleSheetWebhook: (googleSheetWebhook || '').trim(),
    updatedAt: new Date().toISOString(),
  };

  writeJson(SETTINGS_FILE, settings);
  res.json({ success: true, message: 'Settings saved successfully' });
});

// 6. Admin Delete Single Response
app.delete('/api/admin/response/:id', (req, res) => {
  const pin = req.query.pin || req.headers['x-admin-pin'];
  if (pin !== ADMIN_PIN) {
    return res.status(401).json({ success: false, error: 'Invalid PIN' });
  }

  let responses = readJson(RESPONSES_FILE, []);
  responses = responses.filter(r => r.id !== req.params.id);
  writeJson(RESPONSES_FILE, responses);

  res.json({ success: true, message: 'Response removed.' });
});

// Helper for Google Sheets Webhook
async function triggerGoogleSheetWebhook(webhookUrl, submission) {
  try {
    const brandsList = (submission.selectedBrands || [])
      .map(b => (typeof b === 'string' ? b : b.name))
      .join(', ');

    const payload = {
      id: submission.id,
      timestamp: submission.createdAt,
      name: submission.respondentName,
      contact: submission.contactInfo,
      categories: (submission.selectedCategories || []).join(', '),
      brands: brandsList,
      brandCount: submission.selectedBrands ? submission.selectedBrands.length : 0,
      frequency: submission.shoppingFrequency,
      customRequests: submission.customRequests,
    };

    // Node 18+ built-in fetch
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.warn('Webhook delivery error:', e.message);
  }
}

// Redirect /admin to admin.html
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Catch-all
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server locally (if not running in Vercel serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`✨ ADY SELECT Demand Assessment Server running at: http://localhost:${PORT}`);
    console.log(`📊 Admin Portal available at: http://localhost:${PORT}/admin (PIN: ${ADMIN_PIN})`);
  });
}

// Export Express app for Vercel Serverless Function
module.exports = app;

