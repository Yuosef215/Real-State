import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaHome } from 'react-icons/fa';
import { MdRealEstateAgent, MdPayments } from 'react-icons/md';
import { PiBuildingApartmentFill } from 'react-icons/pi';
import { IoIosPeople } from 'react-icons/io';
import { LiaFileContractSolid } from 'react-icons/lia';
import { MdOutlineLock, MdOutlineLockOpen } from 'react-icons/md';
import { FaMoneyBillWave } from 'react-icons/fa';
import { MdOutlineAttachMoney } from 'react-icons/md';
import { RiTimerFill } from "react-icons/ri";
import { FaUserPlus } from "react-icons/fa"
import { useNavigate } from 'react-router-dom';

const size = 20; // حجم الأيقونات في المينيو

// ====== إعدادات الـ API ======
const API_BASE_URL = "https://real-state-5h8r.onrender.com/api/v1";
const DASHBOARD_ENDPOINT = `${API_BASE_URL}/dashboard/get_dashboard`;
const EXPIRING_CONTRACTS_ENDPOINT = `${API_BASE_URL}/expiring/expiring-contracts`;

// ====== روابط المينيو ======
const NAV_ITEMS = [
  { label: 'الرئيسية', path: '/dashboard', icon: <FaHome size={size} color='black'/> },
  { label: 'العقارات', path: '/properties', icon: <MdRealEstateAgent size={size} color='black'/> },
  { label: 'الوحدات', path: '/units', icon:  <PiBuildingApartmentFill size={size} color='black'/>},
  { label: 'المستأجرين', path: '/tenants', icon: <IoIosPeople size={size} color='black'/> },
  { label: 'العقود', path: '/contracts', icon: <LiaFileContractSolid size={size} color='black'/>},
  { label: 'الدفع', path: '/payments', icon: <MdPayments size={size} color='black'/>},
  { label: 'إضافة مستخدم', path: '/users/add', icon: <FaUserPlus size={size} color='black'/>},
];

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [expiringContracts, setExpiringContracts] = useState([]);
  const [expiringLoading, setExpiringLoading] = useState(true);
  const [expiringError, setExpiringError] = useState('');

  const location = useLocation();

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(DASHBOARD_ENDPOINT, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (response.data?.success) {
          setStats(response.data.data);
        } else {
          setError('تعذر تحميل بيانات الداشبورد');
        }
      } catch (err) {
        setError('تعذر الاتصال بالسيرفر، تأكد إن السيرفر شغال');
      } finally {
        setLoading(false);
      }
    };

    const fetchExpiringContracts = async () => {
      setExpiringLoading(true);
      setExpiringError('');

      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(EXPIRING_CONTRACTS_ENDPOINT, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (response.data?.success) {
          setExpiringContracts(response.data.data || []);
        } else {
          setExpiringError('تعذر تحميل العقود القربة من الانتهاء');
        }
      } catch (err) {
        setExpiringError('تعذر تحميل العقود القربة من الانتهاء');
      } finally {
        setExpiringLoading(false);
      }
    };

    fetchStats();
    fetchExpiringContracts();
  }, []);

  // حساب عدد الأيام المتبقية على انتهاء العقد
  const daysRemaining = (endDate) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const cards = stats
    ? [
        { label: 'إجمالي العقارات', value: stats.totalProperties, icon: <FaHome size={size} color='black'/>, color: 'bg-blue-50 text-blue-600' },
        { label: 'إجمالي الوحدات', value: stats.totalUnits, icon: <PiBuildingApartmentFill size={size} color='black'/>, color: 'bg-indigo-50 text-indigo-600' },
        { label: 'الوحدات المتاحة', value: stats.availableUnits, icon: <MdOutlineLockOpen size={size} color='black'/>, color: 'bg-green-50 text-green-600' },
        { label: 'الوحدات المؤجرة', value: stats.rentedUnits, icon: <MdOutlineLock size={size} color='black'/>, color: 'bg-amber-50 text-amber-600' },
        { label: 'إجمالي المستأجرين', value: stats.totalTenants, icon: <IoIosPeople size={size} color='black'/>, color: 'bg-purple-50 text-purple-600' },
        { label: 'العقود النشطة', value: stats.activeContracts, icon: <LiaFileContractSolid size={size} color='black'/>, color: 'bg-teal-50 text-teal-600' },
        { label: 'الإيراد الشهري', value: `${stats.monthlyRevenue?.toLocaleString('ar-EG')} ج.م`, icon: <MdOutlineAttachMoney size={size} color='black'/>, color: 'bg-rose-50 text-rose-600', wide: true },
        { label: 'الإيراد اليومي', value: `${stats.dailyRevenue?.toLocaleString('ar-EG')} ج.م`, icon: <MdOutlineAttachMoney size={size} color='black'/>, color: 'bg-rose-50 text-rose-600', wide: true },
      ]
    : [];


    const navigate2 = useNavigate();

const handleLogout = () => {
  localStorage.removeItem("token");
  navigate2("/");
};

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 flex font-sans">

      {/* ===== Sidebar (Desktop) ===== */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-l border-slate-200 min-h-screen sticky top-0">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl">
              <img src="/logo.png" alt="" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800">مؤسسه الشروق 3</h1>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ===== Main Content ===== */}
      <main className="flex-1 min-w-0">

        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-lg font-bold text-slate-800">لوحة التحكم</h2>
          
          <div className="flex items-center gap-3">
  <button
    onClick={handleLogout}
    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
  >
    تسجيل الخروج
  </button>

  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
    <img
      src="/logo.png"
      alt="Logo"
      className="w-8 h-8 object-contain"
    />
  </div>
</div>
        </header>

        <div className="p-4 md:p-8 pb-24 md:pb-8">

          {loading && (
            <div className="flex items-center justify-center py-20">
              <span className="w-8 h-8 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin"></span>
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {cards.map((card) => (
                <div
                  key={card.label}
                  className={`bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-slate-100 ${
                    card.wide ? 'col-span-2' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3 ${card.color}`}>
                    {card.icon}
                  </div>
                  <p className="text-xs md:text-sm text-slate-500 mb-1">{card.label}</p>
                  <p className="text-xl md:text-2xl font-bold text-slate-800">{card.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* ===== قسم العقود القربة من الانتهاء ===== */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg"><RiTimerFill color="red" /></span>
              <h3 className="text-base md:text-lg font-bold text-slate-800">عقود قربت تنتهي (خلال 30 يوم)</h3>
            </div>

            {expiringLoading && (
              <div className="flex items-center justify-center py-10">
                <span className="w-6 h-6 border-3 border-slate-200 border-t-amber-500 rounded-full animate-spin"></span>
              </div>
            )}

            {!expiringLoading && expiringError && (
              <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4 text-sm">
                {expiringError}
              </div>
            )}

            {!expiringLoading && !expiringError && expiringContracts.length === 0 && (
              <div className="bg-white rounded-2xl p-6 text-center text-slate-400 border border-slate-100 text-sm">
                لا توجد عقود قربت تنتهي حالياً
              </div>
            )}

            {!expiringLoading && !expiringError && expiringContracts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {expiringContracts.map((contract) => {
                  const remaining = daysRemaining(contract.endDate);
                  return (
                    <div
                      key={contract._id}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100 border-r-4 border-r-amber-400"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-slate-800 text-sm">{contract.tenant?.name || '—'}</h4>
                        <span className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded-full font-semibold whitespace-nowrap">
                          {remaining <= 0 ? 'ينتهي اليوم' : `${remaining} يوم متبقي`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-1">
                        🏢 {contract.unit?.property?.name || '—'} - شقة {contract.unit?.unitNumber ?? '—'}
                      </p>
                      <p className="text-xs text-slate-500">
                        📅 ينتهي في {contract.endDate?.substring(0, 10)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ===== Bottom Navigation (Mobile) ===== */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex items-center justify-around py-2 z-20">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium min-w-[60px] ${
                active ? 'text-blue-600' : 'text-slate-500'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default Dashboard;
