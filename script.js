// ==================== SEKTOR 1: AUTHENTICATION (LOGIN SYSTEMS) ====================
const ADMIN_USERNAME = "Admin";
const ADMIN_PASSWORD = "gesnt123";

let isLoggedIn = localStorage.getItem("gudang_session") === "true";

function aturVisibilitasHalaman() {
  const loginScreen = document.getElementById("halamanLogin");
  const mainScreen = document.getElementById("aplikasiUtama");

  if (isLoggedIn) {
    if (loginScreen) loginScreen.classList.add("hidden");
    if (mainScreen) mainScreen.classList.remove("hidden");
    
    // Memberikan jeda aman agar DOM HTML siap sepenuhnya sebelum merender data
    setTimeout(() => {
      renderAplikasi();
    }, 50); 
  } else {
    if (loginScreen) loginScreen.classList.remove("hidden");
    if (mainScreen) mainScreen.classList.add("hidden");
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
    if (errMsg) errMsg.classList.add("hidden");
    e.target.reset();
    aturVisibilitasHalaman();
    catatAktivitas("🔑 Pengguna 'admin' berhasil login ke sistem.");
    simpanDanSiarkan();
  } else {
    if (errMsg) errMsg.classList.remove("hidden");
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
  { id: '1', nama: 'Kabel Belden Cat5', stok: 220, minimalStok: 10, rak: 'RAK A-1 Depo', foto: placeholderImg },
  { id: '2', nama: 'Mur 14', stok: 4, minimalStok: 12, rak: 'Rak B-2 501', foto: placeholderImg },
  { id: '3', nama: 'Cat semprot putih', stok: 30, minimalStok: 5, rak: 'Rak C-1 501', foto: placeholderImg },
];

// Daftar lokasi rak bawaan (default) jika local storage kosong
const initialRacks = ['RAK A-1 Depo', 'Rak B-2 501', 'Rak C-1 501', 'Gudang Utama', 'Lainnya'];

let products = JSON.parse(localStorage.getItem('gudang_data_foto')) || initialInventory;
let listRak = JSON.parse(localStorage.getItem('gudang_list_rak')) || initialRacks;

// Log inisialisasi default awal dengan menyertakan format tanggal utuh
let logs = JSON.parse(localStorage.getItem('gudang_logs')) || [
  { teks: "Sistem diinisialisasi berhasil.", waktu: `${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}` }
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

// Mencatat aktivitas sistem dengan struktur Tanggal + Waktu lengkap
function catatAktivitas(teks) {
  const tgl = new Date().toLocaleDateString('id-ID');
  const jam = new Date().toLocaleTimeString('id-ID');
  const logBaru = { teks: teks, waktu: `${tgl} ${jam}` };
  logs.unshift(logBaru); 
  if (logs.length > 30) logs.pop(); 
}

// Sinkronisasi opsi isian pada menu dropdown input barang dan filter rak
function renderDropdownRak() {
  const inputRakSelect = document.getElementById('inputRak');
  const filterRakSelect = document.getElementById('filterRak');
  
  // Guard Pembatas: Jika elemen HTML belum siap/tampil, hentikan fungsi agar tidak crash
  if (!inputRakSelect || !filterRakSelect) return;

  const selectedInputVal = inputRakSelect.value;
  const selectedFilterVal = filterRakSelect.value || 'SEMUA';

  // Gambar opsi di Form Tambah Barang
  inputRakSelect.innerHTML = '';
  listRak.forEach(rak => {
    const opt = document.createElement('option');
    opt.value = rak;
    opt.innerText = rak;
    inputRakSelect.appendChild(opt);
  });
  if (listRak.includes(selectedInputVal)) inputRakSelect.value = selectedInputVal;

  // Gambar opsi di Menu Filter Monitoring
  filterRakSelect.innerHTML = '<option value="SEMUA">✨ Tampilkan Semua Lokasi</option>';
  listRak.forEach(rak => {
    const opt = document.createElement('option');
    opt.value = rak;
    opt.innerText = rak;
    filterRakSelect.appendChild(opt);
  });
  filterRakSelect.value = selectedFilterVal;
}

function renderAplikasi() {
  if (!isLoggedIn) return; 

  const tabelBodi = document.getElementById('tabelBodi');
  const kontainerNotifikasi = document.getElementById('kontainerNotifikasi');
  const badgeAlert = document.getElementById('badgeAlert');
  const kontainerLog = document.getElementById('kontainerLog');
  const filterRak = document.getElementById('filterRak');
  
  if (!tabelBodi) return; 
  
  // Sinkronisasikan isi dropdown terlebih dahulu
  renderDropdownRak();
  
  tabelBodi.innerHTML = '';
  if (kontainerNotifikasi) kontainerNotifikasi.innerHTML = '';
  if (kontainerLog) kontainerLog.innerHTML = '';
  let jumlahAlert = 0;

  // Mendapatkan filter lokasi yang saat ini sedang aktif dipilih admin
  const lokasiDipilih = filterRak ? filterRak.value : 'SEMUA';
  
  products.forEach(item => {
    // Logika pemfilteran lokasi rak secara real-time
    if (lokasiDipilih !== 'SEMUA' && item.rak !== lokasiDipilih) {
      return; // Lewati baris data ini jika tidak sesuai filter lokasi
    }

    const isKritis = Number(item.stok) <= Number(item.minimalStok);
    
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-750 transition-colors border-b border-slate-700/50';
    tr.innerHTML = `
      <td class="px-4 py-3 text-left whitespace-nowrap">
        <img src="${item.foto || placeholderImg}" alt="${item.nama}" class="w-10 h-10 md:w-12 md:h-12 object-cover rounded-lg bg-slate-900 border border-slate-700 shadow-inner" />
      </td>
      <td class="px-4 py-3 font-medium text-white text-left break-words">
        ${item.nama}
      </td>
      <td class="px-4 py-3 text-center whitespace-nowrap">
        <span class="font-mono bg-slate-900 px-2.5 py-1 rounded text-slate-400 text-[11px] md:text-xs border border-slate-700/50">
          ${item.rak}
        </span>
      </td>
      <td class="px-4 py-3 text-center whitespace-nowrap">
        <span class="px-3 py-1 rounded-full font-bold text-[11px] md:text-xs inline-block ${isKritis ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}">
          ${item.stok} Pcs
        </span>
      </td>
      <td class="px-4 py-3 text-center text-slate-400 font-medium whitespace-nowrap">
        ${item.minimalStok} Pcs
      </td>
      <td class="px-4 py-3 text-center whitespace-nowrap">
        <div class="flex justify-center gap-1.5">
          <button data-id="${item.id}" data-aksi="kurang" class="bg-slate-700 hover:bg-slate-600 active:scale-95 text-white text-xs px-2.5 py-1 rounded transition font-bold select-none">-1</button>
          <button data-id="${item.id}" data-aksi="tambah" class="bg-slate-700 hover:bg-slate-600 active:scale-95 text-white text-xs px-2.5 py-1 rounded transition font-bold select-none">+1</button>
        </div>
      </td>
      <td class="px-4 py-3 text-center whitespace-nowrap">
        <button data-id="${item.id}" data-aksi="hapus" class="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white text-xs px-2.5 py-1.5 rounded transition border border-red-500/20 flex items-center justify-center mx-auto select-none">
          🗑️
        </button>
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
      if (kontainerNotifikasi) kontainerNotifikasi.appendChild(alertDiv);
    }
  });

  if (badgeAlert) badgeAlert.innerText = `${jumlahAlert} Terdeteksi`;
  if (jumlahAlert === 0 && kontainerNotifikasi) {
    kontainerNotifikasi.innerHTML = `<div class="text-center text-slate-500 pt-10 text-sm"><p>✅ Stok aman terkendali.</p></div>`;
  }

  logs.forEach(log => {
    const logDiv = document.createElement('div');
    logDiv.className = 'flex justify-between items-start py-1 border-b border-slate-700/30 text-slate-300 hover:text-white text-xs';
    logDiv.innerHTML = `
      <span class="break-all pr-2">➡️ ${log.teks}</span>
      <span class="text-slate-500 shrink-0 text-[10px] font-mono">${log.waktu}</span>
    `;
    if (kontainerLog) kontainerLog.appendChild(logDiv);
  });
}

function simpanDanSiarkan() {
  localStorage.setItem('gudang_data_foto', JSON.stringify(products));
  localStorage.setItem('gudang_logs', JSON.stringify(logs));
  localStorage.setItem('gudang_list_rak', JSON.stringify(listRak));
  renderAplikasi();
  channel.postMessage({ products, logs, listRak });
}

channel.onmessage = (event) => {
  products = event.data.products;
  logs = event.data.logs;
  if (event.data.listRak) listRak = event.data.listRak;
  renderAplikasi();
};

// Pasang Event Listener perubahan dropdown filter jika elemennya eksis
if (document.getElementById('filterRak')) {
  document.getElementById('filterRak').addEventListener('change', renderAplikasi);
}

// Mengelola daftar isi menu dropdown rak (Tambah / Hapus Kustom)
if (document.getElementById('btnKelolaRak')) {
  document.getElementById('btnKelolaRak').addEventListener('click', () => {
    const menuOpsi = prompt(
      "⚙️ PENGATURAN DROPDOWN LOKASI RAK\n\n" +
      "Ketik '1' : Untuk MENAMBAH Pilihan Rak Baru\n" +
      "Ketik '2' : Untuk MENGHAPUS Pilihan Rak yang Ada"
    );

    if (menuOpsi === '1') {
      const namaRakBaru = prompt("Masukkan nama lokasi rak baru:");
      if (namaRakBaru && namaRakBaru.trim() !== "") {
        const namaBersih = namaRakBaru.trim();
        if (listRak.includes(namaBersih)) {
          alert("⚠️ Nama lokasi rak tersebut sudah ada di daftar!");
        } else {
          listRak.push(namaBersih);
          catatAktivitas(`Menambahkan lokasi rak baru ke pilihan: "${namaBersih}"`);
          simpanDanSiarkan();
          alert(`✅ Berhasil menambahkan "${namaBersih}" ke pilihan menu.`);
        }
      }
    } else if (menuOpsi === '2') {
      let daftarTeks = "Ketik nama rak yang ingin dihapus (harus sama persis):\n\n";
      listRak.forEach((r, idx) => { daftarTeks += `${idx + 1}. ${r}\n`; });
      
      const targetHapus = prompt(daftarTeks);
      if (targetHapus && targetHapus.trim() !== "") {
        const namaHapus = targetHapus.trim();
        if (listRak.includes(namaHapus)) {
          listRak = listRak.filter(r => r !== namaHapus);
          catatAktivitas(`Menghapus lokasi rak "${namaHapus}" dari pilihan sistem.`);
          simpanDanSiarkan();
          alert(`🗑️ Pilihan "${namaHapus}" berhasil dihapus.`);
        } else {
          alert("❌ Nama rak salah atau tidak ditemukan!");
        }
      }
    }
  });
}

// Submit Form Pemasukan Data Barang Baru
document.getElementById('formBarang').addEventListener('submit', (e) => {
  e.preventDefault();
  const nama = document.getElementById('inputNama').value;
  const rak = document.getElementById('inputRak').value;
  const stok = Number(document.getElementById('inputStok').value);
  const minimalStok = Number(document.getElementById('inputMin').value);
  const fileFoto = document.getElementById('inputFoto').files[0];

  const buatBarangBaru = (fotoUrl) => {
    const barangBaru = { id: Date.now().toString(), nama, rak, stok, minimalStok, foto: fotoUrl };
    products.push(barangBaru);
    catatAktivitas(`Menambahkan item baru "${nama}" di [${rak}] (Stok: ${stok})`);
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

// Event Delegation Click Handler untuk Aksi Tombol-Tombol di Tabel (+1, -1, Hapus)
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
      catatAktivitas(`Menghapus produk "${itemTerpilih.nama}" dari sistem.`);
      products = products.filter(item => item.id !== id);
      simpanDanSiarkan();
    }
    return;
  }

  let pembatalanAksi = false;
  let catatanLogTambahan = "";

  if (aksi === 'kurang') {
    const alasan = prompt(`Mengurangi stok untuk "${itemTerpilih.nama}". Masukkan keterangan alasan penggunaan (wajib isi):`);
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
      logs = [{ teks: "Log dibersihkan oleh Admin Utama.", waktu: `${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}` }];
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

  const barisExcel = [
    ["WAKTU", "AKTIVITAS / PERUBAHAN SISTEM", "KETERANGAN PENGGUNAAN"] 
  ];

  logs.forEach(log => {
    let teksAktivitas = log.teks;
    let teksKeterangan = "-";

    const regexKet = /\[Ket:\s*(.*?)\]/;
    const cocok = teksAktivitas.match(regexKet);

    if (cocok) {
      teksKeterangan = cocok[1]; 
      teksAktivitas = teksAktivitas.replace(regexKet, "").trim(); 
    }

    barisExcel.push([log.waktu, teksAktivitas, teksKeterangan]);
  });

  const lembarKerja = XLSX.utils.aoa_to_sheet(barisExcel);
  const bukuKerja = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(bukuKerja, lembarKerja, "Log Aktivitas");

  lembarKerja["!cols"] = [
    { wch: 22 }, // Ditingkatkan lebarnya agar muat teks Tanggal + Jam
    { wch: 55 }, 
    { wch: 35 }  
  ];

  const namaFile = `Log_Gudang_${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(bukuKerja, namaFile);
});

// Jalankan pengaturan awal saat file pertama dimuat
aturVisibilitasHalaman();