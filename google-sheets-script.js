/**
 * =======================================================================
 * ADY SELECT — GOOGLE SHEETS LIVE SYNC SCRIPT
 * =======================================================================
 * 
 * Instructions:
 * 1. Open Google Sheets at https://sheets.new
 * 2. In the top menu, click: Extensions > Apps Script
 * 3. Delete any code in the editor, paste this entire script, and click Save (disk icon).
 * 4. In the top right, click Deploy > New deployment
 * 5. Select type: "Web app" (click the gear icon > Web app if needed)
 * 6. Set Description: "Ady Select Demand Webhook"
 * 7. Set "Execute as": "Me"
 * 8. Set "Who has access": "Anyone"  <-- CRITICAL!
 * 9. Click Deploy, authorize permissions if prompted, and copy the Web App URL.
 * 10. In your Ady Select Admin Portal (http://localhost:3000/admin), paste the URL in the 
 *     "Connect to Google Sheets" box and click Save!
 * =======================================================================
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Set headers on first run if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp",
        "Submission ID",
        "Customer Name",
        "VIP Contact (IG/WhatsApp)",
        "Shopping Frequency",
        "Categories",
        "Brands Count",
        "Brands Selected",
        "Custom Wishlist / Special Requests"
      ]);
      
      // Style header row
      var headerRange = sheet.getRange(1, 1, 1, 9);
      headerRange.setBackground("#23201F");
      headerRange.setFontColor("#FFFFFF");
      headerRange.setFontWeight("bold");
      sheet.setFrozenRows(1);
    }
    
    // Append the submission row
    sheet.appendRow([
      new Date().toLocaleString(),
      data.id || "",
      data.name || "Anonymous VIP",
      data.contact || "N/A",
      data.frequency || "Not specified",
      data.categories || "",
      data.brandCount || 0,
      data.brands || "",
      data.customRequests || ""
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ "status": "success" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput("ADY SELECT Webhook is active and listening.");
}
