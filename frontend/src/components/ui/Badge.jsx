import React from "react";

export default function Badge({ tone = "good", children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
