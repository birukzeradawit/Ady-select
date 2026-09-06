/**
 * =======================================================================
 * ADY SELECT — 100% FREE GOOGLE-HOSTED WEB APP & SPREADSHEET
 * =======================================================================
 * 
 * How to get your live public link in 2 minutes:
 * 1. Go to https://sheets.new to open a fresh, private Google Sheet.
 * 2. Rename your spreadsheet (e.g. "ADY SELECT Demand Assessment").
 * 3. In the top menu, click: Extensions > Apps Script.
 * 4. Replace everything in "Code.gs" with this file's contents.
 * 5. In Apps Script, click the "+" next to Files > Select "HTML" > Name it: Index
 * 6. Copy and paste the contents of "Index.html" into that new file and Save.
 * 7. In the top right corner, click: Deploy > New deployment.
 * 8. Click the gear icon (Select type) > Choose "Web app".
 * 9. Set:
 *    - Description: "Ady Select Live Poll"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"   <-- (CRITICAL so anyone with your link can vote!)
 * 10. Click "Deploy", authorize Google permissions if asked, and COPY YOUR WEB APP URL!
 * 
 * 🎉 That URL is your permanent, live public link! Send it to anyone on WhatsApp, Instagram, iMessage, etc.
 * Every vote will instantly appear in your Google Sheet!
 * =======================================================================
 */

function doGet(e) {
  var template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
    .setTitle('ADY SELECT | Curate Our USA & Canada Drop')
    .setFaviconUrl('https://img.icons8.com/color/96/diamond.png')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function submitDemand(data) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Set headers on first run if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp",
        "Submission ID",
        "Customer Name",
        "VIP Contact (IG / WhatsApp)",
        "Shopping Frequency",
        "Categories Selected",
        "Total Brands Chosen",
        "Selected Brands List",
        "Custom Wishlist / Special Requests"
      ]);
      
      var headerRange = sheet.getRange(1, 1, 1, 9);
      headerRange.setBackground("#23201F");
      headerRange.setFontColor("#FFFFFF");
      headerRange.setFontWeight("bold");
      headerRange.setFontSize(10);
      headerRange.setWrap(true);
      sheet.setFrozenRows(1);
    }
    
    var brandsList = (data.selectedBrands || []).map(function(b) {
      return typeof b === 'string' ? b : b.name;
    }).join(', ');
    
    var categoriesList = (data.selectedCategories || []).join(', ');
    
    sheet.appendRow([
      new Date().toLocaleString(),
      "ADY-" + Date.now().toString(36).toUpperCase(),
      data.respondentName || "Anonymous VIP",
      data.contactInfo || "N/A",
      data.shoppingFrequency || "Not specified",
      categoriesList,
      (data.selectedBrands || []).length,
      brandsList,
      data.customRequests || ""
    ]);
    
    // Auto-fit columns
    sheet.autoResizeColumns(1, 9);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
