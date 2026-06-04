const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const os = require('os'); // Modul bawaan Node.js untuk mendeteksi IP jaringan

const app = express();
const PORT = process.env.PORT || 8080;
const DB_FILE = path.join(__dirname, 'database.json');

// ==================== MIDDLEWARE UTAMA ====================
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Limit ditinggikan agar lancar upload foto format Base64
app.use(express.static(__dirname)); // Melayani file static frontend (index.html, script.js, styles.css)

// ==================== HELPER DATABASE FUNGSI ====================

// Fungsi membaca data dari database.json
const bacaDatabase = () => {
  try {
    // Jika file belum ada, buat file baru dengan struktur kosong bawaan
    if (!fs.existsSync(DB_FILE)) {
      const strukturAwal = { products: [], tools: [], listRak: [], listKategoriAlat: [], logs: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(strukturAwal, null, 2), 'utf8');
      return strukturAwal;
    }
    
    const dataRaw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(dataRaw);
  } catch (error) {
    console.error("Gagal membaca database, menggunakan data kosong sementara:", error);
    return { products: [], tools: [], listRak: [], listKategoriAlat: [], logs: [] };
  }
};

// Fungsi menulis/menyimpan data ke database.json
const tulisDatabase = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error("Gagal menulis data ke database.json:", error);
    return false;
  }
};

// ==================== ROUTING ENDPOINT API ====================

// 1. Jalur GET: Mengambil data untuk dimuat di HP maupun Laptop saat aplikasi dibuka
app.get('/api/gudang', (req, res) => {
  const dataGudang = bacaDatabase();
  res.json(dataGudang);
});

// 2. Jalur POST: Menerima data terbaru dari frontend dan disimpan permanen ke database.json
app.post('/api/gudang', (req, res) => {
  const dataBaru = req.body;
  
  // Validasi sederhana memastikan data yang masuk berstruktur benar
  if (!dataBaru || typeof dataBaru !== 'object') {
    return res.status(400).json({ success: false, message: "Format data tidak valid!" });
  }

  const berhasil = tulisDatabase(dataBaru);
  if (berhasil) {
    res.json({ success: true, message: "Database logistik berhasil diperbarui di server pusat." });
  } else {
    res.status(500).json({ success: false, message: "Gagal menulis perubahan data ke dalam disk server." });
  }
});

// ==================== LOGIKA DETEKSI IP NETWORK OTOMATIS ====================
function dapatkanIPNetwork() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Cari alamat IP berjenis IPv4 dan bukan internal localhost (127.0.0.1)
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address; // Kembalikan IP lokal asli (Contoh: 192.168.1.104)
      }
    }
  }
  return 'localhost'; // Fallback jika tidak terhubung ke Wi-Fi / Jaringan
}

// ==================== MENJALANKAN SERVER ====================
app.listen(PORT, () => {
  const ipLokal = dapatkanIPNetwork();
  console.log(`==================================================`);
  console.log(`🚀 Server Gudang Aktif Berjalan!`);
  console.log(`💻 Local (Laptop): http://localhost:${PORT}`);
  console.log(`📱 Network (HP)   : http://${ipLokal}:${PORT}`);
  console.log(`==================================================`);
  console.log(`👉 Silakan buka link 'Network (HP)' di Chrome HP Abang`);
  console.log(`👉 Pastikan HP dan Laptop terhubung ke Wi-Fi yang sama`);
  console.log(`==================================================`);
});