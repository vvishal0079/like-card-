/**
 * Google Apps Script - Portfolio contact form backend
 * Sheet: "Responses"  (columns: Timestamp | Name | Email | Message)
 */
const SHEET_NAME = "Responses";

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["Timestamp", "Name", "Email", "Message"]);
  }
  return sheet;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* Receive a new response from the contact form */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    getSheet_().appendRow([
      data.timestamp || new Date().toISOString(),
      data.name,
      data.email,
      data.message
    ]);
    return json_({ status: "success" });
  } catch (err) {
    return json_({ status: "error", message: String(err) });
  }
}

/* Serve all responses as JSON array */
function doGet() {
  try {
    const rows = getSheet_().getDataRange().getValues();
    rows.shift(); // remove header row
    const out = rows.map(function (r) {
      return {
        timestamp: r[0] instanceof Date ? r[0].toISOString() : r[0],
        name: r[1],
        email: r[2],
        message: r[3]
      };
    });
    return json_(out);
  } catch (err) {
    return json_({ status: "error", message: String(err) });
  }
}
