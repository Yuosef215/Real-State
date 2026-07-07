import React, { useState } from "react";
import { Building2, Plus, ChevronDown, ChevronUp, DoorOpen, Search } from "lucide-react";
import Modal from "../components/ui/Modal";
import Badge from "../components/ui/Badge";

const MOCK_PROPERTIES = [
  {
    _id: "p1",
    name: "برج النيل",
    address: "شارع النيل، المعادي، القاهرة",
    units: [
      { _id: "u1", unitNumber: "12", floor: 3, status: "Rented" },
      { _id: "u2", unitNumber: "4", floor: 1, status: "Rented" },
      { _id: "u3", unitNumber: "9", floor: 2, status: "Available" },
    ],
  },
  {
    _id: "p2",
    name: "عمارة المعادي",
    address: "شارع 9، المعادي، القاهرة",
    units: [
      { _id: "u4", unitNumber: "1", floor: 0, status: "Rented" },
      { _id: "u5", unitNumber: "3", floor: 1, status: "Available" },
    ],
  },
];

function UnitCard({ unit }) {
  return (
    <div
      style={{
        background: "var(--bg)",
        border: "1px solid var(--line)",
        borderRadius: 10,
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      }}
    >
      <div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>وحدة {unit.unitNumber}</div>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>الدور {unit.floor}</div>
      </div>
      <Badge tone={unit.status === "Available" ? "good" : "warn"}>
        {unit.status === "Available" ? "متاحة" : "مستأجرة"}
      </Badge>
    </div>
  );
}

function AddPropertyModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: "", address: "" });
  return (
    <Modal title="إضافة عقار جديد" onClose={onClose}>
      <div className="input-group">
        <label className="label">اسم العقار</label>
        <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثال: برج النيل" />
      </div>
      <div className="input-group">
        <label className="label">العنوان</label>
        <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="الشارع، الحي، المدينة" />
      </div>
      <button
        className="btn btn-primary btn-block"
        style={{ marginTop: 16 }}
        onClick={() => form.name && form.address && onSave(form)}
      >
        حفظ العقار
      </button>
    </Modal>
  );
}

function AddUnitModal({ propertyName, onClose, onSave }) {
  const [form, setForm] = useState({ unitNumber: "", floor: "" });
  return (
    <Modal title={`إضافة وحدة — ${propertyName}`} onClose={onClose}>
      <div className="input-group">
        <label className="label">رقم الوحدة</label>
        <input className="input" value={form.unitNumber} onChange={(e) => setForm({ ...form, unitNumber: e.target.value })} placeholder="مثال: 14" />
      </div>
      <div className="input-group">
        <label className="label">الدور</label>
        <input className="input" type="number" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} placeholder="مثال: 3" />
      </div>
      <button
        className="btn btn-primary btn-block"
        style={{ marginTop: 16 }}
        onClick={() => form.unitNumber && form.floor && onSave(form)}
      >
        حفظ الوحدة
      </button>
    </Modal>
  );
}

export default function PropertiesUnits() {
  const [properties, setProperties] = useState(MOCK_PROPERTIES);
  const [expanded, setExpanded] = useState({ p1: true });
  const [search, setSearch] = useState("");
  const [unitModalFor, setUnitModalFor] = useState(null);
  const [showAddProperty, setShowAddProperty] = useState(false);

  const filtered = properties.filter((p) => p.name.includes(search) || p.address.includes(search));

  function toggle(id) {
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  }

  function handleAddProperty(data) {
    setProperties((prev) => [...prev, { _id: `p${Date.now()}`, name: data.name, address: data.address, units: [] }]);
    setShowAddProperty(false);
  }

  function handleAddUnit(propertyId, unitData) {
    setProperties((prev) =>
      prev.map((p) =>
        p._id === propertyId
          ? { ...p, units: [...p.units, { _id: `u${Date.now()}`, unitNumber: unitData.unitNumber, floor: Number(unitData.floor), status: "Available" }] }
          : p
      )
    );
    setUnitModalFor(null);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">العقارات والوحدات</div>
          <div className="page-subtitle">
            {properties.length} عقار — {properties.reduce((s, p) => s + p.units.length, 0)} وحدة إجمالًا
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddProperty(true)}>
          <Plus size={16} />
          إضافة عقار
        </button>
      </div>

      <div className="search-box">
        <Search size={16} color="var(--muted)" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث باسم العقار أو العنوان" />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filtered.map((property) => {
          const occupied = property.units.filter((u) => u.status === "Rented").length;
          const isOpen = !!expanded[property._id];
          return (
            <div key={property._id} className="card">
              <div
                onClick={() => toggle(property._id)}
                style={{ padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: 10, flexWrap: "wrap" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <div className="stat-icon">
                    <Building2 size={19} color="var(--ink)" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{property.name}</div>
                    <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{property.address}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ fontSize: 12.5, color: "var(--muted)", display: "flex", alignItems: "center", gap: 5 }}>
                    <DoorOpen size={15} />
                    {occupied}/{property.units.length} مؤجرة
                  </div>
                  {isOpen ? <ChevronUp size={18} color="var(--muted)" /> : <ChevronDown size={18} color="var(--muted)" />}
                </div>
              </div>

              {isOpen && (
                <div style={{ padding: "0 18px 18px", borderTop: "1px solid var(--line)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10, marginTop: 14 }}>
                    {property.units.map((unit) => <UnitCard key={unit._id} unit={unit} />)}
                    <button
                      onClick={() => setUnitModalFor(property._id)}
                      style={{
                        border: "1px dashed var(--line)", borderRadius: 10, background: "transparent", color: "var(--muted)",
                        fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, minHeight: 58,
                      }}
                    >
                      <Plus size={15} />
                      إضافة وحدة
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--muted)", padding: "40px 0", fontSize: 14 }}>
            لا يوجد عقارات مطابقة للبحث
          </div>
        )}
      </div>

      {unitModalFor && (
        <AddUnitModal
          propertyName={properties.find((p) => p._id === unitModalFor)?.name}
          onClose={() => setUnitModalFor(null)}
          onSave={(data) => handleAddUnit(unitModalFor, data)}
        />
      )}
      {showAddProperty && <AddPropertyModal onClose={() => setShowAddProperty(false)} onSave={handleAddProperty} />}
    </div>
  );
}
