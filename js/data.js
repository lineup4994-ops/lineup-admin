/**
 * Line.Up Phone Rental Service - Data Store & Mock Data
 * Comprehensive local storage management with initial sample data.
 */

const STORAGE_KEYS = {
  INVENTORY: 'lineup_inventory_v1',
  EVENTS: 'lineup_events_v1',
  BOOKINGS: 'lineup_bookings_v1',
  CUSTOMERS: 'lineup_customers_v1',
  SETTINGS: 'lineup_settings_v1'
};

// Initial Seed Data
const INITIAL_EVENTS = [
  {
    id: "EV-01",
    name: "Coldplay: Music of the Spheres World Tour",
    artist: "Coldplay",
    venue: "ราชมังคลากีฬาสถาน (Rajamangala Stadium)",
    startDate: "2026-11-06",
    endDate: "2026-11-07",
    color: "#ff7b9d",
    pricing: {
      phone: 1500,
      lens: 400,
      fullset: 1800,
      deposit: 2000
    },
    notes: "คอนเสิร์ตใหญ่ระดับสเตเดียม คนแน่น แนะนำโปรโมต S24 Ultra ซูม 100x"
  },
  {
    id: "EV-02",
    name: "NCT DREAM TOUR 'THE DREAM SHOW 3'",
    artist: "NCT DREAM",
    venue: "อิมแพ็ค อารีน่า เมืองทองธานี (Impact Arena)",
    startDate: "2026-11-14",
    endDate: "2026-11-15",
    color: "#3ec29e",
    pricing: {
      phone: 1400,
      lens: 350,
      fullset: 1650,
      deposit: 2000
    },
    notes: "จัด 2 วัน นัดรับจุดทางเชื่อม Challenger อาคาร 1"
  },
  {
    id: "EV-03",
    name: "IU HEREH World Tour Concert in Bangkok",
    artist: "IU (이지은)",
    venue: "อิมแพ็ค ชาเลนเจอร์ ฮอลล์ 1 (Impact Challenger)",
    startDate: "2026-11-21",
    endDate: "2026-11-22",
    color: "#ffd53d",
    pricing: {
      phone: 1600,
      lens: 450,
      fullset: 1950,
      deposit: 2500
    },
    notes: "งานเสียงดี แสงสวย ลูกค้าต้องการถ่ายคลิป 4K 60fps เยอะมาก"
  },
  {
    id: "EV-04",
    name: "Bruno Mars Live in Bangkok 2026",
    artist: "Bruno Mars",
    venue: "ราชมังคลากีฬาสถาน (Rajamangala Stadium)",
    startDate: "2026-11-28",
    endDate: "2026-11-29",
    color: "#ff9f43",
    pricing: {
      phone: 1700,
      lens: 500,
      fullset: 2100,
      deposit: 2500
    },
    notes: "สเตเดียมสเกล คนเยอะมาก ต้องจัดคิวนัดรับตั้งแต่ 13:00 น."
  },
  {
    id: "EV-05",
    name: "aespa LIVE TOUR - SYNK : PARALLEL LINE",
    artist: "aespa",
    venue: "อิมแพ็ค อารีน่า เมืองทองธานี",
    startDate: "2026-12-05",
    endDate: "2026-12-06",
    color: "#a55eea",
    pricing: {
      phone: 1500,
      lens: 400,
      fullset: 1800,
      deposit: 2000
    },
    notes: "เน้นแฟลชและถ่ายเซลฟี่มุมกว้างด้วย iPhone 16 Pro Max"
  },
  {
    id: "EV-06",
    name: "ZEROBASEONE THE FIRST TOUR in Bangkok",
    artist: "ZEROBASEONE",
    venue: "ยูโอบี ไลฟ์ เอ็มสเฟียร์ (UOB LIVE Emsphere)",
    startDate: "2026-12-19",
    endDate: "2026-12-20",
    color: "#2bcbba",
    pricing: {
      phone: 1300,
      lens: 350,
      fullset: 1550,
      deposit: 2000
    },
    notes: "ฮอลล์ในห้างเดินทางสะดวก นัดรับหน้าร้านกาแฟชั้น 5"
  }
];

const INITIAL_INVENTORY = [
  // --- โทรศัพท์มือถือ (Smartphones) ---
  {
    id: "PH-01",
    category: "phone",
    model: "Samsung Galaxy S24 Ultra (512GB)",
    color: "Titanium Gray",
    serial: "S24U-88921-TH",
    email: "lineup.s24u.01@gmail.com",
    password: "LineUp#S24U@01",
    status: "available", // Available by default, dynamic booking check determines date conflicts
    batteryHealth: "100%",
    condition: "ยอดเยี่ยม ไร้รอย",
    accessories: "สายคล้องคอ, เคสกันกระแทก, หัวชาร์จ 45W, ฟิล์มกระจกกันเสือก",
    notes: "ซูม 100x ชัดทะลุเวที บัตรดอยก็ถ่ายหน้าศิลปินชัด",
    createdAt: "2026-01-15"
  },
  {
    id: "PH-02",
    category: "phone",
    model: "Samsung Galaxy S24 Ultra (512GB)",
    color: "Titanium Black",
    serial: "S24U-88922-TH",
    email: "lineup.s24u.02@gmail.com",
    password: "LineUp#S24U@02",
    status: "available",
    batteryHealth: "99%",
    condition: "ดีมาก รอยขนแมวขอบเครื่องเล็กน้อย",
    accessories: "สายคล้องคอ, เคสใส, หัวชาร์จ 45W",
    notes: "กล้องคมชัด ถ่าย 8K ลื่นไหล",
    createdAt: "2026-01-20"
  },
  {
    id: "PH-03",
    category: "phone",
    model: "Samsung Galaxy S24 Ultra (256GB)",
    color: "Titanium Violet",
    serial: "S24U-88923-TH",
    email: "lineup.s24u.03@gmail.com",
    password: "LineUp#S24U@03",
    status: "available",
    batteryHealth: "98%",
    condition: "สภาพสวย มีประกันจอแตก",
    accessories: "สายคล้องคอ, เคส, สายชาร์จ Type-C",
    notes: "คิวยอดนิยม ลูกค้าจองต่อเนื่อง",
    createdAt: "2026-02-01"
  },
  {
    id: "PH-04",
    category: "phone",
    model: "Samsung Galaxy S23 Ultra (512GB)",
    color: "Phantom Black",
    serial: "S23U-77011-TH",
    email: "lineup.s23u.04@gmail.com",
    password: "LineUp#S23U@04",
    status: "available",
    batteryHealth: "96%",
    condition: "พร้อมใช้งาน แบตทนทาน",
    accessories: "สายคล้องคอ, เคสหนา, สายชาร์จ",
    notes: "ซูม 100x รุ่นยอดฮิต สเปกคุ้มราคา",
    createdAt: "2026-02-10"
  },
  {
    id: "PH-05",
    category: "phone",
    model: "Samsung Galaxy S23 Ultra (256GB)",
    color: "Green",
    serial: "S23U-77012-TH",
    email: "lineup.s23u.05@gmail.com",
    password: "LineUp#S23U@05",
    status: "maintenance",
    batteryHealth: "94%",
    condition: "กำลังเปลี่ยนฟิล์มกระจกใหม่และตรวจสอบพอร์ตชาร์จ",
    accessories: "เคส, สายชาร์จ",
    notes: "ส่งศูนย์ซ่อมเปลี่ยนฟิล์มแท้ คาดว่าพร้อมใช้วันศุกร์นี้",
    createdAt: "2026-02-15"
  },
  {
    id: "PH-06",
    category: "phone",
    model: "iPhone 16 Pro Max (512GB)",
    color: "Desert Titanium",
    serial: "IP16PM-9901-TH",
    email: "lineup.ip16.01@icloud.com",
    password: "Apple#LineUp16P",
    status: "available",
    batteryHealth: "100%",
    condition: "ใหม่เอี่ยม 100%",
    accessories: "เคสกันกระแทกพร้อม MagSafe, สายคล้อง, ฟิล์มกระจก",
    notes: "ถ่าย 4K 120fps Dolby Vision โคตรลื่น สีสันเวทีตรงเป๊ะ",
    createdAt: "2026-09-25"
  },
  {
    id: "PH-07",
    category: "phone",
    model: "iPhone 16 Pro Max (256GB)",
    color: "Natural Titanium",
    serial: "IP16PM-9902-TH",
    email: "lineup.ip16.02@icloud.com",
    password: "Apple#LineUp16P02",
    status: "available",
    batteryHealth: "100%",
    condition: "ไร้ริ้วรอย",
    accessories: "เคสกันกระแทก, ที่คล้องคอ",
    notes: "ปุ่ม Camera Control ช่วยซูมสะดวกมากตอนอยู่ในหลุม",
    createdAt: "2026-09-28"
  },
  {
    id: "PH-08",
    category: "phone",
    model: "iPhone 15 Pro Max (256GB)",
    color: "Blue Titanium",
    serial: "IP15PM-6601-TH",
    email: "lineup.ip15.01@icloud.com",
    password: "Apple#LineUp15P",
    status: "available",
    batteryHealth: "95%",
    condition: "สมบูรณ์ 98%",
    accessories: "เคส, สายคล้อง, สายชาร์จ Braided Type-C",
    notes: "กล้อง 5x Optical Telephoto ภาพนิ่งและวิดีโอเสถียรมาก",
    createdAt: "2026-03-01"
  },

  // --- เลนส์เสริม (Lenses) ---
  {
    id: "LN-01",
    category: "lens",
    model: "Apexel 36X HD Telephoto Lens Kit",
    color: "Black",
    serial: "APX-36X-001",
    email: "-",
    password: "-",
    status: "available",
    batteryHealth: "-",
    condition: "เลนส์ใส ไร้รา ไร้ฝุ่น",
    accessories: "คลิปหนีบโลหะ, ขาตั้งกล้อง Mini Tripod, ผ้าเช็ดเลนส์, ฝาปิดหน้า-หลัง",
    notes: "ซูมไกลระดับส่องดวงจันทร์ เหมาะกับที่นั่งบัตรดอยราชมังคลากีฬาสถาน",
    createdAt: "2026-02-01"
  },
  {
    id: "LN-02",
    category: "lens",
    model: "Apexel 36X HD Telephoto Lens Kit",
    color: "Black",
    serial: "APX-36X-002",
    email: "-",
    password: "-",
    status: "available",
    batteryHealth: "-",
    condition: "เลนส์ใส พร้อมใช้งาน",
    accessories: "คลิปหนีบ, ขาตั้งกล้อง, กล่องเคสพกพา",
    notes: "ภาพคมชัด ปรับโฟกัสแบบ Manual หมุนง่าย",
    createdAt: "2026-02-15"
  },
  {
    id: "LN-03",
    category: "lens",
    model: "Apexel 20-40X Zoom Telephoto Lens",
    color: "Dark Blue",
    serial: "APX-40X-003",
    email: "-",
    password: "-",
    status: "available",
    batteryHealth: "-",
    condition: "สภาพ 99%",
    accessories: "วงแหวนปรับระยะ, คลิปหนีบมือถือ, ขาตั้ง",
    notes: "ปรับระยะซูมได้ยืดหยุ่น 20x ถึง 40x โฟกัสไว",
    createdAt: "2026-03-10"
  },
  {
    id: "LN-04",
    category: "lens",
    model: "Moment 58mm Tele Lens (M-Series)",
    color: "Black / Wood accent",
    serial: "MMT-58-001",
    email: "-",
    password: "-",
    status: "available",
    batteryHealth: "-",
    condition: "สภาพสวย กระจกใส",
    accessories: "เมาท์หนีบสากล, ฝาครอบยาง, ถุงผ้าไมโครไฟเบอร์",
    notes: "ให้มิติภาพพอร์ตเทรตสวย โบเก้ละมุน สำหรับถ่ายศิลปินระยะกลาง",
    createdAt: "2026-04-05"
  },
  {
    id: "LN-05",
    category: "lens",
    model: "Sirui 400mm Super Telephoto Mobile Lens",
    color: "Matte Black",
    serial: "SR-400-001",
    email: "-",
    password: "-",
    status: "maintenance",
    batteryHealth: "-",
    condition: "เกลียวคลิปหลวม ส่งศูนย์เปลี่ยนสปริงหนีบ",
    accessories: "กระเป๋าฮาร์ดเคส, อะแดปเตอร์",
    notes: "รออะไหล่ส่งมาจากตัวแทนจำหน่าย คาดว่าพร้อมใช้สิ้นเดือน",
    createdAt: "2026-04-12"
  },
  {
    id: "LN-06",
    category: "lens",
    model: "Apexel 18X Telephoto with Eye Piece",
    color: "Black",
    serial: "APX-18X-006",
    email: "-",
    password: "-",
    status: "available",
    batteryHealth: "-",
    condition: "สภาพดีเยี่ยม เลนส์ใสแจ๋ว",
    accessories: "คลิปหนีบ, ซิลิโคนอายพีซส่องตาเปล่าได้, ขาตั้งเล็ก",
    notes: "เป็นได้ทั้งเลนส์กล้องมือถือและกล้องส่องทางไกล (Monocular)",
    createdAt: "2026-05-01"
  }
];

const INITIAL_CUSTOMERS = [
  {
    id: "CUST-001",
    nickname: "น้องแพรว",
    fullName: "ณิชารีย์ วงศ์สว่างวัฒนา",
    phone: "089-123-4567",
    lineId: "praew_coldplay",
    socialHandle: "@praew_nicha (IG)",
    citizenId: "1-1002-01928-33-1",
    idCardVerified: true,
    tag: "VIP",
    tagReason: "ลูกค้าประจำ เช่าติดต่อกัน 5 งาน ดูแลเครื่องดีมาก ส่งคืนตรงเวลาทุกรอบ แนะนำเพื่อนมาเช่าเยอะ",
    notes: "ชอบนั่งโซนบัตรยืน E ขอสายคล้องคอแน่นหนาเสมอ",
    createdAt: "2026-05-10"
  },
  {
    id: "CUST-002",
    nickname: "กิ๊ฟซี่",
    fullName: "กุลธิดา สุขประเสริฐ",
    phone: "081-998-3344",
    lineId: "giftzy_nct",
    socialHandle: "@giftzy_dreamer (X)",
    citizenId: "3-1005-00291-77-2",
    idCardVerified: true,
    tag: "VIP",
    tagReason: "เช่าประจำงานเกาหลี ชำระเงินไวมาก คืนเครื่องสะอาดเอี่ยม 100%",
    notes: "มักจองแบบครบเซ็ต S24 Ultra + เลนส์ Apexel 36X",
    createdAt: "2026-06-18"
  },
  {
    id: "CUST-003",
    nickname: "โอ๊ตตี้",
    fullName: "กิตติพงษ์ รัตนวิเชียร",
    phone: "095-442-1190",
    lineId: "oat_kpop",
    socialHandle: "@oatty_live (IG)",
    citizenId: "1-1020-00812-44-5",
    idCardVerified: true,
    tag: "Regular",
    tagReason: "ลูกค้าทั่วไป ประวัติดี ไม่มีประวัติเสียหาย",
    notes: "สะดวกนัดรับหน้างานคอนเสิร์ตเท่านั้น",
    createdAt: "2026-08-01"
  },
  {
    id: "CUST-004",
    nickname: "หมิว",
    fullName: "สุพรรษา ธรรมรัตน์",
    phone: "062-887-2231",
    lineId: "mewmew_iu",
    socialHandle: "@mew_uaena (X)",
    citizenId: "2-1004-99812-11-9",
    idCardVerified: true,
    tag: "Regular",
    tagReason: "ลูกค้าใหม่ ยืนยันบัตรประชาชนเรียบร้อย",
    notes: "แฟนคลับไอยู ขอคำแนะนำวิธีปรับตั้งค่ากล้องถ่ายสเตจสีจัด",
    createdAt: "2026-09-12"
  },
  {
    id: "CUST-005",
    nickname: "แอนดี้",
    fullName: "อนิรุทธ์ ชนะไพศาล",
    phone: "086-777-9912",
    lineId: "andy_rock",
    socialHandle: "@andy_livebkk",
    citizenId: "1-1033-00911-55-4",
    idCardVerified: true,
    tag: "Caution",
    tagReason: "เคยส่งเครื่องคืนเลทกว่ากำหนด 3 ชั่วโมงในงานก่อนหน้า แต่ชำระค่าปรับเรียบร้อย",
    notes: "ให้กำชับเรื่องเวลารับคืนเครื่องล่วงหน้า 1 วัน",
    createdAt: "2026-07-20"
  },
  {
    id: "CUST-006",
    nickname: "ต้น",
    fullName: "วรเมธ ศิริโรจน์ (บุคคลเฝ้าระวัง)",
    phone: "080-000-1234",
    lineId: "ton_fake_id",
    socialHandle: "@ton_blocked",
    citizenId: "1-1099-00000-00-0",
    idCardVerified: false,
    tag: "Blacklist",
    tagReason: "แบล็กลิสต์: ปลอมสลิปโอนเงินมัดจำ และเคยทำเคสเลนส์แตกแล้วไม่ยอมชดใช้ ห้ามให้เช่าทุกกรณี!",
    notes: "ขึ้น Blacklist ในกลุ่มแอดมินเช่ากล้องมือถือคอนเสิร์ตแห่งประเทศไทย",
    createdAt: "2026-04-01"
  }
];

const INITIAL_BOOKINGS = [
  {
    id: "BK-1001",
    customerId: "CUST-001",
    customerNickname: "น้องแพรว",
    customerName: "ณิชารีย์ วงศ์สว่างวัฒนา",
    customerPhone: "089-123-4567",
    customerLine: "praew_coldplay",
    eventId: "EV-01",
    eventName: "Coldplay: Music of the Spheres World Tour",
    venue: "ราชมังคลากีฬาสถาน (Rajamangala Stadium)",
    rentalType: "fullset", // phone | lens | fullset
    assignedPhoneId: "PH-01",
    assignedLensId: "LN-01",
    deviceSummary: "Samsung Galaxy S24 Ultra (512GB) + Apexel 36X Lens",
    startDate: "2026-11-06",
    endDate: "2026-11-07",
    days: 2,
    ratePerDay: 1800,
    totalRental: 3600,
    deposit: 2000,
    totalPayable: 5600,
    paymentStatus: "paid", // paid | deposit_only | pending
    deliveryMethod: "venue", // venue | messenger | shop
    deliveryAddress: "นัดรับที่จุดบริการ Line.Up ป้ายทางเข้าประตู 3 โซน E ราชมังคลาฯ เวลา 14:30 น.",
    deliveryStatus: "pending", // pending | delivered | returned | cancelled
    conditionCheck: {
      beforeDelivery: {
        checked: true,
        checkedAt: "2026-11-05 16:30",
        batteryLevel: "100%",
        inspector: "แอดมิน มิ้นท์",
        photos: [
          "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&auto=format&fit=crop&q=60",
          "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&auto=format&fit=crop&q=60"
        ],
        notes: "เครื่องสมบูรณ์ 100% ติดฟิล์มใหม่ ไม่มีรอยขีดข่วน เลนส์ใสไม่มีฝุ่น แบตเต็ม 100%"
      },
      afterReturn: {
        checked: false,
        checkedAt: null,
        inspector: null,
        photos: [],
        defectNotes: "",
        hasPenalty: false,
        penaltyAmount: 0
      }
    },
    createdAt: "2026-10-25"
  },
  {
    id: "BK-1002",
    customerId: "CUST-002",
    customerNickname: "กิ๊ฟซี่",
    customerName: "กุลธิดา สุขประเสริฐ",
    customerPhone: "081-998-3344",
    customerLine: "giftzy_nct",
    eventId: "EV-02",
    eventName: "NCT DREAM TOUR 'THE DREAM SHOW 3'",
    venue: "อิมแพ็ค อารีน่า เมืองทองธานี",
    rentalType: "phone",
    assignedPhoneId: "PH-03",
    assignedLensId: null,
    deviceSummary: "Samsung Galaxy S24 Ultra (256GB)",
    startDate: "2026-11-14",
    endDate: "2026-11-15",
    days: 2,
    ratePerDay: 1400,
    totalRental: 2800,
    deposit: 2000,
    totalPayable: 4800,
    paymentStatus: "paid",
    deliveryMethod: "messenger",
    deliveryAddress: "ส่งแมสเซนเจอร์ Grab Express ไปที่ คอนโด The Base แจ้งวัฒนะ ห้อง 812",
    deliveryStatus: "pending",
    conditionCheck: {
      beforeDelivery: {
        checked: true,
        checkedAt: "2026-11-13 14:00",
        batteryLevel: "100%",
        inspector: "แอดมิน กอล์ฟ",
        photos: [
          "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=60"
        ],
        notes: "ตรวจสภาพแล้ว หน้าจอไร้รอย กล้องทำงานปกติ เคสพร้อมสายคล้อง"
      },
      afterReturn: {
        checked: false,
        checkedAt: null,
        inspector: null,
        photos: [],
        defectNotes: "",
        hasPenalty: false,
        penaltyAmount: 0
      }
    },
    createdAt: "2026-10-28"
  },
  {
    id: "BK-1003",
    customerId: "CUST-003",
    customerNickname: "โอ๊ตตี้",
    customerName: "กิตติพงษ์ รัตนวิเชียร",
    customerPhone: "095-442-1190",
    customerLine: "oat_kpop",
    eventId: "EV-01",
    eventName: "Coldplay: Music of the Spheres World Tour",
    venue: "ราชมังคลากีฬาสถาน",
    rentalType: "phone",
    assignedPhoneId: "PH-07",
    assignedLensId: null,
    deviceSummary: "iPhone 16 Pro Max (256GB)",
    startDate: "2026-11-06",
    endDate: "2026-11-06",
    days: 1,
    ratePerDay: 1500,
    totalRental: 1500,
    deposit: 2000,
    totalPayable: 3500,
    paymentStatus: "paid",
    deliveryMethod: "venue",
    deliveryAddress: "นัดรับหน้างาน บูธ Line.Up ตรงข้ามเต็นท์จำหน่ายของที่ระลึก เวลา 15:00 น.",
    deliveryStatus: "pending",
    conditionCheck: {
      beforeDelivery: {
        checked: true,
        checkedAt: "2026-11-05 17:00",
        batteryLevel: "100%",
        inspector: "แอดมิน มิ้นท์",
        photos: [
          "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500&auto=format&fit=crop&q=60"
        ],
        notes: "เครื่องใหม่เอี่ยม ติดฟิล์มกระจก 9H พร้อมเคสใสกันกระแทก"
      },
      afterReturn: {
        checked: false,
        checkedAt: null,
        inspector: null,
        photos: [],
        defectNotes: "",
        hasPenalty: false,
        penaltyAmount: 0
      }
    },
    createdAt: "2026-11-01"
  },
  {
    id: "BK-1004",
    customerId: "CUST-004",
    customerNickname: "หมิว",
    customerName: "สุพรรษา ธรรมรัตน์",
    customerPhone: "062-887-2231",
    customerLine: "mewmew_iu",
    eventId: "EV-03",
    eventName: "IU HEREH World Tour Concert in Bangkok",
    venue: "อิมแพ็ค ชาเลนเจอร์ ฮอลล์ 1",
    rentalType: "lens",
    assignedPhoneId: null,
    assignedLensId: "LN-06",
    deviceSummary: "Apexel 18X Telephoto with Eye Piece",
    startDate: "2026-11-21",
    endDate: "2026-11-22",
    days: 2,
    ratePerDay: 450,
    totalRental: 900,
    deposit: 1500,
    totalPayable: 2400,
    paymentStatus: "paid",
    deliveryMethod: "shop",
    deliveryAddress: "มารับที่หน้าร้าน Line.Up สาขาเมืองทองธานี ช่วงเช้า 10:30 น.",
    deliveryStatus: "pending",
    conditionCheck: {
      beforeDelivery: {
        checked: true,
        checkedAt: "2026-11-04 11:00",
        batteryLevel: "-",
        inspector: "แอดมิน บอย",
        photos: [],
        notes: "ชิ้นเลนส์ใสไร้รอย คลิปหนีบแน่นหนา กระเป๋าครบชุด"
      },
      afterReturn: {
        checked: false,
        checkedAt: null,
        inspector: null,
        photos: [],
        defectNotes: "",
        hasPenalty: false,
        penaltyAmount: 0
      }
    },
    createdAt: "2026-11-02"
  },
  // Completed past bookings for revenue trends & customer history
  {
    id: "BK-0995",
    customerId: "CUST-001",
    customerNickname: "น้องแพรว",
    customerName: "ณิชารีย์ วงศ์สว่างวัฒนา",
    customerPhone: "089-123-4567",
    customerLine: "praew_coldplay",
    eventId: "EV-00",
    eventName: "BLACKPINK WORLD TOUR BORN PINK FINALE",
    venue: "ราชมังคลากีฬาสถาน",
    rentalType: "fullset",
    assignedPhoneId: "PH-01",
    assignedLensId: "LN-01",
    deviceSummary: "Samsung Galaxy S24 Ultra + Apexel 36X Lens",
    startDate: "2026-10-10",
    endDate: "2026-10-11",
    days: 2,
    ratePerDay: 1900,
    totalRental: 3800,
    deposit: 2000,
    totalPayable: 5800,
    paymentStatus: "paid",
    deliveryMethod: "venue",
    deliveryAddress: "รับหน้างานราชมังคลาฯ ประตู 1",
    deliveryStatus: "returned",
    conditionCheck: {
      beforeDelivery: {
        checked: true,
        checkedAt: "2026-10-09 18:00",
        batteryLevel: "100%",
        inspector: "แอดมิน มิ้นท์",
        photos: [],
        notes: "สภาพสมบูรณ์ ไร้ตำหนิ"
      },
      afterReturn: {
        checked: true,
        checkedAt: "2026-10-11 23:30",
        inspector: "แอดมิน มิ้นท์",
        photos: [],
        defectNotes: "ส่งคืนตรงเวลา เครื่องสมบูรณ์ 100% คืนเงินมัดจำเต็มจำนวนเรียบร้อย",
        hasPenalty: false,
        penaltyAmount: 0
      }
    },
    createdAt: "2026-10-01"
  },
  {
    id: "BK-0996",
    customerId: "CUST-002",
    customerNickname: "กิ๊ฟซี่",
    customerName: "กุลธิดา สุขประเสริฐ",
    customerPhone: "081-998-3344",
    customerLine: "giftzy_nct",
    eventId: "EV-00B",
    eventName: "SEVENTEEN TOUR 'FOLLOW' AGAIN TO BANGKOK",
    venue: "ราชมังคลากีฬาสถาน",
    rentalType: "fullset",
    assignedPhoneId: "PH-02",
    assignedLensId: "LN-02",
    deviceSummary: "Samsung Galaxy S24 Ultra + Apexel 36X Lens",
    startDate: "2026-10-18",
    endDate: "2026-10-19",
    days: 2,
    ratePerDay: 1850,
    totalRental: 3700,
    deposit: 2000,
    totalPayable: 5700,
    paymentStatus: "paid",
    deliveryMethod: "messenger",
    deliveryAddress: "ส่ง Lalamove รถยนต์ไปแจ้งวัฒนะ",
    deliveryStatus: "returned",
    conditionCheck: {
      beforeDelivery: {
        checked: true,
        checkedAt: "2026-10-17 19:00",
        batteryLevel: "100%",
        inspector: "แอดมิน กอล์ฟ",
        photos: [],
        notes: "สภาพปกติทุกฟังก์ชัน"
      },
      afterReturn: {
        checked: true,
        checkedAt: "2026-10-20 09:30",
        inspector: "แอดมิน กอล์ฟ",
        photos: [],
        defectNotes: "เครื่องกลับมาสะอาดเรียบร้อย ขาตั้งและเลนส์ครบ",
        hasPenalty: false,
        penaltyAmount: 0
      }
    },
    createdAt: "2026-10-10"
  },
  {
    id: "BK-0997",
    customerId: "CUST-005",
    customerNickname: "แอนดี้",
    customerName: "อนิรุทธ์ ชนะไพศาล",
    customerPhone: "086-777-9912",
    customerLine: "andy_rock",
    eventId: "EV-00C",
    eventName: "Summer Sonic Bangkok 2026",
    venue: "อิมแพ็ค ชาเลนเจอร์ 1-3",
    rentalType: "phone",
    assignedPhoneId: "PH-06",
    assignedLensId: null,
    deviceSummary: "iPhone 16 Pro Max (512GB)",
    startDate: "2026-08-24",
    endDate: "2026-08-25",
    days: 2,
    ratePerDay: 1600,
    totalRental: 3200,
    deposit: 2500,
    totalPayable: 5700,
    paymentStatus: "paid",
    deliveryMethod: "shop",
    deliveryAddress: "รับ-คืนที่ร้าน Line.Up",
    deliveryStatus: "returned",
    conditionCheck: {
      beforeDelivery: {
        checked: true,
        checkedAt: "2026-08-23 18:00",
        batteryLevel: "100%",
        inspector: "แอดมิน บอย",
        photos: [],
        notes: "เครื่องใหม่ 100%"
      },
      afterReturn: {
        checked: true,
        checkedAt: "2026-08-26 02:00",
        inspector: "แอดมิน บอย",
        photos: [],
        defectNotes: "ส่งคืนเลท 3 ชั่วโมง โดนปรับค่าล่วงเวลา 300 บาท หักจากมัดจำเรียบร้อย",
        hasPenalty: true,
        penaltyAmount: 300
      }
    },
    createdAt: "2026-08-15"
  },
  {
    id: "BK-0998",
    customerId: "CUST-003",
    customerNickname: "โอ๊ตตี้",
    customerName: "กิตติพงษ์ รัตนวิเชียร",
    customerPhone: "095-442-1190",
    customerLine: "oat_kpop",
    eventId: "EV-00D",
    eventName: "IVE THE 1ST WORLD TOUR <SHOW WHAT I HAVE>",
    venue: "อิมแพ็ค ชาเลนเจอร์ ฮอลล์",
    rentalType: "lens",
    assignedPhoneId: null,
    assignedLensId: "LN-04",
    deviceSummary: "Moment 58mm Tele Lens",
    startDate: "2026-09-07",
    endDate: "2026-09-08",
    days: 2,
    ratePerDay: 400,
    totalRental: 800,
    deposit: 1500,
    totalPayable: 2300,
    paymentStatus: "paid",
    deliveryMethod: "venue",
    deliveryAddress: "นัดรับหน้าฮอลล์",
    deliveryStatus: "returned",
    conditionCheck: {
      beforeDelivery: {
        checked: true,
        checkedAt: "2026-09-06 20:00",
        batteryLevel: "-",
        inspector: "แอดมิน มิ้นท์",
        photos: [],
        notes: "เลนส์ใส พร้อมคลิป"
      },
      afterReturn: {
        checked: true,
        checkedAt: "2026-09-08 22:30",
        inspector: "แอดมิน มิ้นท์",
        photos: [],
        defectNotes: "เรียบร้อยดี คืนมัดจำเต็ม",
        hasPenalty: false,
        penaltyAmount: 0
      }
    },
    createdAt: "2026-09-01"
  }
];

// Data Store Manager
const LineUpDB = {
  getInventory() {
    const data = localStorage.getItem(STORAGE_KEYS.INVENTORY);
    if (!data) {
      this.setInventory(INITIAL_INVENTORY);
      return INITIAL_INVENTORY;
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      return INITIAL_INVENTORY;
    }
  },

  setInventory(items) {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('lineup:inventory-updated'));
  },

  getEvents() {
    const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (!data) {
      this.setEvents(INITIAL_EVENTS);
      return INITIAL_EVENTS;
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      return INITIAL_EVENTS;
    }
  },

  setEvents(events) {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    window.dispatchEvent(new CustomEvent('lineup:events-updated'));
  },

  getBookings() {
    const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    if (!data) {
      this.setBookings(INITIAL_BOOKINGS);
      return INITIAL_BOOKINGS;
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      return INITIAL_BOOKINGS;
    }
  },

  setBookings(bookings) {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
    window.dispatchEvent(new CustomEvent('lineup:bookings-updated'));
  },

  getCustomers() {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (!data) {
      this.setCustomers(INITIAL_CUSTOMERS);
      return INITIAL_CUSTOMERS;
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      return INITIAL_CUSTOMERS;
    }
  },

  setCustomers(customers) {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    window.dispatchEvent(new CustomEvent('lineup:customers-updated'));
  },

  // Dynamic Date-Based Device Availability Check
  // Condition: Device or lens cannot be booked on overlapping dates.
  // But if dates differ (e.g. booked on 12/5, then on 13/5 it is free), it CAN be booked!
  isDeviceAvailableForDates(deviceId, startDate, endDate, excludeBookingId = null) {
    if (!deviceId) return { available: true };
    if (!startDate || !endDate) return { available: true };

    const inventory = this.getInventory();
    const item = inventory.find(i => i.id === deviceId);
    if (!item) return { available: false, reason: 'ไม่พบอุปกรณ์ในระบบ' };

    // If equipment is in maintenance, it cannot be booked on any date until repaired
    if (item.status === 'maintenance') {
      return {
        available: false,
        reason: 'อุปกรณ์กำลังส่งซ่อมบำรุงรักษา',
        status: 'maintenance'
      };
    }

    // Check all active non-cancelled bookings
    const bookings = this.getBookings().filter(b => b.deliveryStatus !== 'cancelled' && b.id !== excludeBookingId);

    for (const b of bookings) {
      const usesDevice = (b.assignedPhoneId === deviceId || b.assignedLensId === deviceId);
      if (usesDevice) {
        // Date overlap check: two ranges [A_start, A_end] and [B_start, B_end] overlap
        // if and only if: (A_start <= B_end) && (A_end >= B_start)
        const hasOverlap = (startDate <= b.endDate) && (endDate >= b.startDate);
        if (hasOverlap) {
          return {
            available: false,
            reason: `ติดจองคิว ${b.id} (${b.customerNickname}) ในช่วงวันที่ ${b.startDate} ถึง ${b.endDate}`,
            conflictingBooking: b,
            status: 'booked'
          };
        }
      }
    }

    return { available: true, status: 'available' };
  },

  // Get dynamic status of a device for a given reference date (defaults to today or reference)
  getDeviceDynamicStatus(deviceId, targetDate = null) {
    const inventory = this.getInventory();
    const item = inventory.find(i => i.id === deviceId);
    if (!item) return 'available';
    if (item.status === 'maintenance') return 'maintenance';

    const dateStr = targetDate || '2026-11-04';
    const bookings = this.getBookings().filter(b => b.deliveryStatus !== 'cancelled');

    for (const b of bookings) {
      if (b.assignedPhoneId === deviceId || b.assignedLensId === deviceId) {
        if (dateStr >= b.startDate && dateStr <= b.endDate) {
          return 'booked';
        }
      }
    }

    return 'available';
  },

  // Get all active booking intervals for a device (for display and timeline)
  getDeviceBookingSchedules(deviceId) {
    const bookings = this.getBookings().filter(b => b.deliveryStatus !== 'cancelled');
    return bookings
      .filter(b => b.assignedPhoneId === deviceId || b.assignedLensId === deviceId)
      .map(b => ({
        bookingId: b.id,
        nickname: b.customerNickname,
        startDate: b.startDate,
        endDate: b.endDate,
        eventName: b.eventName
      }))
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  },

  resetAllData() {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(INITIAL_INVENTORY));
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(INITIAL_EVENTS));
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(INITIAL_BOOKINGS));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
    window.location.reload();
  }
};

window.LineUpDB = LineUpDB;
