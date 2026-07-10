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
const CONTRACTS_BASE = `${API_BASE_URL}/contracts`;
const UNITS_BASE = `${API_BASE_URL}/units`;
const TENANTS_BASE = `${API_BASE_URL}/tenants`;

const size = 25;

const NAV_ITEMS = [
  { label: 'الرئيسية', path: '/dashboard', icon: <FaHome size={size} color='black' /> },
  { label: 'العقارات', path: '/properties', icon: <MdRealEstateAgent size={size} color='black' /> },
  { label: 'الوحدات', path: '/units', icon: <PiBuildingApartmentFill size={size} color='black' /> },
  { label: 'المستأجرين', path: '/tenants', icon: <IoIosPeople size={size} color='black' /> },
  { label: 'العقود', path: '/contracts', icon: <LiaFileContractSolid size={size} color='black' /> },
  { label: 'الدفع', path: '/payments', icon: <MdPayments size={size} color='black' /> },
];

const CONTRACT_STATUSES = [
  { value: 'active', label: 'نشطة' },
  { value: 'expired', label: 'منتهية' },
  { value: 'cancelled', label: 'ملغية' },
];

function statusLabel(value) {
  return CONTRACT_STATUSES.find((s) => s.value === value)?.label || value;
}

function statusColor(value) {
  if (value === 'active') return 'bg-green-50 text-green-600';
  if (value === 'cancelled') return 'bg-red-50 text-red-600';
  return 'bg-slate-100 text-slate-500';
}

const EMPTY_FORM = {
  propertyId: "",
  unitId: "",
  tenantId: "",
  startDate: "",
  endDate: "",
  rentAmount: "",
  securityDeposit: "",
  status: "نشط",
};

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function Contracts() {
  const location = useLocation();

  const [contracts, setContracts] = useState([]);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [properties, setProperties] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const unitLabel = (id) => {
    const u = units.find((u) => (u._id || u.id) === id);
    return u ? `وحدة ${u.unitNumber}` : '—';
  };

  const tenantName = (id) => {
    const t = tenants.find((t) => (t._id || t.id) === id);
    return t?.name || '—';
  };

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [contractsRes, propertiesRes, tenantsRes] = await Promise.all([
        axios.get(`${CONTRACTS_BASE}/get_contract`, {
          headers: authHeaders(),
        }),
        axios.get(`${API_BASE_URL}/properties/getAll_properties`, {
          headers: authHeaders(),
        }),
        axios.get(`${TENANTS_BASE}/getAll_tenants`, {
          headers: authHeaders(),
        }),
      ]);

      const contractsList = contractsRes.data?.data || contractsRes.data?.contracts || contractsRes.data || [];
      const unitsList = unitsRes.data?.data || unitsRes.data?.units || unitsRes.data || [];
      const tenantsList = tenantsRes.data?.data || tenantsRes.data?.tenants || tenantsRes.data || [];

      setProperties(propertiesRes.data.data);
      setContracts(Array.isArray(contractsList) ? contractsList : []);
      setUnits(Array.isArray(unitsList) ? unitsList : []);
      setTenants(Array.isArray(tenantsList) ? tenantsList : []);
    } catch (err) {
      setError('تعذر تحميل البيانات، تأكد إن السيرفر شغال');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);
  const selectedProperty = properties.find(
    p => p._id === form.propertyId
  );

  const filteredUnits = selectedProperty?.units || [];

  const openAddModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (contract) => {
    setEditingId(contract._id || contract.id);
    setForm({
      unitId: contract.unitId || contract.unit || '',
      tenantId: contract.tenantId || contract.tenant || '',
      startDate: contract.startDate ? contract.startDate.substring(0, 10) : '',
      endDate: contract.endDate ? contract.endDate.substring(0, 10) : '',
      rentAmount: contract.rentAmount ?? '',
      status: contract.status || 'active',
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
    if (!form.unitId) errs.unitId = 'اختر الوحدة';
    if (!form.tenantId) errs.tenantId = 'اختر المستأجر';
    if (!form.startDate) errs.startDate = 'تاريخ البداية مطلوب';
    if (!form.endDate) errs.endDate = 'تاريخ النهاية مطلوب';
    if (form.startDate && form.endDate && form.endDate <= form.startDate) {
      errs.endDate = 'يجب أن يكون تاريخ النهاية بعد البداية';
    }
    if (!form.rentAmount || Number(form.rentAmount) <= 0) errs.rentAmount = 'أدخل قيمة إيجار صحيحة';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    const payload = {
      unitId: form.unitId,
      tenantId: form.tenantId,
      startDate: form.startDate,
      endDate: form.endDate,
      rentAmount: Number(form.rentAmount),
      status: form.status,
    };

    try {
      if (editingId) {
        await axios.put(`${CONTRACTS_BASE}/update_contract/${editingId}`, payload, {
          headers: authHeaders(),
        });
      } else {
        await axios.post(`${CONTRACTS_BASE}/create_contract`, payload, {
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
      await axios.delete(`${CONTRACTS_BASE}/delete_contract/${deleteTarget._id || deleteTarget.id}`, {
        headers: authHeaders(),
      });
      setDeleteTarget(null);
      fetchAll();
    } catch (err) {
      setError('تعذر حذف العقد، حاول مرة أخرى');
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 text-sm font-medium transition-colors ${active ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
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
          <h2 className="text-lg font-bold text-slate-800">العقود</h2>
          <button
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span>
            <span className="hidden sm:inline">إضافة عقد</span>
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

          {!loading && !error && contracts.length === 0 && (
            <div className="bg-white rounded-2xl p-10 text-center text-slate-400 border border-slate-100">
              لا توجد عقود مضافة بعد
            </div>
          )}

          {!loading && !error && contracts.length > 0 && (
            <>
              {/* ===== عرض كروت في الموبايل ===== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3">
                {contracts.map((c) => (
                  <div key={c._id || c.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-slate-800">{unitLabel(c.unitId || c.unit)}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColor(c.status)}`}>
                        {statusLabel(c.status)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-1">👤 {tenantName(c.tenantId || c.tenant)}</p>
                    <p className="text-sm text-slate-500 mb-1">
                      📅 {c.startDate?.substring(0, 10)} → {c.endDate?.substring(0, 10)}
                    </p>
                    <p className="text-sm text-slate-500 mb-3">
                      💰 {Number(c.rentAmount).toLocaleString('ar-EG')} ج.م / شهر
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(c)}
                        className="flex-1 text-sm font-medium text-blue-600 bg-blue-50 py-2 rounded-lg"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => setDeleteTarget(c)}
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
                      <th className="py-3 px-5 font-semibold">العقار</th>
                      <th className="py-3 px-5 font-semibold">الوحدة</th>
                      <th className="py-3 px-5 font-semibold">المستأجر</th>
                      <th className="py-3 px-5 font-semibold">تاريخ البداية</th>
                      <th className="py-3 px-5 font-semibold">تاريخ النهاية</th>
                      <th className="py-3 px-5 font-semibold">قيمة الإيجار</th>
                      <th className="py-3 px-5 font-semibold">الحالة</th>
                      <th className="py-3 px-5 font-semibold">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((c) => (
                      <tr key={c._id || c.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-5 font-medium text-slate-800">{c.unit.property.name}</td>
                        <td className="py-3 px-5 font-medium text-slate-800">{c.unit.unitNumber}</td>
                        <td className="py-3 px-5 text-slate-600">{c.tenant.name}</td>
                        <td className="py-3 px-5 text-slate-600">{c.startDate?.substring(0, 10)}</td>
                        <td className="py-3 px-5 text-slate-600">{c.endDate?.substring(0, 10)}</td>
                        <td className="py-3 px-5 text-slate-600">{c.monthlyRent?.toLocaleString('ar-EG')} ج.م</td>
                        <td className="py-3 px-5">
                          <span className={`text-xs px-2 py-1 rounded-full ${statusColor(c.status)}`}>
                            {statusLabel(c.status)}
                          </span>
                        </td>
                        <td className="py-3 px-5">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal(c)}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              تعديل
                            </button>
                            <button
                              onClick={() => setDeleteTarget(c)}
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
              className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium min-w-[60px] ${active ? 'text-blue-600' : 'text-slate-500'
                }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* ===== Modal: إضافة / تعديل عقد ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-30 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-bold text-slate-800">{editingId ? 'تعديل العقد' : 'إضافة عقد جديد'}</h3>
              <button onClick={closeModal} className="text-slate-400 text-xl leading-none">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formErrors.general && (
                <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">
                  {formErrors.general}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">الوحدة</label>
                <select
                  value={form.unitId}
                  onChange={(e) => setForm({ ...form, unitId: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none ${formErrors.unitId ? 'border-red-500' : 'border-slate-200 focus:border-blue-600'
                    }`}
                >
                  <option value="">اختر الوحدة</option>
                  {filteredUnits.map((u) => (
                    <option key={u._id} value={u._id}>
                      وحدة {u.unitNumber} - الدور {u.floor}
                    </option>
                  ))}
                </select>
                {formErrors.unitId && <p className="text-red-500 text-xs mt-1">{formErrors.unitId}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">المستأجر</label>
                <select
                  value={form.tenantId}
                  onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none ${formErrors.tenantId ? 'border-red-500' : 'border-slate-200 focus:border-blue-600'
                    }`}
                >
                  <option value="">اختر المستأجر</option>
                  {tenants.map((t) => (
                    <option key={t._id || t.id} value={t._id || t.id}>{t.name}</option>
                  ))}
                </select>
                {formErrors.tenantId && <p className="text-red-500 text-xs mt-1">{formErrors.tenantId}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">تاريخ البداية</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none ${formErrors.startDate ? 'border-red-500' : 'border-slate-200 focus:border-blue-600'
                      }`}
                  />
                  {formErrors.startDate && <p className="text-red-500 text-xs mt-1">{formErrors.startDate}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">تاريخ النهاية</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none ${formErrors.endDate ? 'border-red-500' : 'border-slate-200 focus:border-blue-600'
                      }`}
                  />
                  {formErrors.endDate && <p className="text-red-500 text-xs mt-1">{formErrors.endDate}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">قيمة الإيجار الشهري</label>
                  <input
                    type="number"
                    min="1"
                    value={form.rentAmount}
                    onChange={(e) => setForm({ ...form, rentAmount: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none ${formErrors.rentAmount ? 'border-red-500' : 'border-slate-200 focus:border-blue-600'
                      }`}
                    placeholder="0"
                  />
                  {formErrors.rentAmount && <p className="text-red-500 text-xs mt-1">{formErrors.rentAmount}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">حالة العقد</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-600"
                  >
                    {CONTRACT_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
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
                  {saving ? 'جاري الحفظ...' : editingId ? 'حفظ التعديلات' : 'إضافة العقد'}
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
              هل أنت متأكد من حذف هذا العقد؟ لا يمكن التراجع عن هذا الإجراء.
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

export default Contracts;
