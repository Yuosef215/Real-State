import React, { useState, useEffect, useMemo } from "react";
import { Building2, DoorOpen, Users, CheckCircle2, AlertCircle } from "lucide-react";
import api from "../lib/api";

const MONTHS_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const MOCK_DASHBOARD = {
  totalProperties: 8,
  totalUnits: 42,
  occupiedUnits: 35,
  availableUnits: 7,
  totalTenants: 35,
  paidThisMonth: 27,
  unpaidThisMonth: 8,
  totalCollected: 245000,
  totalRequired: 310000,
};

function formatEGP(n) {
  return new Intl.NumberFormat("ar-EG").format(n) + " ج.م";
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card stat-card">
      <div className="stat-icon">
        <Icon size={20} color="var(--ink)" />
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState(MOCK_DASHBOARD);

  useEffect(() => {
    // فعّل هذا لما يكون الباك اند شغال:
    // api.get(`/dashboard?month=${month + 1}&year=${year}`).then((res) => setData(res.data));
  }, [month, year]);

  const rate = useMemo(
    () => Math.round((data.totalCollected / data.totalRequired) * 100),
    [data]
  );

  const ringColor = rate >= 80 ? "var(--good)" : rate >= 50 ? "var(--gold)" : "var(--alert)";

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">لوحة التحكم</div>
          <div className="page-subtitle">نظرة عامة على العقارات، العقود، والتحصيل</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select className="input" style={{ width: "auto" }} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTHS_AR.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select className="input" style={{ width: "auto" }} value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <div className="dashboard-hero">
        <div className="card" style={{ padding: 22, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div className="stat-label" style={{ alignSelf: "flex-start", marginBottom: 10 }}>نسبة التحصيل هذا الشهر</div>
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: `conic-gradient(${ringColor} ${rate * 3.6}deg, rgba(22,48,43,0.07) 0deg)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 122,
                height: 122,
                borderRadius: "50%",
                background: "var(--surface)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 800 }}>{rate}%</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)" }}>محصّل</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 22, marginTop: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{formatEGP(data.totalCollected)}</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)" }}>محصّل</div>
            </div>
            <div style={{ width: 1, background: "var(--line)" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{formatEGP(data.totalRequired)}</div>
              <div style={{ fontSize: 11.5, color: "var(--muted)" }}>المستحق</div>
            </div>
          </div>
        </div>

        <div className="stat-grid">
          <StatCard icon={Building2} label="إجمالي العقارات" value={data.totalProperties} />
          <StatCard icon={DoorOpen} label="إجمالي الوحدات" value={data.totalUnits} />
          <StatCard icon={Users} label="إجمالي المستأجرين" value={data.totalTenants} />
          <StatCard icon={CheckCircle2} label="وحدات مشغولة" value={data.occupiedUnits} />
          <StatCard icon={DoorOpen} label="وحدات متاحة" value={data.availableUnits} />
          <StatCard icon={CheckCircle2} label="دفعوا هذا الشهر" value={data.paidThisMonth} />
          <StatCard icon={AlertCircle} label="لم يدفعوا بعد" value={data.unpaidThisMonth} />
        </div>
      </div>

      <style>{`
        .dashboard-hero {
          display: grid;
          grid-template-columns: minmax(240px, 340px) 1fr;
          gap: 18px;
        }
        @media (max-width: 760px) {
          .dashboard-hero { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
