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
    
    setTimeout(() => {
      renderDropdownRak();
      renderDropdownKategoriAlat();
      renderAplikasi();
      renderPeralatan();
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


// ==================== ENGINE NAVIGASI SWITCH TAB (SPA SEKTOR) ====================
const tabLogistik = document.getElementById('tabLogistik');
const tabPeralatan = document.getElementById('tabPeralatan');
const halLogistik = document.getElementById('halamanLogistik');
const halPeralatan = document.getElementById('halamanPeralatan');

if (tabLogistik && tabPeralatan) {
  tabLogistik.addEventListener('click', () => {
    halLogistik.classList.remove('hidden');
    halPeralatan.classList.add('hidden');
    tabLogistik.className = "px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white shadow transition-all";
    tabPeralatan.className = "px-4 py-2 text-sm font-semibold rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all";
  });

  tabPeralatan.addEventListener('click', () => {
    halLogistik.classList.add('hidden');
    halPeralatan.classList.remove('hidden');
    tabLogistik.className = "px-4 py-2 text-sm font-semibold rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all";
    tabPeralatan.className = "px-4 py-2 text-sm font-semibold rounded-lg bg-cyan-600 text-white shadow transition-all";
  });
}


// ==================== SEKTOR 2: MANAGEMEN LOGISTIK & PERALATAN GUDANG ====================
const placeholderImg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect width='18' height='18' x='3' y='3' rx='2' ry='2'/><circle cx='9' cy='9' r='2'/><path d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/></svg>";

const initialInventory = [
  { id: '1', nama: 'Kabel Belden Cat5', stok: 220, minimalStok: 10, rak: 'RAK A-1 Depo', foto: placeholderImg, aktifKartu: "", aktifKuota: "" },
  { id: '2', nama: 'Perdana Internet 15GB - 1', stok: 1, minimalStok: 0, rak: 'Rak B-2 501', foto: placeholderImg, aktifKartu: "2026-12-31", aktifKuota: "2026-07-15" }
];

const initialPeralatan = [
  { id: 'p1', nama: 'Tang Krimping RJ45 Probe', kategori: 'Alat Kerja', stok: 3, kondisi: 'BAGUS', lantai: 'Lantai 1', rak: 'Gudang Utama' },
  { id: 'p2', nama: 'Solder Listrik 60W', kategori: 'Alat Kerja', stok: 1, kondisi: 'RUSAK RINGAN', lantai: 'Lantai 2', rak: 'Rak B-2 501' }
];

const initialRacks = ['RAK A-1 Depo', 'Rak B-2 501', 'Rak C-1 501', 'Gudang Utama', 'Lainnya'];
const initialCategories = ['Alat Kerja', 'Perangkat IT', 'Safety Gear', 'Lainnya'];

let products = JSON.parse(localStorage.getItem('gudang_data_foto')) || initialInventory;
let tools = JSON.parse(localStorage.getItem('gudang_peralatan')) || initialPeralatan;
let listRak = JSON.parse(localStorage.getItem('gudang_list_rak')) || initialRacks;
let listKategoriAlat = JSON.parse(localStorage.getItem('gudang_kategori_alat')) || initialCategories;

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

function catatAktivitas(teks) {
  const tgl = new Date().toLocaleDateString('id-ID');
  const jam = new Date().toLocaleTimeString('id-ID');
  const logBaru = { teks: teks, waktu: `${tgl} ${jam}` };
  logs.unshift(logBaru); 
  if (logs.length > 30) logs.pop(); 
}

// MENGGAMBAR DROPDOWN RAK (SERAGAM DI KEDUA FORM)
function renderDropdownRak() {
  const inputRakSelect = document.getElementById('inputRak');
  const filterRakSelect = document.getElementById('filterRak');
  const inputRakAlatSelect = document.getElementById('inputRakAlat');
  
  if (!inputRakSelect || !filterRakSelect || !inputRakAlatSelect) return;

  const cachedInput = inputRakSelect.value;
  const cachedFilter = filterRakSelect.value || 'SEMUA';
  const cachedInputAlat = inputRakAlatSelect.value;

  inputRakSelect.innerHTML = '';
  inputRakAlatSelect.innerHTML = '';
  
  listRak.forEach(rak => {
    const opt1 = document.createElement('option');
    opt1.value = rak; opt1.innerText = rak;
    inputRakSelect.appendChild(opt1);

    const opt2 = document.createElement('option');
    opt2.value = rak; opt2.innerText = rak;
    inputRakAlatSelect.appendChild(opt2);
  });

  if (listRak.includes(cachedInput)) inputRakSelect.value = cachedInput;
  if (listRak.includes(cachedInputAlat)) inputRakAlatSelect.value = cachedInputAlat;

  filterRakSelect.innerHTML = '<option value="SEMUA">✨ Tampilkan Semua Lokasi</option>';
  listRak.forEach(rak => {
    const opt = document.createElement('option');
    opt.value = rak; opt.innerText = rak;
    filterRakSelect.appendChild(opt);
  });
  filterRakSelect.value = cachedFilter;
}

// MENGGAMBAR DROPDOWN KATEGORI ALAT
function renderDropdownKategoriAlat() {
  const inputKategori = document.getElementById('inputKategoriAlat');
  const filterKategori = document.getElementById('filterKategoriAlat');

  if (!inputKategori || !filterKategori) return;

  const cachedInput = inputKategori.value;
  const cachedFilter = filterKategori.value || 'SEMUA';

  inputKategori.innerHTML = '';
  listKategoriAlat.forEach(kat => {
    const opt = document.createElement('option');
    opt.value = kat; opt.innerText = kat;
    inputKategori.appendChild(opt);
  });
  if (listKategoriAlat.includes(cachedInput)) inputKategori.value = cachedInput;

  filterKategori.innerHTML = '<option value="SEMUA">✨ Semua Kategori</option>';
  listKategoriAlat.forEach(kat => {
    const opt = document.createElement('option');
    opt.value = kat; opt.innerText = kat;
    filterKategori.appendChild(opt);
  });
  filterKategori.value = cachedFilter;
}

function dapatkanBadgeCountdown(tanggalTarget) {
  if (!tanggalTarget) return `<span class="text-slate-500 italic text-xs">-</span>`;
  const targetTime = new Date(tanggalTarget + "T23:59:59").getTime();
  const sekarang = new Date().getTime();
  const selisih = targetTime - sekarang;

  if (selisih <= 0) {
    return `<span class="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-1 rounded font-bold text-[11px] block text-center animate-pulse">❌ KADALUARSA</span>`;
  }
  const hari = Math.floor(selisih / (1000 * 60 * 60 * 24));
  const jam = Math.floor((selisih % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  let warnaKelas = "bg-slate-900 border-slate-700 text-emerald-400";
  if (hari <= 3) warnaKelas = "bg-red-950/40 border-red-500/40 text-red-400";
  else if (hari <= 7) warnaKelas = "bg-amber-950/40 border-amber-500/40 text-amber-400";

  return `
    <div class="text-center">
      <span class="font-mono ${warnaKelas} border px-2 py-0.5 rounded text-[11px] font-bold block shadow-sm">${hari}h ${jam}j Sisa</span>
      <span class="text-[10px] text-slate-500 block mt-0.5 font-mono">${tanggalTarget}</span>
    </div>
  `;
}

// RENDER MONITORING LOGISTIK KARTU
function renderAplikasi() {
  if (!isLoggedIn) return; 

  const tabelBodi = document.getElementById('tabelBodi');
  const kontainerNotifikasi = document.getElementById('kontainerNotifikasi');
  const badgeAlert = document.getElementById('badgeAlert');
  const kontainerLog = document.getElementById('kontainerLog');
  const filterRak = document.getElementById('filterRak');
  
  if (!tabelBodi) return; 
  
  tabelBodi.innerHTML = '';
  if (kontainerNotifikasi) kontainerNotifikasi.innerHTML = '';
  if (kontainerLog) kontainerLog.innerHTML = '';
  let jumlahAlert = 0;

  const lokasiDipilih = filterRak ? filterRak.value : 'SEMUA';
  
  products.forEach(item => {
    if (lokasiDipilih !== 'SEMUA' && item.rak !== lokasiDipilih) return; 

    const isKritis = Number(item.stok) <= Number(item.minimalStok);
    let statusMasaAktifKritis = false;
    let pesanKritisMasaAktif = "";

    const cekMasaAktif = (tgl, tipe) => {
      if (!tgl) return;
      const selisih = new Date(tgl + "T23:59:59").getTime() - new Date().getTime();
      if (selisih <= 0) { statusMasaAktifKritis = true; pesanKritisMasaAktif += `❌ ${tipe} ${item.nama} Habis! `; }
      else if (selisih / (1000 * 60 * 60 * 24) <= 7) { statusMasaAktifKritis = true; pesanKritisMasaAktif += `⏳ ${tipe} ${item.nama} sisa < 7 hari. `; }
    };

    cekMasaAktif(item.aktifKartu, "Masa Kartu");
    cekMasaAktif(item.aktifKuota, "Masa Kuota");

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-750 transition-colors border-b border-slate-700/50';
    tr.innerHTML = `
      <td class="px-4 py-3 text-left whitespace-nowrap">
        <img src="${item.foto || placeholderImg}" alt="${item.nama}" class="w-10 h-10 object-cover rounded-lg bg-slate-900 border border-slate-700 shadow-inner" />
      </td>
      <td class="px-4 py-3 font-medium text-white text-left break-words">${item.nama}</td>
      <td class="px-4 py-3 text-center whitespace-nowrap">
        <span class="font-mono bg-slate-900 px-2 py-0.5 rounded text-slate-400 text-[11px] border border-slate-700/50">${item.rak}</span>
      </td>
      <td class="px-4 py-3 text-center whitespace-nowrap">
        <span class="px-2.5 py-0.5 rounded-full font-bold text-[11px] inline-block ${isKritis ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}">${item.stok} Pcs</span>
      </td>
      <td class="px-4 py-3 text-center text-slate-400 font-medium whitespace-nowrap text-xs">${item.minimalStok} Pcs</td>
      <td class="px-4 py-3 text-center whitespace-nowrap">${dapatkanBadgeCountdown(item.aktifKartu)}</td>
      <td class="px-4 py-3 text-center whitespace-nowrap">${dapatkanBadgeCountdown(item.aktifKuota)}</td>
      <td class="px-4 py-3 text-center whitespace-nowrap">
        <div class="flex justify-center gap-1">
          <button data-id="${item.id}" data-aksi="kurang" class="bg-slate-700 hover:bg-slate-600 text-white text-[11px] px-2 py-0.5 rounded transition font-bold select-none">-1</button>
          <button data-id="${item.id}" data-aksi="tambah" class="bg-slate-700 hover:bg-slate-600 text-white text-[11px] px-2 py-0.5 rounded transition font-bold select-none">+1</button>
        </div>
      </td>
      <td class="px-4 py-3 text-center whitespace-nowrap">
        <button data-id="${item.id}" data-aksi="hapus" class="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white text-xs px-2 py-1 rounded transition border border-red-500/20 flex items-center justify-center mx-auto select-none">🗑️</button>
      </td>
    `;
    tabelBodi.appendChild(tr);

    if (isKritis || statusMasaAktifKritis) {
      jumlahAlert++;
      let templatePesan = "";
      if (isKritis) templatePesan += `⚠️ Stok ${item.nama} kritis! Sisa ${item.stok} Pcs. `;
      if (statusMasaAktifKritis) templatePesan += pesanKritisMasaAktif;

      const alertDiv = document.createElement('div');
      alertDiv.className = 'bg-red-950/40 border-l-4 border-red-500 p-3 rounded-r-lg border border-y-slate-700 border-r-slate-700 flex gap-3 items-center';
      alertDiv.innerHTML = `
        <img src="${item.foto || placeholderImg}" class="w-10 h-10 object-cover rounded bg-slate-900 border border-red-500/20" />
        <div class="flex-1 min-w-0"><p class="text-xs text-red-200 font-medium break-words">${templatePesan}</p></div>
      `;
      if (kontainerNotifikasi) kontainerNotifikasi.appendChild(alertDiv);
    }
  });

  tools.forEach(alat => {
    if (alat.kondisi === "RUSAK BERAT") {
      jumlahAlert++;
      const alertDiv = document.createElement('div');
      alertDiv.className = 'bg-red-950/40 border-l-4 border-amber-500 p-3 rounded-r-lg border border-y-slate-700 border-r-slate-700';
      alertDiv.innerHTML = `<p class="text-xs text-amber-200 font-medium">🚨 Alat "${alat.nama}" terdata RUSAK BERAT! Harap segera dicek unitnya.</p>`;
      if (kontainerNotifikasi) kontainerNotifikasi.appendChild(alertDiv);
    }
  });

  if (badgeAlert) badgeAlert.innerText = `${jumlahAlert} Terdeteksi`;
  if (jumlahAlert === 0 && kontainerNotifikasi) {
    kontainerNotifikasi.innerHTML = `<div class="text-center text-slate-500 pt-10 text-sm"><p>✅ Semua aman terkendali.</p></div>`;
  }

  logs.forEach(log => {
    const logDiv = document.createElement('div');
    logDiv.className = 'flex justify-between items-start py-1 border-b border-slate-700/30 text-slate-300 text-xs';
    logDiv.innerHTML = `<span>➡️ ${log.teks}</span><span class="text-slate-500 text-[10px]">${log.waktu}</span>`;
    if (kontainerLog) kontainerLog.appendChild(logDiv);
  });
}

// RENDER HALAMAN DATA PERALATAN (MENDUKUNG TRIPLE FILTER + LANTAI DROPDOWN)
function renderPeralatan() {
  const tabelAlat = document.getElementById('tabelPeralatanBodi');
  if (!tabelAlat) return;

  const filterKategori = document.getElementById('filterKategoriAlat').value || 'SEMUA';
  const filterKondisi = document.getElementById('filterKondisiAlat').value || 'SEMUA';
  const filterLantai = document.getElementById('filterLantaiAlat').value || 'SEMUA';

  tabelAlat.innerHTML = '';
  
  tools.forEach(alat => {
    // Jalankan filtering multiparameter
    if (filterKategori !== 'SEMUA' && alat.kategori !== filterKategori) return;
    if (filterKondisi !== 'SEMUA' && alat.kondisi !== filterKondisi) return;
    if (filterLantai !== 'SEMUA' && (alat.lantai || 'Lantai 1') !== filterLantai) return;

    let badgeKondisi = "";
    if (alat.kondisi === "BAGUS") badgeKondisi = `<span class="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] px-2 py-0.5 rounded font-medium">✅ BAGUS</span>`;
    if (alat.kondisi === "RUSAK RINGAN") badgeKondisi = `<span class="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] px-2 py-0.5 rounded font-medium">⚠️ RUSAK RINGAN</span>`;
    if (alat.kondisi === "RUSAK BERAT") badgeKondisi = `<span class="bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] px-2 py-0.5 rounded font-bold animate-pulse">❌ RUSAK BERAT</span>`;

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-750 transition-colors border-b border-slate-700/50';
    tr.innerHTML = `
      <td class="px-4 py-3 text-left font-medium text-white break-words">${alat.nama}</td>
      <td class="px-4 py-3 text-center text-slate-400 text-xs">${alat.kategori}</td>
      <td class="px-4 py-3 text-center font-bold text-cyan-400 font-mono">${alat.stok} Unit</td>
      <td class="px-4 py-3 text-center whitespace-nowrap">${badgeKondisi}</td>
      <td class="px-4 py-3 text-center whitespace-nowrap">
        <span class="bg-slate-900 px-2 py-0.5 rounded text-cyan-400 border border-slate-700 text-xs font-semibold">${alat.lantai || 'Lantai 1'}</span>
      </td>
      <td class="px-4 py-3 text-left text-slate-300 text-xs break-words">${alat.rak || 'Belum diatur'}</td>
      <td class="px-4 py-3 text-center whitespace-nowrap">
        <button data-id="${alat.id}" class="btn-hapus-alat bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white text-xs px-2 py-1 rounded transition border border-red-500/20 flex items-center justify-center mx-auto select-none">🗑️</button>
      </td>
    `;
    tabelAlat.appendChild(tr);
  });
}

function simpanDanSiarkan() {
  localStorage.setItem('gudang_data_foto', JSON.stringify(products));
  localStorage.setItem('gudang_peralatan', JSON.stringify(tools));
  localStorage.setItem('gudang_logs', JSON.stringify(logs));
  localStorage.setItem('gudang_list_rak', JSON.stringify(listRak));
  localStorage.setItem('gudang_kategori_alat', JSON.stringify(listKategoriAlat));
  renderAplikasi();
  renderPeralatan();
  channel.postMessage({ products, tools, logs, listRak, listKategoriAlat });
}

channel.onmessage = (event) => {
  products = event.data.products;
  logs = event.data.logs;
  if (event.data.tools) tools = event.data.tools;
  if (event.data.listRak) listRak = event.data.listRak;
  if (event.data.listKategoriAlat) listKategoriAlat = event.data.listKategoriAlat;
  renderDropdownRak();
  renderDropdownKategoriAlat();
  renderAplikasi();
  renderPeralatan();
};

// Pasang Event Change pada Filter Komponen
if (document.getElementById('filterRak')) document.getElementById('filterRak').addEventListener('change', renderAplikasi);
if (document.getElementById('filterKategoriAlat')) document.getElementById('filterKategoriAlat').addEventListener('change', renderPeralatan);
if (document.getElementById('filterKondisiAlat')) document.getElementById('filterKondisiAlat').addEventListener('change', renderPeralatan);
if (document.getElementById('filterLantaiAlat')) document.getElementById('filterLantaiAlat').addEventListener('change', renderPeralatan);

// KELOLA DROPDOWN RAK UTAMA
if (document.getElementById('btnKelolaRak')) {
  document.getElementById('btnKelolaRak').addEventListener('click', () => {
    const menuOpsi = prompt("⚙️ PENGATURAN DROPDOWN LOKASI RAK\n\nKetik '1' : TAMBAH Rak Baru\nKetik '2' : HAPUS Rak");
    if (menuOpsi === '1') {
      const namaRakBaru = prompt("Masukkan nama lokasi rak baru:");
      if (namaRakBaru && namaRakBaru.trim() !== "") {
        const namaBersih = namaRakBaru.trim();
        if (!listRak.includes(namaBersih)) {
          listRak.push(namaBersih);
          catatAktivitas(`Menambahkan lokasi rak baru ke pilihan: "${namaBersih}"`);
          simpanDanSiarkan();
          renderDropdownRak();
        }
      }
    } else if (menuOpsi === '2') {
      let daftarTeks = "Ketik nama rak yang ingin dihapus:\n\n";
      listRak.forEach((r, idx) => { daftarTeks += `${idx + 1}. ${r}\n`; });
      const targetHapus = prompt(daftarTeks);
      if (targetHapus && listRak.includes(targetHapus.trim())) {
        listRak = listRak.filter(r => r !== targetHapus.trim());
        catatAktivitas(`Menghapus lokasi rak "${targetHapus.trim()}"`);
        simpanDanSiarkan();
        renderDropdownRak();
      }
    }
  });
}

// KELOLA PILIHAN KATEGORI ALAT
if (document.getElementById('btnKelolaKategoriAlat')) {
  document.getElementById('btnKelolaKategoriAlat').addEventListener('click', () => {
    const menuOpsi = prompt("⚙️ KELOLA PILIHAN KATEGORI PERALATAN\n\nKetik '1' : TAMBAH Kategori Baru\nKetik '2' : HAPUS Kategori");
    if (menuOpsi === '1') {
      const namaKatBaru = prompt("Masukkan nama jenis kategori baru:");
      if (namaKatBaru && namaKatBaru.trim() !== "") {
        const bersih = namaKatBaru.trim();
        if (!listKategoriAlat.includes(bersih)) {
          listKategoriAlat.push(bersih);
          catatAktivitas(`Menambahkan kategori alat baru: "${bersih}"`);
          simpanDanSiarkan();
          renderDropdownKategoriAlat();
        }
      }
    } else if (menuOpsi === '2') {
      let daftarTeks = "Ketik nama kategori yang ingin dihapus:\n\n";
      listKategoriAlat.forEach((k, idx) => { daftarTeks += `${idx + 1}. ${k}\n`; });
      const targetHapus = prompt(daftarTeks);
      if (targetHapus && listKategoriAlat.includes(targetHapus.trim())) {
        listKategoriAlat = listKategoriAlat.filter(k => k !== targetHapus.trim());
        catatAktivitas(`Menghapus kategori alat: "${targetHapus.trim()}"`);
        simpanDanSiarkan();
        renderDropdownKategoriAlat();
      }
    }
  });
}

document.getElementById('checkInputMassal').addEventListener('change', (e) => {
  const wrapperBiasa = document.getElementById('wrapperStokBiasa');
  const wrapperMassal = document.getElementById('wrapperJumlahMassal');
  if (e.target.checked) { wrapperBiasa.classList.add('hidden'); wrapperMassal.classList.remove('hidden'); }
  else { wrapperBiasa.classList.remove('hidden'); wrapperMassal.classList.add('hidden'); }
});

// SUBMIT FORM DATA KARTU LOGISTIK
document.getElementById('formBarang').addEventListener('submit', (e) => {
  e.preventDefault();
  const nama = document.getElementById('inputNama').value;
  const rak = document.getElementById('inputRak').value;
  const fileFoto = document.getElementById('inputFoto').files[0];
  const aktifKartu = document.getElementById('inputAktifKartu').value;
  const aktifKuota = document.getElementById('inputAktifKuota').value;
  const isMassal = document.getElementById('checkInputMassal').checked;

  if (!nama || nama.trim() === "") return;

  const eksekusiSimpan = (fotoUrl) => {
    if (isMassal) {
      const jumlahKartu = Number(document.getElementById('inputJumlahMassal').value) || 1;
      for (let i = 1; i <= jumlahKartu; i++) {
        products.push({ id: (Date.now() + i).toString(), nama: `${nama} - ${i}`, rak, stok: 1, minimalStok: 0, foto: fotoUrl, aktifKartu, aktifKuota });
      }
      catatAktivitas(`Massal: Menambahkan ${jumlahKartu} kartu baru "${nama}"`);
    } else {
      const stok = Number(document.getElementById('inputStok').value);
      const minimalStok = Number(document.getElementById('inputMin').value);
      products.push({ id: Date.now().toString(), nama, rak, stok, minimalStok, foto: fotoUrl, aktifKartu, aktifKuota });
      catatAktivitas(`Menambahkan item baru "${nama}"`);
      if (stok <= minimalStok) mainkanSuaraAlarm();
    }
    simpanDanSiarkan();
    e.target.reset();
    document.getElementById('wrapperStokBiasa').classList.remove('hidden');
    document.getElementById('wrapperJumlahMassal').classList.add('hidden');
  };

  if (fileFoto) {
    const reader = new FileReader();
    reader.onload = function(event) { eksekusiSimpan(event.target.result); };
    reader.readAsDataURL(fileFoto);
  } else {
    eksekusiSimpan(placeholderImg);
  }
});

// SUBMIT FORM DATA PERALATAN BARU (MENDUKUNG DATA LANTAI)
document.getElementById('formPeralatan').addEventListener('submit', (e) => {
  e.preventDefault();
  const nama = document.getElementById('inputNamaAlat').value;
  const kategori = document.getElementById('inputKategoriAlat').value;
  const stok = Number(document.getElementById('inputStokAlat').value) || 0;
  const kondisi = document.getElementById('inputKondisiAlat').value;
  const lantai = document.getElementById('inputLantaiAlat').value;
  const rak = document.getElementById('inputRakAlat').value;

  const alatBaru = { id: 'alat-' + Date.now(), nama, kategori, stok, kondisi, lantai, rak };
  tools.push(alatBaru);
  catatAktivitas(`🛠️ Menambahkan alat baru "${nama}" (${stok} Unit) di [${lantai} - ${rak}]`);
  simpanDanSiarkan();
  e.target.reset();
});

// EVENT CLICK TABLE LOGISTIK
document.getElementById('tabelBodi').addEventListener('click', (e) => {
  const tombol = e.target.closest('button');
  if (!tombol) return;
  const aksi = tombol.getAttribute('data-aksi');
  const id = tombol.getAttribute('data-id');
  const itemTerpilih = products.find(p => p.id === id);
  if (!itemTerpilih) return;

  if (aksi === 'hapus') {
    if (confirm(`Hapus "${itemTerpilih.nama}"?`)) {
      catatAktivitas(`Menghapus produk "${itemTerpilih.nama}"`);
      products = products.filter(item => item.id !== id);
      simpanDanSiarkan();
    }
    return;
  }

  let pembatalanAksi = false;
  let catatanLogTambahan = "";
  if (aksi === 'kurang') {
    const alasan = prompt(`Keterangan alasan pengurangan stok "${itemTerpilih.nama}":`);
    if (alasan === null || alasan.trim() === "") {
      alert("⚠️ Pengurangan dibatalkan, keterangan wajib diisi.");
      pembatalanAksi = true;
    } else {
      catatanLogTambahan = ` [Ket: ${alasan.trim()}]`;
    }
  }
  if (pembatalanAksi) return;

  products = products.map(item => {
    if (item.id === id) {
      let stokBaru = item.stok;
      if (aksi === 'tambah') { stokBaru += 1; catatAktivitas(`Stok "${item.nama}" naik -> ${stokBaru}`); }
      if (aksi === 'kurang') {
        stokBaru = Math.max(0, item.stok - 1);
        catatAktivitas(`Stok "${item.nama}" turun -> ${stokBaru}.${catatanLogTambahan}`);
        if (stokBaru <= item.minimalStok) mainkanSuaraAlarm();
      }
      return { ...item, stok: stokBaru };
    }
    return item;
  });
  simpanDanSiarkan();
});

// EVENT CLICK TABLE PERALATAN
document.getElementById('tabelPeralatanBodi').addEventListener('click', (e) => {
  const tombol = e.target.closest('.btn-hapus-alat');
  if (!tombol) return;
  const id = tombol.getAttribute('data-id');
  const alatTerpilih = tools.find(t => t.id === id);
  if (!alatTerpilih) return;

  if (confirm(`Hapus peralatan "${alatTerpilih.nama}" dari inventaris kerja?`)) {
    catatAktivitas(`🛠️ Menghapus peralatan kerja "${alatTerpilih.nama}"`);
    tools = tools.filter(t => t.id !== id);
    simpanDanSiarkan();
  }
});

document.getElementById('btnBersihkanLog').addEventListener('click', () => {
  if (prompt("🔐 Masukkan password admin:") === "gudang123") {
    logs = [{ teks: "Log dibersihkan oleh Admin Utama.", waktu: `${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}` }];
    simpanDanSiarkan();
  }
});

document.getElementById('btnDownloadExcel').addEventListener('click', () => {
  const barisExcel = [["WAKTU", "AKTIVITAS / PERUBAHAN SISTEM", "KETERANGAN PENGGUNAAN"]];
  logs.forEach(log => {
    let teksAktivitas = log.teks;
    let teksKeterangan = "-";
    const regexKet = /\[Ket:\s*(.*?)\]/;
    const cocok = teksAktivitas.match(regexKet);
    if (cocok) { teksKeterangan = cocok[1]; teksAktivitas = teksAktivitas.replace(regexKet, "").trim(); }
    barisExcel.push([log.waktu, teksAktivitas, teksKeterangan]);
  });
  const lembarKerja = XLSX.utils.aoa_to_sheet(barisExcel);
  const bukuKerja = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(bukuKerja, lembarKerja, "Log Aktivitas");
  XLSX.writeFile(bukuKerja, `Log_Gudang_${new Date().toISOString().slice(0,10)}.xlsx`);
});

// COUNTDOWN TIMER
setInterval(() => {
  if (isLoggedIn) {
    renderAplikasi();
  }
}, 1000);

aturVisibilitasHalaman();