// --- 1. STATE & DATA ---
let dataLogistik = JSON.parse(localStorage.getItem('logistik')) || [];
let dataPeralatan = JSON.parse(localStorage.getItem('peralatan')) || [];
let logs = JSON.parse(localStorage.getItem('logs')) || [];
let rakList = JSON.parse(localStorage.getItem('rakList')) || ["Rak A-1", "Rak A-2"];
let kategoriList = JSON.parse(localStorage.getItem('kategoriList')) || ["Handtools", "Power-tools", "Safety"];

// --- 2. INISIALISASI ---
document.addEventListener('DOMContentLoaded', () => {
    // Cek Login
    if (localStorage.getItem('isLoggedIn') === 'true') {
        document.getElementById('halamanLogin').classList.add('hidden');
        document.getElementById('aplikasiUtama').classList.remove('hidden');
    }
    updateDropdowns();
    renderAll();
});

// --- 3. FUNGSI LOGIN ---
document.getElementById('formLogin').onsubmit = (e) => {
    e.preventDefault();
    if(document.getElementById('loginUsername').value === 'admin' && document.getElementById('loginPassword').value === '123') {
        localStorage.setItem('isLoggedIn', 'true');
        location.reload();
    } else {
        document.getElementById('errorLogin').classList.remove('hidden');
    }
};

document.getElementById('btnLogout').onclick = () => {
    localStorage.removeItem('isLoggedIn');
    location.reload();
};

// --- 4. NAVIGASI TAB ---
document.getElementById('tabLogistik').onclick = () => {
    document.getElementById('halamanLogistik').classList.remove('hidden');
    document.getElementById('halamanPeralatan').classList.add('hidden');
};
document.getElementById('tabPeralatan').onclick = () => {
    document.getElementById('halamanLogistik').classList.add('hidden');
    document.getElementById('halamanPeralatan').classList.remove('hidden');
};

// --- 5. DROPDOWN & KELOLA DATA ---
function updateDropdowns() {
    const rHTML = rakList.map(r => `<option value="${r}">${r}</option>`).join('');
    document.getElementById('inputRak').innerHTML = rHTML;
    document.getElementById('filterRak').innerHTML = `<option value="SEMUA">Semua Rak</option>` + rHTML;
    
    const kHTML = kategoriList.map(k => `<option value="${k}">${k}</option>`).join('');
    document.getElementById('inputKategoriAlat').innerHTML = kHTML;
    document.getElementById('filterKategoriAlat').innerHTML = `<option value="SEMUA">Semua Kategori</option>` + kHTML;
}

document.getElementById('btnKelolaRak').onclick = () => {
    let baru = prompt("Tambah Lokasi Rak (pisahkan koma):");
    if(baru) { rakList = baru.split(',').map(s => s.trim()); localStorage.setItem('rakList', JSON.stringify(rakList)); updateDropdowns(); }
};

document.getElementById('btnKelolaKategoriAlat').onclick = () => {
    let baru = prompt("Tambah Kategori Alat (pisahkan koma):");
    if(baru) { kategoriList = baru.split(',').map(s => s.trim()); localStorage.setItem('kategoriList', JSON.stringify(kategoriList)); updateDropdowns(); }
};

// --- 6. LOGIKA UPLOAD & RENDER ---
function getBase64(file) {
    return new Promise((resolve) => {
        let reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}

document.getElementById('formBarang').onsubmit = async (e) => {
    e.preventDefault();
    const file = document.getElementById('inputFoto').files[0];
    const data = {
        nama: document.getElementById('inputNama').value,
        rak: document.getElementById('inputRak').value,
        stok: document.getElementById('inputStok').value,
        min: document.getElementById('inputMin').value,
        masaKartu: document.getElementById('inputAktifKartu').value,
        masaKuota: document.getElementById('inputAktifKuota').value,
        foto: file ? await getBase64(file) : ''
    };
    dataLogistik.push(data);
    addLog(`Tambah Barang: ${data.nama}`);
    renderAll();
    e.target.reset();
};

// --- 7. RENDER TABEL & MONITORING ---
function renderAll() {
    // A. Render Tabel Logistik (Tetap)
    document.getElementById('tabelBodi').innerHTML = dataLogistik.map((item, i) => `
        <tr class="border-b border-slate-700/30 ${parseInt(item.stok) <= parseInt(item.min) ? 'bg-red-900/20' : ''}">
            <td class="p-2"><img src="${item.foto}" class="w-10 h-10 object-cover rounded"></td>
            <td class="p-2 text-left">${item.nama}</td>
            <td class="p-2">${item.rak}</td>
            <td class="p-2 font-bold">${item.stok}</td>
            <td class="p-2 text-xs">${item.min}</td>
            <td class="p-2 text-xs text-emerald-400">${getDays(item.masaKartu)}h</td>
            <td class="p-2 text-xs text-emerald-400">${getDays(item.masaKuota)}h</td>
            <td class="p-2">
                <button onclick="updateStok(${i},1)" class="bg-slate-700 px-2 rounded">+</button>
                <button onclick="updateStok(${i},-1)" class="bg-slate-700 px-2 rounded">-</button>
            </td>
            <td class="p-2"><button onclick="hapusLog(${i})" class="text-red-500">🗑️</button></td>
        </tr>
    `).join('');

    // B. Render Tabel Peralatan (PENTING: Agar daftar peralatan tidak hilang)
    // Pastikan ID tabel ini sesuai dengan yang ada di HTML Anda (tabelPeralatanBodi)
    const tbodyPeralatan = document.getElementById('tabelPeralatanBodi');
    if (tbodyPeralatan) {
        tbodyPeralatan.innerHTML = dataPeralatan.map((alat, i) => `
            <tr class="border-b border-slate-700/30">
                <td class="p-2">${alat.nama}</td>
                <td class="p-2">${alat.kategori}</td>
                <td class="p-2">${alat.stok}</td>
                <td class="p-2">${alat.kondisi}</td>
                <td class="p-2">${alat.lantai}</td>
                <td class="p-2">${alat.rak}</td>
                <td class="p-2"><button onclick="hapusAlat(${i})" class="text-red-500">🗑️</button></td>
            </tr>
        `).join('');
    }

    // C. Render Alarm Panel (Hanya Notifikasi, tidak mengganggu tabel)
    const kritis = dataLogistik.filter(i => parseInt(i.stok) <= parseInt(i.min) || getDays(i.masaKartu) < 3);
    document.getElementById('badgeAlert').innerText = `${kritis.length} Terdeteksi`;
    
    // Notifikasi hanya diisi ke kontainer khusus notifikasi
    document.getElementById('kontainerNotifikasi').innerHTML = kritis.map(i => `
        <div class="bg-red-600/20 p-2 rounded text-[10px] text-red-300 border border-red-500">⚠️ ${i.nama} stok/masa aktif kritis!</div>
    `).join('');

    // D. Log
    document.getElementById('kontainerLog').innerHTML = logs.map(l => `<p class="text-[10px] text-slate-400">${l}</p>`).join('');
    
    saveAll();
}

// --- 8. FUNGSI UTILITAS ---
function getDays(date) { return Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24)); }
function updateStok(i, val) { dataLogistik[i].stok = Math.max(0, parseInt(dataLogistik[i].stok) + val); renderAll(); }
function hapusLog(i) { dataLogistik.splice(i, 1); renderAll(); }
document.getElementById('btnBersihkanLog').onclick = () => { logs = []; renderAll(); };

function addLog(msg) { logs.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`); }
function saveAll() {
    localStorage.setItem('logistik', JSON.stringify(dataLogistik));
    localStorage.setItem('logs', JSON.stringify(logs));
}

// Excel Export
document.getElementById('btnDownloadExcel').onclick = () => {
    const ws = XLSX.utils.json_to_sheet(dataLogistik);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventaris");
    XLSX.writeFile(wb, "Data_Gudang.xlsx");
};