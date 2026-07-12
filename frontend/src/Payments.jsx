import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaPrint } from "react-icons/fa6";
import { FaHome } from "react-icons/fa";
import { MdRealEstateAgent } from "react-icons/md";
import { PiBuildingApartmentFill } from "react-icons/pi";
import { IoIosPeople } from "react-icons/io";
import { LiaFileContractSolid } from "react-icons/lia";
import { MdPayments } from "react-icons/md";
import { FaMoneyBill } from "react-icons/fa";
import { FaCalendar } from "react-icons/fa";
import { FaCreditCard } from "react-icons/fa";

// ====== إعدادات الـ API ======
const API_BASE_URL = "https://real-state-5h8r.onrender.com/api/v1";
const PAYMENTS_BASE = `${API_BASE_URL}/payments`;
const CONTRACTS_BASE = `${API_BASE_URL}/contracts`;

// ====== اسم الشركة الظاهر على الوصل ======
const COMPANY_NAME = 'مؤسسه الشروق 3';

const size = 25;
const NAV_ITEMS = [
  { label: 'الرئيسية', path: '/dashboard', icon: <FaHome size={size} color='black'/> },
  { label: 'العقارات', path: '/properties', icon: <MdRealEstateAgent size={size} color='black'/> },
  { label: 'الوحدات', path: '/units', icon:  <PiBuildingApartmentFill size={size} color='black'/>},
  { label: 'المستأجرين', path: '/tenants', icon: <IoIosPeople size={size} color='black'/> },
  { label: 'العقود', path: '/contracts', icon: <LiaFileContractSolid size={size} color='black'/>},
  { label: 'الدفع', path: '/payments', icon: <MdPayments size={size} color='black'/>},
];

const PAYMENT_STATUSES = [
  { value: 'paid', label: 'مدفوع' },
  { value: 'pending', label: 'معلق' },
  { value: 'late', label: 'متأخر' },
];

function statusLabel(value) {
  return PAYMENT_STATUSES.find((s) => s.value === value)?.label || value;
}

function statusColor(value) {
  if (value === 'paid') return 'bg-green-50 text-green-600';
  if (value === 'late') return 'bg-red-50 text-red-600';
  return 'bg-amber-50 text-amber-600';
}

const EMPTY_FORM = {
  contractId: '',
  amount: '',
  paymentDate: '',
  status: 'pending',
};

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function Payments() {
  const location = useLocation();

  const [payments, setPayments] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // بيانات العقد/المستأجر/الوحدة بترجع populate جوا الدفعة نفسها
  const getContractInfo = (payment) => {
    const contract = payment.contract || contracts.find((c) => (c._id || c.id) === payment.contractId);
    return {
      tenantName: contract?.tenant?.name || '—',
      unitNumber: contract?.unit?.unitNumber ?? '—',
      propertyName: contract?.unit?.property?.name || '—',
      contractLabel: contract ? `عقد #${(contract._id || contract.id).toString().slice(-5)}` : '—',
    };
  };

  const printReceipt = (payment) => {
    const info = getContractInfo(payment);
    const receiptWindow = window.open('', '_blank', 'width=420,height=600');

    // المتبقي من المدة المتبقية بين تاريخ اليوم وتاريخ انتهاء العقد بي الشهر
    const today = new Date();
    const endDate = new Date(payment.contract.endDate);
    const remainingTime = endDate > today ? Math.ceil((endDate - today) / (1000 * 60 * 60 * 24 * 30)) : 0;

    const receiptHtml = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>وصل دفع</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; }
          body { padding: 24px; color: #1e293b; }
          .receipt { max-width: 360px; margin: 0 auto; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 24px; }
          .header { text-align: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px dashed #cbd5e1; }
          .header h1 { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
          .header p { font-size: 12px; color: #94a3b8; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13.5px; border-bottom: 1px solid #f1f5f9; }
          .row span:first-child { color: #64748b; }
          .row span:last-child { font-weight: 600; }
          .amount-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 14px; text-align: center; margin: 16px 0; }
          .amount-box p { font-size: 12px; color: #15803d; margin-bottom: 4px; }
          .amount-box h2 { font-size: 24px; color: #15803d; font-weight: 800; }
          .footer { text-align: center; margin-top: 20px; padding-top: 16px; border-top: 2px dashed #cbd5e1; font-size: 11px; color: #94a3b8; }
          @media print {
            body { padding: 0; }
            .receipt { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>${COMPANY_NAME}</h1>
            <p>وصل استلام دفعة إيجار</p>
          </div>

          <div class="row"><span>المستأجر</span><span>${info.tenantName}</span></div>
          <div class="row"><span>العقار</span><span>${info.propertyName}</span></div>
          <div class="row"><span>الوحدة</span><span>شقة ${info.unitNumber}</span></div>
          <div class="row"><span>تاريخ الدفع</span><span>${payment.paymentDate?.substring(0, 10) || '—'}</span></div>
          <div class="row"><span>تاريخ بداية العقد</span><span>${payment.contract.startDate?.substring(0, 10) || '—'}</span></div>
          <div class="row"><span>تاريخ انتهاء العقد</span><span>${payment.contract.endDate?.substring(0, 10) || '—'}</span></div>
          <div class="row"><span>المدة المتبقية</span><span>${remainingTime} شهر</span></div>
          <div class="row"><span>طريقة الدفع</span><span>${payment.paymentMethod || 'نقدي'}</span></div>

          <div class="amount-box">
            <p>المبلغ المدفوع</p>
            <h2>${payment.contract.monthlyRent} ج.م</h2>
          </div>

          <div class="footer">
            <p>شكراً لتعاملكم معنا</p>
          </div>
        </div>
      </body>
      </html>
    `;

    receiptWindow.document.write(receiptHtml);
    receiptWindow.document.close();
    receiptWindow.focus();
    receiptWindow.onload = () => {
      receiptWindow.print();
    };
  };

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [paymentsRes, contractsRes] = await Promise.all([
        axios.get(`${PAYMENTS_BASE}/all_payments`, { headers: authHeaders() }),
        axios.get(`${CONTRACTS_BASE}/get_contract`, { headers: authHeaders() }),
      ]);

      const paymentsList = paymentsRes.data?.data || paymentsRes.data?.payments || paymentsRes.data || [];
      const contractsList = contractsRes.data?.data || contractsRes.data?.contracts || contractsRes.data || [];

      setPayments(Array.isArray(paymentsList) ? paymentsList : []);
      setContracts(Array.isArray(contractsList) ? contractsList : []);
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

  const openEditModal = (payment) => {
    setEditingId(payment._id || payment.id);
    setForm({
      contractId: payment.contractId || payment.contract || '',
      amount: payment.amount ?? '',
      paymentDate: payment.paymentDate ? payment.paymentDate.substring(0, 10) : '',
      status: payment.status || 'pending',
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
    if (!form.contractId) errs.contractId = 'اختر العقد';
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'أدخل مبلغ صحيح';
    if (!form.paymentDate) errs.paymentDate = 'تاريخ الدفع مطلوب';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    const payload = {
    contract: form.contractId,
    amountPaid: Number(form.amount),
};

    try {
      if (editingId) {
        await axios.put(`${PAYMENTS_BASE}/payment/${editingId}`, payload, {
          headers: authHeaders(),
        });
      } else {
        await axios.post(`${PAYMENTS_BASE}/create_payment`, payload, {
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
      await axios.delete(`${PAYMENTS_BASE}/payment/${deleteTarget._id || deleteTarget.id}`, {
        headers: authHeaders(),
      });
      setDeleteTarget(null);
      fetchAll();
    } catch (err) {
      setError('تعذر حذف الدفعة، حاول مرة أخرى');
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
          <h2 className="text-lg font-bold text-slate-800">المدفوعات</h2>
          <button
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span>
            <span className="hidden sm:inline">إضافة دفعة</span>
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

          {!loading && !error && payments.length === 0 && (
            <div className="bg-white rounded-2xl p-10 text-center text-slate-400 border border-slate-100">
              لا توجد مدفوعات مسجلة بعد
            </div>
          )}

          {!loading && !error && payments.length > 0 && (
            <>
              {/* ===== عرض كروت في الموبايل ===== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-3">
                {payments.map((p) => {
                  const info = getContractInfo(p);
                  return (
                    <div key={p._id || p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-slate-800">{info.tenantName}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${statusColor(p.status)}`}>
                          {statusLabel(p.status)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mb-1"><FaHome color="blue" className="inline-block ml-1" /> {info.propertyName} - شقة {info.unitNumber}</p>
                      <p className="text-sm text-slate-500 mb-1"><FaMoneyBill color="green" className="inline-block ml-1" /> {p.contract.monthlyRent} ج.م</p>
                      <p className="text-sm text-slate-500 mb-1"><FaCalendar color="purple" className="inline-block ml-1" /> {p.paymentDate?.substring(0, 10)}</p>
                      <p className="text-sm text-slate-500 mb-3"><FaCreditCard color="orange" className="inline-block ml-1" /> {p.paymentMethod || 'نقدي'}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => printReceipt(p)}
                          className="flex-1 text-sm font-medium text-slate-600 bg-slate-100 py-2 rounded-lg flex items-center justify-center gap-1"
                        >
                          <FaPrint/> طباعة
                        </button>
                        <button
                          onClick={() => openEditModal(p)}
                          className="flex-1 text-sm font-medium text-blue-600 bg-blue-50 py-2 rounded-lg"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="flex-1 text-sm font-medium text-red-600 bg-red-50 py-2 rounded-lg"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ===== جدول في الديسكتوب ===== */}
              <div className="hidden lg:block bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-right">
                      <th className="py-3 px-5 font-semibold">المستأجر</th>
                      <th className="py-3 px-5 font-semibold">العقار / الوحدة</th>
                      <th className="py-3 px-5 font-semibold">المبلغ</th>
                      <th className="py-3 px-5 font-semibold">تاريخ الدفع</th>
                      <th className="py-3 px-5 font-semibold">طريقة الدفع</th>
                      <th className="py-3 px-5 font-semibold">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => {
                      const info = getContractInfo(p);
                      return (
                        <tr key={p._id || p.id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-5 font-medium text-slate-800">{info.tenantName}</td>
                          <td className="py-3 px-5 text-slate-600">{info.propertyName} - شقة {info.unitNumber}</td>
                          <td className="py-3 px-5 text-slate-600">{p.contract.monthlyRent} ج.م</td>
                          <td className="py-3 px-5 text-slate-600">{p.paymentDate?.substring(0, 10)}</td>
                          <td className="py-3 px-5 text-slate-600">{p.paymentMethod || 'نقدي'}</td>
                          <td className="py-3 px-5">
                            <div className="flex gap-3">
                              <button
                                onClick={() => printReceipt(p)}
                                className="text-slate-600 hover:underline font-medium"
                              >
                                <span><FaPrint /></span> طباعة
                              </button>
                              <button
                                onClick={() => openEditModal(p)}
                                className="text-blue-600 hover:underline font-medium"
                              >
                                تعديل
                              </button>
                              <button
                                onClick={() => setDeleteTarget(p)}
                                className="text-red-600 hover:underline font-medium"
                              >
                                حذف
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>

      {/* ===== Bottom Navigation (Mobile) ===== */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex items-center justify-around py-2 z-20 overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
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

      {/* ===== Modal: إضافة / تعديل دفعة ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-30 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-bold text-slate-800">{editingId ? 'تعديل الدفعة' : 'إضافة دفعة جديدة'}</h3>
              <button onClick={closeModal} className="text-slate-400 text-xl leading-none">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formErrors.general && (
                <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">
                  {formErrors.general}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">العقد</label>
                <select
                  value={form.contractId}
                  onChange={(e) => setForm({ ...form, contractId: e.target.value })}
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none ${
                    formErrors.contractId ? 'border-red-500' : 'border-slate-200 focus:border-blue-600'
                  }`}
                >
                  <option value="">اختر العقد</option>
                  
                  {contracts.map((c) => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      عقد {(c.tenant.name)} عقار {(c.unit.property.name)} - شقة {(c.unit.unitNumber)}
                    </option>
                  ))}
                </select>
                {formErrors.contractId && <p className="text-red-500 text-xs mt-1">{formErrors.contractId}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">المبلغ</label>
                  <input
                    type="number"
                    min="1"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none ${
                      formErrors.amount ? 'border-red-500' : 'border-slate-200 focus:border-blue-600'
                    }`}
                    placeholder="0"
                  />
                  {formErrors.amount && <p className="text-red-500 text-xs mt-1">{formErrors.amount}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">تاريخ الدفع</label>
                  <input
                    type="date"
                    value={form.paymentDate}
                    onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none ${
                      formErrors.paymentDate ? 'border-red-500' : 'border-slate-200 focus:border-blue-600'
                    }`}
                  />
                  {formErrors.paymentDate && <p className="text-red-500 text-xs mt-1">{formErrors.paymentDate}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">طريقة الدفع</label>
                <input
                  type="text"
                  value="نقدي"
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm bg-slate-50 text-slate-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">حالة الدفعة</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-600"
                >
                  {PAYMENT_STATUSES.map((s) => (
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
                  {saving ? 'جاري الحفظ...' : editingId ? 'حفظ التعديلات' : 'إضافة الدفعة'}
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
              هل أنت متأكد من حذف هذه الدفعة؟ لا يمكن التراجع عن هذا الإجراء.
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

export default Payments;
