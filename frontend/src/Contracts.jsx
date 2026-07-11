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
const CONTRACTS_BASE = `${API_BASE_URL}/contracts`;
const PROPERTIES_BASE = `${API_BASE_URL}/properties`;
const TENANTS_BASE = `${API_BASE_URL}/tenants`;
const UNITS_BASE = `${API_BASE_URL}/units`;

const size = 25;
const NAV_ITEMS = [
  { label: 'الرئيسية', path: '/dashboard', icon: <FaHome size={size} color='black'/> },
  { label: 'العقارات', path: '/properties', icon: <MdRealEstateAgent size={size} color='black'/> },
  { label: 'الوحدات', path: '/units', icon:  <PiBuildingApartmentFill size={size} color='black'/>},
  { label: 'المستأجرين', path: '/tenants', icon: <IoIosPeople size={size} color='black'/> },
  { label: 'العقود', path: '/contracts', icon: <LiaFileContractSolid size={size} color='black'/>},
  { label: 'الدفع', path: '/payments', icon: <MdPayments size={size} color='black'/>},
];

const CONTRACT_STATUSES = ['نشط', 'منتهي', 'ملغي'];

function statusColor(status) {
  if (status === 'نشط') return 'bg-green-50 text-green-600';
  if (status === 'ملغي') return 'bg-red-50 text-red-600';
  return 'bg-slate-100 text-slate-500';
}

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const EMPTY_FORM = {
  propertyId: '',
  unit: '',
  tenant: '',
  monthlyRent: '',
  securityDeposit: '',
  startDate: '',
  endDate: '',
  status: 'نشط',
};

// ===================== Sidebar =====================
function Sidebar({ currentPath }) {
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-l border-slate-200 min-h-screen sticky top-0">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl">🏢</div>
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

// ===================== Toast =====================
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium border ${
        type === 'success'
          ? 'bg-green-50 text-green-700 border-green-200'
          : 'bg-red-50 text-red-700 border-red-200'
      }`}
    >
      {message}
    </div>
  );
}

// ===================== Contract Form Modal =====================
function ContractFormModal({ properties, units, tenants, initialData, onClose, onSaved }) {
  const isEditing = Boolean(initialData);

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // تعبئة الفورم عند التعديل
  useEffect(() => {
    if (initialData) {
      const propertyId = initialData.unit?.property?._id || initialData.unit?.property || '';
      setForm({
        propertyId,
        unit: initialData.unit?._id || initialData.unit || '',
        tenant: initialData.tenant?._id || '',
        monthlyRent: initialData.monthlyRent ?? '',
        securityDeposit: initialData.securityDeposit ?? '',
        startDate: initialData.startDate?.substring(0, 10) || '',
        endDate: initialData.endDate?.substring(0, 10) || '',
        status: initialData.status || 'نشط',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
    setSubmitError('');
  }, [initialData]);

  // الوحدات المتاحة بناءً على العقار المختار فقط
  // كل وحدة فيها property (populate)، فبنفلتر الوحدات اللي property._id بتاعها = العقار المختار
  const availableUnits = units.filter((u) => {
    const unitPropertyId = u.property?._id || u.property;
    return unitPropertyId === form.propertyId;
  });

  const handlePropertyChange = (propertyId) => {
    setForm((prev) => ({ ...prev, propertyId, unit: '' }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.propertyId) newErrors.propertyId = 'العقار مطلوب';
    if (!form.unit) newErrors.unit = 'الوحدة مطلوبة';
    if (!form.tenant) newErrors.tenant = 'المستأجر مطلوب';

    if (!form.monthlyRent || Number(form.monthlyRent) <= 0) {
      newErrors.monthlyRent = 'مبلغ الإيجار يجب أن يكون أكبر من صفر';
    }

    if (form.securityDeposit === '' || Number(form.securityDeposit) < 0) {
      newErrors.securityDeposit = 'مبلغ التأمين يجب أن يكون صفر أو أكبر';
    }

    if (!form.startDate) newErrors.startDate = 'تاريخ البداية مطلوب';
    if (!form.endDate) newErrors.endDate = 'تاريخ النهاية مطلوب';

    if (form.startDate && form.endDate && form.endDate <= form.startDate) {
      newErrors.endDate = 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validate()) return;

    const payload = {
      tenant: form.tenant,
      unit: form.unit,
      monthlyRent: Number(form.monthlyRent),
      securityDeposit: Number(form.securityDeposit),
      startDate: form.startDate,
      endDate: form.endDate,
      status: form.status,
    };

    setSaving(true);
    try {
      if (isEditing) {
        await axios.put(`${CONTRACTS_BASE}/update_contract/${initialData._id}`, payload, {
          headers: authHeaders(),
        });
        onSaved('تم تعديل العقد بنجاح');
      } else {
        await axios.post(`${CONTRACTS_BASE}/create_contract`, payload, {
          headers: authHeaders(),
        });
        onSaved('تم إنشاء العقد بنجاح');
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'حدث خطأ أثناء حفظ العقد');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-30 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="font-bold text-slate-800">{isEditing ? 'تعديل العقد' : 'إضافة عقد جديد'}</h3>
          <button onClick={onClose} className="text-slate-400 text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4" noValidate>
          {submitError && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">
              {submitError}
            </div>
          )}

          {/* العقار */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">العقار</label>
            <select
              value={form.propertyId}
              onChange={(e) => handlePropertyChange(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none ${
                errors.propertyId ? 'border-red-500' : 'border-slate-200 focus:border-blue-600'
              }`}
            >
              <option value="">اختر العقار</option>
              {properties.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            {errors.propertyId && <p className="text-red-500 text-xs mt-1">{errors.propertyId}</p>}
          </div>

          {/* الوحدة - مفلترة حسب العقار */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">الوحدة</label>
            <select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              disabled={!form.propertyId}
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none disabled:bg-slate-50 disabled:text-slate-400 ${
                errors.unit ? 'border-red-500' : 'border-slate-200 focus:border-blue-600'
              }`}
            >
              <option value="">
                {form.propertyId ? 'اختر الوحدة' : 'اختر العقار أولاً'}
              </option>
              {availableUnits.map((u) => (
                <option key={u._id} value={u._id}>
                  شقة {u.unitNumber} - الدور {u.floor}
                </option>
              ))}
            </select>
            {errors.unit && <p className="text-red-500 text-xs mt-1">{errors.unit}</p>}
          </div>

          {/* المستأجر */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">المستأجر</label>
            <select
              value={form.tenant}
              onChange={(e) => setForm({ ...form, tenant: e.target.value })}
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none ${
                errors.tenant ? 'border-red-500' : 'border-slate-200 focus:border-blue-600'
              }`}
            >
              <option value="">اختر المستأجر</option>
              {tenants.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
            {errors.tenant && <p className="text-red-500 text-xs mt-1">{errors.tenant}</p>}
          </div>

          {/* الإيجار الشهري + مبلغ التأمين */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">الإيجار الشهري</label>
              <input
                type="number"
                min="0"
                value={form.monthlyRent}
                onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none ${
                  errors.monthlyRent ? 'border-red-500' : 'border-slate-200 focus:border-blue-600'
                }`}
                placeholder="0"
              />
              {errors.monthlyRent && <p className="text-red-500 text-xs mt-1">{errors.monthlyRent}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">مبلغ التأمين</label>
              <input
                type="number"
                min="0"
                value={form.securityDeposit}
                onChange={(e) => setForm({ ...form, securityDeposit: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none ${
                  errors.securityDeposit ? 'border-red-500' : 'border-slate-200 focus:border-blue-600'
                }`}
                placeholder="0"
              />
              {errors.securityDeposit && <p className="text-red-500 text-xs mt-1">{errors.securityDeposit}</p>}
            </div>
          </div>

          {/* تاريخ البداية والنهاية */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">تاريخ البداية</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none ${
                  errors.startDate ? 'border-red-500' : 'border-slate-200 focus:border-blue-600'
                }`}
              />
              {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">تاريخ النهاية</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none ${
                  errors.endDate ? 'border-red-500' : 'border-slate-200 focus:border-blue-600'
                }`}
              />
              {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* حالة العقد - تظهر فقط عند التعديل */}
          {isEditing && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">حالة العقد</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-600"
              >
                {CONTRACT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-medium text-sm"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-sm"
            >
              {saving ? 'جاري الحفظ...' : isEditing ? 'حفظ التعديلات' : 'إضافة العقد'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===================== Delete Confirmation Modal =====================
function DeleteConfirmModal({ contract, onCancel, onConfirm, deleting }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-30 p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl p-5">
        <h3 className="font-bold text-slate-800 mb-2">تأكيد الحذف</h3>
        <p className="text-sm text-slate-500 mb-5">
          هل أنت متأكد من حذف عقد "{contract.tenant?.name}" الخاص بشقة {contract.unit?.unitNumber}؟ لا يمكن التراجع عن هذا الإجراء.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-medium text-sm"
          >
            إلغاء
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-bold text-sm"
          >
            {deleting ? 'جاري الحذف...' : 'حذف'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===================== Contracts Table (Desktop) =====================
function ContractsTable({ contracts, onEdit, onDelete }) {
  return (
    <div className="hidden lg:block bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-slate-500 text-right">
            <th className="py-3 px-5 font-semibold">العقار</th>
            <th className="py-3 px-5 font-semibold">الوحدة</th>
            <th className="py-3 px-5 font-semibold">الدور</th>
            <th className="py-3 px-5 font-semibold">المستأجر</th>
            <th className="py-3 px-5 font-semibold">الإيجار الشهري</th>
            <th className="py-3 px-5 font-semibold">مبلغ التأمين</th>
            <th className="py-3 px-5 font-semibold">تاريخ البداية</th>
            <th className="py-3 px-5 font-semibold">تاريخ النهاية</th>
            <th className="py-3 px-5 font-semibold">الحالة</th>
            <th className="py-3 px-5 font-semibold">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((c) => (
            <tr key={c._id} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="py-3 px-5 font-medium text-slate-800">{c.unit?.property?.name || '—'}</td>
              <td className="py-3 px-5 text-slate-600">{c.unit?.unitNumber ?? '—'}</td>
              <td className="py-3 px-5 text-slate-600">{c.unit?.floor ?? '—'}</td>
              <td className="py-3 px-5 text-slate-600">{c.tenant?.name || '—'}</td>
              <td className="py-3 px-5 text-slate-600">{Number(c.monthlyRent).toLocaleString('ar-EG')} ج.م</td>
              <td className="py-3 px-5 text-slate-600">{Number(c.securityDeposit).toLocaleString('ar-EG')} ج.م</td>
              <td className="py-3 px-5 text-slate-600">{c.startDate?.substring(0, 10)}</td>
              <td className="py-3 px-5 text-slate-600">{c.endDate?.substring(0, 10)}</td>
              <td className="py-3 px-5">
                <span className={`text-xs px-2 py-1 rounded-full ${statusColor(c.status)}`}>{c.status}</span>
              </td>
              <td className="py-3 px-5">
                <div className="flex gap-2">
                  <button onClick={() => onEdit(c)} className="text-blue-600 hover:underline font-medium">تعديل</button>
                  <button onClick={() => onDelete(c)} className="text-red-600 hover:underline font-medium">حذف</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ===================== Contracts Cards (Mobile) =====================
function ContractsCards({ contracts, onEdit, onDelete }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3">
      {contracts.map((c) => (
        <div key={c._id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-slate-800">{c.unit?.property?.name || '—'}</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${statusColor(c.status)}`}>{c.status}</span>
          </div>
          <p className="text-sm text-slate-500 mb-1">🏠 شقة {c.unit?.unitNumber} - الدور {c.unit?.floor}</p>
          <p className="text-sm text-slate-500 mb-1">👤 {c.tenant?.name || '—'}</p>
          <p className="text-sm text-slate-500 mb-1">💰 إيجار: {Number(c.monthlyRent).toLocaleString('ar-EG')} ج.م</p>
          <p className="text-sm text-slate-500 mb-1">🔒 تأمين: {Number(c.securityDeposit).toLocaleString('ar-EG')} ج.م</p>
          <p className="text-sm text-slate-500 mb-3">
            📅 {c.startDate?.substring(0, 10)} → {c.endDate?.substring(0, 10)}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(c)}
              className="flex-1 text-sm font-medium text-blue-600 bg-blue-50 py-2 rounded-lg"
            >
              تعديل
            </button>
            <button
              onClick={() => onDelete(c)}
              className="flex-1 text-sm font-medium text-red-600 bg-red-50 py-2 rounded-lg"
            >
              حذف
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ===================== Main Page =====================
function Contracts() {
  const location = useLocation();

  const [contracts, setContracts] = useState([]);
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    try {
      const [contractsRes, propertiesRes, unitsRes, tenantsRes] = await Promise.all([
        axios.get(`${CONTRACTS_BASE}/get_contract`, { headers: authHeaders() }),
        axios.get(`${PROPERTIES_BASE}/getAll_properties`, { headers: authHeaders() }),
        axios.get(`${UNITS_BASE}/getAll_units`, { headers: authHeaders() }),
        axios.get(`${TENANTS_BASE}/getAll_tenants`, { headers: authHeaders() }),
      ]);

      const contractsList = contractsRes.data?.data || contractsRes.data?.contracts || contractsRes.data || [];
      const propertiesList = propertiesRes.data?.data || propertiesRes.data?.properties || propertiesRes.data || [];
      const unitsList = unitsRes.data?.data || unitsRes.data?.units || unitsRes.data || [];
      const tenantsList = tenantsRes.data?.data || tenantsRes.data?.tenants || tenantsRes.data || [];

      setContracts(Array.isArray(contractsList) ? contractsList : []);
      setProperties(Array.isArray(propertiesList) ? propertiesList : []);
      setUnits(Array.isArray(unitsList) ? unitsList : []);
      setTenants(Array.isArray(tenantsList) ? tenantsList : []);

      // 🔍 مؤقت للتشخيص - شيله بعد ما نحل المشكلة
      console.log('Properties response:', propertiesList);
    } catch (err) {
      setError('تعذر تحميل البيانات، تأكد إن السيرفر شغال');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const openAddModal = () => {
    setEditingContract(null);
    setShowFormModal(true);
  };

  const openEditModal = (contract) => {
    setEditingContract(contract);
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingContract(null);
  };

  const handleSaved = (message) => {
    closeFormModal();
    fetchAllData();
    showToast(message, 'success');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`${CONTRACTS_BASE}/delete_contract/${deleteTarget._id}`, {
        headers: authHeaders(),
      });
      setDeleteTarget(null);
      fetchAllData();
      showToast('تم حذف العقد بنجاح', 'success');
    } catch (err) {
      showToast('تعذر حذف العقد، حاول مرة أخرى', 'error');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-slate-100 flex font-sans">
      <Sidebar currentPath={location.pathname} />

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
              <ContractsCards contracts={contracts} onEdit={openEditModal} onDelete={setDeleteTarget} />
              <ContractsTable contracts={contracts} onEdit={openEditModal} onDelete={setDeleteTarget} />
            </>
          )}
        </div>
      </main>

      <BottomNav currentPath={location.pathname} />

      {showFormModal && (
        <ContractFormModal
          properties={properties}
          units={units}
          tenants={tenants}
          initialData={editingContract}
          onClose={closeFormModal}
          onSaved={handleSaved}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          contract={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          deleting={deleting}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

export default Contracts;
