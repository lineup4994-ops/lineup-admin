/**
 * Line.Up Phone Rental Service - Firebase Configuration File
 * 
 * วิธีตั้งค่าเชื่อมต่อ Firebase Project ชื่อ "LineUp":
 * 1. เข้าไปที่ https://console.firebase.google.com/
 * 2. สร้างหรือเปิดโปรเจกต์ "LineUp"
 * 3. ไปที่ Cloud Firestore -> สร้างฐานข้อมูล
 * 4. ไปที่ Project Settings (ฟันเฟือง) -> Your apps -> Web (</>)
 * 5. นำค่า firebaseConfig มาใส่ในตัวแปร LINEUP_FIREBASE_CONFIG ด้านล่างนี้ หรือใส่ผ่านเมนูบนหน้าเว็บ
 */

window.LINEUP_FIREBASE_CONFIG = {
  apiKey: "",               // ตัวอย่าง: "AIzaSyBxxxxxx..."
  authDomain: "lineup.firebaseapp.com",
  projectId: "LineUp",     // ชื่อโปรเจกต์
  storageBucket: "lineup.appspot.com",
  messagingSenderId: "",
  appId: ""
};
