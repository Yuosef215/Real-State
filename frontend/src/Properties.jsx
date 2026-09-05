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
const PROPERTIES_BASE = `${API_BASE_URL}/properties`;
const size = 25
const NAV_ITEMS = [
  { label: 'الرئيسية', path: '/dashboard', icon: <FaHome size={size} color='black'/> },
  { label: 'العقارات', path: '/properties', icon: <MdRealEstateAgent size={size} color='black'/> },
  { label: 'الوحدات', path: '/units', icon:  <PiBuildingApartmentFill size={size} color='black'/>},
  { label: 'المستأجرين', path: '/tenants', icon: <IoIosPeople size={size} color='black'/> },
  { label: 'العقود', path: '/contracts', icon: <LiaFileContractSolid size={size} color='black'/>},
  { label: 'الدفع', path: '/payments', icon: <MdPayments size={size} color='black'/>},
];

const PROPERTY_TYPES = ['سكني', 'تجاري', 'إداري'];

// ====== أسماء الشهور لعرضها في فلتر تفاصيل العقار ======
const MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

// آخر 12 شهر (من الشهر الحالي ورجوع للخلف) عشان المستخدم يختار منهم
function buildPeriodOptions() {
  const options = [];
  const today = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    options.push({ month: date.getMonth() + 1, year: date.getFullYear() });
  }
  return options;
}

function currentPeriod() {
  const today = new Date();
  return { month: today.getMonth() + 1, year: today.getFullYear() };
}

const EMPTY_FORM = {
  name: '',
  address: '',
  unitsCount: '',
  description: '',
};

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function Properties() {
  const location = useLocation();

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

  // ====== تفاصيل العقار (الوحدات + حالة السداد لشهر معين) ======
  const [detailsTarget, setDetailsTarget] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [unitsFilter, setUnitsFilter] = useState('all');

  // الشهر/السنة اللي بنعرض بياناتهم دلوقتي (الافتراضي هو الشهر الحالي)
  const [period, setPeriod] = useState(currentPeriod);
  const periodOptions = buildPeriodOptions();

  // البيانات بتتجاب من السيرفر مفلترة بالشهر، مش بنجيب كل الشهور ونفلتر في المتصفح
  useEffect(() => {
    if (!detailsTarget) return;

    let cancelled = false;

    const fetchDetails = async () => {
      setDetailsLoading(true);
      setDetailsError('');
      try {
        const res = await axios.get(
          `${PROPERTIES_BASE}/property-details/${detailsTarget._id || detailsTarget.id}`,
          {
            headers: authHeaders(),
            params: { month: period.month, year: period.year },
          }
        );
        if (!cancelled) setDetails(res.data?.data || null);
      } catch (err) {
        if (!cancelled) {
          setDetails(null);
          setDetailsError('تعذر تحميل تفاصيل العقار، حاول مرة أخرى');
        }
      } finally {
        if (!cancelled) setDetailsLoading(false);
      }
    };

    fetchDetails();

    return () => {
      cancelled = true;
    };
  }, [detailsTarget, period]);

  const openDetails = (property) => {
    setDetails(null);
    setDetailsError('');
    setUnitsFilter('all');
    setPeriod(currentPeriod());
    setDetailsTarget(property);
  };

  const closeDetails = () => {
    setDetailsTarget(null);
    setDetails(null);
    setDetailsError('');
    setUnitsFilter('all');
    setPeriod(currentPeriod());
  };

  // فلترة الوحدات جوا مودال التفاصيل
  const visibleUnits = (details?.units || []).filter((u) => {
    if (unitsFilter === 'available') return u.status === 'متاحه';
    if (unitsFilter === 'rented') return u.status === 'مستأجره';
    if (unitsFilter === 'paid') return u.paymentStatus === 'مدفوع';
    if (unitsFilter === 'unpaid')
      return u.paymentStatus === 'غير مدفوع' || u.paymentStatus === 'مدفوع جزئياً';
    return true;
  });

  // لون البادچ حسب حالة سداد الشهر الحالي
  const paymentBadgeColor = (status) => {
    if (status === 'مدفوع') return 'bg-green-50 text-green-600';
    if (status === 'مدفوع جزئياً') return 'bg-amber-50 text-amber-600';
    if (status === 'غير مدفوع') return 'bg-red-50 text-red-600';
    return 'bg-slate-100 text-slate-500';
  };

  const fetchProperties = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${PROPERTIES_BASE}/getAll_properties`, {
        headers: authHeaders(),
      });
      const list = res.data?.data || res.data?.properties || res.data || [];
      setProperties(Array.isArray(list) ? list : []);
    } catch (err) {
      setError('تعذر تحميل بيانات العقارات، تأكد إن السيرفر شغال');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (property) => {
    setEditingId(property._id || property.id);
    setForm({
      name: property.name || '',
      address: property.address || '',
      type: property.type || 'سكني',
      unitsCount: property.totalUnits || '',
      description: property.description || '',
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
    if (!form.name.trim()) errs.name = 'اسم العقار مطلوب';
    if (!form.address.trim()) errs.address = 'العنوان مطلوب';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    const payload = {
  name: form.name.trim(),
  address: form.address.trim(),
  totalUnits: Number(form.unitsCount),
  description: form.description.trim(),
};

    try {
      if (editingId) {
        await axios.put(`${PROPERTIES_BASE}/update_property/${editingId}`, payload, {
          headers: authHeaders(),
        });
      } else {
        await axios.post(`${PROPERTIES_BASE}/create_property`, payload, {
          headers: authHeaders(),
        });
      }
      closeModal();
      fetchProperties();
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
      await axios.delete(`${PROPERTIES_BASE}/delete_property/${deleteTarget._id || deleteTarget.id}`, {
        headers: authHeaders(),
      });
      setDeleteTarget(null);
      fetchProperties();
    } catch (err) {
      setError('تعذر حذف العقار، حاول مرة أخرى');
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
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <h2 className="text-lg font-bold text-slate-800">العقارات</h2>
          <button
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span>
            <span className="hidden sm:inline">إضافة عقار</span>
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

          {!loading && !error && properties.length === 0 && (
            <div className="bg-white rounded-2xl p-10 text-center text-slate-400 border border-slate-100">
              لا توجد عقارات مضافة بعد
            </div>
          )}

          {!loading && !error && properties.length > 0 && (
            <>
              {/* ===== عرض كروت في الموبايل ===== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3">
                {properties.map((p) => (
                  <div
                    key={p._id || p.id}
                    onClick={() => openDetails(p)}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 cursor-pointer hover:shadow-md hover:border-blue-200 transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-slate-800">{p.name}</h3>
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">{p.type}</span>
                    </div>
                    <p className="text-sm text-slate-500 mb-1">📍 {p.address}</p>
                    <p className="text-sm text-slate-500 mb-1">عدد الوحدات: {p.totalUnits}</p>
                    <p className="text-xs text-blue-600 font-medium mb-3">اضغط لعرض تفاصيل الوحدات</p>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openDetails(p); }}
                        className="flex-1 text-sm font-medium text-slate-700 bg-slate-100 py-2 rounded-lg"
                      >
                        تفاصيل
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditModal(p); }}
                        className="flex-1 text-sm font-medium text-blue-600 bg-blue-50 py-2 rounded-lg"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }}
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
                      <th className="py-3 px-5 font-semibold">اسم العقار</th>
                      <th className="py-3 px-5 font-semibold">العنوان</th>
                      <th className="py-3 px-5 font-semibold">عدد الوحدات</th>
                      <th className="py-3 px-5 font-semibold">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((p) => (
                      <tr
                        key={p._id || p.id}
                        onClick={() => openDetails(p)}
                        className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                      >
                        <td className="py-3 px-5 font-medium text-slate-800">{p.name}</td>
                        <td className="py-3 px-5 text-slate-600">{p.address}</td>
                  
                        <td className="py-3 px-5 text-slate-600">{p.totalUnits}</td>
                        <td className="py-3 px-5">
                          <div className="flex gap-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); openDetails(p); }}
                              className="text-slate-700 hover:underline font-medium"
                            >
                              تفاصيل
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); openEditModal(p); }}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              تعديل
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }}
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

      {/* ===== Modal: تفاصيل العقار (الوحدات + حالة السداد) ===== */}
      {detailsTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-30 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-5xl sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto">

            <div className="p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-800 truncate">{detailsTarget.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">📍 {detailsTarget.address}</p>
                </div>
                <button onClick={closeDetails} className="text-slate-400 text-xl leading-none shrink-0">✕</button>
              </div>

              {/* ===== فلتر الشهر ===== */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <label className="text-xs font-semibold text-slate-600">عرض بيانات شهر:</label>
                <select
                  value={`${period.year}-${period.month}`}
                  onChange={(e) => {
                    const [y, m] = e.target.value.split('-');
                    setPeriod({ month: Number(m), year: Number(y) });
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-600 bg-white"
                >
                  {periodOptions.map((opt) => (
                    <option key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>
                      {MONTH_NAMES[opt.month - 1]} {opt.year}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setPeriod(currentPeriod())}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  الشهر الحالي
                </button>

                {details && !details.isCurrentMonth && (
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
                    بيانات شهر سابق
                  </span>
                )}
              </div>
            </div>

            <div className="p-5">
              {detailsLoading && (
                <div className="flex items-center justify-center py-16">
                  <span className="w-8 h-8 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin"></span>
                </div>
              )}

              {!detailsLoading && detailsError && (
                <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4 text-sm">
                  {detailsError}
                </div>
              )}

              {!detailsLoading && !detailsError && details && (
                <>
                  {/* ===== ملخص أرقام العقار ===== */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                      <p className="text-xs text-slate-500 mb-1">إجمالي الوحدات</p>
                      <p className="text-xl font-bold text-slate-800">{details.summary.totalUnits}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                      <p className="text-xs text-green-700 mb-1">وحدات متاحة</p>
                      <p className="text-xl font-bold text-green-700">{details.summary.availableUnits}</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                      <p className="text-xs text-amber-700 mb-1">وحدات مؤجرة</p>
                      <p className="text-xl font-bold text-amber-700">{details.summary.rentedUnits}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                      <p className="text-xs text-blue-700 mb-1">
                        سداد {MONTH_NAMES[details.month - 1]} {details.year}
                      </p>
                      <p className="text-sm font-bold text-blue-700">
                        {details.summary.paidUnits} مدفوع ·{' '}
                        {details.summary.partiallyPaidUnits} جزئي ·{' '}
                        {details.summary.unpaidUnits} غير مدفوع
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                    <div className="bg-white rounded-xl p-3 border border-slate-200">
                      <p className="text-xs text-slate-500 mb-1">
                        الإيجار المتوقع في {MONTH_NAMES[details.month - 1]}
                      </p>
                      <p className="text-lg font-bold text-slate-800">
                        {details.summary.expectedMonthlyRent.toLocaleString('ar-EG')} ج.م
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-green-200">
                      <p className="text-xs text-slate-500 mb-1">
                        المحصّل في {MONTH_NAMES[details.month - 1]}
                      </p>
                      <p className="text-lg font-bold text-green-700">
                        {details.summary.collectedThisMonth.toLocaleString('ar-EG')} ج.م
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-red-200">
                      <p className="text-xs text-slate-500 mb-1">
                        المتبقي في {MONTH_NAMES[details.month - 1]}
                      </p>
                      <p className="text-lg font-bold text-red-600">
                        {details.summary.remainingThisMonth.toLocaleString('ar-EG')} ج.م
                      </p>
                    </div>
                  </div>

                  {/* ===== فلاتر الوحدات ===== */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {[
                      { key: 'all', label: `الكل (${details.summary.totalUnits})` },
                      { key: 'available', label: `متاحة (${details.summary.availableUnits})` },
                      { key: 'rented', label: `مؤجرة (${details.summary.rentedUnits})` },
                      { key: 'paid', label: `دفعت ${MONTH_NAMES[details.month - 1]} (${details.summary.paidUnits})` },
                      {
                        key: 'unpaid',
                        label: `لم تسدد (${details.summary.unpaidUnits + details.summary.partiallyPaidUnits})`,
                      },
                    ].map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setUnitsFilter(f.key)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                          unitsFilter === f.key
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {visibleUnits.length === 0 && (
                    <div className="bg-slate-50 rounded-xl p-8 text-center text-slate-400 text-sm">
                      لا توجد وحدات مطابقة
                    </div>
                  )}

                  {/* ===== كروت الوحدات (موبايل) ===== */}
                  {visibleUnits.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3">
                      {visibleUnits.map((u) => (
                        <div key={u._id} className="bg-white rounded-2xl p-4 border border-slate-200">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-bold text-slate-800">
                              شقة {u.unitNumber} - الدور {u.floor}
                            </h4>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                u.status === 'مستأجره'
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-green-50 text-green-600'
                              }`}
                            >
                              {u.status}
                            </span>
                          </div>

                          {u.tenant ? (
                            <>
                              <p className="text-sm text-slate-600 mb-1">👤 {u.tenant.name}</p>
                              <p className="text-sm text-slate-500 mb-1">📞 {u.tenant.phone}</p>
                              <p className="text-sm text-slate-500 mb-1">
                                الإيجار: {u.monthlyRent.toLocaleString('ar-EG')} ج.م
                              </p>
                              <p className="text-sm text-slate-500 mb-1">
                                المدفوع: {u.paidAmount.toLocaleString('ar-EG')} ج.م
                              </p>
                              <p
                                className={`text-sm font-semibold mb-2 ${
                                  u.remainingAmount > 0 ? 'text-red-600' : 'text-green-600'
                                }`}
                              >
                                المتبقي: {u.remainingAmount.toLocaleString('ar-EG')} ج.م
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-slate-400 mb-2">لا يوجد عقد نشط على الوحدة</p>
                          )}

                          <span
                            className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${paymentBadgeColor(
                              u.paymentStatus
                            )}`}
                          >
                            {u.paymentStatus}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ===== جدول الوحدات (ديسكتوب) ===== */}
                  {visibleUnits.length > 0 && (
                    <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 text-right">
                            <th className="py-3 px-4 font-semibold">الوحدة</th>
                            <th className="py-3 px-4 font-semibold">الدور</th>
                            <th className="py-3 px-4 font-semibold">الحالة</th>
                            <th className="py-3 px-4 font-semibold">المستأجر</th>
                            <th className="py-3 px-4 font-semibold">الإيجار الشهري</th>
                            <th className="py-3 px-4 font-semibold">المدفوع</th>
                            <th className="py-3 px-4 font-semibold">المتبقي</th>
                            <th className="py-3 px-4 font-semibold">حالة السداد</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleUnits.map((u) => (
                            <tr key={u._id} className="border-t border-slate-100 hover:bg-slate-50">
                              <td className="py-3 px-4 font-medium text-slate-800">شقة {u.unitNumber}</td>
                              <td className="py-3 px-4 text-slate-600">{u.floor}</td>
                              <td className="py-3 px-4">
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    u.status === 'مستأجره'
                                      ? 'bg-amber-50 text-amber-600'
                                      : 'bg-green-50 text-green-600'
                                  }`}
                                >
                                  {u.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-600">
                                {u.tenant ? (
                                  <>
                                    <span className="font-medium text-slate-800">{u.tenant.name}</span>
                                    <span className="block text-xs text-slate-400">{u.tenant.phone}</span>
                                  </>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="py-3 px-4 text-slate-600">
                                {u.monthlyRent ? `${u.monthlyRent.toLocaleString('ar-EG')} ج.م` : '—'}
                              </td>
                              <td className="py-3 px-4 text-green-700 font-medium">
                                {u.status === 'مستأجره' ? `${u.paidAmount.toLocaleString('ar-EG')} ج.م` : '—'}
                              </td>
                              <td
                                className={`py-3 px-4 font-medium ${
                                  u.remainingAmount > 0 ? 'text-red-600' : 'text-green-600'
                                }`}
                              >
                                {u.status === 'مستأجره'
                                  ? `${u.remainingAmount.toLocaleString('ar-EG')} ج.م`
                                  : '—'}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`text-xs font-semibold px-3 py-1 rounded-full ${paymentBadgeColor(
                                    u.paymentStatus
                                  )}`}
                                >
                                  {u.paymentStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal: إضافة / تعديل عقار ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-30 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-bold text-slate-800">{editingId ? 'تعديل العقار' : 'إضافة عقار جديد'}</h3>
              <button onClick={closeModal} className="text-slate-400 text-xl leading-none">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formErrors.general && (
                <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">
                  {formErrors.general}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">اسم العقار</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none ${
                    formErrors.name ? 'border-red-500' : 'border-slate-200 focus:border-blue-600'
                  }`}
                  placeholder="مثال: برج النخيل"
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">العنوان</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none ${
                    formErrors.address ? 'border-red-500' : 'border-slate-200 focus:border-blue-600'
                  }`}
                  placeholder="مثال: التجمع الخامس، القاهرة"
                />
                {formErrors.address && <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>}
              </div>



              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">الوصف</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-600 resize-none"
                  placeholder="وصف مختصر عن العقار (اختياري)"
                />
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
                  {saving ? 'جاري الحفظ...' : editingId ? 'حفظ التعديلات' : 'إضافة العقار'}
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
              هل أنت متأكد من حذف عقار "{deleteTarget.name}"؟ لا يمكن التراجع عن هذا الإجراء.
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

export default Properties;
