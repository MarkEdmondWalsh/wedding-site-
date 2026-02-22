/**
 * Google Apps Script — Wedding RSVP Backend
 *
 * SETUP:
 * 1. Create a Google Sheet called "Wedding RSVPs"
 * 2. Add headers in Row 1: Timestamp | Name | Email | Attending | Guests | Day2 | Dietary | Message
 * 3. Open Extensions → Apps Script, paste this code
 * 4. Click Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the web app URL and paste it into index.html (form action) and main.js (APPS_SCRIPT_URL)
 *
 * SUMMARY FORMULAS (paste in Row 2 of a "Dashboard" sheet or below your data):
 *   Total Attending:    =COUNTIF(Data!D:D,"yes")
 *   Total Guests:       =SUMIF(Data!D:D,"yes",Data!E:E)
 *   Day 2 Count:        =COUNTIFS(Data!D:D,"yes",Data!F:F,"yes")
 *   Dietary List:       =FILTER(Data!A:G, Data!G:G<>"", Data!G:G<>"Dietary")
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = e.parameter;

    sheet.appendRow([
      new Date(),                          // Timestamp
      data.name || '',                     // Name
      data.email || '',                    // Email
      data.attending || '',                // Attending (yes/no)
      data.guests || '1',                  // Number of guests
      data.day2 || '',                     // Day 2 (yes/no)
      data.dietary || '',                  // Dietary requirements
      data.message || ''                   // Message
    ]);

    // Return success — the frontend uses no-cors so won't read this,
    // but it's useful for testing via curl
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Optional: test via GET request in browser
function doGet() {
  return ContentService
    .createTextOutput('Wedding RSVP backend is running.')
    .setMimeType(ContentService.MimeType.TEXT);
}
