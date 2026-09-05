import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import { FaHome } from "react-icons/fa";
import { MdRealEstateAgent, MdPayments } from "react-icons/md";
import { PiBuildingApartmentFill } from "react-icons/pi";
import { IoIosPeople } from "react-icons/io";
import { LiaFileContractSolid } from "react-icons/lia";
import { MdOutlineLock, MdOutlineLockOpen } from "react-icons/md";
import { FaMoneyBillWave } from "react-icons/fa";
import { MdOutlineAttachMoney } from "react-icons/md";
import { RiTimerFill } from "react-icons/ri";
import { FaUserPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const size = 20; // حجم الأيقونات في المينيو

// ====== إعدادات الـ API ======
const API_BASE_URL = "https://real-state-5h8r.onrender.com/api/v1";
const DASHBOARD_ENDPOINT = `${API_BASE_URL}/dashboard/get_dashboard`;
const DASHBOARD_GETUNPAID = `${API_BASE_URL}/dashboard/get_unpaid`;
const EXPIRING_CONTRACTS_ENDPOINT = `${API_BASE_URL}/expiring/expiring-contracts`;
const CHANGE_PASSWORD_ENDPOINT = `${API_BASE_URL}/users/change_password`;

const EMPTY_PASSWORD_FORM = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

// ====== روابط المينيو ======
const NAV_ITEMS = [
  {
    label: "الرئيسية",
    path: "/dashboard",
    icon: <FaHome size={size} color="black" />,
  },
  {
    label: "العقارات",
    path: "/properties",
    icon: <MdRealEstateAgent size={size} color="black" />,
  },
  {
    label: "الوحدات",
    path: "/units",
    icon: <PiBuildingApartmentFill size={size} color="black" />,
  },
  {
    label: "المستأجرين",
    path: "/tenants",
    icon: <IoIosPeople size={size} color="black" />,
  },
  {
    label: "العقود",
    path: "/contracts",
    icon: <LiaFileContractSolid size={size} color="black" />,
  },
  {
    label: "الدفع",
    path: "/payments",
    icon: <MdPayments size={size} color="black" />,
  },
  {
    label: "إضافة مستخدم",
    path: "/users/add",
    icon: <FaUserPlus size={size} color="black" />,
  },
];

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expiringContracts, setExpiringContracts] = useState([]);
  const [expiringLoading, setExpiringLoading] = useState(true);
  const [expiringError, setExpiringError] = useState("");
  const [unpaid, setUnpaid] = useState([]);

  const location = useLocation();

  // ====== تغيير كلمة المرور ======
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState(EMPTY_PASSWORD_FORM);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const openPasswordModal = () => {
    setPasswordForm(EMPTY_PASSWORD_FORM);
    setPasswordError("");
    setPasswordSuccess("");
    setShowPasswords(false);
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordForm(EMPTY_PASSWORD_FORM);
    setPasswordError("");
    setPasswordSuccess("");
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    // تحقق مبدئي في المتصفح قبل ما نتعب السيرفر
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setPasswordError("من فضلك أدخل جميع الحقول");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("كلمة المرور الجديدة وتأكيدها غير متطابقين");
      return;
    }

    if (passwordForm.newPassword === passwordForm.currentPassword) {
      setPasswordError("كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية");
      return;
    }

    setPasswordSaving(true);

    try {
      const token = localStorage.getItem("token");

      const response = await axios.put(
        CHANGE_PASSWORD_ENDPOINT,
        passwordForm,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      // السيرفر بيرجع توكن جديد عشان الجلسة تفضل شغالة بعد التغيير
      if (response.data?.token) {
        localStorage.setItem("token", response.data.token);
      }

      setPasswordForm(EMPTY_PASSWORD_FORM);
      setPasswordSuccess("تم تغيير كلمة المرور بنجاح");
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || "تعذر تغيير كلمة المرور، حاول مرة أخرى",
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError("");

      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(DASHBOARD_ENDPOINT, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (response.data?.success) {
          setStats(response.data.data);
        } else {
          setError("تعذر تحميل بيانات الداشبورد");
        }
      } catch (err) {
        setError("تعذر الاتصال بالسيرفر، تأكد إن السيرفر شغال");
      } finally {
        setLoading(false);
      }
    };

    const fetchUnpaid = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await axios.get(DASHBOARD_GETUNPAID, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          setUnpaid(response.data.data);
        }
      } catch (error) {
        console.error(error);
      }
    };

    const fetchExpiringContracts = async () => {
      setExpiringLoading(true);
      setExpiringError("");

      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(EXPIRING_CONTRACTS_ENDPOINT, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (response.data?.success) {
          setExpiringContracts(response.data.data || []);
        } else {
          setExpiringError("تعذر تحميل العقود القربة من الانتهاء");
        }
      } catch (err) {
        setExpiringError("تعذر تحميل العقود القربة من الانتهاء");
      } finally {
        setExpiringLoading(false);
      }
    };

    fetchStats();
    fetchExpiringContracts();
    fetchStats();
    fetchUnpaid();
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
        {
          label: "إجمالي العقارات",
          value: stats.totalProperties,
          icon: <FaHome size={size} color="black" />,
          color: "bg-blue-50 text-blue-600",
          path: "/properties",
        },
        {
          label: "إجمالي الوحدات",
          value: stats.totalUnits,
          icon: <PiBuildingApartmentFill size={size} color="black" />,
          color: "bg-indigo-50 text-indigo-600",
          path: "/units",
        },
        {
          label: "الوحدات المتاحة",
          value: stats.availableUnits,
          icon: <MdOutlineLockOpen size={size} color="black" />,
          color: "bg-green-50 text-green-600",
          path: "/units",
        },
        {
          label: "الوحدات المؤجرة",
          value: stats.rentedUnits,
          icon: <MdOutlineLock size={size} color="black" />,
          color: "bg-amber-50 text-amber-600",
          path: "/units",
        },
        {
          label: "إجمالي المستأجرين",
          value: stats.totalTenants,
          icon: <IoIosPeople size={size} color="black" />,
          color: "bg-purple-50 text-purple-600",
          path: "/tenants",
        },
        {
          label: "العقود النشطة",
          value: stats.activeContracts,
          icon: <LiaFileContractSolid size={size} color="black" />,
          color: "bg-teal-50 text-teal-600",
          path: "/contracts",
        },
        {
          label: "الإيراد الشهري",
          value: `${stats.monthlyRevenue?.toLocaleString("ar-EG")} ج.م`,
          icon: <MdOutlineAttachMoney size={size} color="black" />,
          color: "bg-rose-50 text-rose-600",
          wide: true,
        },
        {
          label: "الإيراد اليومي",
          value: `${stats.dailyRevenue?.toLocaleString("ar-EG")} ج.م`,
          icon: <MdOutlineAttachMoney size={size} color="black" />,
          color: "bg-rose-50 text-rose-600",
          wide: true,
        },
        {
          label: "المصروفات اليومية",
          value: 'دخول',
          icon: <MdOutlineAttachMoney size={size} color="orange" />,
          color: "bg-rose-50 text-rose-600",
          wide: true,
          path: "/expenses"
        },
        {
          label: "الايرادات اليومية",
          value: 'دخول',
          icon: <MdOutlineAttachMoney size={size} color="orange" />,
          color: "bg-rose-50 text-rose-600",
          wide: true,
          path: "/revenues"
        },
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
              <h1 className="text-sm font-bold text-slate-800">
                مؤسسه الشروق 3
              </h1>
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
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-600 hover:bg-slate-50"
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

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={openPasswordModal}
              className="px-3 md:px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs md:text-sm font-medium rounded-lg transition"
            >
              تغيير كلمة المرور
            </button>

            <button
              onClick={handleLogout}
              className="px-3 md:px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs md:text-sm font-medium rounded-lg transition"
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
                  className={`bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-slate-100  cursor-pointer hover:shadow-md transition${
                    card.wide ? "col-span-2" : ""
                  }`} onClick={() => navigate2(card.path)}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3 ${card.color}`}
                   >
                    {card.icon}
                  </div>
                  <p className="text-xs md:text-sm text-slate-500 mb-1">
                    {card.label}
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-slate-800">
                    {card.value}
                  </p>
                </div>
              ))}
            </div>
          )}
          
         <div className="bg-white rounded-2xl shadow-md p-6 mt-6">
  <h2 className="text-2xl font-bold mb-4 text-right">
    العقود غير المسددة
  </h2>
<div className="hidden lg:block">
  <div className="overflow-x-auto">
    <table className="w-full text-right">
      <thead className="border-b-2 border-gray-200">
        <tr className="text-gray-600">
          <th className="py-3 px-4">المستأجر</th>
          <th className="py-3 px-4">العقار</th>
          <th className="py-3 px-4">الوحدة</th>
          <th className="py-3 px-4">الإيجار</th>
          <th className="py-3 px-4 text-center">الحالة</th>
          <th className="py-3 px-4 text-center"></th>
        </tr>
      </thead>

      <tbody>
        {unpaid.map((item) => (
          <tr
            key={item._id}
            className="border-b hover:bg-gray-50 transition"
          >
            <td className="py-4 px-4 font-medium">
              {item.tenant?.name}
            </td>

            <td className="py-4 px-4">
              {item.unit?.property?.name}
            </td>

            <td className="py-4 px-4 text-center">
              {item.unit?.unitNumber}
            </td>

            <td className="py-4 px-4 font-bold text-green-700">
              {item.monthlyRent.toLocaleString()} جنيه
            </td>

            <td className="py-4 px-4 text-center">
              <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-semibold">
                غير مدفوع
              </span>
            </td>

            
          </tr>
        ))}
      </tbody>
    </table>

    {unpaid.length === 0 && (
      <div className="text-center py-8 text-gray-500">
        لا توجد عقود غير مسددة 🎉
      </div>
    )}
  </div>
</div>
</div>
<div className="lg:hidden space-y-4">
  {unpaid.map((item) => (
    <div
      key={item._id}
      className="bg-white rounded-2xl shadow p-4 border"
    >
      <h3 className="font-bold text-lg">
        {item.tenant?.name}
      </h3>

      <p className="text-gray-600 mt-2">
        {item.unit?.property?.name}
      </p>

      <p className="text-gray-600">
        الوحدة: {item.unit?.unitNumber}
      </p>

      <p className="text-green-700 font-bold mt-2">
        {item.monthlyRent.toLocaleString()} جنيه
      </p>

      <span className="inline-block mt-3 bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm">
        غير مدفوع
      </span>

      
    </div>
  ))}
</div>
          {/* ===== قسم العقود القربة من الانتهاء ===== */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">
                <RiTimerFill color="red" />
              </span>
              <h3 className="text-base md:text-lg font-bold text-slate-800">
                عقود قربت تنتهي (خلال 30 يوم)
              </h3>
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

            {!expiringLoading &&
              !expiringError &&
              expiringContracts.length === 0 && (
                <div className="bg-white rounded-2xl p-6 text-center text-slate-400 border border-slate-100 text-sm">
                  لا توجد عقود قربت تنتهي حالياً
                </div>
              )}

            {!expiringLoading &&
              !expiringError &&
              expiringContracts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {expiringContracts.map((contract) => {
                    const remaining = daysRemaining(contract.endDate);
                    return (
                      <div
                        key={contract._id}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100 border-r-4 border-r-amber-400"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-bold text-slate-800 text-sm">
                            {contract.tenant?.name || "—"}
                          </h4>
                          <span className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded-full font-semibold whitespace-nowrap">
                            {remaining <= 0
                              ? "ينتهي اليوم"
                              : `${remaining} يوم متبقي`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mb-1">
                          🏢 {contract.unit?.property?.name || "—"} - شقة{" "}
                          {contract.unit?.unitNumber ?? "—"}
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

      {/* ===== Modal: تغيير كلمة المرور ===== */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-40 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">

            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">تغيير كلمة المرور</h3>
              <button
                onClick={closePasswordModal}
                className="text-slate-400 text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-5 space-y-4">
              {passwordError && (
                <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg p-3 text-sm">
                  {passwordSuccess}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  كلمة المرور الحالية
                </label>
                <input
                  type={showPasswords ? "text" : "password"}
                  autoComplete="current-password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-600"
                  placeholder="أدخل كلمة المرور الحالية"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  كلمة المرور الجديدة
                </label>
                <input
                  type={showPasswords ? "text" : "password"}
                  autoComplete="new-password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-600"
                  placeholder="6 أحرف على الأقل"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  تأكيد كلمة المرور الجديدة
                </label>
                <input
                  type={showPasswords ? "text" : "password"}
                  autoComplete="new-password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-600"
                  placeholder="أعد كتابة كلمة المرور الجديدة"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPasswords}
                  onChange={(e) => setShowPasswords(e.target.checked)}
                  className="w-4 h-4"
                />
                إظهار كلمات المرور
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-medium text-sm"
                >
                  {passwordSuccess ? "إغلاق" : "إلغاء"}
                </button>
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-sm"
                >
                  {passwordSaving ? "جاري الحفظ..." : "حفظ كلمة المرور"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Bottom Navigation (Mobile) ===== */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex items-center justify-around py-2 z-20">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium min-w-[60px] ${
                active ? "text-blue-600" : "text-slate-500"
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
