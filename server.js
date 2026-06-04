const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 8080;
const DB_FILE = path.join(__dirname, 'database.json');

// Middleware wajib
app.use(cors());
app.use(express.json({ limit: '50mb' })); 
app.use(express.static(__dirname)); 

// Fungsi membaca database dengan aman
const bacaDatabase = () => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const strukturAwal = { products: [], tools: [], listRak: ["RAK A-1 Depo", "Rak B-2 501", "Gudang Utama"], listKategoriAlat: ["Alat Kerja", "Perangkat IT"], logs: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(strukturAwal, null, 2), 'utf8');
      console.log("ℹ️ File database.json baru berhasil dibuat.");
      return strukturAwal;
    }
    const dataRaw = fs.readFileSync(DB_FILE, 'utf8');
    // Jika file ada tapi isinya kosong melompong, isi dengan struktur dasar
    if (!dataRaw.trim()) {
      return { products: [], tools: [], listRak: ["RAK A-1 Depo", "Rak B-2 501"], listKategoriAlat: ["Alat Kerja"], logs: [] };
    }
    return JSON.parse(dataRaw);
  } catch (error) {
    console.error("❌ Error saat membaca database:", error.message);
    return { products: [], tools: [], listRak: [], listKategoriAlat: [], logs: [] };
  }
};

// Fungsi menulis database ke harddisk secara permanen
const tulisDatabase = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log("💾 [BERHASIL] Data sukses dikunci ke database.json!");
    return true;
  } catch (error) {
    console.error("❌ [GAGAL ENKREPSI] Tidak bisa menulis ke database.json. Alasan:", error.message);
    return false;
  }
};

// API Endpoint untuk mengambil data
app.get('/api/gudang', (req, res) => {
  console.log("📥 Browser meminta data gudang terbaru...");
  res.json(bacaDatabase());
});

// API Endpoint untuk menyimpan data
app.post('/api/gudang', (req, res) => {
  console.log("📤 Menerima kiriman data baru dari frontend...");
  const berhasil = tulisDatabase(req.body);
  if (berhasil) {
    res.json({ success: true, message: "Database berhasil diperbarui secara permanen." });
  } else {
    res.status(500).json({ success: false, message: "Gagal menulis ke database harian." });
  }
});

// Mendeteksi IP Wi-Fi otomatis agar HP bisa terhubung
function dapatkanIPNetwork() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Menjalankan Server Pusat
app.listen(PORT, () => {
  const ipLokal = dapatkanIPNetwork();
  console.log(`==================================================`);
  console.log(`🚀 SERVER GUDANG AKTIF DAN BERJALAN LOG!`);
  console.log(`💻 Link Laptop : http://localhost:${PORT}`);
  console.log(`📱 Link HP     : http://${ipLokal}:${PORT}`);
  console.log(`==================================================`);
});