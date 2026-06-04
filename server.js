const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;
const DB_FILE = path.join(__dirname, 'database.json');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Limit besar agar bisa menampung upload foto base64
app.use(express.static(__dirname)); // Melayani file frontend (index.html, script.js, dll)

// Fungsi helper untuk membaca data dari database.json
const bacaDatabase = () => {
  try {
    const dataRaw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(dataRaw);
  } catch (error) {
    console.error("Gagal membaca database, menggunakan fallback kosongan:", error);
    return { products: [], tools: [], listRak: [], listKategoriAlat: [], logs: [] };
  }
};

// Fungsi helper untuk menulis data ke database.json
const tulisDatabase = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error("Gagal menulis ke database:", error);
    return false;
  }
};

// ==================== ENDPOINT API ====================

// 1. Ambil semua data gudang
app.get('/api/gudang', (req, res) => {
  const dbData = bacaDatabase();
  res.json(dbData);
});

// 2. Simpan/Update semua data gudang (Sinkronisasi Massal)
app.post('/api/gudang', (req, res) => {
  const dataBaru = req.body;
  
  if (!dataBaru.products || !dataBaru.tools) {
    return res.status(400).json({ success: false, message: "Format data tidak valid!" });
  }

  const berhasil = tulisDatabase(dataBaru);
  if (berhasil) {
    res.json({ success: true, message: "Database berhasil diperbarui di server." });
  } else {
    res.status(500).json({ success: false, message: "Gagal menyimpan data ke server." });
  }
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 Server Gudang Aktif Berjalan!`);
  console.log(`📱 Akses lokal/HP via IP Network yang tertera di terminal`);
  console.log(`==================================================`);
});