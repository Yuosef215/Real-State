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
const API_BASE_URL = "https://real-state-5h8r.onrender.com/api/v1";
const TENANTS_BASE = `${API_BASE_URL}/tenants`;
const size = 25;
const NAV_ITEMS = [
  { label: 'الرئيسية', path: '/dashboard', icon: <FaHome size={size} color='black'/> },
  { label: 'العقارات', path: '/properties', icon: <MdRealEstateAgent size={size} color='black'/> },
  { label: 'الوحدات', path: '/units', icon:  <PiBuildingApartmentFill size={size} color='black'/>},
  { label: 'المستأجرين', path: '/tenants', icon: <IoIosPeople size={size} color='black'/> },
  { label: 'العقود', path: '/contracts', icon: <LiaFileContractSolid size={size} color='black'/>},
  { label: 'الدفع', path: '/payments', icon: <MdPayments size={size} color='black'/>},
];

const EMPTY_FORM = {
  name: '',
  phone: '',
  email: '',
  nationalId: '',
  address: '',
};

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function Tenants() {
  const location = useLocation();

  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTenants = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${TENANTS_BASE}/getAll_tenants`, {
        headers: authHeaders(),
      });
      const list = res.data?.data || res.data?.tenants || res.data || [];
      setTenants(Array.isArray(list) ? list : []);
    } catch (err) {
      setError('تعذر تحميل بيانات المستأجرين، تأكد إن السيرفر شغال');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (tenant) => {
    setEditingId(tenant._id || tenant.id);
    setForm({
      name: tenant.name || '',
      phone: tenant.phone || '',
      email: tenant.email || '',
      nationalId: tenant.nationalId || '',
      address: tenant.address || '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(EMPTY_FORM);
    setFormErrors({});
  };

  const validateForm = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'الاسم مطلوب';

    if (!form.phone.trim()) {
      errs.phone = 'رقم الهاتف مطلوب';
    } else if (!/^01[0-2,5]{1}[0-9]{8}$/.test(form.phone.trim())) {
      errs.phone = 'رقم هاتف غير صحيح';
    }

    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = 'بريد إلكتروني غير صحيح';
    }

    if (!form.nationalId.trim()) {
      errs.nationalId = 'الرقم القومي مطلوب';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      nationalId: form.nationalId.trim(),
      address: form.address.trim(),
    };

    try {
      if (editingId) {
        await axios.put(`${TENANTS_BASE}/update_tenant/${editingId}`, payload, {
          headers: authHeaders(),
        });
      } else {
        await axios.post(`${TENANTS_BASE}/create_tenant`, payload, {
          headers: authHeaders(),
        });
      }
      closeModal();
      fetchTenants();
    } catch (err) {
      const message = err.response?.data?.message || 'حدث خطأ أثناء الحفظ';
      setFormErrors({ general: message });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`${TENANTS_BASE}/delete_tenant/${deleteTarget._id || deleteTarget.id}`, {
        headers: authHeaders(),
      });
      setDeleteTarget(null);
      fetchTenants();
    } catch (err) {
      setError('تعذر حذف المستأجر، حاول مرة أخرى');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const filteredTenants = tenants.filter((t) => {
    const q = search.trim();
    if (!q) return true;
    return (
      t.name?.includes(q) ||
      t.phone?.includes(q) ||
      t.nationalId?.includes(q)
    );
  });

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 flex font-sans">

      {/* ===== Sidebar (Desktop) ===== */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-l border-slate-200 min-h-screen sticky top-0">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl"><img src="/logo.png" alt="" /></div>
            <h1 className="text-sm font-bold text-slate-800">مؤسسه الشروق 3</h1>
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

      {/* ===== Main Content ===== */}
      <main className="flex-1 min-w-0">
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-800">المستأجرين</h2>
            <button
              onClick={openAddModal}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <span className="text-lg leading-none">+</span>
              <span className="hidden sm:inline">إضافة مستأجر</span>
            </button>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الهاتف أو الرقم القومي..."
            className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-600"
          />
        </header>

        <div className="p-4 md:p-8 pb-24 md:pb-8">

          {loading && (
            <div className="flex items-center justify-center py-20">
              <span className="w-8 h-8 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin"></span>
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4 text-sm mb-4">
              {error}
            </div>
          )}

          {!loading && !error && filteredTenants.length === 0 && (
            <div className="bg-white rounded-2xl p-10 text-center text-slate-400 border border-slate-100">
              {tenants.length === 0 ? 'لا يوجد مستأجرين مضافين بعد' : 'لا توجد نتائج مطابقة للبحث'}
            </div>
          )}

          {!loading && !error && filteredTenants.length > 0 && (
            <>
              {/* ===== عرض كروت في الموبايل ===== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3">
                {filteredTenants.map((t) => (
                  <div key={t._id || t.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
                        {t.name?.charAt(0) || '؟'}
                      </div>
                      <h3 className="font-bold text-slate-800">{t.name}</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-1">📞 {t.phone}</p>
                    <p className="text-sm text-slate-500 mb-3">🪪 {t.nationalId}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(t)}
                        className="flex-1 text-sm font-medium text-blue-600 bg-blue-50 py-2 rounded-lg"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => setDeleteTarget(t)}
                        className="flex-1 text-sm font-medium text-red-600 bg-red-50 py-2 rounded-lg"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* ===== جدول في الديسكتوب ===== */}
              <div className="hidden lg:block bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-right">
                      <th className="py-3 px-5 font-semibold">الاسم</th>
                      <th className="py-3 px-5 font-semibold">الهاتف</th>
                      <th className="py-3 px-5 font-semibold">الرقم القومي</th>
                      <th className="py-3 px-5 font-semibold">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTenants.map((t) => (
                      <tr key={t._id || t.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-5 font-medium text-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-xs font-bold shrink-0">
                              {t.name?.charAt(0) || '؟'}
                            </div>
                            {t.name}
                          </div>
                        </td>
                        <td className="py-3 px-5 text-slate-600">{t.phone}</td>
                        <td className="py-3 px-5 text-slate-600">{t.nationalId}</td>
                        <td className="py-3 px-5">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal(t)}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              تعديل
                            </button>
                            <button
                              onClick={() => setDeleteTarget(t)}
                              className="text-red-600 hover:underline font-medium"
                            >
                              حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
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

      {/* ===== Modal: إضافة / تعديل مستأجر ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-30 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-bold text-slate-800">{editingId ? 'تعديل بيانات المستأجر' : 'إضافة مستأجر جديد'}</h3>
              <button onClick={closeModal} className="text-slate-400 text-xl leading-none">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formErrors.general && (
                <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">
                  {formErrors.general}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">الاسم</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none ${
                    formErrors.name ? 'border-red-500' : 'border-slate-200 focus:border-blue-600'
                  }`}
                  placeholder="مثال: أحمد محمد"
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none ${
                      formErrors.phone ? 'border-red-500' : 'border-slate-200 focus:border-blue-600'
                    }`}
                    placeholder="01xxxxxxxxx"
                  />
                  {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">الرقم القومي</label>
                  <input
                    type="text"
                    value={form.nationalId}
                    onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none ${
                      formErrors.nationalId ? 'border-red-500' : 'border-slate-200 focus:border-blue-600'
                    }`}
                    placeholder="الرقم القومي الخاص بي المستأجر"
                  />
                  {formErrors.nationalId && <p className="text-red-500 text-xs mt-1">{formErrors.nationalId}</p>}
                </div>
              </div>




              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-medium text-sm"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-sm"
                >
                  {saving ? 'جاري الحفظ...' : editingId ? 'حفظ التعديلات' : 'إضافة المستأجر'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Modal: تأكيد الحذف ===== */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-30 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5">
            <h3 className="font-bold text-slate-800 mb-2">تأكيد الحذف</h3>
            <p className="text-sm text-slate-500 mb-5">
              هل أنت متأكد من حذف المستأجر "{deleteTarget.name}"؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-medium text-sm"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold text-sm"
              >
                {deleting ? 'جاري الحذف...' : 'حذف'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tenants;
