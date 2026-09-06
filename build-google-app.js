const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const publicDir = path.join(baseDir, 'public');
const imgDir = path.join(publicDir, 'images');
const brandsJson = fs.readFileSync(path.join(baseDir, 'data', 'brands.json'), 'utf8');
const css = fs.readFileSync(path.join(publicDir, 'style.css'), 'utf8');
let html = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
let js = fs.readFileSync(path.join(publicDir, 'app.js'), 'utf8');

// Base64 Logo
const logoBuffer = fs.readFileSync(path.join(publicDir, 'logo.png'));
const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;

// Replace logo img src with base64
html = html.replace('src="logo.png"', `src="${logoBase64}"`);
html = html.replace('src="logo.png"', `src="${logoBase64}"`);

// Replace all images in html with base64
const imgFiles = [
  'the-ordinary-cerave',
  'rare-beauty-summer-fridays',
  'sol-de-janeiro-ariana',
  'olaplex-k18',
  'beauty-circles',
  'skincare-serums',
  'eyeshadow-palette',
  'silk-intimates',
  'lingerie-mens',
  'haircare-body',
];

imgFiles.forEach(name => {
  const jpgPath = path.join(imgDir, `${name}.jpg`);
  if (fs.existsSync(jpgPath)) {
    const b64 = `data:image/jpeg;base64,${fs.readFileSync(jpgPath).toString('base64')}`;
    html = html.split(`images/${name}.png`).join(b64);
    html = html.split(`images/${name}.jpg`).join(b64);
  }
});

// Replace stylesheet link with inline CSS
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + css + '\n</style>');

// Modify js to load embedded catalog directly
js = js.replace(
  `try {
      const res = await fetch('/api/brands');
      const data = await res.json();
      if (data.success && data.categories) {
        categoriesData = data.categories;
        renderBrands();
      }
    } catch (e) {
      console.warn('Network error loading brands:', e);
    }`,
  `categoriesData = ${brandsJson};
    renderBrands();`
);

// Modify js submit function to support google.script.run
js = js.replace(
  `try {
        await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn('Saved offline:', err);
      }

      showSuccess(payload);`,
  `if (window.google && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function() {
            showSuccess(payload);
          })
          .withFailureHandler(function(err) {
            alert('Error saving submission: ' + err);
            submitWishlistBtn.disabled = false;
            submitWishlistBtn.querySelector('.btn-caption').textContent = 'Submit My Wishlist';
          })
          .submitDemand(payload);
      } else {
        try {
          await fetch('/api/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } catch(e) {}
        showSuccess(payload);
      }`
);

// Replace script tag with inline JS
html = html.replace('<script src="app.js"></script>', '<script>\n' + js + '\n</script>');

// Save to google-sheet-app/Index.html
const destPath = path.join(baseDir, 'google-sheet-app', 'Index.html');
fs.writeFileSync(destPath, html, 'utf8');
console.log('✅ All-in-one Google Sheet Index.html built! Size:', (html.length / 1024).toFixed(1), 'KB');
