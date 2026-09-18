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
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    
    // Remove header row if it exists
    if (data.length > 0 && data[0][0] === "Timestamp") {
      data = data.slice(1);
    }
    
    // Convert sheet data to JSON format matching the responses.json structure
    var responses = data.map(function(row) {
      return {
        id: row[1] || "",
        createdAt: row[0] || "",
        respondentName: row[2] || "Anonymous VIP",
        contactInfo: row[3] || "N/A",
        shoppingFrequency: row[4] || "Not specified",
        selectedCategories: row[5] ? row[5].split(', ').map(function(cat) { return cat.trim(); }) : [],
        selectedBrands: parseBrands(row[7], row[5]),
        customRequests: row[8] || ""
      };
    });
    
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "success", 
      data: responses 
    }))
    .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: error.toString() 
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

// Helper function to parse brands string back to objects
function parseBrands(brandsString, categoriesString) {
  if (!brandsString) return [];
  
  var categories = categoriesString ? categoriesString.split(', ').map(function(cat) { return cat.trim(); }) : [];
  var brands = brandsString.split(', ');
  
  return brands.map(function(brand) {
    return {
      name: brand.trim(),
      category: categories[0] || "other",
      origin: "USA",
      priority: true
    };
  });
}

// Function to delete a response by ID
function doDelete(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();
    var submissionId = e.parameter.id;
    
    if (!submissionId) {
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "error", 
        message: "Missing submission ID" 
      }))
      .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Find and remove the row with matching ID (assuming ID is in column 2, index 1)
    var rowIndex = -1;
    for (var i = 1; i < data.length; i++) { // Start from 1 to skip header
      if (data[i][1] === submissionId) {
        rowIndex = i + 1; // +1 because sheet rows are 1-indexed
        break;
      }
    }
    
    if (rowIndex > 0) {
      sheet.deleteRow(rowIndex);
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "success", 
        message: "Response deleted successfully" 
      }))
      .setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "error", 
        message: "Response not found" 
      }))
      .setMimeType(ContentService.MimeType.JSON);
    }
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      message: error.toString() 
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}
