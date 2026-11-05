/**
 * ==============================================================================
 * Line.Up Phone & Lens Rental Service - Google Apps Script Backend (API)
 * ==============================================================================
 * สคริปต์นี้ใช้สำหรับติดตั้งใน Google Sheets เพื่อทำหน้าที่เป็น Database และ API
 * พร้อมทั้งจัดการบันทึกไฟล์รูปภาพสลิป/สภาพเครื่องลงใน Google Drive โดยอัตโนมัติ
 *
 * วิธีติดตั้ง (ทำเพียงครั้งเดียว):
 * 1. เปิด Google Sheets เปล่าขึ้นมา 1 ไฟล์ ตั้งชื่อว่า "LineUp"
 * 2. ไปที่เมนู "ส่วนขยาย" (Extensions) > "Apps Script"
 * 3. ลบโค้ดเดิมทั้งหมด แล้วคัดลอกโค้ดนี้ทั้งหมดไปวางแทนที่
 * 4. กดปุ่ม "บันทึก" (รูปแผ่นดิสก์)
 * 5. กดปุ่มสีน้ำเงิน "การทำให้ใช้งานได้" (Deploy) > "การทำให้ใช้งานได้รายการใหม่" (New deployment)
 * 6. เลือกประเภทเป็น "เว็บแอป" (Web app)
 *    - คำอธิบาย: LineUp API
 *    - ดำเนินการในฐานะ (Execute as): ฉัน (Me)
 *    - ผู้มีสิทธิ์เข้าถึง (Who has access): ทุกคน (Anyone)  <-- สำคัญมาก!
 * 7. กด "ทำให้ใช้งานได้" (Deploy) แล้วคัดลอก "URL เว็บแอป" (Web App URL)
 * 8. นำ URL นั้นมาวางในหน้าเว็บ Line.Up ในช่องเชื่อมต่อ Google Sheets & Drive
 * ==============================================================================
 */

// ชื่อโฟลเดอร์ใน Google Drive ที่จะใช้เก็บรูปภาพ
var DRIVE_FOLDER_NAME = "LineUp_Storage";
var BOOKING_SLIPS_FOLDER_NAME = "LineUp_Slips1"; // สลิปการจอง
var CLOSING_SLIPS_FOLDER_NAME = "LineUp_Slips2"; // สลิปปิดยอด

/**
 * Handle GET requests (ดึงข้อมูล)
 */
function doGet(e) {
  var action = e.parameter.action || "getAll";
  var result = {};

  try {
    if (action === "getAll") {
      result = {
        status: "success",
        data: {
          inventory: getSheetData("Inventory"),
          events: getSheetData("Events"),
          bookings: getSheetData("Bookings"),
          customers: getSheetData("Customers")
        }
      };
    } else if (action === "ping") {
      result = { status: "success", message: "LineUp Google Sheets API is Online!" };
    } else {
      result = { status: "error", message: "Unknown action: " + action };
    }
  } catch (err) {
    result = { status: "error", message: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST requests (บันทึกข้อมูล และ อัปโหลดรูปภาพเข้า Google Drive)
 */
function doPost(e) {
  var result = {};

  try {
    var payload = {};
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else {
      payload = e.parameter || {};
    }

    var action = payload.action || "syncAll";

    // 1. อัปโหลดรูปภาพไปยัง Google Drive
    if (action === "uploadImage") {
      result = handleImageUpload(payload);
    }
    // 2. ซิงค์ข้อมูลทั้งหมดลง Google Sheets (4 แท็บ)
    else if (action === "syncAll") {
      result = handleSyncAll(payload.data);
    }
    // 3. บันทึกหรืออัปเดตการจองเดี่ยว
    else if (action === "saveBooking") {
      result = handleSaveBooking(payload.booking);
    }
    // 4. ลบรายการการจอง
    else if (action === "deleteBooking") {
      result = handleDeleteRow("Bookings", payload.id);
    }
    // 5. บันทึกข้อมูลลูกค้า
    else if (action === "saveCustomer") {
      result = handleSaveCustomer(payload.customer);
    }
    // 6. บันทึกอุปกรณ์
    else if (action === "saveInventory") {
      result = handleSaveInventory(payload.item);
    }
    else {
      result = { status: "error", message: "Unknown POST action: " + action };
    }

  } catch (err) {
    result = { status: "error", message: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * อัปโหลดไฟล์รูปภาพ (Base64) ไปยัง Google Drive และสร้างลิงก์สำหรับเปิดดูรูป
 */
function handleImageUpload(payload) {
  var base64Data = payload.base64Data;
  var fileName = payload.fileName || ("slip_" + new Date().getTime() + ".jpg");
  var folderType = String(payload.folderType || "").toLowerCase();
  var lowerFileName = String(fileName).toLowerCase();

  if (!base64Data) {
    return { status: "error", message: "No image data provided" };
  }

  // ตัด Header Data URL ออก (เช่น data:image/png;base64, หรือ data:image/svg+xml;utf8, )
  var contentType = "image/jpeg";
  var decodedBytes;

  if (base64Data.indexOf(";base64,") !== -1) {
    var parts = base64Data.split(";base64,");
    contentType = parts[0].replace("data:", "");
    base64Data = parts[1];
    decodedBytes = Utilities.base64Decode(base64Data);
  } else if (base64Data.indexOf("data:image/svg+xml;utf8,") !== -1) {
    contentType = "image/svg+xml";
    var svgText = decodeURIComponent(base64Data.replace("data:image/svg+xml;utf8,", ""));
    decodedBytes = Utilities.newBlob(svgText, contentType).getBytes();
    if (fileName.indexOf(".jpg") !== -1) {
      fileName = fileName.replace(".jpg", ".svg");
    }
  } else {
    decodedBytes = Utilities.base64Decode(base64Data);
  }

  var blob = Utilities.newBlob(decodedBytes, contentType, fileName);

  // ค้นหาหรือสร้างโฟลเดอร์หลัก LineUp_Storage
  var rootFolder = getOrCreateFolder(DRIVE_FOLDER_NAME);
  var targetFolder;

  // ตรวจสอบทั้ง folderType และชื่อไฟล์ เพื่อแยกเข้า LineUp_Slips1 (สลิปการจอง) และ LineUp_Slips2 (สลิปปิดยอด) อย่างแม่นยำ 100%
  if (
    folderType.indexOf("closing") !== -1 ||
    folderType.indexOf("slips2") !== -1 ||
    lowerFileName.indexOf("closing") !== -1
  ) {
    targetFolder = getOrCreateSubFolder(rootFolder, CLOSING_SLIPS_FOLDER_NAME);
  } else {
    // ค่าเริ่มต้นสำหรับสลิปการจอง (booking_slips / LineUp_Slips1 / slip_booking_...)
    targetFolder = getOrCreateSubFolder(rootFolder, BOOKING_SLIPS_FOLDER_NAME);
  }

  var file = targetFolder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // สร้าง Direct View Image URL
  var fileId = file.getId();
  var driveViewUrl = "https://lh3.googleusercontent.com/d/" + fileId;
  var altViewUrl = "https://drive.google.com/uc?export=view&id=" + fileId;

  return {
    status: "success",
    fileId: fileId,
    fileUrl: driveViewUrl,
    altUrl: altViewUrl,
    fileName: fileName,
    folderName: targetFolder.getName()
  };
}

/**
 * ซิงค์ข้อมูลทั้ง 4 ตารางลงใน Google Sheets
 */
function handleSyncAll(data) {
  if (!data) return { status: "error", message: "No data payload provided" };

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Sync Bookings
  if (data.bookings) {
    syncBookingsSheet(ss, data.bookings);
  }

  // 2. Sync Inventory
  if (data.inventory) {
    syncInventorySheet(ss, data.inventory);
  }

  // 3. Sync Customers
  if (data.customers) {
    syncCustomersSheet(ss, data.customers);
  }

  // 4. Sync Events
  if (data.events) {
    syncEventsSheet(ss, data.events);
  }

  return {
    status: "success",
    message: "ซิงค์ข้อมูล Line.Up ทั้งหมดเข้าสู่ Google Sheets เรียบร้อยแล้ว",
    timestamp: new Date().toISOString()
  };
}

/**
 * ซิงค์แท็บ Bookings
 */
function syncBookingsSheet(ss, bookings) {
  var sheet = getOrCreateSheet(ss, "Bookings", [
    "รหัสคิว (ID)", "ชื่อเล่นลูกค้า", "เบอร์โทร", "Line ID", "สถานะลูกค้า",
    "งานคอนเสิร์ต", "อุปกรณ์ที่เช่า", "ประเภทเช่า", "วันเริ่มเช่า", "วันสิ้นสุด", "จำนวนวัน",
    "ค่าเช่าต่อวัน", "ค่าเช่ารวม", "เงินมัดจำ", "ยอดชำระสุทธิ", "วิธีส่งมอบ", "สถานะส่งมอบ",
    "จุดนัดหมาย/ที่อยู่", "ลิงก์สลิปการจอง (Drive)", "ลิงก์สลิปปิดยอด (Drive)", "วันที่บันทึก"
  ], "#38c29e");

  sheet.getRange(2, 1, Math.max(sheet.getLastRow(), 1), sheet.getLastColumn()).clearContent();

  if (!bookings || bookings.length === 0) return;

  var rows = bookings.map(function(b) {
    var bkSlip = b.paymentSlips && b.paymentSlips.bookingSlip ? b.paymentSlips.bookingSlip.imageUrl : "";
    var clSlip = b.paymentSlips && b.paymentSlips.closingSlip ? b.paymentSlips.closingSlip.imageUrl : "";

    return [
      b.id,
      b.customerNickname,
      b.customerPhone,
      b.customerLine || "-",
      b.customerTag || "Regular",
      b.eventName,
      b.deviceSummary,
      b.rentalType,
      b.startDate,
      b.endDate,
      b.days,
      b.ratePerDay,
      b.totalRental,
      b.deposit,
      b.totalPayable,
      b.deliveryMethod,
      b.deliveryStatus,
      b.deliveryAddress || "-",
      bkSlip || "-",
      clSlip || "-",
      b.createdAt || new Date().toISOString().split("T")[0]
    ];
  });

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

/**
 * ซิงค์แท็บ Inventory
 */
function syncInventorySheet(ss, inventory) {
  var sheet = getOrCreateSheet(ss, "Inventory", [
    "รหัสอุปกรณ์ (ID)", "รุ่นอุปกรณ์ (Model)", "หมวดหมู่ (Category)", "สถานะ (Status)",
    "ซีเรียล/เลขอ้างอิง", "อีเมล/Apple ID", "รหัสผ่าน (Password)", "สุขภาพแบต",
    "สภาพอุปกรณ์", "อุปกรณ์ที่ให้ไปด้วย", "หมายเหตุแอดมิน"
  ], "#2ea888");

  sheet.getRange(2, 1, Math.max(sheet.getLastRow(), 1), sheet.getLastColumn()).clearContent();

  if (!inventory || inventory.length === 0) return;

  var rows = inventory.map(function(item) {
    return [
      item.id,
      item.model,
      item.category,
      item.status,
      item.serial || "-",
      item.email || "-",
      item.password || "-",
      item.batteryHealth || "-",
      item.condition || "-",
      item.accessories || "-",
      item.notes || "-"
    ];
  });

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

/**
 * ซิงค์แท็บ Customers
 */
function syncCustomersSheet(ss, customers) {
  var sheet = getOrCreateSheet(ss, "Customers", [
    "รหัสลูกค้า (ID)", "ชื่อเล่น (Nickname)", "ชื่อ-นามสกุล", "เบอร์โทร", "Line ID",
    "โซเชียลมีเดีย", "ป้ายสถานะ (Tag)", "หมายเหตุสถานะ", "บันทึกเพิ่มเติม", "วันที่สมัคร"
  ], "#ff7599");

  sheet.getRange(2, 1, Math.max(sheet.getLastRow(), 1), sheet.getLastColumn()).clearContent();

  if (!customers || customers.length === 0) return;

  var rows = customers.map(function(c) {
    return [
      c.id,
      c.nickname,
      c.fullName || c.nickname,
      c.phone,
      c.lineId || "-",
      c.socialHandle || "-",
      c.tag || "Regular",
      c.tagReason || "-",
      c.notes || "-",
      c.createdAt || new Date().toISOString().split("T")[0]
    ];
  });

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

/**
 * ซิงค์แท็บ Events
 */
function syncEventsSheet(ss, events) {
  var sheet = getOrCreateSheet(ss, "Events", [
    "รหัสอีเวนต์ (ID)", "ชื่องานคอนเสิร์ต", "สถานที่จัดงาน", "วันเริ่มงาน", "วันสิ้นสุด",
    "ราคาโทรศัพท์/วัน", "ราคาเลนส์/วัน", "ราคาครบเซ็ต/วัน", "เงินมัดจำ", "หมายเหตุ"
  ], "#facc15");

  sheet.getRange(2, 1, Math.max(sheet.getLastRow(), 1), sheet.getLastColumn()).clearContent();

  if (!events || events.length === 0) return;

  var rows = events.map(function(e) {
    return [
      e.id,
      e.name,
      e.venue,
      e.startDate,
      e.endDate,
      e.pricing ? e.pricing.phone : 0,
      e.pricing ? e.pricing.lens : 0,
      e.pricing ? e.pricing.fullset : 0,
      e.pricing ? e.pricing.deposit : 2000,
      e.notes || "-"
    ];
  });

  sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

/**
 * Helper: ค้นหาหรือสร้างโฟลเดอร์ใน Google Drive
 */
function getOrCreateFolder(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

/**
 * Helper: ค้นหาหรือสร้างโฟลเดอร์ย่อยใน Google Drive
 */
function getOrCreateSubFolder(parentFolder, subFolderName) {
  var subFolders = parentFolder.getFoldersByName(subFolderName);
  if (subFolders.hasNext()) {
    return subFolders.next();
  }
  return parentFolder.createFolder(subFolderName);
}

/**
 * Helper: ค้นหาหรือสร้าง Sheet พร้อมหัวตาราง
 */
function getOrCreateSheet(ss, sheetName, headers, headerColor) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  // ถ้ายังไม่มีหัวตาราง ให้ใส่หัวตาราง
  if (sheet.getLastRow() === 0 || sheet.getRange(1, 1).getValue() === "") {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground(headerColor || "#38c29e")
      .setFontColor("#ffffff")
      .setFontWeight("bold");
    sheet.setFrozenRows(1);
  }

  return sheet;
}

/**
 * Helper: อ่านข้อมูลจากแท็บแปลงเป็น Array of Objects
 */
function getSheetData(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var rows = values.slice(1);

  return rows.map(function(row) {
    var obj = {};
    headers.forEach(function(header, idx) {
      obj[header] = row[idx];
    });
    return obj;
  });
}
