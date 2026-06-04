// ==========================================================================
// SEKTOR 1: AUTHENTICATION, CONFIG & ROUTING
// ==========================================================================
const ADMIN_USERNAME = "Admin";
const ADMIN_PASSWORD = "gesnt123";

// URL Database Baru untuk project Gesnt Abang (Otomatis membuat berkas gudang.json)
const FIREBASE_DB_URL = "https://gesnt-f5eb1-default-rtdb.asia-southeast1.firebasedatabase.app/gudang.json";

let isLoggedIn = localStorage.getItem("gudang_session") === "true";

function aturVisibilitasHalaman() {
  const loginScreen = document.getElementById("halamanLogin");
  const mainScreen = document.getElementById("aplikasiUtama");

  if (isLoggedIn) {
    if (loginScreen) loginScreen.classList.add("hidden");
    if (mainScreen) mainScreen.classList.remove("hidden");
    
    // Ambil data terbaru dari Cloud Firebase begitu berhasil masuk
    muatDataDariServer();
  } else {
    if (loginScreen) loginScreen.classList.remove("hidden");
    if (mainScreen) mainScreen.classList.add("hidden");
  }
}

// Handle Form Login
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const userIn = document.getElementById("username").value;
    const passIn = document.getElementById("password").value;

    if (userIn === ADMIN_USERNAME && passIn === ADMIN_PASSWORD) {
      isLoggedIn = true;
      localStorage.setItem("gudang_session", "true");
      aturVisibilitasHalaman();
      tampilkanNotifikasi("Selamat datang, Admin!", "success");
    } else {
      tampilkanNotifikasi("Username atau Password salah!", "error");
    }
  });
}

// Log Out
function logout() {
  isLoggedIn = false;
  localStorage.removeItem("gudang_session");
  aturVisibilitasHalaman();
  tampilkanNotifikasi("Berhasil keluar sistem.", "info");
}

// Navigasi Tab Dashboard Utama
function gantiTab(tabId) {
  const semuaTab = ["tabDashboard", "tabBarang", "tabAlat", "tabPengaturan", "tabLog"];
  semuaTab.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });

  const tabAktif = document.getElementById(tabId);
  if (tabAktif) tabAktif.classList.remove("hidden");

  // Atur styling tombol navigasi yang aktif
  const semuaTombol = document.querySelectorAll(".nav-btn");
  semuaTombol.forEach(btn => btn.classList.remove("bg-emerald-700", "text-white"));
  
  const btnAktif = document.getElementById("btn-" + tabId);
  if (btnAktif) btnAktif.classList.add("bg-emerald-700", "text-white");
}


// ==========================================================================
// SEKTOR 2: AMBIL & SIMPAN DATA (CLOUD FIREBASE REST API)
// ==========================================================================
const placeholderImg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect width='18' height='18' x='3' y='3' rx='2' ry='2'/><circle cx='9' cy='9' r='2'/><path d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/></svg>";

let products = [];
let tools = [];
let listRak = ["RAK A-1 Depo", "Rak B-2 501", "Gudang Utama"];
let listKategoriAlat = ["Alat Kerja", "Perangkat IT"];
let logs = [];

// Memuat data dari server Firebase Cloud
async function muatDataDariServer() {
  try {
    const response = await fetch(FIREBASE_DB_URL);
    if (!response.ok) throw new Error("Gagal mengambil data cloud.");
    const data = await response.json();
    
    if (data) {
      products = data.products || [];
      tools = data.tools || [];
      listRak = data.listRak || ["RAK A-1 Depo", "Rak B-2 501", "Gudang Utama"];
      listKategoriAlat = data.listKategoriAlat || ["Alat Kerja", "Perangkat IT"];
      logs = data.logs || [];
    }
    
    refreshSemuaKomponenUI();
  } catch (error) {
    console.error("⚠️ Masalah sinkronisasi Firebase:", error);
    tampilkanNotifikasi("Gagal memuat data dari cloud. Berjalan dalam mode lokal.", "error");
  }
}

// Menyimpan data secara permanen ke server Firebase Cloud
async function simpanDanSiarkan() {
  const dataGudang = { products, tools, listRak, listKategoriAlat, logs };
  
  // Render UI lokal terlebih dahulu agar aplikasi terasa instan tanpa delay
  refreshSemuaKomponenUI();

  try {
    await fetch(FIREBASE_DB_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataGudang)
    });
  } catch (error) {
    console.error("❌ Sinkronisasi Cloud Gagal:", error);
    tampilkanNotifikasi("Gagal mencadangkan ke cloud. Periksa internet Anda.", "error");
  }
}

function refreshSemuaKomponenUI() {
  renderDashboard();
  renderTabelBarang();
  renderTabelAlat();
  renderOpsiPengaturan();
  renderRiwayatLog();
}


// ==========================================================================
// SEKTOR 3: MANAJEMEN BARANG (STOK & KEUANGAN)
// ==========================================================================
function renderTabelBarang() {
  const tbody = document.getElementById("tbodyBarang");
  if (!tbody) return;
  tbody.innerHTML = "";

  products.forEach((p, index) => {
    const totalHargaBeli = p.stok * p.hargaBeli;
    const totalHargaJual = p.stok * p.hargaJual;
    const estimasiProfit = totalHargaJual - totalHargaBeli;

    const tr = document.createElement("tr");
    tr.className = "border-b hover:bg-slate-50 text-sm text-slate-700";
    tr.innerHTML = `
      <td class="p-3 text-center">${index + 1}</td>
      <td class="p-3">
        <img src="${p.foto || placeholderImg}" class="w-12 h-12 object-cover rounded border bg-white mx-auto">
      </td>
      <td class="p-3 font-semibold text-slate-900">${p.nama}</td>
      <td class="p-3 text-center"><span class="px-2 py-1 bg-slate-100 rounded text-xs">${p.rak}</span></td>
      <td class="p-3 text-center font-bold text-emerald-600">${p.stok}</td>
      <td class="p-3 text-right">Rp ${p.hargaBeli.toLocaleString()}</td>
      <td class="p-3 text-right">Rp ${p.hargaJual.toLocaleString()}</td>
      <td class="p-3 text-right text-amber-600 font-medium">Rp ${estimasiProfit.toLocaleString()}</td>
      <td class="p-3 text-center">
        <div class="flex justify-center gap-1">
          <button onclick="ubahStokBarang(${index}, 1)" class="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-bold">+1</button>
          <button onclick="ubahStokBarang(${index}, -1)" class="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-bold">-1</button>
          <button onclick="hapusBarang(${index})" class="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded text-xs font-bold">Hapus</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function tambahBarangBaru(e) {
  e.preventDefault();
  const nama = document.getElementById("pNama").value;
  const rak = document.getElementById("pRak").value;
  const stok = parseInt(document.getElementById("pStok").value) || 0;
  const hargaBeli = parseInt(document.getElementById("pHargaBeli").value) || 0;
  const hargaJual = parseInt(document.getElementById("pHargaJual").value) || 0;
  const fileFoto = document.getElementById("pFoto").files[0];

  const prosesSimpan = (fotoBase64) => {
    products.push({ nama, rak, stok, hargaBeli, hargaJual, foto: fotoBase64 });
    tulisLog(`Menambahkan barang baru: ${nama} sebanyak ${stok} unit di ${rak}`);
    document.getElementById("formTambahBarang").reset();
    simpanDanSiarkan();
    tampilkanNotifikasi("Barang baru berhasil ditambahkan!", "success");
  };

  if (fileFoto) {
    const reader = new FileReader();
    reader.onloadend = () => prosesSimpan(reader.result);
    reader.readAsDataURL(fileFoto);
  } else {
    prosesSimpan("");
  }
}

function ubahStokBarang(index, jumlah) {
  const p = products[index];
  if (p.stok + jumlah < 0) {
    tampilkanNotifikasi("Stok tidak boleh minus!", "error");
    return;
  }
  p.stok += jumlah;
  tulisLog(`Mengubah stok ${p.nama}: ${jumlah > 0 ? '+' : ''}${jumlah} (Stok sekarang: ${p.stok})`);
  simpanDanSiarkan();
}

function hapusBarang(index) {
  if (confirm(`Hapus ${products[index].nama} dari database?`)) {
    tulisLog(`Menghapus barang: ${products[index].nama}`);
    products.splice(index, 1);
    simpanDanSiarkan();
    tampilkanNotifikasi("Barang berhasil dihapus.", "info");
  }
}


// ==========================================================================
// SEKTOR 4: MANAJEMEN ALAT KERJA / INVENTARIS IT
// ==========================================================================
function renderTabelAlat() {
  const tbody = document.getElementById("tbodyAlat");
  if (!tbody) return;
  tbody.innerHTML = "";

  tools.forEach((t, index) => {
    const tr = document.createElement("tr");
    tr.className = "border-b hover:bg-slate-50 text-sm text-slate-700";
    tr.innerHTML = `
      <td class="p-3 text-center">${index + 1}</td>
      <td class="p-3 font-semibold text-slate-900">${t.nama}</td>
      <td class="p-3 text-center"><span class="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">${t.kategori}</span></td>
      <td class="p-3 text-center font-bold text-blue-600">${t.jumlah}</td>
      <td class="p-3 text-center">
        <span class="px-2 py-1 rounded text-xs font-semibold ${t.status === 'Tersedia' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
          ${t.status}
        </span>
      </td>
      <td class="p-3 text-slate-500 text-xs">${t.keterangan || "-"}</td>
      <td class="p-3 text-center">
        <div class="flex justify-center gap-1">
          <button onclick="ubahStatusAlat(${index})" class="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium">Ubah Status</button>
          <button onclick="hapusAlat(${index})" class="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded text-xs font-medium">Hapus</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function tambahAlatBaru(e) {
  e.preventDefault();
  const nama = document.getElementById("tNama").value;
  const kategori = document.getElementById("tKategori").value;
  const jumlah = parseInt(document.getElementById("tJumlah").value) || 0;
  const status = document.getElementById("tStatus").value;
  const keterangan = document.getElementById("tKeterangan").value;

  tools.push({ nama, kategori, jumlah, status, keterangan });
  tulisLog(`Menambahkan aset alat: ${nama} (${jumlah} unit) - Status: ${status}`);
  document.getElementById("formTambahAlat").reset();
  simpanDanSiarkan();
  tampilkanNotifikasi("Alat kerja berhasil didaftarkan!", "success");
}

function ubahStatusAlat(index) {
  const t = tools[index];
  t.status = t.status === "Tersedia" ? "Dipinjam/Dipakai" : "Tersedia";
  tulisLog(`Mengubah status alat ${t.nama} menjadi: ${t.status}`);
  simpanDanSiarkan();
}

function hapusAlat(index) {
  if (confirm(`Hapus alat ${tools[index].nama}?`)) {
    tulisLog(`Menghapus alat: ${tools[index].nama}`);
    tools.splice(index, 1);
    simpanDanSiarkan();
    tampilkanNotifikasi("Alat berhasil dihapus.", "info");
  }
}


// ==========================================================================
// SEKTOR 5: DASHBOARD ANALYTICS & LOGIC KALKULASI PENGELUARAN OPERASIONAL
// ==========================================================================
function renderDashboard() {
  // Ambil nilai pengeluaran operasional dari LocalStorage (bersifat dinamis per perangkat/sesi kerja)
  const biayaTenagaKerja = parseInt(localStorage.getItem("ops_tenaga_kerja")) || 0;
  const biayaTransport = parseInt(localStorage.getItem("ops_transport")) || 0;

  // Set nilai input agar tidak hilang saat halaman di-refresh
  if (document.getElementById("inputTenagaKerja")) document.getElementById("inputTenagaKerja").value = biayaTenagaKerja;
  if (document.getElementById("inputTransport")) document.getElementById("inputTransport").value = biayaTransport;

  let totalStokBarang = 0;
  let totalAsetAlat = 0;
  let akumulasiModalBeli = 0;
  let akumulasiOmzetJual = 0;

  products.forEach(p => {
    totalStokBarang += p.stok;
    akumulasiModalBeli += (p.stok * p.hargaBeli);
    akumulasiOmzetJual += (p.stok * p.hargaJual);
  });

  tools.forEach(t => {
    totalAsetAlat += t.jumlah;
  });

  // Perhitungan Keuntungan Kotor dan Keuntungan Bersih (Dikurangi Biaya Tenaga Kerja & Transportasi)
  const untungKotor = akumulasiOmzetJual - akumulasiModalBeli;
  const totalPengeluaranTambahan = biayaTenagaKerja + biayaTransport;
  const untungBersih = untungKotor - totalPengeluaranTambahan;

  // Suntik Nilai ke Elemen Dashboard Ringkasan
  if (document.getElementById("dashStokBarang")) document.getElementById("dashStokBarang").innerText = totalStokBarang.toLocaleString();
  if (document.getElementById("dashTotalAlat")) document.getElementById("dashTotalAlat").innerText = totalAsetAlat.toLocaleString();
  if (document.getElementById("dashModalBeli")) document.getElementById("dashModalBeli").innerText = "Rp " + akumulasiModalBeli.toLocaleString();
  
  const elUntungBersih = document.getElementById("dashUntungBersih");
  if (elUntungBersih) {
    elUntungBersih.innerText = "Rp " + untungBersih.toLocaleString();
    if (untungBersih < 0) {
      elUntungBersih.className = "text-2xl font-bold text-rose-600";
    } else {
      elUntungBersih.className = "text-2xl font-bold text-emerald-600";
    }
  }
}

// Fungsi Trigger Saat Mengubah Nilai Input Pengeluaran Tenaga Kerja & Transport
function hitungUlangOperasional() {
  const biayaTenagaKerja = parseInt(document.getElementById("inputTenagaKerja").value) || 0;
  const biayaTransport = parseInt(document.getElementById("inputTransport").value) || 0;

  // Kunci ke penyimpanan lokal agar persisten
  localStorage.setItem("ops_tenaga_kerja", biayaTenagaKerja);
  localStorage.setItem("ops_transport", biayaTransport);

  // Kalkulasi ulang seluruh layar utama
  renderDashboard();
  tampilkanNotifikasi("Biaya operasional diperbarui!", "info");
}


// ==========================================================================
// SEKTOR 6: RIWAYAT AKTIVITAS & PANEL PENGATURAN DATA RAK
// ==========================================================================
function tulisLog(pesan) {
  const waktu = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
  logs.unshift({ waktu, pesan });
  
  // Batasi agar riwayat log cloud tidak membengkak terlalu besar (Max 150 baris)
  if (logs.length > 150) logs.pop();
}

function renderRiwayatLog() {
  const container = document.getElementById("containerLog");
  if (!container) return;
  container.innerHTML = "";

  if (logs.length === 0) {
    container.innerHTML = `<p class="text-slate-400 text-sm italic">Belum ada riwayat aktivitas gudang.</p>`;
    return;
  }

  logs.forEach(l => {
    const div = document.createElement("div");
    div.className = "p-2 border-b border-slate-100 text-xs text-slate-600 flex justify-between gap-4 hover:bg-slate-50";
    div.innerHTML = `
      <span class="font-medium text-slate-800">${l.pesan}</span>
      <span class="text-slate-400 shrink-0">${l.waktu}</span>
    `;
    container.appendChild(div);
  });
}

function renderOpsiPengaturan() {
  // Update pilihan lokasi Rak pada Dropdown Form Tambah Barang
  const pRakSelect = document.getElementById("pRak");
  if (pRakSelect) {
    pRakSelect.innerHTML = "";
    listRak.forEach(rak => {
      pRakSelect.innerHTML += `<option value="${rak}">${rak}</option>`;
    });
  }

  // Update pilihan Kategori Alat pada Dropdown Form Tambah Alat
  const tKategoriSelect = document.getElementById("tKategori");
  if (tKategoriSelect) {
    tKategoriSelect.innerHTML = "";
    listKategoriAlat.forEach(kat => {
      tKategoriSelect.innerHTML += `<option value="${kat}">${kat}</option>`;
    });
  }

  // Render Daftar List Manajemen Rak di Tab Pengaturan
  const listRakContainer = document.getElementById("listRakPengaturan");
  if (listRakContainer) {
    listRakContainer.innerHTML = "";
    listRak.forEach((rak, idx) => {
      listRakContainer.innerHTML += `
        <div class="flex justify-between items-center bg-slate-50 p-2 border rounded mb-1 text-sm">
          <span>${rak}</span>
          <button onclick="hapusOpsiPengaturan('rak', ${idx})" class="text-rose-500 font-bold hover:text-rose-700">×</button>
        </div>
      `;
    });
  }
}

function tambahOpsiPengaturan(jenis) {
  if (jenis === 'rak') {
    const input = document.getElementById("inputRakBaru");
    const nilai = input.value.trim();
    if (nilai && !listRak.includes(nilai)) {
      listRak.push(nilai);
      input.value = "";
      tulisLog(`Menambahkan opsi lokasi rak baru: ${nilai}`);
      simpanDanSiarkan();
    }
  }
}

function hapusOpsiPengaturan(jenis, idx) {
  if (jenis === 'rak') {
    tulisLog(`Menghapus opsi lokasi rak: ${listRak[idx]}`);
    listRak.splice(idx, 1);
    simpanDanSiarkan();
  }
}

function bersihkanSeluruhLog() {
  if (confirm("Apakah Anda yakin ingin menghapus seluruh riwayat log aktivitas?")) {
    logs = [];
    tulisLog("Riwayat log aktivitas telah dibersihkan oleh Admin.");
    simpanDanSiarkan();
    tampilkanNotifikasi("Seluruh riwayat log dibersihkan.", "info");
  }
}


// ==========================================================================
// SEKTOR 7: FITUR CETAK LAPORAN LAPORAN (PRINT PREVIEW)
// ==========================================================================
function cetakLaporanGudang() {
  const w = window.open();
  let barisBarang = "";
  let akumulasiModal = 0;
  let akumulasiOmzet = 0;

  products.forEach((p, idx) => {
    const modal = p.stok * p.hargaBeli;
    const omzet = p.stok * p.hargaJual;
    akumulasiModal += modal;
    akumulasiOmzet += omzet;

    barisBarang += `
      <tr>
        <td style="text-align:center">${idx+1}</td>
        <td>${p.nama}</td>
        <td>${p.rak}</td>
        <td style="text-align:center">${p.stok}</td>
        <td style="text-align:right">Rp ${p.hargaBeli.toLocaleString()}</td>
        <td style="text-align:right">Rp ${p.hargaJual.toLocaleString()}</td>
        <td style="text-align:right">Rp ${(omzet - modal).toLocaleString()}</td>
      </tr>
    `;
  });

  const bTenaga = parseInt(localStorage.getItem("ops_tenaga_kerja")) || 0;
  const bTransport = parseInt(localStorage.getItem("ops_transport")) || 0;
  const untungBersih = (akumulasiOmzet - akumulasiModal) - (bTenaga + bTransport);

  w.document.write(`
    <html>
    <head>
      <title>Laporan Inventaris Hijrah Agro Mandiri</title>
      <style>
        body { font-family: sans-serif; padding: 20px; color: #333; }
        h2 { margin-bottom: 5px; color: #047857; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 13px; }
        th { bg-color: #f4f4f5; font-weight: bold; }
        .ringkasan { margin-top: 30px; float: right; width: 350px; }
        .ringkasan table td { border: none; padding: 4px; font-size: 14px; }
      </style>
    </head>
    <body>
      <h2>LAPORAN DATA INVENTARIS GUDANG</h2>
      <p style="font-size:12px; color:#666; margin-top:0;">Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
      
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Nama Barang</th>
            <th>Lokasi Rak</th>
            <th>Stok</th>
            <th>Harga Beli</th>
            <th>Harga Jual</th>
            <th>Estimasi Profit</th>
          </tr>
        </thead>
        <tbody>
          ${barisBarang || '<tr><td colspan="7" style="text-align:center">Data barang kosong</td></tr>'}
        </tbody>
      </table>

      <div class="ringkasan">
        <table>
          <tr><td>Total Nilai Aset (Modal)</td><td>:</td><td style="text-align:right">Rp ${akumulasiModal.toLocaleString()}</td></tr>
          <tr><td>Estimasi Omzet Kotor</td><td>:</td><td style="text-align:right">Rp ${akumulasiOmzet.toLocaleString()}</td></tr>
          <tr><td>Biaya Tenaga Kerja</td><td>:</td><td style="text-align:right; color:#e11d48">- Rp ${bTenaga.toLocaleString()}</td></tr>
          <tr><td>Biaya Transportasi</td><td>:</td><td style="text-align:right; color:#e11d48">- Rp ${bTransport.toLocaleString()}</td></tr>
          <tr style="font-weight:bold; font-size:16px; color:#047857;">
            <td>Keuntungan Bersih</td><td>:</td><td style="text-align:right">Rp ${untungBersih.toLocaleString()}</td></tr>
        </table>
      </div>

      <script>window.print();</script>
    </body>
    </html>
  `);
  w.document.close();
}


// ==========================================================================
// SEKTOR 8: UI NOTIFIKASI TOAST & INITIALIZATION RUNNER
// ==========================================================================
function tampilkanNotifikasi(pesan, tipe = "info") {
  const wadah = document.getElementById("wadahToast") || createToastContainer();
  const toast = document.createElement("div");
  
  let bgClass = "bg-slate-800";
  if (tipe === "success") bgClass = "bg-emerald-600";
  if (tipe === "error") bgClass = "bg-rose-600";
  if (tipe === "info") bgClass = "bg-blue-600";

  toast.className = `${bgClass} text-white text-sm px-4 py-3 rounded-xl shadow-lg transition-all duration-300 transform translate-y-2 opacity-0 flex items-center gap-2`;
  toast.innerText = pesan;

  wadah.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove("translate-y-2", "opacity-0");
  }, 10);

  setTimeout(() => {
    toast.classList.add("translate-y-2", "opacity-0");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function createToastContainer() {
  const container = document.createElement("div");
  container.id = "wadahToast";
  container.className = "fixed bottom-5 right-5 z-50 flex flex-col gap-2";
  document.body.appendChild(container);
  return container;
}

// Inisialisasi Aplikasi Saat Browser Selesai Dimuat
document.addEventListener("DOMContentLoaded", function () {
  // Pasang trigger event ke submit form
  const fBarang = document.getElementById("formTambahBarang");
  if (fBarang) fBarang.addEventListener("submit", tambahBarangBaru);

  const fAlat = document.getElementById("formTambahAlat");
  if (fAlat) fAlat.addEventListener("submit", tambahAlatBaru);

  // Jalankan routing halaman
  aturVisibilitasHalaman();
});