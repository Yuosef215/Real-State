import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = "https://real-state-5h8r.onrender.com/api/v1";

const GET_REVENUES = `${API_BASE_URL}/revenues/get-all-revenues`;
const CREATE_REVENUE = `${API_BASE_URL}/revenues/create-revenues`;
const UPDATE_REVENUE = `${API_BASE_URL}/revenues/update-revenues`;
const DELETE_REVENUE = `${API_BASE_URL}/revenues/delete-revenues`;

function Revenues() {
  const [revenues, setRevenues] = useState([]);
  const [loading, setLoading] = useState(false);

  const [totalAmount, setTotalAmount] = useState(0);
  const [monthlyAmount, setMonthlyAmount] = useState(0);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    category: "",
    amount: "",
    revenuesDate: "",
  });

  // =========================
  // Get All Expenses
  // =========================

  const fetchRevenues = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await axios.get(GET_REVENUES, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      if (response.data.success) {
        setRevenues(response.data.data);
        setTotalAmount(response.data.totalAmount);
        setMonthlyAmount(response.data.monthlyAmount);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenues();
  }, []);

  // =========================
  // Add Expense
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      if (editingId) {
        await axios.put(`${UPDATE_REVENUE}/${editingId}`, form, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        await axios.post(CREATE_REVENUE, form, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      fetchRevenues();

      setShowModal(false);

      setEditingId(null);

      setForm({
        title: "",
        category: "",
        amount: "",
        revenuesDate: "",
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

      await axios.delete(`${DELETE_REVENUE}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchRevenues();
    } catch (error) {
      console.log(error);
    }
  };

  // =========================
  // Edit
  // =========================

  const handleEdit = (revenues) => {
    setEditingId(revenues._id);

    setForm({
      title: revenues.title,
      category: revenues.category,
      amount: revenues.amount,
      revenuesDate: revenues.revenuesDate?.slice(0, 10),
    });

    setShowModal(true);
  };

  // =========================
  // Search
  // =========================

  const filteredRevenues = revenues.filter((item) =>
  item.title.toLowerCase().includes(search.toLowerCase())
);

  return (
    <div className="p-6 bg-slate-100 min-h-screen">
      {/* Header */}

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">إدارة الإيرادات</h1>

        <button
          onClick={() => {
            setEditingId(null);

            setForm({
              title: "",
              category: "",
              amount: "",
              revenuesDate: "",
            });

            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl"
        >
          + إضافة ايراد
        </button>
      </div>

      {/* Cards */}

      <div className="grid md:grid-cols-3 gap-5 mb-6">
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-gray-500 mb-2">إجمالي الايرادات</h3>

          <h2 className="text-3xl font-bold text-red-600">
            {totalAmount} جنيه
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-gray-500 mb-2">ايردات الشهر</h3>

          <h2 className="text-3xl font-bold text-blue-600">
            {monthlyAmount} جنيه
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="text-gray-500 mb-2">عدد الايرادات</h3>

          <h2 className="text-3xl font-bold">{revenues.length}</h2>
        </div>
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
            {filteredRevenues.map((revenue) => (
              <tr key={revenue._id} className="text-center border-b">
                <td className="p-3">{revenue.title}</td>

                <td className="p-3">{revenue.category}</td>

                <td className="p-3">{revenue.amount} جنيه</td>

                <td className="p-3">
                  {new Date(revenue.revenuesDate).toLocaleDateString()}
                </td>

                <td className="p-3 flex justify-center gap-2">
                  <button
                    onClick={() => handleEdit(revenue)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-1 rounded-lg"
                  >
                    تعديل
                  </button>

                  <button
                    onClick={() => handleDelete(revenue._id)}
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
              {editingId ? "تعديل  ايراد" : "إضافة ايراد"}
            </h2>

            <input
              type="text"
              placeholder="اسم الايراد"
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
              value={form.revenuesDate}
              onChange={(e) =>
                setForm({
                  ...form,
                  revenuesDate: e.target.value,
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

export default Revenues;
