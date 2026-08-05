import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
  Dot,
} from "recharts";

const STATUS_COLOR = {
  above_range: "var(--flag-red)",
  below_range: "var(--flag-amber)",
  null: "var(--flag-green)",
};

function StatusDot(props) {
  const { cx, cy, payload } = props;
  const color = STATUS_COLOR[payload.status] || STATUS_COLOR.null;
  return <Dot cx={cx} cy={cy} r={5} fill={color} stroke="var(--bg-chart)" strokeWidth={1.5} />;
}

export default function TrendChart({ data }) {
  const [refLow, refHigh] = data.reference_range || [null, null];

  const points = data.values.map((v, i) => ({
    visit: data.visit_dates?.[i] || `Visit ${i + 1}`,
    value: v,
    status: data.statuses?.[i] || null,
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={points} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--hairline)" strokeDasharray="3 3" />
          {refLow != null && refHigh != null && (
            <ReferenceArea y1={refLow} y2={refHigh} fill="var(--flag-green)" fillOpacity={0.08} strokeOpacity={0} />
          )}
          <XAxis dataKey="visit" tick={{ fontFamily: "var(--font-mono)", fontSize: 11 }} stroke="var(--ink-soft)" />
          <YAxis tick={{ fontFamily: "var(--font-mono)", fontSize: 11 }} stroke="var(--ink-soft)" />
          <Tooltip
            contentStyle={{ fontFamily: "var(--font-mono)", fontSize: 12, border: "1px solid var(--hairline)" }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--accent-teal)"
            strokeWidth={2}
            dot={<StatusDot />}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p style={{ fontSize: 12, color: "var(--ink-soft)" }}>
        Shaded band = reference range (<span className="data-value">{refLow}–{refHigh}</span>). Amber/red dots =
        out of range.
      </p>
    </div>
  );
}
