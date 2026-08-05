import React from "react";
import { TrendingUp, TrendingDown, Activity, AlertCircle, RefreshCw } from "lucide-react";
import LabTestPicker from "./LabTestPicker.jsx";
import TrendChart from "./TrendChart.jsx";
import Citation from "./Citation.jsx";

export default function TrendsTab({
  labTests,
  selectedTest,
  onSelectTest,
  trendData,
  onOpenSource
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Test Picker Header Bar */}
      <div className="chart-panel" style={{ padding: "16px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h3 className="chart-panel__title" style={{ margin: "0 0 6px", padding: 0, border: "none" }}>
              <TrendingUp size={18} /> Deterministic Lab Analytics & Regression Engine
            </h3>
            <div className="chart-panel__subtitle">
              Calculates statistical slope and percentage trajectory across all historical lab extractions.
            </div>
          </div>

          <LabTestPicker
            testNames={labTests.length > 0 ? labTests : ["Creatinine", "eGFR", "Potassium", "HbA1c"]}
            value={selectedTest}
            onChange={onSelectTest}
          />
        </div>
      </div>

      {/* Main Chart Card */}
      {!trendData ? (
        <div className="chart-panel" style={{ textAlign: "center", padding: "60px 20px" }}>
          <Activity size={36} style={{ color: "var(--accent-teal)", marginBottom: 12 }} />
          <h4 style={{ margin: "0 0 6px", fontSize: 16 }}>Select a Lab Test Above</h4>
          <p style={{ margin: 0, fontSize: 13, color: "var(--ink-soft)" }}>
            Pick a parameter like <strong>Creatinine</strong>, <strong>eGFR</strong>, or <strong>Potassium</strong> to plot the longitudinal trend curve.
          </p>
        </div>
      ) : (
        <div className="grid-2-1">
          {/* Recharts Visualizer */}
          <div className="chart-panel">
            <div className="chart-panel__header">
              <div>
                <h3 className="chart-panel__title">
                  {trendData.test_name} Longitudinal Trajectory
                </h3>
                <div className="chart-panel__subtitle">
                  Reference range: <span className="data-value">{trendData.reference_range?.[0]}–{trendData.reference_range?.[1]} {trendData.unit || "mg/dL"}</span>
                </div>
              </div>

              {trendData.trend?.pct_change != null && (
                <span
                  className={`flag-tab flag-tab--${
                    trendData.trend.pct_change > 0 ? "red" : "green"
                  }`}
                  style={{ fontSize: 13 }}
                >
                  {trendData.trend.pct_change > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {trendData.trend.pct_change > 0 ? `+${trendData.trend.pct_change}%` : `${trendData.trend.pct_change}%`}{" "}
                  {trendData.trend.direction?.includes("worsening") ? "(Worsening Trend)" : "(Improving)"}
                </span>
              )}
            </div>

            <TrendChart data={trendData} />

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--hairline)" }}>
              <h4 style={{ margin: "0 0 6px", fontSize: 13, color: "var(--accent-teal)" }}>
                AI Clinical Trend Explanation
              </h4>
              <p style={{ margin: 0, fontSize: 13.5, color: "var(--ink)", lineHeight: 1.6 }}>
                {trendData.explanation}
              </p>
            </div>
          </div>

          {/* Right Panel: Data Table & Sources */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="chart-panel">
              <h4 style={{ margin: "0 0 12px", fontSize: 14, color: "var(--accent-teal)" }}>
                Extracted Values History
              </h4>
              <table className="med-table">
                <thead>
                  <tr>
                    <th>Visit Date</th>
                    <th>Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {trendData.values?.map((val, idx) => {
                    const date = trendData.visit_dates?.[idx] || `Visit ${idx + 1}`;
                    const status = trendData.statuses?.[idx];
                    return (
                      <tr key={idx}>
                        <td className="data-value">{date}</td>
                        <td className="data-value" style={{ fontWeight: 600, color: status ? "var(--flag-red)" : "var(--ink)" }}>
                          {val} {trendData.unit}
                        </td>
                        <td>
                          {status ? (
                            <span className="flag-tab flag-tab--red" style={{ margin: 0, padding: "1px 6px", fontSize: 11 }}>
                              Out of Range
                            </span>
                          ) : (
                            <span className="flag-tab flag-tab--green" style={{ margin: 0, padding: "1px 6px", fontSize: 11 }}>
                              Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="chart-panel">
              <h4 style={{ margin: "0 0 10px", fontSize: 14, color: "var(--accent-teal)" }}>
                Document Provenance Sources
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {trendData.sources?.map((s, i) => (
                  <div key={i} style={{ fontSize: 12, background: "var(--bg-exam)", padding: 8, borderRadius: 4, border: "1px solid var(--hairline)" }}>
                    <div style={{ marginBottom: 4 }}>
                      <Citation documentId={s.document_id} snippet={s.snippet} filename={null} onOpen={onOpenSource} />
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink-soft)", fontStyle: "italic" }}>
                      "{s.snippet}"
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
