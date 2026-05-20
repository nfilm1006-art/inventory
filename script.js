// ==================== SEKTOR 1: AUTHENTICATION (LOGIN SYSTEMS) ====================
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "gesnt123";

let isLoggedIn = localStorage.getItem("gudang_session") === "true";

function aturVisibilitasHalaman() {
  const loginScreen = document.getElementById("halamanLogin");
  const mainScreen = document.getElementById("aplikasiUtama");

  if (isLoggedIn) {
    loginScreen.classList.add("hidden");
    mainScreen.classList.remove("hidden");
    renderAplikasi(); 
  } else {
    loginScreen.classList.remove("hidden");
    mainScreen.classList.add("hidden");
  }
}

document.getElementById("formLogin").addEventListener("submit", (e) => {
  e.preventDefault();
  const user = document.getElementById("loginUsername").value;
  const pass = document.getElementById("loginPassword").value;
  const errMsg = document.getElementById("errorLogin");

  if (user === ADMIN_USERNAME && pass === ADMIN_PASSWORD) {
    isLoggedIn = true;
    localStorage.setItem("gudang_session", "true");
    errMsg.classList.add("hidden");
    e.target.reset();
    aturVisibilitasHalaman();
    catatAktivitas("🔑 Pengguna 'admin' berhasil login ke sistem.");
    simpanDanSiarkan();
  } else {
    errMsg.classList.remove("hidden");
  }
});

document.getElementById("btnLogout").addEventListener("click", () => {
  if (confirm("Apakah Anda ingin keluar dari sistem logistik?")) {
    isLoggedIn = false;
    localStorage.removeItem("gudang_session");
    aturVisibilitasHalaman();
  }
});


// ==================== SEKTOR 2: MANAGEMEN DATA GUDANG REAL-TIME ====================
const placeholderImg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect width='18' height='18' x='3' y='3' rx='2' ry='2'/><circle cx='9' cy='9' r='2'/><path d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/></svg>";

const initialInventory = [
  { id: '1', nama: 'Kabel Belden CAT5', stok: 25, minimalStok: 10, rak: 'RAK A-1 Depo', foto: placeholderImg },
  { id: '2', nama: 'Mur 14', stok: 4, minimalStok: 12, rak: 'Rak B-2 501', foto: placeholderImg },
  { id: '3', nama: 'Cat semprot putih', stok: 30, minimalStok: 5, rak: 'Rak C-1 501', foto: placeholderImg },
];

let products = JSON.parse(localStorage.getItem('gudang_data_foto')) || initialInventory;
let logs = JSON.parse(localStorage.getItem('gudang_logs')) || [
  { teks: "Sistem diinisialisasi berhasil.", waktu: new Date().toLocaleTimeString() }
];

const channel = new BroadcastChannel('gudang_realtime_total_channel');

function mainkanSuaraAlarm() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
  gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); 
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.15);
}

function catatAktivitas(teks) {
  const logBaru = { teks: teks, waktu: new Date().toLocaleTimeString() };
  logs.unshift(logBaru); 
  if (logs.length > 30) logs.pop(); 
}

function renderAplikasi() {
  if (!isLoggedIn) return; 

  const tabelBodi = document.getElementById('tabelBodi');
  const kontainerNotifikasi = document.getElementById('kontainerNotifikasi');
  const badgeAlert = document.getElementById('badgeAlert');
  const kontainerLog = document.getElementById('kontainerLog');
  
  tabelBodi.innerHTML = '';
  kontainerNotifikasi.innerHTML = '';
  kontainerLog.innerHTML = '';
  let jumlahAlert = 0;

  products.forEach(item => {
    const isKritis = Number(item.stok) <= Number(item.minimalStok);
    
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-750 transition-colors border-b border-slate-700/50';
    tr.innerHTML = `
      <td class="px-6 py-3 whitespace-nowrap">
        <img src="${item.foto || placeholderImg}" alt="${item.nama}" class="w-12 h-12 object-cover rounded-lg bg-slate-900 border border-slate-700 shadow-inner" />
      </td>
      <td class="px-6 py-3 font-medium text-white">${item.nama}</td>
      <td class="px-6 py-3 text-center"><span class="font-mono bg-slate-900 px-2 py-0.5 rounded text-slate-400 text-xs">${item.rak}</span></td>
      <td class="px-6 py-3 text-center">
        <span class="px-3 py-1 rounded-full font-bold text-xs ${isKritis ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400'}">
          ${item.stok} Pcs
        </span>
      </td>
      <td class="px-6 py-3 text-center text-slate-400">${item.minimalStok} Pcs</td>
      <td class="px-6 py-3 text-center">
        <div class="flex justify-center gap-1">
          <button data-id="${item.id}" data-aksi="kurang" class="bg-slate-700 hover:bg-slate-600 text-white text-xs px-2.5 py-1 rounded transition font-bold">-1</button>
          <button data-id="${item.id}" data-aksi="tambah" class="bg-slate-700 hover:bg-slate-600 text-white text-xs px-2.5 py-1 rounded transition font-bold">+1</button>
        </div>
      </td>
      <td class="px-6 py-3 text-center">
        <button data-id="${item.id}" data-aksi="hapus" class="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white text-xs px-3 py-1.5 rounded transition border border-red-500/20 flex items-center gap-1 mx-auto">🗑️ Hapus</button>
      </td>
    `;
    tabelBodi.appendChild(tr);

    if (isKritis) {
      jumlahAlert++;
      const alertDiv = document.createElement('div');
      alertDiv.className = 'bg-red-950/40 border-l-4 border-red-500 p-3 rounded-r-lg shadow-md border border-y-slate-700 border-r-slate-700 flex gap-3 items-center';
      alertDiv.innerHTML = `
        <img src="${item.foto || placeholderImg}" class="w-10 h-10 object-cover rounded bg-slate-900 border border-red-500/20" />
        <div>
          <p class="text-xs text-red-200 font-medium">⚠️ Stok ${item.nama} kritis! Sisa ${item.stok} Pcs</p>
          <span class="text-[9px] text-red-400 block mt-0.5 font-mono">LIVE MONITORING</span>
        </div>
      `;
      kontainerNotifikasi.appendChild(alertDiv);
    }
  });

  badgeAlert.innerText = `${jumlahAlert} Terdeteksi`;
  if (jumlahAlert === 0) {
    kontainerNotifikasi.innerHTML = `<div class="text-center text-slate-500 pt-10 text-sm"><p>✅ Stok aman terkendali.</p></div>`;
  }

  logs.forEach(log => {
    const logDiv = document.createElement('div');
    logDiv.className = 'flex justify-between items-start py-1 border-b border-slate-700/30 text-slate-300 hover:text-white';
    logDiv.innerHTML = `
      <span class="break-all pr-2">➡️ ${log.teks}</span>
      <span class="text-slate-500 shrink-0">${log.waktu}</span>
    `;
    kontainerLog.appendChild(logDiv);
  });
}

function simpanDanSiarkan() {
  localStorage.setItem('gudang_data_foto', JSON.stringify(products));
  localStorage.setItem('gudang_logs', JSON.stringify(logs));
  renderAplikasi();
  channel.postMessage({ products, logs });
}

channel.onmessage = (event) => {
  products = event.data.products;
  logs = event.data.logs;
  renderAplikasi();
};

document.getElementById('formBarang').addEventListener('submit', (e) => {
  e.preventDefault();
  const nama = document.getElementById('inputNama').value;
  const rak = document.getElementById('inputRak').value || '-';
  const stok = Number(document.getElementById('inputStok').value);
  const minimalStok = Number(document.getElementById('inputMin').value);
  const fileFoto = document.getElementById('inputFoto').files[0];

  const buatBarangBaru = (fotoUrl) => {
    const barangBaru = { id: Date.now().toString(), nama, rak, stok, minimalStok, foto: fotoUrl };
    products.push(barangBaru);
    catatAktivitas(`Menambahkan item baru "${nama}" (Stok: ${stok})`);
    if (stok <= minimalStok) mainkanSuaraAlarm();
    simpanDanSiarkan();
    e.target.reset();
  };

  if (fileFoto) {
    const reader = new FileReader();
    reader.onload = function(event) { buatBarangBaru(event.target.result); };
    reader.readAsDataURL(fileFoto);
  } else {
    buatBarangBaru(placeholderImg);
  }
});

document.getElementById('tabelBodi').addEventListener('click', (e) => {
  const tombol = e.target.closest('button');
  if (!tombol) return;

  const aksi = tombol.getAttribute('data-aksi');
  const id = tombol.getAttribute('data-id');
  if (!aksi || !id) return;

  const itemTerpilih = products.find(p => p.id === id);
  if (!itemTerpilih) return;

  if (aksi === 'hapus') {
    const konfirmasi = confirm(`Hapus "${itemTerpilih.nama}" dari gudang?`);
    if (konfirmasi) {
      catatAktivitas(`Menghapus produk "${itemTerpilih.nama}" dari sistem`);
      products = products.filter(item => item.id !== id);
      simpanDanSiarkan();
    }
    return;
  }

  let pembatalanAksi = false;
  let catatanLogTambahan = "";

  if (aksi === 'kurang') {
    const alasan = prompt(`Mengurangi stok untuk "${itemTerpilih.nama}". Masukkan keterangan penggunaan/alasan (wajib isi):`);
    if (alasan === null) {
      pembatalanAksi = true;
    } else if (alasan.trim() === "") {
      alert("⚠️ Pengurangan stok dibatalkan karena keterangan tidak diisi.");
      pembatalanAksi = true;
    } else {
      catatanLogTambahan = ` [Ket: ${alasan.trim()}]`;
    }
  }

  if (pembatalanAksi) return;

  products = products.map(item => {
    if (item.id === id) {
      let stokBaru = item.stok;
      if (aksi === 'tambah') {
        stokBaru += 1;
        catatAktivitas(`Stok "${item.nama}" bertambah menjadi ${stokBaru}`);
      }
      if (aksi === 'kurang') {
        stokBaru = Math.max(0, item.stok - 1);
        catatAktivitas(`Stok "${item.nama}" berkurang menjadi ${stokBaru}.${catatanLogTambahan}`);
        if (stokBaru <= item.minimalStok && item.stok > item.minimalStok) {
          mainkanSuaraAlarm();
        }
      }
      return { ...item, stok: stokBaru };
    }
    return item;
  });

  simpanDanSiarkan();
});

document.getElementById('btnBersihkanLog').addEventListener('click', () => {
  const PASSWORD_RAHASIA = "gudang123"; 
  const inputPassword = prompt("🔐 Area Terbatas! Masukkan password admin untuk menghapus log:");
  if (inputPassword === null) return;

  if (inputPassword === PASSWORD_RAHASIA) {
    if (confirm("Apakah Anda yakin ingin menghapus seluruh log?")) {
      logs = [{ teks: "Log dibersihkan oleh Admin Utama.", waktu: new Date().toLocaleTimeString() }];
      catatAktivitas("⚠️ SELURUH LOG SEBELUMNYA TELAH DIHAPUS OLEH ADMIN");
      simpanDanSiarkan();
    }
  } else {
    alert("❌ Password Salah!");
    catatAktivitas("🛑 Percobaan penghapusan log gagal (Password Salah)");
    simpanDanSiarkan();
  }
});


// ==================== SEKTOR 3: EKSPOR EXCEL GENERATOR SYSTEM ====================
document.getElementById('btnDownloadExcel').addEventListener('click', () => {
  if (logs.length === 0) {
    alert("⚠️ Tidak ada data aktivitas untuk diunduh!");
    return;
  }

  // Persiapan Struktur Data Kolom Excel
  const barisExcel = [
    ["WAKTU", "AKTIVITAS / PERUBAHAN SISTEM", "KETERANGAN PENGGUNAAN"] // Header Excel
  ];

  // Memecah teks log untuk memisahkan bagian '[Ket: ...]' ke kolom tersendiri
  logs.forEach(log => {
    let teksAktivitas = log.teks;
    let teksKeterangan = "-";

    // Mencari pattern teks [Ket: ...] menggunakan Regex baku
    const regexKet = /\[Ket:\s*(.*?)\]/;
    const cocok = teksAktivitas.match(regexKet);

    if (cocok) {
      teksKeterangan = cocok[1]; // Ambil isi dalam kurung siku
      teksAktivitas = teksAktivitas.replace(regexKet, "").trim(); // Bersihkan teks utama dari kode kurung
    }

    barisExcel.push([log.waktu, teksAktivitas, teksKeterangan]);
  });

  // Membuka engine pembuat spreadsheet SheetJS
  const lembarKerja = XLSX.utils.aoa_to_sheet(barisExcel);
  const bukuKerja = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(bukuKerja, lembarKerja, "Log Aktivitas");

  // Atur lebar otomatis tiap kolom supaya tidak terpotong
  lembarKerja["!cols"] = [
    { wch: 15 }, // Kolom Waktu
    { wch: 55 }, // Kolom Aktivitas
    { wch: 35 }  // Kolom Keterangan
  ];

  // Eksekusi Download Berkas Langsung di Browser
  const namaFile = `Log_Gudang_${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(bukuKerja, namaFile);
});

aturVisibilitasHalaman();