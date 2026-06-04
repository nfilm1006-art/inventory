// --- 1. STATE & DATA ---
let dataLogistik = JSON.parse(localStorage.getItem('logistik')) || [];
let dataPeralatan = JSON.parse(localStorage.getItem('peralatan')) || [];
let logs = JSON.parse(localStorage.getItem('logs')) || [];
let rakList = JSON.parse(localStorage.getItem('rakList')) || ["Rak A-1", "Rak A-2"];
let kategoriList = JSON.parse(localStorage.getItem('kategoriList')) || ["Handtools", "Power-tools", "Safety"];

// --- 2. INISIALISASI ---
document.addEventListener('DOMContentLoaded', () => {
    // A. Cek Login
    if (localStorage.getItem('isLoggedIn') === 'true') {
        const loginPage = document.getElementById('halamanLogin');
        const mainApp = document.getElementById('aplikasiUtama');
        if(loginPage) loginPage.classList.add('hidden');
        if(mainApp) mainApp.classList.remove('hidden');
    }

    // B. Navigasi Tab
    const tabLog = document.getElementById('tabLogistik');
    const tabAlat = document.getElementById('tabPeralatan');
    const halLog = document.getElementById('halamanLogistik');
    const halAlat = document.getElementById('halamanPeralatan');

    if (tabLog && tabAlat) {
        tabLog.onclick = () => { halLog.classList.remove('hidden'); halAlat.classList.add('hidden'); };
        tabAlat.onclick = () => { halLog.classList.add('hidden'); halAlat.classList.remove('hidden'); };
    }

    // C. Tombol Kelola
    if (document.getElementById('btnKelolaRak')) {
        document.getElementById('btnKelolaRak').onclick = () => {
            let baru = prompt("Tambah Lokasi Rak (pisahkan koma):");
            if (baru) { rakList = baru.split(',').map(s => s.trim()); localStorage.setItem('rakList', JSON.stringify(rakList)); updateDropdowns(); }
        };
    }
    if (document.getElementById('btnKelolaKategoriAlat')) {
        document.getElementById('btnKelolaKategoriAlat').onclick = () => {
            let baru = prompt("Tambah Kategori Alat (pisahkan koma):");
            if (baru) { kategoriList = baru.split(',').map(s => s.trim()); localStorage.setItem('kategoriList', JSON.stringify(kategoriList)); updateDropdowns(); }
        };
    }

    // D. Submit Forms
    if (document.getElementById('formBarang')) {
        document.getElementById('formBarang').onsubmit = handleLogistik;
    }
    if (document.getElementById('formPeralatan')) {
        document.getElementById('formPeralatan').onsubmit = handlePeralatan;
    }
    if (document.getElementById('btnBersihkanLog')) {
        document.getElementById('btnBersihkanLog').onclick = () => { logs = []; renderAll(); };
    }

    updateDropdowns();
    renderAll();
});

// --- 3. LOGIKA FORM ---
async function handleLogistik(e) {
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
}

function handlePeralatan(e) {
    e.preventDefault();
    dataPeralatan.push({
        nama: document.getElementById('inputNamaAlat').value,
        kategori: document.getElementById('inputKategoriAlat').value,
        stok: document.getElementById('inputStokAlat').value,
        kondisi: document.getElementById('inputKondisiAlat').value,
        lantai: document.getElementById('inputLantaiAlat').value,
        rak: document.getElementById('inputRakAlat').value
    });
    addLog("Tambah Alat: " + document.getElementById('inputNamaAlat').value);
    renderAll();
    e.target.reset();
}

// --- 4. RENDER & UTILS ---
function renderAll() {
    const tbodyLog = document.getElementById('tabelBodi');
    if (tbodyLog) {
        tbodyLog.innerHTML = dataLogistik.map((item, i) => `
            <tr class="border-b border-slate-700/30 ${parseInt(item.stok) <= parseInt(item.min) ? 'bg-red-900/20' : ''}">
                <td class="p-2"><img src="${item.foto}" class="w-10 h-10 object-cover rounded"></td>
                <td class="p-2 text-left">${item.nama}</td>
                <td class="p-2">${item.rak}</td>
                <td class="p-2 font-bold">${item.stok}</td>
                <td class="p-2 text-xs">${item.min}</td>
                <td class="p-2 text-xs text-emerald-400">${getDays(item.masaKartu)}h</td>
                <td class="p-2 text-xs text-emerald-400">${getDays(item.masaKuota)}h</td>
                <td class="p-2"><button onclick="updateStok(${i},1)" class="bg-slate-700 px-2 rounded">+</button> <button onclick="updateStok(${i},-1)" class="bg-slate-700 px-2 rounded">-</button></td>
                <td class="p-2"><button onclick="hapusLogistik(${i})" class="text-red-500">🗑️</button></td>
            </tr>
        `).join('');
    }

    const tbodyAlat = document.getElementById('tabelPeralatanBodi');
    if (tbodyAlat) {
        tbodyAlat.innerHTML = dataPeralatan.map((a, i) => `
            <tr class="border-b border-slate-700/30">
                <td class="p-2 text-left">${a.nama}</td>
                <td class="p-2">${a.kategori}</td>
                <td class="p-2">${a.stok}</td>
                <td class="p-2">${a.kondisi}</td>
                <td class="p-2">${a.lantai}</td>
                <td class="p-2">${a.rak}</td>
                <td class="p-2"><button onclick="hapusAlat(${i})" class="text-red-500">🗑️</button></td>
            </tr>
        `).join('');
    }

    const kritis = dataLogistik.filter(i => parseInt(i.stok) <= parseInt(i.min) || getDays(i.masaKartu) < 1 || getDays(i.masaKuota) < 1);
    if(document.getElementById('badgeAlert')) document.getElementById('badgeAlert').innerText = `${kritis.length} Terdeteksi`;
    if(document.getElementById('kontainerNotifikasi')) {
        document.getElementById('kontainerNotifikasi').innerHTML = kritis.map(i => `<div class="bg-red-600/20 p-2 rounded text-[10px] text-red-300 border border-red-500">⚠️ ${i.nama} Kritis!</div>`).join('');
    }
    if(document.getElementById('kontainerLog')) {
        document.getElementById('kontainerLog').innerHTML = logs.map(l => `<p class="text-[10px] text-slate-400">${l}</p>`).join('');
    }
    saveAll();
}

function updateDropdowns() {
    const rHTML = rakList.map(r => `<option value="${r}">${r}</option>`).join('');
    const kHTML = kategoriList.map(k => `<option value="${k}">${k}</option>`).join('');
    if(document.getElementById('inputRak')) document.getElementById('inputRak').innerHTML = rHTML;
    if(document.getElementById('filterRak')) document.getElementById('filterRak').innerHTML = `<option value="SEMUA">Semua Rak</option>` + rHTML;
    if(document.getElementById('inputKategoriAlat')) document.getElementById('inputKategoriAlat').innerHTML = kHTML;
    if(document.getElementById('filterKategoriAlat')) document.getElementById('filterKategoriAlat').innerHTML = `<option value="SEMUA">Semua Kategori</option>` + kHTML;
}

function getDays(d) { return Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24)); }
function getBase64(f) { return new Promise(r => { let reader = new FileReader(); reader.onload = () => r(reader.result); reader.readAsDataURL(f); }); }
function addLog(m) { logs.unshift(`[${new Date().toLocaleTimeString()}] ${m}`); }
function saveAll() { localStorage.setItem('logistik', JSON.stringify(dataLogistik)); localStorage.setItem('peralatan', JSON.stringify(dataPeralatan)); localStorage.setItem('logs', JSON.stringify(logs)); }

window.updateStok = (i, v) => { dataLogistik[i].stok = Math.max(0, parseInt(dataLogistik[i].stok) + v); renderAll(); };
window.hapusLogistik = (i) => { dataLogistik.splice(i, 1); renderAll(); };
window.hapusAlat = (i) => { dataPeralatan.splice(i, 1); renderAll(); };