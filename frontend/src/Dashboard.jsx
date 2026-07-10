import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaHome } from "react-icons/fa";
import { MdRealEstateAgent } from "react-icons/md";
import { PiBuildingApartmentFill } from "react-icons/pi";
import { IoIosPeople } from "react-icons/io";
import { LiaFileContractSolid } from "react-icons/lia";
import { MdPayments } from "react-icons/md"

// ====== إعدادات الـ API ======
const API_BASE_URL = "http://localhost:5000/api/v1";
const DASHBOARD_ENDPOINT = `${API_BASE_URL}/dashboard/get_dashboard`;
const size = 25;
// ====== روابط المينيو ======
const NAV_ITEMS = [
  { label: 'الرئيسية', path: '/dashboard', icon: <FaHome size={size} color='black'/> },
  { label: 'العقارات', path: '/properties', icon: <MdRealEstateAgent size={size} color='black'/> },
  { label: 'الوحدات', path: '/units', icon:  <PiBuildingApartmentFill size={size} color='black'/>},
  { label: 'المستأجرين', path: '/tenants', icon: <IoIosPeople size={size} color='black'/> },
  { label: 'العقود', path: '/contracts', icon: <LiaFileContractSolid size={size} color='black'/>},
  { label: 'الدفع', path: '/payments', icon: <MdPayments size={size} color='black'/>},
];

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

    fetchStats();
  }, []);

  const cards = stats
    ? [
        { label: 'إجمالي العقارات', value: stats.totalProperties, icon: '🏢', color: 'bg-blue-50 text-blue-600' },
        { label: 'إجمالي الوحدات', value: stats.totalUnits, icon: '🏘️', color: 'bg-indigo-50 text-indigo-600' },
        { label: 'الوحدات المتاحة', value: stats.availableUnits, icon: '🔓', color: 'bg-green-50 text-green-600' },
        { label: 'الوحدات المؤجرة', value: stats.rentedUnits, icon: '🔒', color: 'bg-amber-50 text-amber-600' },
        { label: 'إجمالي المستأجرين', value: stats.totalTenants, icon: '👥', color: 'bg-purple-50 text-purple-600' },
        { label: 'العقود النشطة', value: stats.activeContracts, icon: '📄', color: 'bg-teal-50 text-teal-600' },
        { label: 'الإيراد الشهري', value: `${stats.monthlyRevenue?.toLocaleString('ar-EG')} ج.م`, icon: '💰', color: 'bg-rose-50 text-rose-600', wide: true },
        { label: 'الإيراد اليومي', value: `${stats.dailyRevenue?.toLocaleString('ar-EG')} ج.م`, icon: '💰', color: 'bg-rose-50 text-rose-600', wide: true },
      ]
    : [];

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 flex font-sans">

      {/* ===== Sidebar (Desktop) ===== */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-l border-slate-200 min-h-screen sticky top-0">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl">
              🏢
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
          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">
            👤
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
