import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import axios from "axios";

const API_BASE_URL = "https://real-state-5h8r.onrender.com/api/v1";

const GET_EXPENSES = `${API_BASE_URL}/expense/get-all-expense`;
const CREATE_EXPENSE = `${API_BASE_URL}/expense/create-expense`;
const UPDATE_EXPENSE = `${API_BASE_URL}/expense/update-expense`;
const DELETE_EXPENSE = `${API_BASE_URL}/expense/delete-expense`;

// ====== أسماء الشهور + قائمة آخر 12 شهر للفلتر ======
const MONTH_NAMES = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

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
  return { month: today.getMonth() + 1, year: today.getFullYear(), all: false };
}


function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);

  const [totalAmount, setTotalAmount] = useState(0);
  const [monthlyAmount, setMonthlyAmount] = useState(0);

  // ====== فلتر الشهر: الافتراضي الشهر الحالي والسيرفر بيرجع بياناته بس ======
  const [period, setPeriod] = useState(currentPeriod);
  const [periodAmount, setPeriodAmount] = useState(0);
  const periodOptions = buildPeriodOptions();

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    category: "",
    amount: "",
    expenseDate: "",
  });

  // =========================
  // Get All Expenses
  // =========================

  const fetchExpenses = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await axios.get(GET_EXPENSES, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
        params: period.all
          ? { all: true }
          : { month: period.month, year: period.year },
      });

      if (response.data.success) {
        setExpenses(response.data.data);
        setTotalAmount(response.data.totalAmount);
        setMonthlyAmount(response.data.monthlyAmount);
        setPeriodAmount(response.data.periodAmount ?? 0);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [period]);

  // =========================
  // Add Expense
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      if (editingId) {
        await axios.put(
          `${UPDATE_EXPENSE}/${editingId}`,
          form,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        await axios.post(
          CREATE_EXPENSE,
          form,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      // المصروف ممكن يكون بتاريخ شهر تاني، فبنروح للشهر بتاعه عشان ميختفيش
      if (period.all) {
        fetchExpenses();
      } else {
        const savedDate = form.expenseDate ? new Date(form.expenseDate) : new Date();
        setPeriod({
          month: savedDate.getMonth() + 1,
          year: savedDate.getFullYear(),
          all: false,
        });
      }

      setShowModal(false);

      setEditingId(null);

      setForm({
        title: "",
        category: "",
        amount: "",
        expenseDate: "",
      });
    } catch (error) {
      console.log(error);
    }
  };

  // =========================
  // Delete
  // =========================

  const handleDelete = async (id) => {
    if (!window.confirm("هل تريد حذف هذا المصروف؟")) return;

    try {
      const token = localStorage.getItem("token");

      await axios.delete(`${DELETE_EXPENSE}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchExpenses();
    } catch (error) {
      console.log(error);
    }
  };

  // =========================
  // Edit
  // =========================

  const handleEdit = (expense) => {
    setEditingId(expense._id);

    setForm({
      title: expense.title,
      category: expense.category,
      amount: expense.amount,
      expenseDate: expense.expenseDate?.slice(0, 10),
    });

    setShowModal(true);
  };

  // =========================
  // Search
  // =========================

  const filteredExpenses = expenses.filter((expense) =>
    expense.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
  <div className="p-6 bg-slate-100 min-h-screen">

    {/* Header */}

    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">

      <div className="flex items-center gap-3">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl font-semibold text-sm"
        >
          <FaArrowRight />
          الرئيسية
        </Link>

        <h1 className="text-3xl font-bold">
          إدارة المصروفات
        </h1>
      </div>

      <button
        onClick={() => {
          setEditingId(null);

          setForm({
            title: "",
            category: "",
            amount: "",
            expenseDate: "",
          });

          setShowModal(true);
        }}
        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl"
      >
        + إضافة مصروف
      </button>

    </div>

    {/* Cards */}

    <div className="grid md:grid-cols-3 gap-5 mb-6">

      <div className="bg-white rounded-xl shadow p-5">
        <h3 className="text-gray-500 mb-2">
          إجمالي المصروفات
        </h3>

        <h2 className="text-3xl font-bold text-red-600">
          {totalAmount} جنيه
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow p-5">
        <h3 className="text-gray-500 mb-2">
          {period.all
            ? "مصروفات كل الشهور"
            : `مصروفات ${MONTH_NAMES[period.month - 1]} ${period.year}`}
        </h3>

        <h2 className="text-3xl font-bold text-blue-600">
          {periodAmount} جنيه
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow p-5">
        <h3 className="text-gray-500 mb-2">
          {period.all ? "عدد المصروفات" : "عدد مصروفات الشهر"}
        </h3>

        <h2 className="text-3xl font-bold">
          {expenses.length}
        </h2>
      </div>

    </div>

      {/* ===== فلتر الشهر ===== */}

      <div className="flex flex-wrap items-center gap-2 mb-5 bg-white rounded-xl p-3 shadow">
        <label className="text-sm font-semibold text-slate-600">
          عرض شهر:
        </label>

        <select
          value={period.all ? "all" : `${period.year}-${period.month}`}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "all") {
              setPeriod({ ...currentPeriod(), all: true });
              return;
            }
            const [y, m] = value.split("-");
            setPeriod({ month: Number(m), year: Number(y), all: false });
          }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-600 bg-white"
        >
          {periodOptions.map((opt) => (
            <option
              key={`${opt.year}-${opt.month}`}
              value={`${opt.year}-${opt.month}`}
            >
              {MONTH_NAMES[opt.month - 1]} {opt.year}
            </option>
          ))}
          <option value="all">كل الشهور</option>
        </select>

        <button
          onClick={() => setPeriod(currentPeriod())}
          className="text-sm font-semibold px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          الشهر الحالي
        </button>

        {!period.all &&
          (period.month !== currentPeriod().month ||
            period.year !== currentPeriod().year) && (
            <span className="text-sm font-semibold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              بيانات شهر سابق
            </span>
          )}

        {loading && (
          <span className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></span>
        )}
      </div>


    {/* Search */}

    <input
      type="text"
      placeholder="بحث..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="w-full bg-white rounded-xl p-3 mb-5 outline-none"
    />

    {/* Table */}

    <div className="overflow-x-auto bg-white rounded-xl shadow">

      <table className="min-w-full">

        <thead className="bg-slate-200">

          <tr>

            <th className="p-3">تفاصيل</th>

            <th className="p-3">النوع</th>

            <th className="p-3">المبلغ</th>

            <th className="p-3">التاريخ</th>

            <th className="p-3">الإجراءات</th>

          </tr>

        </thead>

        <tbody>

          {filteredExpenses.map((expense) => (

            <tr
              key={expense._id}
              className="text-center border-b"
            >

              <td className="p-3">
                {expense.title}
              </td>

              <td className="p-3">
                {expense.category}
              </td>

              <td className="p-3">
                {expense.amount} جنيه
              </td>

              <td className="p-3">
                {new Date(expense.expenseDate).toLocaleDateString()}
              </td>

              <td className="p-3 flex justify-center gap-2">

                <button
                  onClick={() => handleEdit(expense)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-1 rounded-lg"
                >
                  تعديل
                </button>

                <button
                  onClick={() => handleDelete(expense._id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded-lg"
                >
                  حذف
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

    {/* Modal */}

    {showModal && (

      <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-6 w-[95%] md:w-[500px] space-y-4"
        >

          <h2 className="text-2xl font-bold">

            {editingId ? "تعديل مصروف" : "إضافة مصروف"}

          </h2>

          <input
            type="text"
            placeholder="اسم المصروف"
            value={form.title}
            onChange={(e) =>
              setForm({
                ...form,
                title: e.target.value,
              })
            }
            className="w-full border rounded-lg p-3"
          />

          <input
            type="text"
            placeholder="تفاصيل"
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value,
              })
            }
            className="w-full border rounded-lg p-3"
          />

          <input
            type="number"
            placeholder="المبلغ"
            value={form.amount}
            onChange={(e) =>
              setForm({
                ...form,
                amount: e.target.value,
              })
            }
            className="w-full border rounded-lg p-3"
          />

          <input
            type="date"
            value={form.expenseDate}
            onChange={(e) =>
              setForm({
                ...form,
                expenseDate: e.target.value,
              })
            }
            className="w-full border rounded-lg p-3"
          />

          <div className="flex justify-end gap-3">

            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="bg-gray-500 text-white px-5 py-2 rounded-lg"
            >
              إلغاء
            </button>

            <button
              type="submit"
              className="bg-blue-600 text-white px-5 py-2 rounded-lg"
            >
              حفظ
            </button>

          </div>

        </form>

      </div>

    )}

  </div>
);
}

export default Expenses;