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
  { id: '1', nama: 'Kabel Belden Cat5', stok: 220, minimalStok: 10, rak: 'RAK A-1 Depo', foto: placeholderImg, aktifKartu: "", aktifKuota: "" },
  { id: '2', nama: 'Perdana Internet 15GB - 1', stok: 1, minimalStok: 0, rak: 'Rak B-2 501', foto: placeholderImg, aktifKartu: "2026-12-31", aktifKuota: "2026-06-15" },
  { id: '3', nama: 'Cat semprot putih', stok: 30, minimalStok: 5, rak: 'Rak C-1 501', foto: placeholderImg, aktifKartu: "", aktifKuota: "" },
];

const initialRacks = ['RAK A-1 Depo', 'Rak B-2 501', 'Rak C-1 501', 'Gudang Utama', 'Lainnya'];

let products = JSON.parse(localStorage.getItem('gudang_data_foto')) || initialInventory;
let listRak = JSON.parse(localStorage.getItem('gudang_list_rak')) || initialRacks;

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

function renderDropdownRak() {
  const inputRakSelect = document.getElementById('inputRak');
  const filterRakSelect = document.getElementById('filterRak');
  
  if (!inputRakSelect || !filterRakSelect) return;

  const selectedInputVal = inputRakSelect.value;
  const selectedFilterVal = filterRakSelect.value || 'SEMUA';

  inputRakSelect.innerHTML = '';
  listRak.forEach(rak => {
    const opt = document.createElement('option');
    opt.value = rak;
    opt.innerText = rak;
    inputRakSelect.appendChild(opt);
  });
  if (listRak.includes(selectedInputVal)) inputRakSelect.value = selectedInputVal;

  filterRakSelect.innerHTML = '<option value="SEMUA">✨ Tampilkan Semua Lokasi</option>';
  listRak.forEach(rak => {
    const opt = document.createElement('option');
    opt.value = rak;
    opt.innerText = rak;
    filterRakSelect.appendChild(opt);
  });
  filterRakSelect.value = selectedFilterVal;
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
  
  // WARNA WARING: Berubah jadi oranye/merah jika sisa masa aktif di bawah 30 hari (1 bulan)
  if (hari <= 7) {
    warnaKelas = "bg-red-950/40 border-red-500/40 text-red-400";
  } else if (hari <= 30) {
    warnaKelas = "bg-amber-950/40 border-amber-500/40 text-amber-400";
  }

  return `
    <div class="text-center">
      <span class="font-mono ${warnaKelas} border px-2 py-0.5 rounded text-[11px] font-bold block shadow-sm">
        ${hari}h ${jam}j Sisa
      </span>
      <span class="text-[10px] text-slate-500 block mt-0.5 font-mono">${tanggalTarget}</span>
    </div>
  `;
}

function renderAplikasi() {
  if (!isLoggedIn) return; 

  const tabelBodi = document.getElementById('tabelBodi');
  const kontainerNotifikasi = document.getElementById('kontainerNotifikasi');
  const badgeAlert = document.getElementById('badgeAlert');
  const kontainerLog = document.getElementById('kontainerLog');
  const filterRak = document.getElementById('filterRak');
  
  if (!tabelBodi) return; 
  
  renderDropdownRak();
  
  tabelBodi.innerHTML = '';
  if (kontainerNotifikasi) kontainerNotifikasi.innerHTML = '';
  if (kontainerLog) kontainerLog.innerHTML = '';
  let jumlahAlert = 0;

  const lokasiDipilih = filterRak ? filterRak.value : 'SEMUA';
  
  products.forEach(item => {
    if (lokasiDipilih !== 'SEMUA' && item.rak !== lokasiDipilih) {
      return; 
    }

    const isKritis = Number(item.stok) <= Number(item.minimalStok);
    let statusMasaAktifKritis = false;
    let pesanKritisMasaAktif = "";

    const cekMasaAktif = (tgl, tipe) => {
      if (!tgl) return;
      const selisih = new Date(tgl + "T23:59:59").getTime() - new Date().getTime();
      const sisaHari = selisih / (1000 * 60 * 60 * 24);

      if (selisih <= 0) {
        statusMasaAktifKritis = true;
        pesanKritisMasaAktif += `❌ ${tipe} ${item.nama} Habis! `;
      } else if (sisaHari <= 30) { // LOGIKAL PERUBAHAN: Masuk kondisi jika kurang dari 30 hari (1 bulan)
        statusMasaAktifKritis = true;
        pesanKritisMasaAktif += `⏳ ${tipe} ${item.nama} < 1 Bulan (${Math.ceil(sisaHari)} hari lagi). `;
      }
    };

    cekMasaAktif(item.aktifKartu, "Masa Kartu");
    cekMasaAktif(item.aktifKuota, "Masa Kuota");

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-750 transition-colors border-b border-slate-700/50';
    tr.innerHTML = `
      <td class="px-4 py-3 text-left whitespace-nowrap">
        <img src="${item.foto || placeholderImg}" alt="${item.nama}" class="w-10 h-10 object-cover rounded-lg bg-slate-900 border border-slate-700 shadow-inner" />
      </td>
      <td class="px-4 py-3 font-medium text-white text-left break-words">
        ${item.nama}
      </td>
      <td class="px-4 py-3 text-center whitespace-nowrap">
        <span class="font-mono bg-slate-900 px-2 py-0.5 rounded text-slate-400 text-[11px] border border-slate-700/50">
          ${item.rak}
        </span>
      </td>
      <td class="px-4 py-3 text-center whitespace-nowrap">
        <span class="px-2.5 py-0.5 rounded-full font-bold text-[11px] inline-block ${isKritis ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}">
          ${item.stok} Pcs
        </span>
      </td>
      <td class="px-4 py-3 text-center text-slate-400 font-medium whitespace-nowrap text-xs">
        ${item.minimalStok} Pcs
      </td>
      
      <td class="px-4 py-3 text-center whitespace-nowrap">
        ${dapatkanBadgeCountdown(item.aktifKartu)}
      </td>
      <td class="px-4 py-3 text-center whitespace-nowrap">
        ${dapatkanBadgeCountdown(item.aktifKuota)}
      </td>

      <td class="px-4 py-3 text-center whitespace-nowrap">
        <div class="flex justify-center gap-1">
          <button data-id="${item.id}" data-aksi="kurang" class="bg-slate-700 hover:bg-slate-600 active:scale-95 text-white text-[11px] px-2 py-0.5 rounded transition font-bold select-none">-1</button>
          <button data-id="${item.id}" data-aksi="tambah" class="bg-slate-700 hover:bg-slate-600 active:scale-95 text-white text-[11px] px-2 py-0.5 rounded transition font-bold select-none">+1</button>
        </div>
      </td>
      <td class="px-4 py-3 text-center whitespace-nowrap">
        <button data-id="${item.id}" data-aksi="hapus" class="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white text-xs px-2 py-1 rounded transition border border-red-500/20 flex items-center justify-center mx-auto select-none">
          🗑️
        </button>
      </td>
    `;
    tabelBodi.appendChild(tr);

    // Menarik data masuk ke kotak Peringatan Gudang jika stok menipis ATAU masa aktif kurang dari 1 bulan
    if (isKritis || statusMasaAktifKritis) {
      jumlahAlert++;
      let templatePesan = "";
      if (isKritis) templatePesan += `⚠️ Stok ${item.nama} kritis! Sisa ${item.stok} Pcs. `;
      if (statusMasaAktifKritis) templatePesan += pesanKritisMasaAktif;

      const alertDiv = document.createElement('div');
      alertDiv.className = 'bg-red-950/40 border-l-4 border-red-500 p-3 rounded-r-lg shadow-md border border-y-slate-700 border-r-slate-700 flex gap-3 items-center';
      alertDiv.innerHTML = `
        <img src="${item.foto || placeholderImg}" class="w-10 h-10 object-cover rounded bg-slate-900 border border-red-500/20" />
        <div class="flex-1 min-w-0">
          <p class="text-xs text-red-200 font-medium break-words">${templatePesan}</p>
          <span class="text-[9px] text-red-400 block mt-0.5 font-mono">LIVE MONITORING</span>
        </div>
      `;
      if (kontainerNotifikasi) kontainerNotifikasi.appendChild(alertDiv);
    }
  });

  if (badgeAlert) badgeAlert.innerText = `${jumlahAlert} Terdeteksi`;
  if (jumlahAlert === 0 && kontainerNotifikasi) {
    kontainerNotifikasi.innerHTML = `<div class="text-center text-slate-500 pt-10 text-sm"><p>✅ Semua aman terkendali.</p></div>`;
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

if (document.getElementById('filterRak')) {
  document.getElementById('filterRak').addEventListener('change', renderAplikasi);
}

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

document.getElementById('checkInputMassal').addEventListener('change', (e) => {
  const wrapperBiasa = document.getElementById('wrapperStokBiasa');
  const wrapperMassal = document.getElementById('wrapperJumlahMassal');
  
  if (e.target.checked) {
    wrapperBiasa.classList.add('hidden');
    wrapperMassal.classList.remove('hidden');
  } else {
    wrapperBiasa.classList.remove('hidden');
    wrapperMassal.classList.add('hidden');
  }
});

document.getElementById('formBarang').addEventListener('submit', (e) => {
  e.preventDefault();
  const nama = document.getElementById('inputNama').value;
  const rak = document.getElementById('inputRak').value;
  const fileFoto = document.getElementById('inputFoto').files[0];
  const aktifKartu = document.getElementById('inputAktifKartu').value;
  const aktifKuota = document.getElementById('inputAktifKuota').value;
  
  const isMassal = document.getElementById('checkInputMassal').checked;

  const eksekusiSimpan = (fotoUrl) => {
    let memicuAlarmMasaAktif = false;

    // Fungsi pembantu mengecek sisa hari untuk menyalakan audio buzzer pas submit
    const cekKritisForm = (tgl) => {
      if (!tgl) return false;
      const sisa = (new Date(tgl + "T23:59:59").getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
      return sisa <= 30; // true jika di bawah 1 bulan
    };

    if (cekKritisForm(aktifKartu) || cekKritisForm(aktifKuota)) {
      memicuAlarmMasaAktif = true;
    }

    if (isMassal) {
      const jumlahKartu = Number(document.getElementById('inputJumlahMassal').value) || 1;
      
      for (let i = 1; i <= jumlahKartu; i++) {
        const barangBaru = { 
          id: (Date.now() + i).toString(), 
          nama: `${nama} - ${i}`, 
          rak, 
          stok: 1, 
          minimalStok: 0, 
          foto: fotoUrl,
          aktifKartu, 
          aktifKuota 
        };
        products.push(barangBaru);
      }
      catatAktivitas(`Massal: Menambahkan sebanyak ${jumlahKartu} kartu baru "${nama}" di [${rak}]`);
    } else {
      const stok = Number(document.getElementById('inputStok').value);
      const minimalStok = Number(document.getElementById('inputMin').value);
      
      const barangBaru = { 
        id: Date.now().toString(), 
        nama, rak, stok, minimalStok, foto: fotoUrl,
        aktifKartu, aktifKuota 
      };
      products.push(barangBaru);
      catatAktivitas(`Menambahkan item baru "${nama}" di [${rak}] (Stok: ${stok})`);
      if (stok <= minimalStok) memicuAlarmMasaAktif = true;
    }

    // Jika ada yang kritis, bunyikan alarm
    if (memicuAlarmMasaAktif) mainkanSuaraAlarm();

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
    { wch: 22 }, 
    { wch: 55 }, 
    { wch: 35 }  
  ];

  const namaFile = `Log_Gudang_${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(bukuKerja, namaFile);
});

setInterval(() => {
  if (isLoggedIn) {
    renderAplikasi();
  }
}, 1000);

aturVisibilitasHalaman();