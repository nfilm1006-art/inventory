import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8080; // Kita sesuaikan dengan port di log terminal Abang

// Middleware
app.use(cors());
app.use(express.json());

// Membaca file statis (index.html, script.js) langsung dari root folder
app.use(express.static(__dirname));

// Route utama untuk memuat halaman index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 SERVER GUDANG AKTIF DAN BERJALAN LOG!`);
    console.log(`💻 Link Laptop : http://localhost:${PORT}`);
    console.log(`=========================================`);
});