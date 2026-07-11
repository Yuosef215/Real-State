import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaHome } from "react-icons/fa";
import { MdRealEstateAgent } from "react-icons/md";
import { PiBuildingApartmentFill } from "react-icons/pi";
import { IoIosPeople } from "react-icons/io";
import { LiaFileContractSolid } from "react-icons/lia";
import { MdPayments } from "react-icons/md";

// ====== إعدادات الـ API ======
const API_BASE_URL = "http://localhost:5000/api/v1";
const UNITS_BASE = `${API_BASE_URL}/units`;
const PROPERTIES_BASE = `${API_BASE_URL}/properties`;
const size = 25;
const NAV_ITEMS = [
  { label: 'الرئيسية', path: '/dashboard', icon: <FaHome size={size} color='black'/> },
  { label: 'العقارات', path: '/properties', icon: <MdRealEstateAgent size={size} color='black'/> },
  { label: 'الوحدات', path: '/units', icon:  <PiBuildingApartmentFill size={size} color='black'/>},
  { label: 'المستأجرين', path: '/tenants', icon: <IoIosPeople size={size} color='black'/> },
  { label: 'العقود', path: '/contracts', icon: <LiaFileContractSolid size={size} color='black'/>},
  { label: 'الدفع', path: '/payments', icon: <MdPayments size={size} color='black'/>},
];

const UNIT_STATUSES = [
  { value: 'متاحه', label: 'متاحه' },
  { value: 'مستأجره', label: 'مستأجره' },
];

function statusLabel(value) {
  return UNIT_STATUSES.find((s) => s.value === value)?.label || value;
}

function statusColor(value) {
  return value === 'rented'
    ? 'bg-amber-50 text-amber-600'
    : 'bg-green-50 text-green-600';
}

const EMPTY_FORM = {
  unitNumber: '',
  floor: '',
  area: '',
  monthlyRent: '',
  status: 'متاحه',
  propertyId: '',
};

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function Units() {
  const location = useLocation();

  const [units, setUnits] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const propertyName = (id) => {
    const p = properties.find((p) => (p._id || p.id) === id);
    return p?.name || '—';
  };

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [unitsRes, propsRes] = await Promise.all([
        axios.get(`${UNITS_BASE}/getAll_units`, { headers: authHeaders() }),
        axios.get(`${PROPERTIES_BASE}/getAll_properties`, { headers: authHeaders() }),
      ]);

      const unitsList = unitsRes.data?.data || unitsRes.data?.units || unitsRes.data || [];
      const propsList = propsRes.data?.data || propsRes.data?.properties || propsRes.data || [];

      setUnits(Array.isArray(unitsList) ? unitsList : []);
      setProperties(Array.isArray(propsList) ? propsList : []);
    } catch (err) {
      setError('تعذر تحميل البيانات، تأكد إن السيرفر شغال');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (unit) => {
    setEditingId(unit._id || unit.id);
    setForm({
      unitNumber: unit.unitNumber || '',
      floor: unit.floor ?? '',
      area: unit.area ?? '',
      monthlyRent: unit.monthlyRent ?? '',
      status: unit.status || 'متاحه',
      propertyId: unit.propertyId || unit.property || '',
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
    if (!form.unitNumber.trim()) errs.unitNumber = 'رقم الوحدة مطلوب';
    if (!form.floor.toString().trim()) errs.floor = 'الطابق مطلوب';
    if (!form.propertyId) errs.propertyId = 'اختر العقار التابع له';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    const payload = {
      unitNumber: form.unitNumber.trim(),
      floor: form.floor,
      area: Number(form.area),
      monthlyRent: Number(form.monthlyRent),
      status: form.status,
    };

    try {
      if (editingId) {
        await axios.put(`${UNITS_BASE}/update_unit/${editingId}`, payload, {
          headers: authHeaders(),
        });
      } else {
        await axios.post(`${UNITS_BASE}/create_units/${form.propertyId}`, payload, {
          headers: authHeaders(),
        });
      }
      closeModal();
      fetchAll();
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
      await axios.delete(`${UNITS_BASE}/delete_unit/${deleteTarget._id || deleteTarget.id}`, {
        headers: authHeaders(),
      });
      setDeleteTarget(null);
      fetchAll();
    } catch (err) {
      setError('تعذر حذف الوحدة، حاول مرة أخرى');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 flex font-sans">

      {/* ===== Sidebar (Desktop) ===== */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-l border-slate-200 min-h-screen sticky top-0">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl">🏢</div>
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
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-lg font-bold text-slate-800">الوحدات</h2>
          <button
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span>
            <span className="hidden sm:inline">إضافة وحدة</span>
          </button>
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

          {!loading && !error && units.length === 0 && (
            <div className="bg-white rounded-2xl p-10 text-center text-slate-400 border border-slate-100">
              لا توجد وحدات مضافة بعد
            </div>
          )}

          {!loading && !error && units.length > 0 && (
            <>
              {/* ===== عرض كروت في الموبايل ===== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3">
                {units.map((u) => (
                  <div key={u._id || u.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-slate-800">وحدة {u.unitNumber}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColor(u.status)}`}>
                        {statusLabel(u.status)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-1">🏢 {propertyName(u.propertyId || u.property)}</p>
                    <p className="text-sm text-slate-500 mb-1">الطابق: {u.floor} — المساحة: {u.area} م²</p>
                    <p className="text-sm text-slate-500 mb-3">الإيجار الشهري: {Number(u.monthlyRent).toLocaleString('ar-EG')} ج.م</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(u)}
                        className="flex-1 text-sm font-medium text-blue-600 bg-blue-50 py-2 rounded-lg"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => setDeleteTarget(u)}
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
                      <th className="py-3 px-5 font-semibold">رقم الوحدة</th>
                      <th className="py-3 px-5 font-semibold">العقار</th>
                      <th className="py-3 px-5 font-semibold">الطابق</th>
                      <th className="py-3 px-5 font-semibold">الإيجار الشهري</th>
                      <th className="py-3 px-5 font-semibold">الحالة</th>
                      <th className="py-3 px-5 font-semibold">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {units.map((u) => (
                      <tr key={u._id || u.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-5 font-medium text-slate-800">{u.unitNumber}</td>
                        <td className="py-3 px-5 text-slate-600">{u.propertyId || u.property.name}</td>
                        <td className="py-3 px-5 text-slate-600">{u.floor}</td>
                        <td className="py-3 px-5 text-slate-600">{u.contracts?.[0]?.monthlyRent?.toLocaleString('ar-EG')} ج.م</td>
                        <td className="py-3 px-5">
                          <span className={`text-xs px-2 py-1 rounded-full ${statusColor(u.status)}`}>
                            {statusLabel(u.status)}
                          </span>
                        </td>
                        <td className="py-3 px-5">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal(u)}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              تعديل
                            </button>
                            <button
                              onClick={() => setDeleteTarget(u)}
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

      {/* ===== Modal: إضافة / تعديل وحدة ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-30 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-bold text-slate-800">{editingId ? 'تعديل الوحدة' : 'إضافة وحدة جديدة'}</h3>
              <button onClick={closeModal} className="text-slate-400 text-xl leading-none">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formErrors.general && (
                <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">
                  {formErrors.general}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">العقار</label>
                <select
                  value={form.propertyId}
                  onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
                  disabled={!!editingId}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none disabled:bg-slate-50 disabled:text-slate-400 ${
                    formErrors.propertyId ? 'border-red-500' : 'border-slate-200 focus:border-blue-600'
                  }`}
                >
                  <option value="">اختر العقار</option>
                  {properties.map((p) => (
                    <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>
                  ))}
                </select>
                {formErrors.propertyId && <p className="text-red-500 text-xs mt-1">{formErrors.propertyId}</p>}
                {editingId && (
                  <p className="text-xs text-slate-400 mt-1">لا يمكن تغيير العقار التابع له عند التعديل</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">رقم الوحدة</label>
                  <input
                    type="text"
                    value={form.unitNumber}
                    onChange={(e) => setForm({ ...form, unitNumber: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none ${
                      formErrors.unitNumber ? 'border-red-500' : 'border-slate-200 focus:border-blue-600'
                    }`}
                    placeholder="مثال: A101"
                  />
                  {formErrors.unitNumber && <p className="text-red-500 text-xs mt-1">{formErrors.unitNumber}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">الطابق</label>
                  <input
                    type="text"
                    value={form.floor}
                    onChange={(e) => setForm({ ...form, floor: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none ${
                      formErrors.floor ? 'border-red-500' : 'border-slate-200 focus:border-blue-600'
                    }`}
                    placeholder="مثال: 3"
                  />
                  {formErrors.floor && <p className="text-red-500 text-xs mt-1">{formErrors.floor}</p>}
                </div>
              </div>


              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">الحالة</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-600"
                >
                  {UNIT_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
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
                  {saving ? 'جاري الحفظ...' : editingId ? 'حفظ التعديلات' : 'إضافة الوحدة'}
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
              هل أنت متأكد من حذف وحدة "{deleteTarget.unitNumber}"؟ لا يمكن التراجع عن هذا الإجراء.
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

export default Units;
