import React, { useState } from "react";
import { Users, Plus, Search, Phone } from "lucide-react";
import Modal from "../components/ui/Modal";

const MOCK_TENANTS = [
  { _id: "t1", name: "أحمد عبد الرازق", phone: "01012345678", nationalId: "29001011234567" },
  { _id: "t2", name: "منى الشريف", phone: "01123456789", nationalId: "29102022345678" },
  { _id: "t3", name: "كريم فتحي", phone: "01234567890", nationalId: "28911033456789" },
];

function AddTenantModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: "", phone: "", nationalId: "" });
  return (
    <Modal title="إضافة مستأجر جديد" onClose={onClose}>
      <div className="input-group">
        <label className="label">الاسم</label>
        <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="الاسم بالكامل" />
      </div>
      <div className="input-group">
        <label className="label">رقم الهاتف</label>
        <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01xxxxxxxxx" />
      </div>
      <div className="input-group">
        <label className="label">الرقم القومي</label>
        <input className="input" value={form.nationalId} onChange={(e) => setForm({ ...form, nationalId: e.target.value })} placeholder="14 رقم" maxLength={14} />
      </div>
      <button
        className="btn btn-primary btn-block"
        style={{ marginTop: 16 }}
        onClick={() => form.name && form.phone && form.nationalId && onSave(form)}
      >
        حفظ المستأجر
      </button>
    </Modal>
  );
}

export default function Tenants() {
  const [tenants, setTenants] = useState(MOCK_TENANTS);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = tenants.filter((t) => t.name.includes(search) || t.phone.includes(search));

  function handleAdd(data) {
    setTenants((prev) => [...prev, { _id: `t${Date.now()}`, ...data }]);
    setShowAdd(false);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">المستأجرين</div>
          <div className="page-subtitle">{tenants.length} مستأجر مسجل</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} />
          إضافة مستأجر
        </button>
      </div>

      <div className="search-box">
        <Search size={16} color="var(--muted)" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث بالاسم أو رقم الهاتف" />
      </div>

      {/* Desktop: table. Mobile: stacked cards (handled via CSS below) */}
      <div className="card tenants-desktop">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>الاسم</th>
                <th>الهاتف</th>
                <th>الرقم القومي</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t._id}>
                  <td style={{ fontWeight: 600 }}>{t.name}</td>
                  <td style={{ color: "var(--muted)" }}>{t.phone}</td>
                  <td style={{ color: "var(--muted)" }}>{t.nationalId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="tenants-mobile" style={{ display: "none", flexDirection: "column", gap: 10 }}>
        {filtered.map((t) => (
          <div key={t._id} className="card" style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="stat-icon" style={{ width: 34, height: 34 }}>
                <Users size={16} color="var(--ink)" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}>
                  <Phone size={11} />
                  {t.phone}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", color: "var(--muted)", padding: "40px 0", fontSize: 14 }}>
          لا يوجد مستأجرين مطابقين للبحث
        </div>
      )}

      {showAdd && <AddTenantModal onClose={() => setShowAdd(false)} onSave={handleAdd} />}

      <style>{`
        @media (max-width: 640px) {
          .tenants-desktop { display: none; }
          .tenants-mobile { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
