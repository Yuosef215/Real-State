import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaHome } from "react-icons/fa";
import { MdRealEstateAgent } from "react-icons/md";
import { PiBuildingApartmentFill } from "react-icons/pi";
import { IoIosPeople } from "react-icons/io";
import { LiaFileContractSolid } from "react-icons/lia";
import { MdPayments } from "react-icons/md";
import { FaUserPlus } from "react-icons/fa";

// ====== إعدادات الـ API ======
const API_BASE_URL = "http://localhost:5000/api/v1";
const CREATE_USER_ENDPOINT = `${API_BASE_URL}/users/create_user`;

const size = 25;
const NAV_ITEMS = [
  { label: 'الرئيسية', path: '/dashboard', icon: <FaHome size={size} color='black'/> },
  { label: 'العقارات', path: '/properties', icon: <MdRealEstateAgent size={size} color='black'/> },
  { label: 'الوحدات', path: '/units', icon:  <PiBuildingApartmentFill size={size} color='black'/>},
  { label: 'المستأجرين', path: '/tenants', icon: <IoIosPeople size={size} color='black'/> },
  { label: 'العقود', path: '/contracts', icon: <LiaFileContractSolid size={size} color='black'/>},
  { label: 'الدفع', path: '/payments', icon: <MdPayments size={size} color='black'/>},
  { label: 'المستخدمين', path: '/users/add', icon: <FaUserPlus size={size} color='black'/>},
];

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const EMPTY_FORM = {
  name: '',
  code: '',
  password: '',
  confirmPassword: '',
};

// ===================== Sidebar =====================
function Sidebar({ currentPath }) {
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-l border-slate-200 min-h-screen sticky top-0">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl"><img src="/logo.png" alt="" /></div>
          <h1 className="text-sm font-bold text-slate-800">مؤسسه الشروق 3</h1>
        </div>
      </div>
      <nav className="flex-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active = currentPath === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 text-sm font-medium transition-colors ${
                active ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

// ===================== Bottom Navigation =====================
function BottomNav({ currentPath }) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex items-center justify-around py-2 z-20 overflow-x-auto">
      {NAV_ITEMS.map((item) => {
        const active = currentPath === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium min-w-[55px] shrink-0 ${
              active ? 'text-blue-600' : 'text-slate-500'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function AddUser() {
  const location = useLocation();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = 'الاسم مطلوب';

    if (!form.code.trim()) {
      newErrors.code = 'الكود مطلوب';
    }

    if (!form.password) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (form.password.length < 6) {
      newErrors.password = 'كلمة المرور يجب ألا تقل عن 6 أحرف';
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'تأكيد كلمة المرور مطلوب';
    } else if (form.confirmPassword !== form.password) {
      newErrors.confirmPassword = 'كلمة المرور غير متطابقة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');

    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      password: form.password,
    };

    setSaving(true);
    try {
      await axios.post(CREATE_USER_ENDPOINT, payload, {
        headers: authHeaders(),
      });
      setSuccessMessage('تم إنشاء المستخدم بنجاح');
      setForm(EMPTY_FORM);
      setErrors({});
    } catch (err) {
      const message = err.response?.data?.message || 'حدث خطأ أثناء إنشاء المستخدم';
      setErrors({ general: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 flex font-sans">
      <Sidebar currentPath={location.pathname} />

      <main className="flex-1 min-w-0">
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 sticky top-0 z-10">
          <h2 className="text-lg font-bold text-slate-800">إضافة مستخدم جديد</h2>
        </header>

        <div className="p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">

            {successMessage && (
              <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg p-3 text-sm mb-4">
                {successMessage}
              </div>
            )}

            {errors.general && (
              <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm mb-4">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">الاسم</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none ${
                    errors.name ? 'border-red-500' : 'border-slate-200 focus:border-blue-600'
                  }`}
                  placeholder="مثال: أحمد محمد"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">الكود</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none ${
                    errors.code ? 'border-red-500' : 'border-slate-200 focus:border-blue-600'
                  }`}
                  placeholder="الكود المستخدم لتسجيل الدخول"
                  autoComplete="username"
                />
                {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">كلمة المرور</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none ${
                    errors.password ? 'border-red-500' : 'border-slate-200 focus:border-blue-600'
                  }`}
                  placeholder="6 أحرف على الأقل"
                  autoComplete="new-password"
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">تأكيد كلمة المرور</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none ${
                    errors.confirmPassword ? 'border-red-500' : 'border-slate-200 focus:border-blue-600'
                  }`}
                  placeholder="أعد كتابة كلمة المرور"
                  autoComplete="new-password"
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-sm mt-2"
              >
                {saving ? 'جاري الإضافة...' : 'إضافة المستخدم'}
              </button>
            </form>
          </div>
        </div>
      </main>

      <BottomNav currentPath={location.pathname} />
    </div>
  );
}

export default AddUser;
