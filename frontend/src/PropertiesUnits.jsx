import React, { useState } from "react";
import {
  Building2,
  Plus,
  ChevronDown,
  ChevronUp,
  DoorOpen,
  X,
  Search,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Mock data — matches: GET /properties, GET /properties/:propertyId/units
// Replace with real fetch calls once the API layer (axios instance) is wired.
// ---------------------------------------------------------------------------
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
  {
    _id: "p3",
    name: "عمارة مدينة نصر",
    address: "شارع مكرم عبيد، مدينة نصر، القاهرة",
    units: [
      { _id: "u6", unitNumber: "21", floor: 4, status: "Rented" },
      { _id: "u7", unitNumber: "5", floor: 1, status: "Available" },
      { _id: "u8", unitNumber: "6", floor: 1, status: "Available" },
    ],
  },
];

const T = {
  bg: "#F6F4EF",
  surface: "#FFFFFF",
  ink: "#16302B",
  muted: "#7A7568",
  line: "#E7E2D6",
  good: "#2E7D5B",
  gold: "#BE8A3D",
  fontDisplay: "'Cairo', sans-serif",
  fontBody: "'Tajawal', sans-serif",
};

function StatusBadge({ status }) {
  const isAvailable = status === "Available";
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 20,
        background: isAvailable ? "rgba(46,125,91,0.1)" : "rgba(190,138,61,0.12)",
        color: isAvailable ? T.good : T.gold,
      }}
    >
      {isAvailable ? "متاحة" : "مستأجرة"}
    </span>
  );
}

function UnitCard({ unit }) {
  return (
    <div
      style={{
        background: T.bg,
        border: `1px solid ${T.line}`,
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
        <div style={{ fontSize: 12, color: T.muted }}>الدور {unit.floor}</div>
      </div>
      <StatusBadge status={unit.status} />
    </div>
  );
}

function AddUnitModal({ propertyName, onClose, onSave }) {
  const [form, setForm] = useState({ unitNumber: "", floor: "" });
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(22,48,43,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.surface,
          borderRadius: 16,
          padding: 22,
          width: 340,
          maxWidth: "100%",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: T.fontDisplay, fontWeight: 700, fontSize: 16 }}>
            إضافة وحدة — {propertyName}
          </div>
          <X size={18} style={{ cursor: "pointer", color: T.muted }} onClick={onClose} />
        </div>

        <label style={labelStyle}>رقم الوحدة</label>
        <input
          style={inputStyle}
          value={form.unitNumber}
          onChange={(e) => setForm({ ...form, unitNumber: e.target.value })}
          placeholder="مثال: 14"
        />

        <label style={labelStyle}>الدور</label>
        <input
          style={inputStyle}
          type="number"
          value={form.floor}
          onChange={(e) => setForm({ ...form, floor: e.target.value })}
          placeholder="مثال: 3"
        />

        <button
          style={{
            width: "100%",
            marginTop: 8,
            background: T.ink,
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "10px 0",
            fontFamily: T.fontBody,
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
          onClick={() => {
            if (!form.unitNumber || !form.floor) return;
            onSave(form);
          }}
        >
          حفظ الوحدة
        </button>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 12.5,
  color: T.muted,
  marginBottom: 5,
  marginTop: 10,
};

const inputStyle = {
  width: "100%",
  border: `1px solid ${T.line}`,
  borderRadius: 10,
  padding: "9px 12px",
  fontFamily: T.fontBody,
  fontSize: 14,
  color: T.ink,
  outline: "none",
  boxSizing: "border-box",
};

export default function PropertiesUnits() {
  const [properties, setProperties] = useState(MOCK_PROPERTIES);
  const [expanded, setExpanded] = useState({ p1: true });
  const [search, setSearch] = useState("");
  const [modalFor, setModalFor] = useState(null); // property id currently adding a unit to

  const filtered = properties.filter(
    (p) => p.name.includes(search) || p.address.includes(search)
  );

  function toggle(id) {
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  }

  function handleAddUnit(propertyId, unitData) {
    setProperties((prev) =>
      prev.map((p) =>
        p._id === propertyId
          ? {
              ...p,
              units: [
                ...p.units,
                { _id: `u${Date.now()}`, unitNumber: unitData.unitNumber, floor: Number(unitData.floor), status: "Available" },
              ],
            }
          : p
      )
    );
    setModalFor(null);
  }

  return (
    <div
      dir="rtl"
      style={{
        background: T.bg,
        minHeight: "100vh",
        padding: "28px 24px 60px",
        fontFamily: T.fontBody,
        color: T.ink,
        boxSizing: "border-box",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@600;700;800&family=Tajawal:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #B3AFA3; }
      `}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 22,
        }}
      >
        <div>
          <div style={{ fontFamily: T.fontDisplay, fontSize: 26, fontWeight: 800 }}>
            العقارات والوحدات
          </div>
          <div style={{ color: T.muted, fontSize: 13.5, marginTop: 2 }}>
            {properties.length} عقار — {properties.reduce((s, p) => s + p.units.length, 0)} وحدة إجمالًا
          </div>
        </div>

        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: T.ink,
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "10px 16px",
            fontFamily: T.fontBody,
            fontWeight: 700,
            fontSize: 13.5,
            cursor: "pointer",
          }}
        >
          <Plus size={16} />
          إضافة عقار
        </button>
      </div>

      {/* Search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: T.surface,
          border: `1px solid ${T.line}`,
          borderRadius: 10,
          padding: "8px 12px",
          marginBottom: 20,
          maxWidth: 380,
        }}
      >
        <Search size={16} color={T.muted} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث باسم العقار أو العنوان"
          style={{ border: "none", outline: "none", fontFamily: T.fontBody, fontSize: 13.5, width: "100%", background: "transparent" }}
        />
      </div>

      {/* Property list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filtered.map((property) => {
          const occupied = property.units.filter((u) => u.status === "Rented").length;
          const isOpen = !!expanded[property._id];
          return (
            <div
              key={property._id}
              style={{
                background: T.surface,
                border: `1px solid ${T.line}`,
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              <div
                onClick={() => toggle(property._id)}
                style={{
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "rgba(22,48,43,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Building2 size={19} color={T.ink} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{property.name}</div>
                    <div style={{ fontSize: 12.5, color: T.muted }}>{property.address}</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ fontSize: 12.5, color: T.muted, display: "flex", alignItems: "center", gap: 5 }}>
                    <DoorOpen size={15} />
                    {occupied}/{property.units.length} مؤجرة
                  </div>
                  {isOpen ? <ChevronUp size={18} color={T.muted} /> : <ChevronDown size={18} color={T.muted} />}
                </div>
              </div>

              {isOpen && (
                <div style={{ padding: "0 18px 18px", borderTop: `1px solid ${T.line}` }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                      gap: 10,
                      marginTop: 14,
                    }}
                  >
                    {property.units.map((unit) => (
                      <UnitCard key={unit._id} unit={unit} />
                    ))}
                    <button
                      onClick={() => setModalFor(property._id)}
                      style={{
                        border: `1px dashed ${T.line}`,
                        borderRadius: 10,
                        background: "transparent",
                        color: T.muted,
                        fontFamily: T.fontBody,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 5,
                        minHeight: 58,
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
          <div style={{ textAlign: "center", color: T.muted, padding: "40px 0", fontSize: 14 }}>
            لا يوجد عقارات مطابقة للبحث
          </div>
        )}
      </div>

      {modalFor && (
        <AddUnitModal
          propertyName={properties.find((p) => p._id === modalFor)?.name}
          onClose={() => setModalFor(null)}
          onSave={(data) => handleAddUnit(modalFor, data)}
        />
      )}
    </div>
  );
}
