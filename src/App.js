import React, { useState, useEffect, useMemo } from "react";
import {
  Home,
  FileText,
  Users,
  Calendar,
  Trophy,
  Settings,
  LogOut,
  Check,
  X,
  Trash2,
  Edit3,
  Edit,
  Eye,
  Printer,
  AlertCircle,
  Rocket,
  Search,
  UserCheck,
  Shield,
  UploadCloud,
  ChevronDown,
  Download,
  UserPlus,
  RefreshCw,
} from "lucide-react";

// =====================================================================
// KONFIGURASI GOOGLE APPS SCRIPT (GAS) BACKEND
// URL Web App dari Google Apps Script Anda telah terpasang di bawah ini:
// =====================================================================
const GAS_URL =
  "https://script.google.com/macros/s/AKfycbzv1McsOLE0pUabEz03m-OnACwOuPwguikWhk7Nloex1cN6LcfGfwW8wTV-s7UwuY0E/exec";

// Helper Function untuk memanggil API Google Sheets
const fetchAPI = async (table, action, data = null, id = null) => {
  const payload = { table, action };
  if (data) payload.data = data;
  if (id) payload.id = id;

  try {
    const response = await fetch(GAS_URL, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (result.status === "error") throw new Error(result.message);
    return result.data;
  } catch (error) {
    console.error(`API Error (${table} - ${action}):`, error);
    throw error;
  }
};

// --- CONSTANTS ---
const LOMBA_MAPPING = {
  "Tahfidz Juz Amma": "TJA",
  "MQK Safinatunnaja": "MQK",
  "Cerdas cermat Diniyyah": "CCD",
  "Pidato Bahasa Indonesia": "PBI",
  "Pidato Bahasa Arab": "PBA",
  MTQ: "MTQ",
  "Murotal Wal Imla'": "MWI",
  Kaligrafi: "KGF",
  "Puisi Islami": "PIS",
  "Lari Sprint 100 M": "LSP",
  "Bulu Tangkis Single": "BTS",
  "Tenis Meja Single": "TMJ",
  Sholawat: "SLW",
  Adzan: "ADZ",
  "Hafalan Nadhom Aqidatul Awam": "NAW",
  "Pidato Bahasa Jawa": "PBJ",
};
const LOMBA_LIST = Object.keys(LOMBA_MAPPING);

const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [session, setSession] = useState({ role: "public", data: null }); // 'public', 'panitia', 'koordinator'
  const [view, setView] = useState("beranda"); // For public navigation
  const [showLogin, setShowLogin] = useState(false);
  const [loginType, setLoginType] = useState("panitia"); // 'panitia' or 'koordinator'

  // Data States
  const [loadingData, setLoadingData] = useState(true);
  const [settings, setSettings] = useState({
    isOpen: true,
    minBirthDate: "2011-01-01",
    ketuaPanitia: "",
  });
  const [registrations, setRegistrations] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [results, setResults] = useState([]);

  // Fetch All Data from Google Sheets
  const loadAllData = async () => {
    setLoadingData(true);
    try {
      const [sett, regs, coords, scheds, res] = await Promise.all([
        fetchAPI("Settings", "GET"),
        fetchAPI("Registrations", "GET"),
        fetchAPI("Coordinators", "GET"),
        fetchAPI("Schedules", "GET"),
        fetchAPI("Results", "GET"),
      ]);

      const mainSett = (sett || []).find((s) => s.id === "main") || {
        isOpen: true,
        minBirthDate: "2011-01-01",
        ketuaPanitia: "",
      };
      // Pastikan format boolean
      if (typeof mainSett.isOpen === "string")
        mainSett.isOpen = mainSett.isOpen === "true";

      setSettings(mainSett);
      setRegistrations(regs || []);
      setCoordinators(coords || []);
      setSchedules(scheds || []);
      setResults(res || []);
    } catch (e) {
      console.warn("Gagal mengambil data, mungkin URL belum diatur.");
    }
    setLoadingData(false);
  };

  useEffect(() => {
    if (GAS_URL === "ISI_DENGAN_URL_WEB_APP_ANDA_DISINI") {
      setLoadingData(false);
      return;
    }
    loadAllData();
  }, []);

  // Login Handler
  const handleLogin = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (loginType === "panitia") {
      const u = fd.get("username");
      const p = fd.get("password");
      if (u === "admin" && p === "admin") {
        setSession({ role: "panitia", data: { name: "Admin Panitia" } });
        setShowLogin(false);
      } else {
        alert("Username atau password salah!");
      }
    } else {
      const wa = String(fd.get("waNumber"));
      // Google Sheet kadang menyimpan angka sebagai Number, pastikan di-cast ke string
      const coord = coordinators.find((c) => String(c.waNumber) === wa);
      if (coord) {
        setSession({ role: "koordinator", data: coord });
        setShowLogin(false);
      } else {
        alert("Nomor WA tidak terdaftar sebagai koordinator!");
      }
    }
  };

  const handleLogout = () => {
    setSession({ role: "public", data: null });
    setView("beranda");
  };

  if (loadingData && session.role === "public") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#175e38] text-white flex-col">
        <RefreshCw size={48} className="animate-spin mb-4" />
        <h2 className="text-xl font-bold">Memuat Sistem PORSADIN...</h2>
        <p className="text-sm mt-2 text-green-200">
          Terhubung dengan Google Sheets
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {GAS_URL === "ISI_DENGAN_URL_WEB_APP_ANDA_DISINI" && (
        <div className="bg-red-600 text-white p-3 text-center font-bold print:hidden">
          PERHATIAN: Anda belum memasukkan URL Google Apps Script pada variabel
          GAS_URL di dalam kode (Baris 9).
        </div>
      )}

      {session.role === "public" && (
        <PublicView
          view={view}
          setView={setView}
          setShowLogin={setShowLogin}
          setLoginType={setLoginType}
          settings={settings}
          registrations={registrations}
          schedules={schedules}
          results={results}
          refreshData={loadAllData}
        />
      )}
      {session.role === "panitia" && (
        <PanitiaView
          onLogout={handleLogout}
          data={{ settings, registrations, coordinators, schedules, results }}
          refreshData={loadAllData}
          loadingData={loadingData}
        />
      )}
      {session.role === "koordinator" && (
        <KoordinatorView
          onLogout={handleLogout}
          session={session}
          data={{ registrations, results }}
          refreshData={loadAllData}
        />
      )}

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative">
            <button
              onClick={() => setShowLogin(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-center text-[#175e38] mb-2">
              Login {loginType === "panitia" ? "Panitia" : "Koordinator"}
            </h2>
            <p className="text-center text-sm text-gray-500 mb-6">
              {loginType === "panitia"
                ? "Silakan masuk menggunakan akun admin Anda."
                : "Silakan masuk menggunakan nomor WhatsApp Anda."}
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              {loginType === "panitia" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      required
                      className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-[#175e38] focus:ring-1 focus:ring-[#175e38]"
                      placeholder="Masukkan admin"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      required
                      className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-[#175e38] focus:ring-1 focus:ring-[#175e38]"
                      placeholder="Masukkan admin"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor WhatsApp
                  </label>
                  <input
                    type="text"
                    name="waNumber"
                    required
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-[#175e38] focus:ring-1 focus:ring-[#175e38]"
                    placeholder="0812xxxxxxx"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    *Gunakan nomor WA yang didaftarkan oleh panitia.
                  </p>
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-[#175e38] hover:bg-[#11462a] text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                Masuk
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- PUBLIC VIEW COMPONENTS ---
function PublicView({
  view,
  setView,
  setShowLogin,
  setLoginType,
  settings,
  registrations,
  schedules,
  results,
  refreshData,
}) {
  const openLogin = (type) => {
    setLoginType(type);
    setShowLogin(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Navbar - Matching the design (hidden when printing) */}
      <nav className="print:hidden bg-[#175e38] text-white px-6 py-4 flex flex-col md:flex-row justify-between items-center shadow-md">
        <div className="flex items-center space-x-8 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => setView("beranda")}
          >
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center p-0.5">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/8/82/Seal_of_the_Ministry_of_Religious_Affairs_of_the_Republic_of_Indonesia.svg"
                alt="Logo Kemenag"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-xl tracking-wide">
              PORSADIN 2026
            </span>
          </div>
          <div className="hidden md:flex space-x-6 text-sm font-medium">
            <button
              onClick={() => setView("beranda")}
              className={`hover:text-yellow-300 transition-colors ${
                view === "beranda" ? "text-yellow-400" : ""
              }`}
            >
              Beranda
            </button>
            <button
              onClick={() => setView("pendaftaran")}
              className={`hover:text-yellow-300 transition-colors ${
                view === "pendaftaran" ? "text-yellow-400" : ""
              }`}
            >
              Pendaftaran
            </button>
            <button
              onClick={() => setView("cek")}
              className={`hover:text-yellow-300 transition-colors ${
                view === "cek" ? "text-yellow-400" : ""
              }`}
            >
              Cek Peserta
            </button>
            <button
              onClick={() => setView("jadwal")}
              className={`hover:text-yellow-300 transition-colors ${
                view === "jadwal" ? "text-yellow-400" : ""
              }`}
            >
              Jadwal Kegiatan
            </button>
            <button
              onClick={() => setView("hasil")}
              className={`hover:text-yellow-300 transition-colors ${
                view === "hasil" ? "text-yellow-400" : ""
              }`}
            >
              Hasil Lomba
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-4 mt-4 md:mt-0 text-sm">
          <button
            onClick={() => openLogin("koordinator")}
            className="flex items-center space-x-1 hover:text-yellow-300 transition-colors"
          >
            <UserCheck size={16} /> <span>Koordinator</span>
          </button>
          <button
            onClick={() => openLogin("panitia")}
            className="flex items-center space-x-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors"
          >
            <Shield size={16} /> <span>Panitia</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow">
        {view === "beranda" && (
          <div className="bg-[#175e38] text-white min-h-[85vh] flex items-center">
            <div className="container mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between">
              {/* Left Side */}
              <div className="md:w-1/2 mb-10 md:mb-0">
                <div className="inline-flex items-center space-x-2 bg-white text-[#175e38] px-4 py-1.5 rounded-full font-semibold text-sm mb-6">
                  <span>★ Pendaftaran Porsadin Tahun Ajaran 2026/2027</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
                  Wujudkan Impian <br />
                  <span className="text-gray-300">
                    Generasi Rabbani
                    <br />
                    Terbaik
                  </span>
                </h1>
                <p className="text-lg mb-8 max-w-lg text-gray-200">
                  Pekan Olahraga dan Seni Antar Diniyah (PORSADIN) 2026. Daftar
                  sekarang dan tunjukkan bakat terbaik santri Diniyah
                  Takmiliyah!
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setView("pendaftaran")}
                    className="bg-white text-[#175e38] hover:bg-gray-100 font-bold py-3 px-6 rounded-full flex items-center space-x-2 transition-transform transform hover:scale-105 shadow-lg"
                  >
                    <Rocket size={18} /> <span>Daftar Sekarang</span>
                  </button>
                  <button
                    onClick={() => setView("cek")}
                    className="border-2 border-white hover:bg-white/10 font-bold py-3 px-6 rounded-full flex items-center space-x-2 transition-colors"
                  >
                    <Search size={18} /> <span>Cek Status</span>
                  </button>
                </div>
              </div>

              {/* Right Side - Logo Card */}
              <div className="md:w-5/12 flex justify-center">
                <div className="bg-[#217747] p-10 rounded-[2rem] shadow-2xl flex flex-col items-center border border-[#2a9259]">
                  <div className="relative w-48 h-48 mb-6 bg-white rounded-full flex flex-col items-center justify-center p-4 shadow-lg border-4 border-[#175e38]">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/8/82/Seal_of_the_Ministry_of_Religious_Affairs_of_the_Republic_of_Indonesia.svg"
                      alt="Logo Kemenag"
                      className="w-full h-full object-contain drop-shadow-md"
                    />
                  </div>
                  <h2 className="text-3xl font-extrabold tracking-wide mb-2 text-white">
                    PORSADIN 2026
                  </h2>
                  <p className="text-green-100 font-medium tracking-widest text-sm uppercase">
                    Sportif, Inovatif, Islami
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === "pendaftaran" && (
          <PublicRegistration
            settings={settings}
            LombaList={LOMBA_LIST}
            registrations={registrations}
            refreshData={refreshData}
          />
        )}

        {view === "cek" && (
          <div className="container mx-auto px-6 py-12 max-w-3xl">
            <h2 className="text-3xl font-bold text-[#175e38] mb-6 text-center">
              Cek Status Pendaftaran
            </h2>
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <PublicCheckStatus
                registrations={registrations}
                refreshData={refreshData}
              />
            </div>
          </div>
        )}

        {view === "jadwal" && (
          <div className="container mx-auto px-6 py-12 max-w-5xl">
            <h2 className="text-3xl font-bold text-[#175e38] mb-8 text-center">
              Jadwal Kegiatan PORSADIN 2026
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schedules.length === 0 ? (
                <p className="col-span-full text-center text-gray-500">
                  Jadwal belum tersedia.
                </p>
              ) : null}
              {schedules
                .sort((a, b) => a.timestamp - b.timestamp)
                .map((s) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const scheduleDate = new Date(s.endDate || s.date);
                  const isPast = scheduleDate < today;

                  return (
                    <div
                      key={s.id}
                      className={`bg-white p-6 rounded-2xl border transition-all duration-300 ${
                        isPast
                          ? "border-gray-200 opacity-50 grayscale"
                          : "border-t-4 border-t-[#175e38] shadow-lg shadow-green-100"
                      }`}
                    >
                      <h3
                        className={`text-lg font-bold mb-3 ${
                          isPast ? "text-gray-500" : "text-gray-800"
                        }`}
                      >
                        {s.title}
                      </h3>

                      <div className="space-y-1">
                        <p
                          className={`text-sm ${
                            isPast ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {s.startDate && s.endDate
                            ? `${s.startDate} s/d ${s.endDate}`
                            : new Date(s.date).toLocaleDateString("id-ID")}
                        </p>
                        <p
                          className={`text-sm ${
                            isPast ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {s.location}
                        </p>
                      </div>

                      {s.description && (
                        <p
                          className={`text-xs mt-4 pt-3 border-t ${
                            isPast
                              ? "text-gray-400 border-gray-100"
                              : "text-gray-500 border-gray-100"
                          }`}
                        >
                          {s.description}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {view === "hasil" && (
          <div className="container mx-auto px-6 py-12 max-w-5xl">
            <h2 className="text-3xl font-bold text-[#175e38] mb-8 text-center">
              Hasil Perlombaan
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {LOMBA_LIST.map((lomba) => {
                const resultsPutra = results
                  .filter((r) => r.competition === `${lomba} Putra`)
                  .sort((a, b) => a.rank - b.rank);
                const resultsPutri = results
                  .filter((r) => r.competition === `${lomba} Putri`)
                  .sort((a, b) => a.rank - b.rank);

                if (resultsPutra.length === 0 && resultsPutri.length === 0)
                  return null;

                const renderResultList = (resList, title) => {
                  if (resList.length === 0) return null;
                  return (
                    <div className="mt-4">
                      <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3 border-b pb-1">
                        {title}
                      </h4>
                      <ul className="space-y-3">
                        {resList.map((res) => {
                          const reg = registrations.find(
                            (r) => String(r.id) === String(res.registrationId)
                          );
                          if (!reg) return null;
                          return (
                            <li
                              key={res.id}
                              className="flex items-center p-3 bg-gray-50 rounded-lg"
                            >
                              <span
                                className={`w-8 h-8 flex items-center justify-center rounded-full font-bold mr-4 ${
                                  res.rank == 1
                                    ? "bg-yellow-400 text-white"
                                    : res.rank == 2
                                    ? "bg-gray-300 text-gray-700"
                                    : res.rank == 3
                                    ? "bg-amber-600 text-white"
                                    : "bg-green-100 text-[#175e38]"
                                }`}
                              >
                                {res.rank}
                              </span>
                              <div>
                                <p className="font-bold text-gray-800">
                                  {reg.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {reg.madrasah}
                                </p>
                              </div>
                              <div className="ml-auto font-semibold text-[#175e38]">
                                Nilai: {res.score}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                };

                return (
                  <div
                    key={lomba}
                    className="bg-white p-6 rounded-xl shadow-md border-t-4 border-[#175e38]"
                  >
                    <h3 className="text-xl font-bold text-gray-800">{lomba}</h3>
                    {renderResultList(resultsPutra, "Kategori Putra")}
                    {renderResultList(resultsPutri, "Kategori Putri")}
                  </div>
                );
              })}
            </div>
            {results.length === 0 && (
              <p className="text-center text-gray-500">
                Belum ada hasil lomba yang diumumkan.
              </p>
            )}
          </div>
        )}
      </main>

      {/* Footer (hidden when printing) */}
      <footer className="print:hidden bg-[#0f4025] text-center py-6 text-green-100/70 text-sm">
        <div className="container mx-auto">
          <p>
            &copy; 2026 Panitia PORSADIN Kemenag. Hak Cipta Dilindungi
            Undang-Undang.
          </p>
          <p className="mt-1 text-xs">
            Aplikasi Pendaftaran & Sistem Informasi PORSADIN
          </p>
        </div>
      </footer>
    </div>
  );
}

function RegistrationProof({ data, onClose }) {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl print:p-0 print:m-0 print:max-w-full">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl border-t-8 border-[#175e38] print:shadow-none print:border-none print:rounded-none">
        <div className="text-center mb-6 pb-6 border-b-2 border-[#175e38]">
          <h2 className="text-3xl font-extrabold text-[#175e38] uppercase">
            Tanda Bukti Pendaftaran
          </h2>
          <h3 className="text-lg font-semibold text-gray-700">
            Pekan Olahraga dan Seni Antar Diniyah (PORSADIN) 2026
          </h3>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8 text-center print:bg-white print:border-2 print:border-gray-800">
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-widest mb-1">
            Nomor Pendaftaran Anda
          </p>
          <p className="text-4xl md:text-5xl font-extrabold text-[#175e38] tracking-wider print:text-black">
            {data.registrationCode}
          </p>
          <p className="text-xs text-green-700 mt-3 font-medium print:hidden">
            Simpan nomor ini untuk mengecek status pendaftaran Anda.
          </p>
        </div>

        <div className="mb-8">
          <h4 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
            Detail Santri & Pendaftaran
          </h4>
          <table className="w-full text-left border-collapse text-sm md:text-base">
            <tbody>
              <tr className="border-b">
                <th className="py-3 w-1/3 text-gray-600 align-top">
                  Nama Santri
                </th>
                <td className="py-3 font-bold text-gray-900 align-top">
                  {data.name}
                </td>
              </tr>
              <tr className="border-b">
                <th className="py-3 text-gray-600 align-top">
                  Tempat, Tgl Lahir
                </th>
                <td className="py-3 align-top">
                  {data.tempatLahir},{" "}
                  {new Date(data.birthDate).toLocaleDateString("id-ID")}
                </td>
              </tr>
              <tr className="border-b">
                <th className="py-3 text-gray-600 align-top">Jenis Kelamin</th>
                <td className="py-3 align-top">{data.gender}</td>
              </tr>
              <tr className="border-b">
                <th className="py-3 text-gray-600 align-top">Alamat Santri</th>
                <td className="py-3 align-top">{data.alamatSantri}</td>
              </tr>
              <tr className="border-b">
                <th className="py-3 text-gray-600 align-top">Asal Madrasah</th>
                <td className="py-3 font-semibold text-gray-800 align-top">
                  {data.madrasah}
                </td>
              </tr>
              <tr className="border-b">
                <th className="py-3 text-gray-600 align-top">
                  Alamat Madrasah
                </th>
                <td className="py-3 align-top">{data.alamatMadrasah}</td>
              </tr>
              <tr className="border-b">
                <th className="py-3 text-gray-600 align-top">Cabang Lomba</th>
                <td className="py-3 font-bold text-lg text-[#175e38] align-top print:text-black">
                  {data.competition}
                </td>
              </tr>
              <tr className="border-b">
                <th className="py-3 text-gray-600 align-top">Dokumen Akta</th>
                <td className="py-3 text-gray-500 italic align-top">
                  {data.fileNameAkta}
                </td>
              </tr>
              <tr>
                <th className="py-3 text-gray-600 align-top">Waktu Daftar</th>
                <td className="py-3 align-top">
                  {new Date(data.timestamp).toLocaleString("id-ID")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8 print:hidden">
          <button
            onClick={() => window.print()}
            className="bg-[#175e38] hover:bg-[#11462a] text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center transition-colors shadow-md"
          >
            <Printer size={20} className="mr-2" /> Cetak / Download PDF
          </button>
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition-colors text-center"
          >
            Selesai & Kembali
          </button>
        </div>
      </div>
    </div>
  );
}

function PublicRegistration({
  settings,
  LombaList,
  registrations,
  refreshData,
}) {
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);

  if (!settings.isOpen) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md">
          <AlertCircle size={64} className="mx-auto text-amber-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Pendaftaran Ditutup
          </h2>
          <p className="text-gray-600">
            Mohon maaf, pendaftaran PORSADIN 2026 saat ini sedang ditutup.
            Silakan pantau terus informasi selanjutnya.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.target);

    const comp = fd.get("competition");
    const prefix = LOMBA_MAPPING[comp] || "UMM";
    const existingCount = registrations.filter(
      (r) => r.competition === comp
    ).length;
    const seqNumber = String(existingCount + 1).padStart(3, "0");
    const registrationCode = `${prefix}-${seqNumber}`;

    const fileAkta = fd.get("fileAkta");
    let fileName = "Tidak dilampirkan";
    let fileData = null;

    if (fileAkta && fileAkta.name && fileAkta.size > 0) {
      if (fileAkta.size > 700000) {
        alert("Ukuran file terlalu besar! Maksimal 700KB.");
        setLoading(false);
        return;
      }
      fileName = fileAkta.name;
      fileData = await readFileAsDataURL(fileAkta);
    }

    const data = {
      registrationCode: registrationCode,
      name: fd.get("name"),
      tempatLahir: fd.get("tempatLahir"),
      birthDate: fd.get("birthDate"),
      gender: fd.get("gender"),
      alamatSantri: fd.get("alamatSantri"),
      madrasah: fd.get("madrasah"),
      alamatMadrasah: fd.get("alamatMadrasah"),
      competition: comp,
      fileNameAkta: fileName,
      fileData: fileData, // Google Sheets API akan mengubahnya jadi fileUrl
      status: "Menunggu",
      note: "",
    };

    try {
      const addedData = await fetchAPI("Registrations", "ADD", data);
      setSuccessData(addedData);
      refreshData();
    } catch (err) {
      alert("Terjadi kesalahan saat menyimpan pendaftaran ke Database.");
    }
    setLoading(false);
  };

  if (successData) {
    return (
      <RegistrationProof
        data={successData}
        onClose={() => setSuccessData(null)}
      />
    );
  }

  const fmtDate = new Date(settings.minBirthDate).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <div className="bg-white p-8 rounded-2xl shadow-xl border-t-8 border-[#175e38]">
        <h2 className="text-3xl font-bold text-[#175e38] mb-2 text-center">
          Formulir Pendaftaran
        </h2>
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-8 text-sm text-center max-w-xl mx-auto">
          <AlertCircle size={16} className="inline mr-2 -mt-1" />
          Batas usia tertua: Kelahiran <strong>{fmtDate}</strong> atau
          setelahnya (lebih muda diperbolehkan).
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Users size={20} className="mr-2 text-[#175e38]" /> Data Diri
              Santri
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nama Lengkap Santri
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Sesuai Akta Kelahiran"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#175e38]"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Tempat Lahir
                  </label>
                  <input
                    type="text"
                    name="tempatLahir"
                    required
                    placeholder="Kabupaten/Kota Tempat Lahir"
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#175e38]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    required
                    min={settings.minBirthDate}
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#175e38]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Jenis Kelamin
                </label>
                <select
                  name="gender"
                  required
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#175e38]"
                >
                  <option value="">Pilih...</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Alamat Lengkap Santri
                </label>
                <textarea
                  name="alamatSantri"
                  required
                  rows="2"
                  placeholder="Jalan, RT/RW, Desa/Kelurahan..."
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#175e38]"
                ></textarea>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Home size={20} className="mr-2 text-[#175e38]" /> Asal & Pilihan
              Lomba
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Asal Madrasah / Diniyah
                </label>
                <input
                  type="text"
                  name="madrasah"
                  required
                  placeholder="Nama Madrasah Diniyah Takmiliyah"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#175e38]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Alamat Madrasah
                </label>
                <textarea
                  name="alamatMadrasah"
                  required
                  rows="2"
                  placeholder="Alamat lengkap Madrasah..."
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#175e38]"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Cabang Lomba
                </label>
                <select
                  name="competition"
                  required
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#175e38] bg-white font-medium text-[#175e38]"
                >
                  <option value="">Pilih Cabang Lomba...</option>
                  {LombaList.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
              <UploadCloud size={20} className="mr-2" /> Upload Dokumen
            </h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Upload Scan/Foto Akta Kelahiran
              </label>
              <input
                type="file"
                name="fileAkta"
                accept="image/*,.pdf"
                required
                className="w-full border border-gray-300 bg-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#175e38] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#175e38] file:text-white hover:file:bg-[#11462a]"
              />
              <p className="text-xs text-gray-500 mt-2">
                Format: JPG, PNG, atau PDF. Maksimal 700KB. Dokumen ini akan
                tersimpan otomatis di Google Drive.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#175e38] hover:bg-[#11462a] text-white font-bold py-4 px-4 rounded-xl transition-colors mt-4 text-xl shadow-lg flex items-center justify-center"
          >
            {loading ? (
              <>
                <RefreshCw size={24} className="mr-2 animate-spin" /> Memproses
                Data...
              </>
            ) : (
              <>
                <Check size={24} className="mr-2" /> Kirim Pendaftaran
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function PublicCheckStatus({ registrations, refreshData }) {
  const [search, setSearch] = useState("");
  const [result, setResult] = useState(null);
  const [printData, setPrintData] = useState(null);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    const found = registrations.filter(
      (r) =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.madrasah.toLowerCase().includes(search.toLowerCase()) ||
        (r.registrationCode &&
          r.registrationCode.toLowerCase().includes(search.toLowerCase()))
    );
    setResult(found);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.target);

    const fileAkta = fd.get("fileAkta");
    let fileName = editData.fileNameAkta;
    let fileData = null; // Opsional

    if (fileAkta && fileAkta.name && fileAkta.size > 0) {
      if (fileAkta.size > 700000) {
        alert("Ukuran file terlalu besar! Maksimal 700KB.");
        setLoading(false);
        return;
      }
      fileName = fileAkta.name;
      fileData = await readFileAsDataURL(fileAkta);
    }

    const updatedData = {
      name: fd.get("name"),
      tempatLahir: fd.get("tempatLahir"),
      birthDate: fd.get("birthDate"),
      gender: fd.get("gender"),
      alamatSantri: fd.get("alamatSantri"),
      madrasah: fd.get("madrasah"),
      alamatMadrasah: fd.get("alamatMadrasah"),
      competition: fd.get("competition"),
      fileNameAkta: fileName,
      status: "Menunggu",
      note: "",
    };

    if (fileData) {
      updatedData.fileData = fileData; // Akan diganti jadi fileUrl oleh Google Sheets
    }

    try {
      await fetchAPI("Registrations", "UPDATE", updatedData, editData.id);
      alert(
        'Data berhasil diperbaiki! Status Anda kembali menjadi "Menunggu" untuk divalidasi ulang.'
      );
      setEditData(null);
      refreshData();
      // Kosongkan hasil search agar user mencari ulang yang terbaru
      setResult(null);
    } catch (err) {
      alert("Gagal memperbarui data.");
    }
    setLoading(false);
  };

  if (printData) {
    return (
      <RegistrationProof data={printData} onClose={() => setPrintData(null)} />
    );
  }

  if (editData) {
    return (
      <div className="bg-white p-6 rounded-2xl border-t-4 border-amber-500 shadow-lg">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">
              Perbaiki Data Pendaftaran
            </h3>
            <p className="text-sm text-red-500 mt-1">
              Catatan Panitia: "{editData.note}"
            </p>
          </div>
          <button
            onClick={() => setEditData(null)}
            className="text-gray-500 hover:text-gray-800"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                name="name"
                defaultValue={editData.name}
                required
                className="w-full border p-2 rounded focus:ring-1 focus:ring-[#175e38]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Cabang Lomba
              </label>
              <select
                name="competition"
                defaultValue={editData.competition}
                required
                className="w-full border p-2 rounded focus:ring-1 focus:ring-[#175e38]"
              >
                {LOMBA_LIST.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Tempat Lahir
              </label>
              <input
                type="text"
                name="tempatLahir"
                defaultValue={editData.tempatLahir}
                required
                className="w-full border p-2 rounded focus:ring-1 focus:ring-[#175e38]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Tanggal Lahir
              </label>
              <input
                type="date"
                name="birthDate"
                defaultValue={editData.birthDate}
                required
                className="w-full border p-2 rounded focus:ring-1 focus:ring-[#175e38]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Jenis Kelamin
              </label>
              <select
                name="gender"
                defaultValue={editData.gender}
                required
                className="w-full border p-2 rounded focus:ring-1 focus:ring-[#175e38]"
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Asal Madrasah
              </label>
              <input
                type="text"
                name="madrasah"
                defaultValue={editData.madrasah}
                required
                className="w-full border p-2 rounded focus:ring-1 focus:ring-[#175e38]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Alamat Santri
              </label>
              <textarea
                name="alamatSantri"
                defaultValue={editData.alamatSantri}
                required
                rows="2"
                className="w-full border p-2 rounded focus:ring-1 focus:ring-[#175e38]"
              ></textarea>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Alamat Madrasah
              </label>
              <textarea
                name="alamatMadrasah"
                defaultValue={editData.alamatMadrasah}
                required
                rows="2"
                className="w-full border p-2 rounded focus:ring-1 focus:ring-[#175e38]"
              ></textarea>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Upload Ulang Akta (Opsional)
              </label>
              <input
                type="file"
                name="fileAkta"
                accept="image/*,.pdf"
                className="w-full border border-gray-300 bg-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#175e38] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#175e38] file:text-white hover:file:bg-[#11462a]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Biarkan kosong jika dokumen akta sebelumnya sudah benar.
                Maksimal 700KB. Dokumen saat ini: {editData.fileNameAkta}
              </p>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={() => setEditData(null)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded font-semibold hover:bg-gray-300"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-amber-500 text-white rounded font-semibold hover:bg-amber-600 flex items-center"
            >
              {loading ? (
                <RefreshCw size={16} className="mr-2 animate-spin" />
              ) : null}
              {loading ? "Menyimpan..." : "Kirim Perbaikan"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          required
          placeholder="Masukkan Nama, Madrasah, atau No. Daftar..."
          className="flex-grow border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#175e38]"
        />
        <button
          type="submit"
          className="bg-[#175e38] hover:bg-[#11462a] text-white px-6 rounded-lg font-semibold flex items-center"
        >
          <Search size={18} className="mr-2" /> Cari
        </button>
      </form>

      {result && result.length === 0 && (
        <p className="text-center text-red-500 font-medium p-4 bg-red-50 rounded-lg">
          Data tidak ditemukan.
        </p>
      )}

      {result && result.length > 0 && (
        <div className="space-y-4">
          {result.map((reg) => (
            <div
              key={reg.id}
              className="border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center"
            >
              <div>
                <h4 className="font-bold text-lg text-gray-800">
                  {reg.name}{" "}
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({reg.registrationCode || "-"})
                  </span>
                </h4>
                <p className="text-sm text-gray-600">
                  {reg.madrasah} | Lomba: {reg.competition}
                </p>
              </div>
              <div className="mt-3 md:mt-0 text-right w-full md:w-auto flex flex-col items-end">
                <span
                  className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${
                    reg.status === "Diterima"
                      ? "bg-green-100 text-green-700"
                      : reg.status === "Ditolak"
                      ? "bg-red-100 text-red-700"
                      : reg.status === "Diperbaiki"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  Status: {reg.status}
                </span>
                {reg.status === "Diterima" && (
                  <button
                    onClick={() => setPrintData(reg)}
                    className="mt-2 text-sm text-[#175e38] hover:underline font-semibold flex items-center"
                  >
                    <Printer size={14} className="mr-1" /> Cetak Bukti
                  </button>
                )}
                {reg.status === "Diperbaiki" && (
                  <>
                    <p className="text-xs text-amber-700 mt-2 p-2 bg-amber-50 rounded italic border border-amber-200 text-left w-full max-w-[250px]">
                      Catatan: {reg.note}
                    </p>
                    <button
                      onClick={() => setEditData(reg)}
                      className="mt-2 text-sm bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg font-semibold flex items-center transition-colors shadow-sm"
                    >
                      <Edit3 size={14} className="mr-1" /> Perbaiki Data
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- PANITIA (ADMIN) VIEW ---
function PanitiaView({ onLogout, data, refreshData, loadingData }) {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [isLaporanOpen, setIsLaporanOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", icon: Home, label: "Dashboard" },
    { id: "pendaftar", icon: Users, label: "Pendaftar" },
    { id: "jadwal", icon: Calendar, label: "Jadwal" },
    { id: "hasil", icon: Trophy, label: "Hasil Lomba" },
    { id: "koordinator", icon: UserCheck, label: "Koordinator" },
    {
      id: "laporan",
      icon: Printer,
      label: "Laporan",
      subItems: [
        { id: "laporan-pendaftar", label: "Pendaftar" },
        { id: "laporan-hasil", label: "Hasil Lomba" },
        { id: "laporan-koordinator", label: "Koordinator" },
      ],
    },
    { id: "pengaturan", icon: Settings, label: "Pengaturan" },
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar - hidden when printing */}
      <aside className="w-64 bg-[#0f4025] text-white flex flex-col no-print">
        <div className="p-6 text-center border-b border-white/10 relative">
          <Shield size={40} className="mx-auto mb-2 text-yellow-400" />
          <h2 className="font-bold text-xl tracking-wider">PANITIA</h2>
          <p className="text-xs text-gray-300">PORSADIN 2026</p>
          <button
            onClick={refreshData}
            disabled={loadingData}
            className="absolute top-4 right-4 text-green-200 hover:text-white"
            title="Refresh Data dari Google Sheets"
          >
            <RefreshCw
              size={16}
              className={loadingData ? "animate-spin" : ""}
            />
          </button>
        </div>
        <nav className="flex-grow py-4 overflow-y-auto custom-scrollbar">
          {menuItems.map((m) => {
            if (m.subItems) {
              return (
                <div key={m.id}>
                  <button
                    onClick={() => setIsLaporanOpen(!isLaporanOpen)}
                    className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                      activeMenu.startsWith("laporan")
                        ? "bg-[#175e38] border-l-4 border-yellow-400"
                        : "hover:bg-white/5 text-gray-300"
                    }`}
                  >
                    <m.icon size={18} className="mr-3" /> {m.label}
                    <ChevronDown
                      size={16}
                      className={`ml-auto transition-transform duration-200 ${
                        isLaporanOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isLaporanOpen && (
                    <div className="bg-[#0c331e] py-2 space-y-1">
                      {m.subItems.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => setActiveMenu(sub.id)}
                          className={`w-full text-left pl-14 py-2 text-sm transition-colors ${
                            activeMenu === sub.id
                              ? "text-yellow-400 font-bold"
                              : "text-gray-300 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={m.id}
                onClick={() => {
                  setActiveMenu(m.id);
                  setIsLaporanOpen(false);
                }}
                className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                  activeMenu === m.id
                    ? "bg-[#175e38] border-l-4 border-yellow-400"
                    : "hover:bg-white/5 text-gray-300"
                }`}
              >
                <m.icon size={18} className="mr-3" /> {m.label}
              </button>
            );
          })}
        </nav>
        <button
          onClick={onLogout}
          className="flex items-center justify-center p-4 bg-red-600/20 hover:bg-red-600/40 text-red-300 transition-colors"
        >
          <LogOut size={18} className="mr-2" /> Keluar
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto print:overflow-visible print:bg-white relative">
        {loadingData && (
          <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
            <div className="bg-white p-4 rounded-xl shadow-lg flex items-center font-bold text-[#175e38]">
              <RefreshCw size={24} className="animate-spin mr-3" /> Sinkronisasi
              dengan Google Sheets...
            </div>
          </div>
        )}
        <div className="p-8">
          {activeMenu === "dashboard" && <PanitiaDashboard data={data} />}
          {activeMenu === "pendaftar" && (
            <PanitiaPendaftar
              data={data.registrations}
              refreshData={refreshData}
            />
          )}
          {activeMenu === "jadwal" && (
            <PanitiaJadwal data={data.schedules} refreshData={refreshData} />
          )}
          {activeMenu === "hasil" && (
            <PanitiaHasil data={data} refreshData={refreshData} />
          )}
          {activeMenu === "koordinator" && (
            <PanitiaKoordinator
              data={data.coordinators}
              refreshData={refreshData}
            />
          )}
          {activeMenu.startsWith("laporan-") && (
            <PanitiaLaporan
              data={data}
              reportType={activeMenu.replace("laporan-", "")}
            />
          )}
          {activeMenu === "pengaturan" && (
            <PanitiaPengaturan data={data.settings} refreshData={refreshData} />
          )}
        </div>
      </main>
    </div>
  );
}

function PanitiaDashboard({ data }) {
  const { registrations, coordinators, results, schedules } = data;
  const total = registrations.length;
  const diterima = registrations.filter((r) => r.status === "Diterima").length;
  const menunggu = registrations.filter((r) => r.status === "Menunggu").length;

  const upcomingSchedules = schedules
    .filter((s) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(s.endDate || s.date) >= today;
    })
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(0, 3);

  const monitoringLomba = LOMBA_LIST.map((lomba) => {
    const verifiedCount = registrations.filter(
      (r) => r.status === "Diterima" && r.competition === lomba
    ).length;
    const coord = coordinators.find((c) => c.competition === lomba);
    const hasResult = results.some((r) => r.competition.startsWith(lomba));

    let statusText = "Belum Input";
    let statusClass = "bg-red-100 text-red-700";

    if (verifiedCount === 0) {
      statusText = "Tidak Ada Peserta";
      statusClass = "bg-gray-100 text-gray-500";
    } else if (hasResult) {
      statusText = "Sudah Input";
      statusClass = "bg-green-100 text-green-700";
    }

    return {
      lomba,
      verifiedCount,
      coordName: coord ? coord.name : "Belum Ditugaskan",
      statusText,
      statusClass,
    };
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Dashboard Panitia
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <p className="text-sm text-gray-500 font-medium">Total Pendaftar</p>
          <p className="text-3xl font-bold text-gray-800">{total}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
          <p className="text-sm text-gray-500 font-medium">
            Diverifikasi (Diterima)
          </p>
          <p className="text-3xl font-bold text-green-600">{diterima}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-amber-500">
          <p className="text-sm text-gray-500 font-medium">
            Menunggu Verifikasi
          </p>
          <p className="text-3xl font-bold text-amber-600">{menunggu}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
          <p className="text-sm text-gray-500 font-medium">Total Koordinator</p>
          <p className="text-3xl font-bold text-purple-600">
            {coordinators.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <Calendar size={20} className="mr-2 text-[#175e38]" /> Jadwal
            Mendatang
          </h2>
          <div className="flex flex-col gap-4">
            {upcomingSchedules.length === 0 ? (
              <p className="text-gray-500 text-sm">
                Tidak ada jadwal kegiatan mendatang.
              </p>
            ) : (
              upcomingSchedules.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-lg border border-green-100 bg-green-50/50 border-l-4 border-l-[#175e38]"
                >
                  <h3 className="font-bold text-gray-800 mb-1 text-sm">
                    {s.title}
                  </h3>
                  <p className="text-xs text-gray-600 font-medium">
                    {s.startDate && s.endDate
                      ? `${s.startDate} s/d ${s.endDate}`
                      : new Date(s.date).toLocaleDateString("id-ID")}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{s.location}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <Trophy size={20} className="mr-2 text-[#175e38]" /> Monitoring
            Input Hasil Lomba
          </h2>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Cabang Lomba
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Koordinator
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Peserta
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Status Input
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {monitoringLomba.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      {item.lomba}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm ${
                        item.coordName === "Belum Ditugaskan"
                          ? "text-gray-400 italic"
                          : "text-gray-600"
                      }`}
                    >
                      {item.coordName}
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-semibold text-gray-600">
                      {item.verifiedCount}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${item.statusClass}`}
                      >
                        {item.statusText}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function PanitiaPendaftar({ data, refreshData }) {
  const [filter, setFilter] = useState("Semua");
  const [selectedReg, setSelectedReg] = useState(null);
  const [noteModal, setNoteModal] = useState({ show: false, id: "", note: "" });
  const [editModal, setEditModal] = useState({ show: false, data: null });
  const [addModal, setAddModal] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  const filteredData = data
    .filter((r) => (filter === "Semua" ? true : r.status === filter))
    .sort((a, b) => b.timestamp - a.timestamp);

  const updateStatus = async (id, status, note = "") => {
    setLoadingAction(true);
    try {
      await fetchAPI("Registrations", "UPDATE", { status, note }, id);
      refreshData();
    } catch (e) {
      alert("Error updating status");
    }
    setLoadingAction(false);
  };

  const deleteReg = async (id) => {
    if (window.confirm("Yakin ingin menghapus pendaftar ini?")) {
      setLoadingAction(true);
      await fetchAPI("Registrations", "DELETE", null, id);
      refreshData();
      setLoadingAction(false);
    }
  };

  const submitNote = (e) => {
    e.preventDefault();
    updateStatus(noteModal.id, "Diperbaiki", noteModal.note);
    setNoteModal({ show: false, id: "", note: "" });
  };

  const submitEditData = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    const fd = new FormData(e.target);
    const updatedData = {
      name: fd.get("name"),
      tempatLahir: fd.get("tempatLahir"),
      birthDate: fd.get("birthDate"),
      gender: fd.get("gender"),
      alamatSantri: fd.get("alamatSantri"),
      madrasah: fd.get("madrasah"),
      alamatMadrasah: fd.get("alamatMadrasah"),
      competition: fd.get("competition"),
    };

    try {
      await fetchAPI("Registrations", "UPDATE", updatedData, editModal.data.id);
      alert("Data pendaftar berhasil diperbarui!");
      setEditModal({ show: false, data: null });
      refreshData();
    } catch (err) {
      alert("Gagal memperbarui data.");
    }
    setLoadingAction(false);
  };

  const submitAddData = async (e) => {
    e.preventDefault();
    setLoadingAction(true);
    const fd = new FormData(e.target);

    const comp = fd.get("competition");
    const prefix = LOMBA_MAPPING[comp] || "UMM";
    const existingCount = data.filter((r) => r.competition === comp).length;
    const seqNumber = String(existingCount + 1).padStart(3, "0");
    const registrationCode = `${prefix}-${seqNumber}`;

    const fileAkta = fd.get("fileAkta");
    let fileName = "Diinput oleh Admin";
    let fileData = null;

    if (fileAkta && fileAkta.name && fileAkta.size > 0) {
      if (fileAkta.size > 700000) {
        alert("Ukuran file terlalu besar! Maksimal 700KB.");
        setLoadingAction(false);
        return;
      }
      fileName = fileAkta.name;
      fileData = await readFileAsDataURL(fileAkta);
    }

    const newData = {
      registrationCode: registrationCode,
      name: fd.get("name"),
      tempatLahir: fd.get("tempatLahir"),
      birthDate: fd.get("birthDate"),
      gender: fd.get("gender"),
      alamatSantri: fd.get("alamatSantri"),
      madrasah: fd.get("madrasah"),
      alamatMadrasah: fd.get("alamatMadrasah"),
      competition: comp,
      fileNameAkta: fileName,
      fileData: fileData, // GAS backend akan menanganinya
      status: fd.get("status"),
      note: "",
    };

    try {
      await fetchAPI("Registrations", "ADD", newData);
      alert("Pendaftar berhasil ditambahkan!");
      setAddModal(false);
      refreshData();
    } catch (err) {
      alert("Gagal menambahkan pendaftar.");
    }
    setLoadingAction(false);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Kelola Pendaftar</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 bg-white flex-grow sm:flex-grow-0"
          >
            <option value="Semua">Semua Status</option>
            <option value="Menunggu">Menunggu</option>
            <option value="Diterima">Diterima</option>
            <option value="Diperbaiki">Diperbaiki</option>
            <option value="Ditolak">Ditolak</option>
          </select>
          <button
            onClick={() => setAddModal(true)}
            className="bg-[#175e38] hover:bg-[#11462a] text-white px-4 py-2 rounded-lg font-semibold shadow-sm flex items-center transition-colors whitespace-nowrap"
          >
            <UserPlus size={18} className="mr-2" /> Tambah Peserta
          </button>
        </div>
      </div>

      {loadingAction && (
        <div className="text-center py-2 text-[#175e38] font-bold animate-pulse">
          Memproses permintaan ke Database...
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama & Asal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lomba
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-800">{r.name}</div>
                  <div className="text-sm text-gray-500">
                    {r.registrationCode || "-"} | {r.madrasah}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {r.competition}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${
                      r.status === "Diterima"
                        ? "bg-green-100 text-green-800"
                        : r.status === "Diperbaiki"
                        ? "bg-yellow-100 text-yellow-800"
                        : r.status === "Ditolak"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                  <button
                    onClick={() => setSelectedReg(r)}
                    title="Lihat Detail"
                    className="text-blue-600 hover:text-blue-900 bg-blue-50 p-1.5 rounded"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => setEditModal({ show: true, data: r })}
                    title="Edit Data"
                    className="text-purple-600 hover:text-purple-900 bg-purple-50 p-1.5 rounded"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => updateStatus(r.id, "Diterima")}
                    title="Terima"
                    className="text-green-600 hover:text-green-900 bg-green-50 p-1.5 rounded"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={() =>
                      setNoteModal({ show: true, id: r.id, note: r.note || "" })
                    }
                    title="Minta Perbaikan"
                    className="text-amber-600 hover:text-amber-900 bg-amber-50 p-1.5 rounded"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={() => updateStatus(r.id, "Ditolak")}
                    title="Tolak"
                    className="text-gray-500 hover:text-gray-800 bg-gray-100 p-1.5 rounded"
                  >
                    <X size={18} />
                  </button>
                  <button
                    onClick={() => deleteReg(r.id)}
                    title="Hapus"
                    className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredData.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Tidak ada data pendaftar.
          </div>
        )}
      </div>

      {/* Note Modal */}
      {noteModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Catatan Perbaikan</h3>
            <form onSubmit={submitNote}>
              <textarea
                autoFocus
                required
                value={noteModal.note}
                onChange={(e) =>
                  setNoteModal({ ...noteModal, note: e.target.value })
                }
                className="w-full border p-2 rounded mb-4"
                rows="3"
                placeholder="Masukkan keterangan kenapa harus diperbaiki..."
              ></textarea>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() =>
                    setNoteModal({ show: false, id: "", note: "" })
                  }
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-white rounded"
                >
                  Simpan & Ubah Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.show && editModal.data && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="text-lg font-bold text-gray-800">
                Edit Data Pendaftar:{" "}
                <span className="text-[#175e38]">
                  {editModal.data.registrationCode}
                </span>
              </h3>
              <button
                onClick={() => setEditModal({ show: false, data: null })}
                className="text-gray-500 hover:text-gray-800"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={submitEditData} className="space-y-4 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editModal.data.name}
                    required
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-[#175e38]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Cabang Lomba
                  </label>
                  <select
                    name="competition"
                    defaultValue={editModal.data.competition}
                    required
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-[#175e38]"
                  >
                    {LOMBA_LIST.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Tempat Lahir
                  </label>
                  <input
                    type="text"
                    name="tempatLahir"
                    defaultValue={editModal.data.tempatLahir}
                    required
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-[#175e38]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    defaultValue={editModal.data.birthDate}
                    required
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-[#175e38]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    name="gender"
                    defaultValue={editModal.data.gender}
                    required
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-[#175e38]"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Asal Madrasah
                  </label>
                  <input
                    type="text"
                    name="madrasah"
                    defaultValue={editModal.data.madrasah}
                    required
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-[#175e38]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Alamat Santri
                  </label>
                  <textarea
                    name="alamatSantri"
                    defaultValue={editModal.data.alamatSantri}
                    required
                    rows="2"
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-[#175e38]"
                  ></textarea>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Alamat Madrasah
                  </label>
                  <textarea
                    name="alamatMadrasah"
                    defaultValue={editModal.data.alamatMadrasah}
                    required
                    rows="2"
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-[#175e38]"
                  ></textarea>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditModal({ show: false, data: null })}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded font-semibold hover:bg-gray-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#175e38] text-white rounded font-semibold hover:bg-[#11462a]"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {addModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <UserPlus size={20} className="mr-2 text-[#175e38]" /> Tambah
                Pendaftar (Admin)
              </h3>
              <button
                onClick={() => setAddModal(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={submitAddData} className="space-y-4 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-[#175e38]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Cabang Lomba
                  </label>
                  <select
                    name="competition"
                    required
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-[#175e38] bg-white"
                  >
                    <option value="">Pilih Cabang Lomba...</option>
                    {LOMBA_LIST.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Tempat Lahir
                  </label>
                  <input
                    type="text"
                    name="tempatLahir"
                    required
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-[#175e38]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    required
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-[#175e38]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    name="gender"
                    required
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-[#175e38] bg-white"
                  >
                    <option value="">Pilih...</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Asal Madrasah
                  </label>
                  <input
                    type="text"
                    name="madrasah"
                    required
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-[#175e38]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Alamat Santri
                  </label>
                  <textarea
                    name="alamatSantri"
                    required
                    rows="2"
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-[#175e38]"
                  ></textarea>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Alamat Madrasah
                  </label>
                  <textarea
                    name="alamatMadrasah"
                    required
                    rows="2"
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-[#175e38]"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Status Pendaftaran
                  </label>
                  <select
                    name="status"
                    required
                    className="w-full border p-2 rounded focus:ring-1 focus:ring-[#175e38] bg-green-50 font-bold text-[#175e38]"
                  >
                    <option value="Diterima">
                      Diterima (Langsung Terverifikasi)
                    </option>
                    <option value="Menunggu">Menunggu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    File Akta (Opsional)
                  </label>
                  <input
                    type="file"
                    name="fileAkta"
                    accept="image/*,.pdf"
                    className="w-full border p-1 rounded focus:ring-1 focus:ring-[#175e38] text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maksimal 700KB. Akan tersimpan di Google Drive.
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setAddModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded font-semibold hover:bg-gray-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#175e38] text-white rounded font-semibold hover:bg-[#11462a]"
                >
                  Simpan Peserta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal Terperinci */}
      {selectedReg && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="text-lg font-bold text-gray-800">
                Detail Pendaftar
              </h3>
              <button
                onClick={() => setSelectedReg(null)}
                className="text-gray-500 hover:text-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-gray-100 p-4 rounded text-center mb-6 border">
              <span className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
                Nomor Pendaftaran
              </span>
              <span className="text-3xl font-bold text-[#175e38]">
                {selectedReg.registrationCode || "-"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <span className="font-semibold block text-gray-500">
                  Nama Lengkap
                </span>{" "}
                <span className="text-base font-medium">
                  {selectedReg.name}
                </span>
              </div>
              <div>
                <span className="font-semibold block text-gray-500">
                  Tempat, Tanggal Lahir
                </span>{" "}
                {selectedReg.tempatLahir},{" "}
                {selectedReg.birthDate
                  ? new Date(selectedReg.birthDate).toLocaleDateString("id-ID")
                  : "-"}
              </div>
              <div>
                <span className="font-semibold block text-gray-500">
                  Jenis Kelamin
                </span>{" "}
                {selectedReg.gender}
              </div>
              <div>
                <span className="font-semibold block text-gray-500">
                  Cabang Lomba
                </span>{" "}
                <span className="font-bold text-[#175e38]">
                  {selectedReg.competition}
                </span>
              </div>

              <div className="md:col-span-2 border-t pt-4 mt-2"></div>

              <div className="md:col-span-2">
                <span className="font-semibold block text-gray-500">
                  Alamat Santri
                </span>{" "}
                {selectedReg.alamatSantri || "-"}
              </div>
              <div className="md:col-span-2">
                <span className="font-semibold block text-gray-500">
                  Asal Madrasah
                </span>{" "}
                {selectedReg.madrasah}
              </div>
              <div className="md:col-span-2">
                <span className="font-semibold block text-gray-500">
                  Alamat Madrasah
                </span>{" "}
                {selectedReg.alamatMadrasah || "-"}
              </div>

              <div className="md:col-span-2 border-t pt-4 mt-2"></div>

              <div className="md:col-span-2">
                <span className="font-semibold block text-gray-500 mb-1">
                  File Akta Kelahiran
                </span>
                <div className="flex items-center p-3 bg-blue-50 border border-blue-100 rounded text-blue-800 justify-between">
                  <div className="flex items-center">
                    <FileText size={18} className="mr-2" />{" "}
                    {selectedReg.fileNameAkta || "Tidak ada file dilampirkan"}
                  </div>
                  {/* Menyesuaikan Preview ke Google Drive karena data tersimpan di Apps Script */}
                  {selectedReg.fileUrl && (
                    <div className="flex space-x-2">
                      <a
                        href={selectedReg.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center transition-colors shadow-sm"
                      >
                        <Eye size={16} className="mr-1" /> Buka Dokumen (Drive)
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <span className="font-semibold block text-gray-500">
                  Waktu Daftar
                </span>{" "}
                {selectedReg.timestamp
                  ? new Date(selectedReg.timestamp).toLocaleString("id-ID")
                  : "-"}
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded border flex justify-between items-center">
              <div>
                <span className="text-gray-600">Status saat ini:</span>
                <strong
                  className={`ml-2 px-3 py-1 rounded-full text-xs text-white ${
                    selectedReg.status === "Diterima"
                      ? "bg-green-600"
                      : selectedReg.status === "Ditolak"
                      ? "bg-red-600"
                      : selectedReg.status === "Diperbaiki"
                      ? "bg-amber-500"
                      : "bg-blue-500"
                  }`}
                >
                  {selectedReg.status}
                </strong>
              </div>
              {selectedReg.note && (
                <div className="text-red-500 text-xs max-w-xs text-right">
                  Catatan perbaikan: "{selectedReg.note}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PanitiaJadwal({ data, refreshData }) {
  const [loading, setLoading] = useState(false);

  const submitJadwal = async (e) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.target);
    const newJadwal = {
      title: fd.get("title"),
      startDate: fd.get("startDate"),
      endDate: fd.get("endDate"),
      location: fd.get("location"),
      description: fd.get("description"),
    };
    try {
      await fetchAPI("Schedules", "ADD", newJadwal);
      refreshData();
      e.target.reset();
    } catch (err) {
      alert("Gagal menambah jadwal");
    }
    setLoading(false);
  };

  const deleteJadwal = async (id) => {
    if (window.confirm("Hapus jadwal ini?")) {
      setLoading(true);
      await fetchAPI("Schedules", "DELETE", null, id);
      refreshData();
      setLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm h-fit">
        <h2 className="text-lg font-bold mb-4 border-b pb-2">
          Tambah Jadwal Baru
        </h2>
        <form onSubmit={submitJadwal} className="space-y-3">
          <input
            type="text"
            name="title"
            required
            placeholder="Judul Kegiatan"
            className="w-full border p-2 rounded focus:ring-1 focus:ring-[#175e38] focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Tgl Mulai
              </label>
              <input
                type="date"
                name="startDate"
                required
                className="w-full border p-2 rounded focus:ring-1 focus:ring-[#175e38] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Tgl Selesai
              </label>
              <input
                type="date"
                name="endDate"
                required
                className="w-full border p-2 rounded focus:ring-1 focus:ring-[#175e38] focus:outline-none"
              />
            </div>
          </div>
          <input
            type="text"
            name="location"
            required
            placeholder="Lokasi (mis: Online / Sekretariat)"
            className="w-full border p-2 rounded focus:ring-1 focus:ring-[#175e38] focus:outline-none"
          />
          <textarea
            name="description"
            placeholder="Keterangan singkat (Opsional)"
            className="w-full border p-2 rounded focus:ring-1 focus:ring-[#175e38] focus:outline-none"
            rows="2"
          ></textarea>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#175e38] text-white p-2 rounded hover:bg-[#11462a] font-semibold"
          >
            {loading ? "Menyimpan..." : "Simpan Jadwal"}
          </button>
        </form>
      </div>
      <div className="md:col-span-2">
        <h2 className="text-xl font-bold mb-4">Daftar Jadwal</h2>
        <div className="space-y-3">
          {data
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((s) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const scheduleDate = new Date(s.endDate || s.date);
              const isPast = scheduleDate < today;

              return (
                <div
                  key={s.id}
                  className={`bg-white p-4 rounded-xl shadow-sm flex justify-between items-center border-l-4 ${
                    isPast ? "border-gray-300 opacity-60" : "border-[#175e38]"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-800">{s.title}</h3>
                      {isPast && (
                        <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                          Selesai
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {s.startDate && s.endDate
                        ? `${s.startDate} s/d ${s.endDate}`
                        : new Date(s.date).toLocaleDateString("id-ID")}{" "}
                      | {s.location}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteJadwal(s.id)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-full"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          {data.length === 0 && (
            <p className="text-gray-500 bg-white p-4 rounded text-center border border-dashed">
              Belum ada jadwal ditambahkan.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function PanitiaKoordinator({ data, refreshData }) {
  const [loading, setLoading] = useState(false);

  const submitKoor = async (e) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.target);
    const newKoor = {
      name: fd.get("name"),
      competition: fd.get("competition"),
      waNumber: fd.get("waNumber"),
    };
    try {
      await fetchAPI("Coordinators", "ADD", newKoor);
      refreshData();
      e.target.reset();
    } catch (err) {
      alert("Gagal menambah koordinator");
    }
    setLoading(false);
  };

  const deleteKoor = async (id) => {
    if (window.confirm("Hapus koordinator ini?")) {
      setLoading(true);
      await fetchAPI("Coordinators", "DELETE", null, id);
      refreshData();
      setLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm h-fit">
        <h2 className="text-lg font-bold mb-4 border-b pb-2">
          Tambah Koordinator
        </h2>
        <form onSubmit={submitKoor} className="space-y-3">
          <input
            type="text"
            name="name"
            required
            placeholder="Nama Lengkap"
            className="w-full border p-2 rounded"
          />
          <select
            name="competition"
            required
            className="w-full border p-2 rounded bg-white"
          >
            <option value="">Pilih Cabang Lomba...</option>
            {LOMBA_LIST.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <div>
            <input
              type="text"
              name="waNumber"
              required
              placeholder="No WhatsApp (08...)"
              className="w-full border p-2 rounded"
            />
            <p className="text-xs text-gray-500 mt-1">
              No. WA digunakan untuk login koordinator.
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#175e38] text-white p-2 rounded hover:bg-[#11462a]"
          >
            {loading ? "Menyimpan..." : "Simpan Koordinator"}
          </button>
        </form>
      </div>
      <div className="md:col-span-2">
        <h2 className="text-xl font-bold mb-4">Daftar Koordinator Lomba</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nama
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Lomba
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  No. WA
                </th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {c.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {c.competition}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {c.waNumber}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteKoor(c.id)}
                      className="text-red-500 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              Belum ada data koordinator.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PanitiaHasil({ data, refreshData }) {
  const [selectedLomba, setSelectedLomba] = useState(LOMBA_LIST[0]);
  const [selectedGender, setSelectedGender] = useState("Putra");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const targetGender = selectedGender === "Putra" ? "Laki-laki" : "Perempuan";
  const fullCompetitionName = `${selectedLomba} ${selectedGender}`;

  const verifiedRegs = data.registrations.filter(
    (r) =>
      r.status === "Diterima" &&
      r.competition === selectedLomba &&
      r.gender === targetGender &&
      (searchQuery === "" ||
        (r.registrationCode &&
          r.registrationCode.toLowerCase().includes(searchQuery.toLowerCase())))
  );
  const lombaResults = data.results.filter(
    (r) => r.competition === fullCompetitionName
  );

  // Mengurutkan peserta: Juara 1, 2, 3 di paling atas, sisanya di bawah
  const sortedVerifiedRegs = [...verifiedRegs].sort((a, b) => {
    const resA = lombaResults.find(
      (r) => String(r.registrationId) === String(a.id)
    );
    const resB = lombaResults.find(
      (r) => String(r.registrationId) === String(b.id)
    );
    const rankA = resA && resA.rank ? parseInt(resA.rank) : 999;
    const rankB = resB && resB.rank ? parseInt(resB.rank) : 999;

    if (rankA !== rankB) return rankA - rankB;
    return a.name.localeCompare(b.name);
  });

  const saveResult = async (regId, rank, score) => {
    setLoading(true);
    const existing = lombaResults.find(
      (r) => String(r.registrationId) === String(regId)
    );
    try {
      if (existing) {
        if (!rank && !score) {
          await fetchAPI("Results", "DELETE", null, existing.id);
        } else {
          await fetchAPI(
            "Results",
            "UPDATE",
            { rank: parseInt(rank) || 0, score: parseInt(score) || 0 },
            existing.id
          );
        }
      } else {
        if (rank || score) {
          await fetchAPI("Results", "ADD", {
            registrationId: regId,
            competition: fullCompetitionName,
            rank: parseInt(rank) || 0,
            score: parseInt(score) || 0,
          });
        }
      }
      refreshData();
    } catch (err) {
      alert("Gagal menyimpan hasil lomba.");
    }
    setLoading(false);
  };

  const deleteResult = async (resultId) => {
    if (
      window.confirm("Yakin ingin menghapus hasil lomba untuk peserta ini?")
    ) {
      setLoading(true);
      await fetchAPI("Results", "DELETE", null, resultId);
      refreshData();
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold">Input/Edit Hasil Lomba (Admin)</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={selectedLomba}
            onChange={(e) => setSelectedLomba(e.target.value)}
            className="border p-2 rounded bg-gray-50 font-semibold w-full md:w-auto"
          >
            {LOMBA_LIST.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="border p-2 rounded bg-green-50 text-[#175e38] font-bold w-full md:w-auto"
          >
            <option value="Putra">Putra (Laki-laki)</option>
            <option value="Putri">Putri (Perempuan)</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Cari berdasarkan ID / Nomor Pendaftaran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#175e38] focus:border-[#175e38] sm:text-sm"
          />
        </div>
      </div>

      {loading && (
        <div className="text-sm font-bold text-[#175e38] mb-2 animate-pulse">
          Menyimpan...
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border">
          <thead className="bg-green-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-[#175e38]">
                ID Pendaftar
              </th>
              <th className="px-4 py-3 text-left font-semibold text-[#175e38]">
                Nama Peserta
              </th>
              <th className="px-4 py-3 text-left font-semibold text-[#175e38]">
                Asal Madrasah
              </th>
              <th className="px-4 py-3 text-center font-semibold text-[#175e38]">
                Juara (1,2,3)
              </th>
              <th className="px-4 py-3 text-center font-semibold text-[#175e38]">
                Nilai/Skor
              </th>
              <th className="px-4 py-3 text-center font-semibold text-[#175e38]">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedVerifiedRegs.map((reg) => {
              const res = lombaResults.find(
                (r) => String(r.registrationId) === String(reg.id)
              ) || { rank: "", score: "" };
              return (
                <tr key={reg.id}>
                  <td className="px-4 py-3 font-bold text-[#175e38]">
                    {reg.registrationCode || "-"}
                  </td>
                  <td className="px-4 py-3">{reg.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {reg.madrasah}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      id={`rank-admin-${reg.id}`}
                      type="number"
                      min="1"
                      max="3"
                      defaultValue={res.rank}
                      className="w-16 border rounded text-center p-1"
                      placeholder="-"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      id={`score-admin-${reg.id}`}
                      type="number"
                      defaultValue={res.score}
                      className="w-20 border rounded text-center p-1"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-4 py-3 text-center flex justify-center space-x-2">
                    <button
                      onClick={() => {
                        const r = document.getElementById(
                          `rank-admin-${reg.id}`
                        ).value;
                        const s = document.getElementById(
                          `score-admin-${reg.id}`
                        ).value;
                        saveResult(reg.id, r, s);
                      }}
                      disabled={loading}
                      className="bg-[#175e38] text-white px-3 py-1.5 rounded-lg text-sm hover:bg-[#11462a] flex items-center font-medium"
                    >
                      {res.rank ? (
                        <>
                          <Edit3 size={14} className="mr-1" /> Edit
                        </>
                      ) : (
                        "Simpan"
                      )}
                    </button>
                    {res.rank ? (
                      <button
                        onClick={() => deleteResult(res.id)}
                        disabled={loading}
                        className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-600 flex items-center font-medium"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {verifiedRegs.length === 0 && (
          <p className="p-4 text-center text-gray-500 border-x border-b">
            {searchQuery
              ? "Peserta dengan ID tersebut tidak ditemukan."
              : "Belum ada peserta yang diterima di cabang lomba ini."}
          </p>
        )}
      </div>
    </div>
  );
}

function PanitiaLaporan({ data, reportType }) {
  const [filterLomba, setFilterLomba] = useState("Semua");
  const [filterGender, setFilterGender] = useState("Semua");

  const exportToExcel = () => {
    let csvContent = "";
    let filename = `Laporan_${reportType}_${new Date().getTime()}.csv`;

    const escapeCSV = (str) => `"${String(str).replace(/"/g, '""')}"`;

    if (reportType === "pendaftar") {
      csvContent +=
        "No,No Daftar,Nama Lengkap,Tempat Lahir,Tanggal Lahir,Asal Madrasah,L/P,Cabang Lomba,Status\n";
      const filteredRegs = data.registrations
        .filter((r) =>
          filterLomba === "Semua" ? true : r.competition === filterLomba
        )
        .filter((r) =>
          filterGender === "Semua" ? true : r.gender === filterGender
        );

      filteredRegs.forEach((r, i) => {
        csvContent += `${i + 1},${escapeCSV(
          r.registrationCode || "-"
        )},${escapeCSV(r.name)},${escapeCSV(r.tempatLahir)},${escapeCSV(
          new Date(r.birthDate).toLocaleDateString("id-ID")
        )},${escapeCSV(r.madrasah)},${escapeCSV(
          r.gender === "Laki-laki" ? "L" : "P"
        )},${escapeCSV(r.competition)},${escapeCSV(r.status)}\n`;
      });
    } else if (reportType === "hasil") {
      csvContent += "Cabang Lomba,Juara,Nama Peserta,Asal Madrasah,Nilai\n";
      const filteredResults = data.results
        .sort(
          (a, b) =>
            a.competition.localeCompare(b.competition) || a.rank - b.rank
        )
        .filter((res) => {
          const reg = data.registrations.find(
            (r) => String(r.id) === String(res.registrationId)
          );
          if (!reg) return false;
          const matchLomba =
            filterLomba === "Semua" ? true : reg.competition === filterLomba;
          const matchGender =
            filterGender === "Semua" ? true : reg.gender === filterGender;
          return matchLomba && matchGender;
        });

      filteredResults.forEach((res) => {
        const reg = data.registrations.find(
          (r) => String(r.id) === String(res.registrationId)
        );
        if (reg) {
          csvContent += `${escapeCSV(res.competition)},${escapeCSV(
            res.rank
          )},${escapeCSV(reg.name)},${escapeCSV(reg.madrasah)},${escapeCSV(
            res.score
          )}\n`;
        }
      });
    } else if (reportType === "koordinator") {
      csvContent +=
        "No,Nama Koordinator,Cabang Lomba Ditugaskan,Nomor WhatsApp\n";
      data.coordinators.forEach((c, i) => {
        csvContent += `${i + 1},${escapeCSV(c.name)},${escapeCSV(
          c.competition
        )},${escapeCSV(c.waNumber)}\n`;
      });
    }

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 no-print border-b pb-4 gap-4">
        <h2 className="text-2xl font-bold">
          Cetak Laporan:{" "}
          {reportType === "pendaftar"
            ? "Pendaftar"
            : reportType === "hasil"
            ? "Hasil Lomba"
            : "Koordinator"}
        </h2>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          {(reportType === "pendaftar" || reportType === "hasil") && (
            <>
              <select
                value={filterLomba}
                onChange={(e) => setFilterLomba(e.target.value)}
                className="border border-gray-300 p-2 rounded-lg bg-gray-50 text-sm focus:ring-1 focus:ring-[#175e38] outline-none"
              >
                <option value="Semua">Semua Cabang Lomba</option>
                {LOMBA_LIST.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              <select
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
                className="border border-gray-300 p-2 rounded-lg bg-gray-50 text-sm focus:ring-1 focus:ring-[#175e38] outline-none"
              >
                <option value="Semua">Semua Kategori (L/P)</option>
                <option value="Laki-laki">Putra (Laki-laki)</option>
                <option value="Perempuan">Putri (Perempuan)</option>
              </select>
            </>
          )}
          <button
            onClick={exportToExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg inline-flex items-center justify-center font-semibold shadow-sm transition-colors"
          >
            <Download size={18} className="mr-2" /> Export Excel
          </button>
          <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center justify-center font-semibold shadow-sm transition-colors"
          >
            <Printer size={18} className="mr-2" /> Cetak / PDF
          </button>
        </div>
      </div>

      <div className="print-area">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold uppercase">
            Laporan{" "}
            {reportType === "pendaftar"
              ? "Data Pendaftar"
              : reportType === "hasil"
              ? "Hasil Lomba"
              : "Data Koordinator"}
          </h1>
          <h2 className="text-lg font-semibold text-gray-600">
            Pekan Olahraga dan Seni Antar Diniyah (PORSADIN) 2026
          </h2>

          {(reportType === "pendaftar" || reportType === "hasil") &&
            (filterLomba !== "Semua" || filterGender !== "Semua") && (
              <p className="text-sm font-semibold text-[#175e38] mt-2">
                Kategori:{" "}
                {filterLomba !== "Semua" ? filterLomba : "Semua Lomba"}{" "}
                {filterGender !== "Semua"
                  ? `(${filterGender === "Laki-laki" ? "Putra" : "Putri"})`
                  : ""}
              </p>
            )}

          <p className="text-sm text-gray-500 mt-1">
            Dicetak pada: {new Date().toLocaleDateString("id-ID")}
          </p>
        </div>

        {reportType === "pendaftar" && (
          <table className="w-full text-sm border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2">No</th>
                <th className="border border-gray-300 p-2">No Daftar</th>
                <th className="border border-gray-300 p-2 text-left">
                  Nama Lengkap
                </th>
                <th className="border border-gray-300 p-2 text-left">
                  Tempat, Tgl Lahir
                </th>
                <th className="border border-gray-300 p-2 text-left">
                  Asal Madrasah
                </th>
                <th className="border border-gray-300 p-2">L/P</th>
                <th className="border border-gray-300 p-2 text-left">
                  Cabang Lomba
                </th>
                <th className="border border-gray-300 p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.registrations
                .filter((r) =>
                  filterLomba === "Semua" ? true : r.competition === filterLomba
                )
                .filter((r) =>
                  filterGender === "Semua" ? true : r.gender === filterGender
                )
                .map((r, i) => (
                  <tr key={r.id}>
                    <td className="border border-gray-300 p-2 text-center">
                      {i + 1}
                    </td>
                    <td className="border border-gray-300 p-2 text-center font-medium">
                      {r.registrationCode || "-"}
                    </td>
                    <td className="border border-gray-300 p-2">{r.name}</td>
                    <td className="border border-gray-300 p-2">
                      {r.tempatLahir},{" "}
                      {new Date(r.birthDate).toLocaleDateString("id-ID")}
                    </td>
                    <td className="border border-gray-300 p-2">{r.madrasah}</td>
                    <td className="border border-gray-300 p-2 text-center">
                      {r.gender === "Laki-laki" ? "L" : "P"}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {r.competition}
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      {r.status}
                    </td>
                  </tr>
                ))}

              {data.registrations.filter(
                (r) =>
                  (filterLomba === "Semua" || r.competition === filterLomba) &&
                  (filterGender === "Semua" || r.gender === filterGender)
              ).length === 0 && (
                <tr>
                  <td
                    colSpan="8"
                    className="border border-gray-300 p-4 text-center text-gray-500 italic"
                  >
                    Tidak ada data pendaftar untuk filter yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {reportType === "hasil" && (
          <table className="w-full text-sm border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">
                  Cabang Lomba
                </th>
                <th className="border border-gray-300 p-2 text-center">
                  Juara
                </th>
                <th className="border border-gray-300 p-2 text-left">
                  Nama Peserta
                </th>
                <th className="border border-gray-300 p-2 text-left">
                  Asal Madrasah
                </th>
                <th className="border border-gray-300 p-2 text-center">
                  Nilai
                </th>
              </tr>
            </thead>
            <tbody>
              {data.results
                .sort(
                  (a, b) =>
                    a.competition.localeCompare(b.competition) ||
                    a.rank - b.rank
                )
                .filter((res) => {
                  const reg = data.registrations.find(
                    (r) => String(r.id) === String(res.registrationId)
                  );
                  if (!reg) return false;
                  const matchLomba =
                    filterLomba === "Semua"
                      ? true
                      : reg.competition === filterLomba;
                  const matchGender =
                    filterGender === "Semua"
                      ? true
                      : reg.gender === filterGender;
                  return matchLomba && matchGender;
                })
                .map((res) => {
                  const reg = data.registrations.find(
                    (r) => String(r.id) === String(res.registrationId)
                  );
                  if (!reg) return null;
                  return (
                    <tr key={res.id}>
                      <td className="border border-gray-300 p-2 font-semibold">
                        {res.competition}
                      </td>
                      <td className="border border-gray-300 p-2 text-center font-bold">
                        {res.rank}
                      </td>
                      <td className="border border-gray-300 p-2">{reg.name}</td>
                      <td className="border border-gray-300 p-2">
                        {reg.madrasah}
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        {res.score}
                      </td>
                    </tr>
                  );
                })}

              {data.results.filter((res) => {
                const reg = data.registrations.find(
                  (r) => String(r.id) === String(res.registrationId)
                );
                if (!reg) return false;
                return (
                  (filterLomba === "Semua" ||
                    reg.competition === filterLomba) &&
                  (filterGender === "Semua" || reg.gender === filterGender)
                );
              }).length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="border border-gray-300 p-4 text-center text-gray-500 italic"
                  >
                    Tidak ada data hasil lomba untuk filter yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {reportType === "koordinator" && (
          <table className="w-full text-sm border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 w-12 text-center">
                  No
                </th>
                <th className="border border-gray-300 p-2 text-left">
                  Nama Koordinator
                </th>
                <th className="border border-gray-300 p-2 text-left">
                  Cabang Lomba Ditugaskan
                </th>
                <th className="border border-gray-300 p-2 text-left">
                  Nomor WhatsApp
                </th>
              </tr>
            </thead>
            <tbody>
              {data.coordinators.map((c, i) => (
                <tr key={c.id}>
                  <td className="border border-gray-300 p-2 text-center">
                    {i + 1}
                  </td>
                  <td className="border border-gray-300 p-2 font-medium">
                    {c.name}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {c.competition}
                  </td>
                  <td className="border border-gray-300 p-2">{c.waNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="mt-12 text-right">
          <p className="mb-16">Panitia Pelaksana PORSADIN 2026,</p>
          <div className="inline-flex flex-col items-center">
            <p className="font-bold border-b border-black inline-block min-w-[200px] text-center pb-1">
              {data.settings.ketuaPanitia ||
                "..................................."}
            </p>
            <p className="text-sm mt-1">Ketua Panitia</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PanitiaPengaturan({ data, refreshData }) {
  const [loading, setLoading] = useState(false);

  const saveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.target);
    const updateObj = {
      isOpen: fd.get("isOpen") === "true",
      minBirthDate: fd.get("minBirthDate"),
      ketuaPanitia: fd.get("ketuaPanitia"),
    };

    try {
      await fetchAPI("Settings", "UPDATE", updateObj, "main");
      alert("Pengaturan berhasil disimpan!");
      refreshData();
    } catch (err) {
      alert("Gagal menyimpan pengaturan.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl bg-white p-8 rounded-xl shadow-sm border-t-4 border-[#175e38]">
      <h2 className="text-2xl font-bold mb-6">Pengaturan Sistem</h2>
      <form onSubmit={saveSettings} className="space-y-6">
        <div className="p-4 bg-gray-50 border rounded-lg">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Status Pendaftaran Publik
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="isOpen"
                value="true"
                defaultChecked={data.isOpen === true}
                className="w-4 h-4 text-[#175e38]"
              />
              <span>Buka Pendaftaran</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer text-red-600">
              <input
                type="radio"
                name="isOpen"
                value="false"
                defaultChecked={data.isOpen === false}
                className="w-4 h-4 text-red-600"
              />
              <span>Tutup Pendaftaran</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Jika ditutup, publik tidak dapat mengisi formulir pendaftaran.
          </p>
        </div>

        <div className="p-4 bg-gray-50 border rounded-lg">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Batas Usia Maksimal (Tanggal Lahir Paling Tua)
          </label>
          <input
            type="date"
            name="minBirthDate"
            defaultValue={data.minBirthDate}
            required
            className="w-full md:w-1/2 border p-2 rounded"
          />
          <p className="text-xs text-gray-500 mt-2">
            Contoh: Jika diatur 1 Januari 2011, maka peserta kelahiran 2010
            (lebih tua) tidak bisa mendaftar.
          </p>
        </div>

        <div className="p-4 bg-gray-50 border rounded-lg">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Nama Ketua Panitia
          </label>
          <input
            type="text"
            name="ketuaPanitia"
            defaultValue={data.ketuaPanitia || ""}
            placeholder="Masukkan nama ketua panitia beserta gelar"
            className="w-full border p-2 rounded focus:ring-1 focus:ring-[#175e38]"
          />
          <p className="text-xs text-gray-500 mt-2">
            Nama ini akan ditampilkan pada bagian tanda tangan di cetak laporan.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-[#175e38] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#11462a]"
        >
          {loading ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </form>
    </div>
  );
}

// --- KOORDINATOR VIEW ---
function KoordinatorView({ onLogout, session, data, refreshData }) {
  const coord = session.data;
  const [selectedGender, setSelectedGender] = useState("Putra");

  const [rankInputs, setRankInputs] = useState({ 1: "", 2: "", 3: "" });
  const [scoreInputs, setScoreInputs] = useState({ 1: "", 2: "", 3: "" });
  const [validatedRanks, setValidatedRanks] = useState({
    1: null,
    2: null,
    3: null,
  });
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const targetGender = selectedGender === "Putra" ? "Laki-laki" : "Perempuan";
  const fullCompetitionName = `${coord.competition} ${selectedGender}`;

  useEffect(() => {
    if (isSaved) return;

    const initialInputs = { 1: "", 2: "", 3: "" };
    const initialScores = { 1: "", 2: "", 3: "" };
    const initialValidations = { 1: null, 2: null, 3: null };

    const currentResults = data.results.filter(
      (r) => r.competition === fullCompetitionName
    );

    currentResults.forEach((res) => {
      const reg = data.registrations.find(
        (r) => String(r.id) === String(res.registrationId)
      );
      if (reg && res.rank >= 1 && res.rank <= 3) {
        initialInputs[res.rank] = reg.registrationCode || "";
        initialScores[res.rank] = res.score || "";
        initialValidations[res.rank] = reg;
      }
    });

    setRankInputs(initialInputs);
    setScoreInputs(initialScores);
    setValidatedRanks(initialValidations);
  }, [selectedGender, data.results, fullCompetitionName, isSaved]);

  const checkData = (rank) => {
    const code = rankInputs[rank]?.trim().toLowerCase();
    if (!code) {
      setValidatedRanks((prev) => ({ ...prev, [rank]: null }));
      return;
    }

    const participant = data.registrations.find(
      (r) =>
        r.registrationCode?.toLowerCase() === code &&
        r.competition === coord.competition &&
        r.gender === targetGender &&
        r.status === "Diterima"
    );

    if (participant) {
      const isDuplicate = Object.entries(validatedRanks).some(
        ([rKey, p]) => rKey != rank && p && p.id === participant.id
      );
      if (isDuplicate) {
        setValidatedRanks((prev) => ({ ...prev, [rank]: "Duplicate" }));
      } else {
        setValidatedRanks((prev) => ({ ...prev, [rank]: participant }));
      }
    } else {
      setValidatedRanks((prev) => ({ ...prev, [rank]: "Not Found" }));
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    const lombaResults = data.results.filter(
      (r) => r.competition === fullCompetitionName
    );

    try {
      for (let r = 1; r <= 3; r++) {
        const participant = validatedRanks[r];
        const existingResult = lombaResults.find(
          (res) => parseInt(res.rank) === r
        );
        const scoreVal = parseInt(scoreInputs[r]) || 0;

        if (participant && typeof participant === "object") {
          if (existingResult) {
            if (
              existingResult.registrationId !== participant.id ||
              existingResult.score !== scoreVal
            ) {
              await fetchAPI(
                "Results",
                "UPDATE",
                {
                  registrationId: participant.id,
                  score: scoreVal,
                },
                existingResult.id
              );
            }
          } else {
            await fetchAPI("Results", "ADD", {
              registrationId: participant.id,
              competition: fullCompetitionName,
              rank: r,
              score: scoreVal,
            });
          }
        } else {
          if (existingResult) {
            await fetchAPI("Results", "DELETE", null, existingResult.id);
          }
        }
      }

      refreshData();
      alert("Berhasil! Hasil kejuaraan telah disimpan.");

      setIsSaved(true);
      setRankInputs({ 1: "", 2: "", 3: "" });
      setScoreInputs({ 1: "", 2: "", 3: "" });
      setValidatedRanks({ 1: null, 2: null, 3: null });
    } catch (err) {
      alert("Terjadi kesalahan saat menyimpan data ke database.");
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      <header className="bg-[#0f4025] text-white px-6 py-4 flex justify-between items-center shadow-md w-full">
        <h1 className="font-bold text-lg">Panel Koordinator Lomba</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-green-100 hidden sm:inline">
            Halo, {coord.name}
          </span>
          <button
            onClick={onLogout}
            className="border border-green-400 text-green-100 hover:bg-green-700/50 px-4 py-2 rounded-full text-sm font-bold flex items-center transition-colors"
          >
            <LogOut size={16} className="mr-2" /> Keluar
          </button>
        </div>
      </header>

      <main className="flex-grow w-full px-4 py-8 flex justify-center">
        <div className="bg-white rounded-2xl shadow-lg border p-6 sm:p-10 w-full max-w-3xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-[#175e38] mb-1">
              Input Hasil Kejuaraan
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              Cari dan validasi pemenang berdasarkan{" "}
              <strong className="text-gray-700">Kode Pendaftaran</strong>
            </p>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Cabang Lomba & Kategori
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={coord.competition}
                disabled
                className="bg-gray-100 border border-gray-300 text-gray-600 font-semibold p-3 rounded-lg flex-grow cursor-not-allowed"
              />
              <select
                value={selectedGender}
                onChange={(e) => {
                  setSelectedGender(e.target.value);
                  setIsSaved(false);
                }}
                className="border border-gray-300 p-3 rounded-lg font-bold text-[#175e38] focus:ring-2 focus:ring-[#175e38] min-w-[200px]"
              >
                <option value="Putra">Kategori Putra</option>
                <option value="Putri">Kategori Putri</option>
              </select>
            </div>
          </div>

          {isSaved && (
            <div className="bg-green-100 border border-green-300 text-green-800 p-4 rounded-xl mb-6 font-semibold flex items-center shadow-sm">
              <Check size={20} className="mr-2 text-green-600" />
              Data juara berhasil dikirim! Tampilan isian telah dibersihkan.
            </div>
          )}

          <div className="space-y-5">
            <div className="bg-yellow-50/50 border border-yellow-200 rounded-xl p-5">
              <div className="flex items-center font-extrabold text-yellow-600 mb-3">
                <Trophy size={20} className="mr-2" /> Juara 1
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Masukkan Kode (Cth: TJA-001)"
                  value={rankInputs[1]}
                  onChange={(e) =>
                    setRankInputs({ ...rankInputs, 1: e.target.value })
                  }
                  className="flex-grow border border-yellow-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                />
                <input
                  type="number"
                  placeholder="Skor"
                  value={scoreInputs[1]}
                  onChange={(e) =>
                    setScoreInputs({ ...scoreInputs, 1: e.target.value })
                  }
                  className="w-full sm:w-24 border border-yellow-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white text-center"
                />
                <button
                  onClick={() => checkData(1)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-bold transition-colors whitespace-nowrap"
                >
                  Cek Data
                </button>
              </div>
              {validatedRanks[1] === "Not Found" && (
                <p className="text-red-500 text-sm mt-2 font-medium">
                  ❌ Kode Pendaftaran tidak valid / tidak diverifikasi.
                </p>
              )}
              {validatedRanks[1] === "Duplicate" && (
                <p className="text-red-500 text-sm mt-2 font-medium">
                  ❌ Peserta ini sudah dimasukkan ke peringkat lain.
                </p>
              )}
              {validatedRanks[1] && typeof validatedRanks[1] === "object" && (
                <div className="mt-3 text-sm text-yellow-800 bg-yellow-100/50 p-2 rounded-lg border border-yellow-200">
                  <span className="font-bold">✅ {validatedRanks[1].name}</span>{" "}
                  — {validatedRanks[1].madrasah}
                </div>
              )}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <div className="flex items-center font-extrabold text-gray-500 mb-3">
                <Trophy size={20} className="mr-2" /> Juara 2
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Masukkan Kode (Cth: TJA-002)"
                  value={rankInputs[2]}
                  onChange={(e) =>
                    setRankInputs({ ...rankInputs, 2: e.target.value })
                  }
                  className="flex-grow border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white"
                />
                <input
                  type="number"
                  placeholder="Skor"
                  value={scoreInputs[2]}
                  onChange={(e) =>
                    setScoreInputs({ ...scoreInputs, 2: e.target.value })
                  }
                  className="w-full sm:w-24 border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white text-center"
                />
                <button
                  onClick={() => checkData(2)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition-colors whitespace-nowrap"
                >
                  Cek Data
                </button>
              </div>
              {validatedRanks[2] === "Not Found" && (
                <p className="text-red-500 text-sm mt-2 font-medium">
                  ❌ Kode Pendaftaran tidak valid / tidak diverifikasi.
                </p>
              )}
              {validatedRanks[2] === "Duplicate" && (
                <p className="text-red-500 text-sm mt-2 font-medium">
                  ❌ Peserta ini sudah dimasukkan ke peringkat lain.
                </p>
              )}
              {validatedRanks[2] && typeof validatedRanks[2] === "object" && (
                <div className="mt-3 text-sm text-gray-700 bg-gray-200/50 p-2 rounded-lg border border-gray-300">
                  <span className="font-bold">✅ {validatedRanks[2].name}</span>{" "}
                  — {validatedRanks[2].madrasah}
                </div>
              )}
            </div>

            <div className="bg-orange-50/50 border border-orange-200 rounded-xl p-5">
              <div className="flex items-center font-extrabold text-orange-600 mb-3">
                <Trophy size={20} className="mr-2" /> Juara 3
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Masukkan Kode (Cth: TJA-003)"
                  value={rankInputs[3]}
                  onChange={(e) =>
                    setRankInputs({ ...rankInputs, 3: e.target.value })
                  }
                  className="flex-grow border border-orange-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                />
                <input
                  type="number"
                  placeholder="Skor"
                  value={scoreInputs[3]}
                  onChange={(e) =>
                    setScoreInputs({ ...scoreInputs, 3: e.target.value })
                  }
                  className="w-full sm:w-24 border border-orange-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-center"
                />
                <button
                  onClick={() => checkData(3)}
                  className="bg-[#cc7a00] hover:bg-[#a36200] text-white px-6 py-3 rounded-lg font-bold transition-colors whitespace-nowrap"
                >
                  Cek Data
                </button>
              </div>
              {validatedRanks[3] === "Not Found" && (
                <p className="text-red-500 text-sm mt-2 font-medium">
                  ❌ Kode Pendaftaran tidak valid / tidak diverifikasi.
                </p>
              )}
              {validatedRanks[3] === "Duplicate" && (
                <p className="text-red-500 text-sm mt-2 font-medium">
                  ❌ Peserta ini sudah dimasukkan ke peringkat lain.
                </p>
              )}
              {validatedRanks[3] && typeof validatedRanks[3] === "object" && (
                <div className="mt-3 text-sm text-orange-800 bg-orange-100/50 p-2 rounded-lg border border-orange-200">
                  <span className="font-bold">✅ {validatedRanks[3].name}</span>{" "}
                  — {validatedRanks[3].madrasah}
                </div>
              )}
            </div>
          </div>

          <div className="mt-10">
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="w-full bg-[#175e38] hover:bg-[#11462a] text-white font-bold py-4 px-4 rounded-xl flex items-center justify-center transition-colors shadow-lg"
            >
              {saving ? (
                <>
                  <RefreshCw className="animate-spin mr-2" /> Menyimpan...
                </>
              ) : (
                "Simpan Hasil Lomba"
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
