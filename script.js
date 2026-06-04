/**
 * GESNT INVENTORY SYSTEM - STANDARD VERSION (NON-MODULE)
 * Solusi anti-stuck halaman login
 */

console.log("🚀 Script.js berhasil dimuat oleh browser!");

document.addEventListener("DOMContentLoaded", function() {
    // 1. Ambil elemen login secara langsung
    var formLogin = document.getElementById("formLogin");
    var hLogin = document.getElementById("halamanLogin");
    var hUtama = document.getElementById("aplikasiUtama");
    var errorLogin = document.getElementById("errorLogin");
    var btnLogout = document.getElementById("btnLogout");

    // 2. Cek Sesi Lama
    if (localStorage.getItem("gesnt_session") === "aktif") {
        if (hLogin) hLogin.classList.add("hidden");
        if (hUtama) hUtama.classList.remove("hidden");
        inisialisasiDashboard();
    }

    // 3. Logika Tombol Login
    if (formLogin) {
        formLogin.addEventListener("submit", function(e) {
            e.preventDefault(); // Stop refresh halaman
            
            var user = document.getElementById("loginUsername").value.trim();
            var pass = document.getElementById("loginPassword").value.trim();

            console.log("Mencoba login dengan:", user);

            if (user === "Admin" && pass === "gesnt123") {
                console.log("✅ LOGIN BERHASIL!");
                localStorage.setItem("gesnt_session", "aktif");
                
                if (hLogin) hLogin.classList.add("hidden");
                if (hUtama) hUtama.classList.remove("hidden");
                
                inisialisasiDashboard();
            } else {
                console.warn("❌ LOGIN GAGAL!");
                if (errorLogin) errorLogin.classList.remove("hidden");
            }
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener("click", function() {
            localStorage.removeItem("gesnt_session");
            window.location.reload();
        });
    }
});

// State Data
var dataLogistik = [];
var dataPeralatan = [];
var listRak = ["Rak A-1", "Rak A-2", "Rak B-1", "Rak B-2"];
var listKategoriAlat = ["Handtools", "Power-tools", "Safety Equipment", "Measuring"];

function inisialisasiDashboard() {
    console.log("Memuat komponen dashboard...");
    updateDropdowns();
    renderLogistik();
    renderPeralatan();
    setupFormListeners();
}

function updateDropdowns() {
    var selectRak = document.getElementById("inputRak");
    var selectKategoriAlat = document.getElementById("inputKategoriAlat");
    if (selectRak) {
        selectRak.innerHTML = listRak.map(function(r) { return `<option value="${r}">${r}</option>`; }).join("");
    }
    if (selectKategoriAlat) {
        selectKategoriAlat.innerHTML = listKategoriAlat.map(function(k) { return `<option value="${k}">${k}</option>`; }).join("");
    }
}

function renderLogistik() {
    var tbody = document.getElementById("tabelBodi");
    if (!tbody) return;
    tbody.innerHTML = dataLogistik.map(function(item, index) {
        var total = item.good + item.reject + item.scrap;
        return `
            <tr class="hover:bg-slate-800/40 transition">
                <td class="py-3 px-4 font-medium text-white">${item.nama}</td>
                <td class="py-3 px-4 text-slate-300">${item.rak}</td>
                <td class="py-3 px-4 text-center font-bold text-emerald-400">${item.good}</td>
                <td class="py-3 px-4 text-center font-bold text-rose-400">${item.reject}</td>
                <td class="py-3 px-4 text-center font-bold text-amber-400">${item.scrap}</td>
                <td class="py-3 px-4 text-center font-bold text-slate-100">${total}</td>
                <td class="py-3 px-4 text-center">
                    <button class="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-2 py-1 rounded-lg border border-rose-500/20 text-xs transition" onclick="hapusLogistik(${index})">Hapus</button>
                </td>
            </tr>
        `;
    }).join("");
}

function renderPeralatan() {
    var tbody = document.getElementById("tabelBodiPeralatan");
    if (!tbody) return;
    tbody.innerHTML = dataPeralatan.map(function(item, index) {
        var statusColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
        if (item.kondisi === "Maintenance") statusColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
        if (item.kondisi === "Broken") statusColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";

        return `
            <tr class="hover:bg-slate-800/40 transition">
                <td class="py-3 px-4 font-medium text-white">${item.nama}</td>
                <td class="py-3 px-4 text-slate-300">${item.kategori}</td>
                <td class="py-3 px-4 text-center font-bold text-slate-100">${item.jumlah}</td>
                <td class="py-3 px-4 text-center">
                    <span class="px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColor}">${item.kondisi}</span>
                </td>
                <td class="py-3 px-4 text-center">
                    <button class="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-2 py-1 rounded-lg border border-rose-500/20 text-xs transition" onclick="hapusPeralatan(${index})">Hapus</button>
                </td>
            </tr>
        `;
    }).join("");
}

function setupFormListeners() {
    var tabLogistik = document.getElementById("tabLogistik");
    var tabPeralatan = document.getElementById("tabPeralatan");
    var checkMassal = document.getElementById("checkInputMassal");
    var wrapBiasa = document.getElementById("wrapperStokBiasa");
    var wrapMassal = document.getElementById("wrapperJumlahMassal");

    if (tabLogistik && tabPeralatan) {
        tabLogistik.onclick = function() { switchTab("logistik"); };
        tabPeralatan.onclick = function() { switchTab("peralatan"); };
    }

    if (checkMassal) {
        checkMassal.onchange = function() {
            if (this.checked) {
                wrapBiasa.classList.add("hidden");
                wrapMassal.classList.remove("hidden");
            } else {
                wrapBiasa.classList.remove("hidden");
                wrapMassal.classList.add("hidden");
            }
        };
    }

    document.getElementById("formBarang").onsubmit = function(e) {
        e.preventDefault();
        var nama = document.getElementById("inputNama").value.trim();
        var rak = document.getElementById("inputRak").value;
        var good = 0, reject = 0, scrap = 0;

        if (document.getElementById("checkInputMassal").checked) {
            good = parseInt(document.getElementById("inputTotalMassal").value) || 0;
        } else {
            good = parseInt(document.getElementById("inputGood").value) || 0;
            reject = parseInt(document.getElementById("inputReject").value) || 0;
            scrap = parseInt(document.getElementById("inputScrap").value) || 0;
        }

        dataLogistik.push({ nama: nama, rak: rak, good: good, reject: reject, scrap: scrap });
        this.reset();
        wrapBiasa.classList.remove("hidden");
        wrapMassal.classList.add("hidden");
        renderLogistik();
    };

    document.getElementById("formPeralatan").onsubmit = function(e) {
        e.preventDefault();
        var nama = document.getElementById("inputNamaAlat").value.trim();
        var kategori = document.getElementById("inputKategoriAlat").value;
        var jumlah = parseInt(document.getElementById("inputJumlahAlat").value) || 1;
        var kondisi = document.getElementById("inputKondisiAlat").value;

        dataPeralatan.push({ nama: nama, kategori: kategori, jumlah: jumlah, kondisi: kondisi });
        this.reset();
        renderPeralatan();
    };

    document.getElementById("btnKelolaRak").onclick = function() {
        var baru = prompt("Masukkan nama Rak baru:");
        if (baru) { listRak.push(baru); updateDropdowns(); }
    };

    document.getElementById("btnKelolaKategoriAlat").onclick = function() {
        var baru = prompt("Masukkan nama Kategori baru:");
        if (baru) { listKategoriAlat.push(baru); updateDropdowns(); }
    };
}

function switchTab(mode) {
    var formKatLogistik = document.getElementById("formKategoriLogistik");
    var formKatPeralatan = document.getElementById("formKategoriPeralatan");
    var halLogistik = document.getElementById("halamanLogistik");
    var halPeralatan = document.getElementById("halamanPeralatan");

    if (mode === "logistik") {
        formKatLogistik.classList.remove("hidden");
        halLogistik.classList.remove("hidden");
        formKatPeralatan.classList.add("hidden");
        halPeralatan.classList.add("hidden");
    } else {
        formKatPeralatan.classList.remove("hidden");
        halPeralatan.classList.remove("hidden");
        formKatLogistik.classList.add("hidden");
        halLogistik.classList.add("hidden");
    }
}

// Pasang fungsi global agar tombol hapus bawaan table bisa panggil langsung
window.hapusLogistik = function(idx) { dataLogistik.splice(idx, 1); renderLogistik(); };
window.hapusPeralatan = function(idx) { dataPeralatan.splice(idx, 1); renderPeralatan(); };