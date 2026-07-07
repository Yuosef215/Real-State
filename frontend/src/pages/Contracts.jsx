import React, { useState } from "react";
import { FileText, Plus, Search } from "lucide-react";
import Modal from "../components/ui/Modal";
import Badge from "../components/ui/Badge";

// const MOCK_TENANTS = [
//   { _id: "t1", name: "أحمد عبد الرازق" },
//   { _id: "t2", name: "منى الشريف" },
// ];

// const MOCK_AVAILABLE_UNITS = [
//   { _id: "u3", label: "برج النيل — وحدة 9", monthlyRent: 4500 },
//   { _id: "u5", label: "عمارة المعادي — وحدة 3", monthlyRent: 3800 },
// ];

// const MOCK_CONTRACTS = [
//   { _id: "c1", tenantName: "أحمد عبد الرازق", unitLabel: "برج النيل — وحدة 12", monthlyRent: 4500, startDate: "2026-01-01", endDate: "2026-12-31", status: "Active" },
//   { _id: "c2", tenantName: "منى الشريف", unitLabel: "عمارة المعادي — وحدة 1", monthlyRent: 3800, startDate: "2025-06-01", endDate: "2026-05-31", status: "Ended" },
// ];

function AddContractModal({ onClose, onSave }) {
  const [form, setForm] = useState({ tenantId: "", unitId: "", startDate: "", endDate: "" });
  const selectedUnit = MOCK_AVAILABLE_UNITS.find((u) => u._id === form.unitId);

  return (
    <Modal title="إنشاء عقد جديد" onClose={onClose}>
      <div className="input-group">
        <label className="label">المستأجر</label>
        <select className="input" value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })}>
          <option value="">اختر مستأجر</option>
          {MOCK_TENANTS.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
      </div>
      <div className="input-group">
        <label className="label">الوحدة (المتاحة فقط)</label>
        <select className="input" value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })}>
          <option value="">اختر وحدة</option>
          {MOCK_AVAILABLE_UNITS.map((u) => <option key={u._id} value={u._id}>{u.label}</option>)}
        </select>
      </div>
      {selectedUnit && (
        <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 6 }}>
          الإيجار الشهري: <strong style={{ color: "var(--ink)" }}>{selectedUnit.monthlyRent.toLocaleString("ar-EG")} ج.م</strong>
        </div>
      )}
      <div className="input-group">
        <label className="label">تاريخ البداية</label>
        <input className="input" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
      </div>
      <div className="input-group">
        <label className="label">تاريخ النهاية</label>
        <input className="input" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
      </div>
      <button
        className="btn btn-primary btn-block"
        style={{ marginTop: 16 }}
        onClick={() => {
          if (!form.tenantId || !form.unitId || !form.startDate || !form.endDate) return;
          if (form.endDate <= form.startDate) return; // تاريخ النهاية لازم يكون بعد البداية
          onSave(form, selectedUnit);
        }}
      >
        حفظ العقد
      </button>
    </Modal>
  );
}

export default function Contracts() {
  const [contracts, setContracts] = useState(MOCK_CONTRACTS);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = contracts.filter((c) => c.tenantName.includes(search) || c.unitLabel.includes(search));

  function handleAdd(form, unit) {
    const tenant = MOCK_TENANTS.find((t) => t._id === form.tenantId);
    setContracts((prev) => [
      ...prev,
      {
        _id: `c${Date.now()}`,
        tenantName: tenant.name,
        unitLabel: unit.label,
        monthlyRent: unit.monthlyRent,
        startDate: form.startDate,
        endDate: form.endDate,
        status: "Active",
      },
    ]);
    setShowAdd(false);
  }

  function handleEnd(id) {
    setContracts((prev) => prev.map((c) => (c._id === id ? { ...c, status: "Ended" } : c)));
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">العقود</div>
          <div className="page-subtitle">
            {contracts.filter((c) => c.status === "Active").length} عقد نشط من إجمالي {contracts.length}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} />
          عقد جديد
        </button>
      </div>

      <div className="search-box">
        <Search size={16} color="var(--muted)" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث باسم المستأجر أو الوحدة" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((c) => (
          <div key={c._id} className="card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <div className="stat-icon">
                <FileText size={18} color="var(--ink)" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{c.tenantName}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{c.unitLabel}</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                  {c.startDate} → {c.endDate}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>
                {c.monthlyRent.toLocaleString("ar-EG")} ج.م
              </div>
              <Badge tone={c.status === "Active" ? "good" : "warn"}>
                {c.status === "Active" ? "نشط" : "منتهي"}
              </Badge>
              {c.status === "Active" && (
                <button className="btn btn-outline" style={{ padding: "6px 12px", fontSize: 12.5 }} onClick={() => handleEnd(c._id)}>
                  إنهاء العقد
                </button>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--muted)", padding: "40px 0", fontSize: 14 }}>
            لا يوجد عقود مطابقة للبحث
          </div>
        )}
      </div>

      {showAdd && <AddContractModal onClose={() => setShowAdd(false)} onSave={handleAdd} />}
    </div>
  );
}
