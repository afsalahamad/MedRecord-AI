import React from "react";

export default function LabTestPicker({ testNames, value, onChange }) {
  return (
    <div>
      <input
        list="lab-test-options"
        placeholder="Type or pick a lab test (e.g. Creatinine)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: 280 }}
      />
      <datalist id="lab-test-options">
        {testNames.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>

      {testNames.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {testNames.map((t) => (
            <span
              key={t}
              className={`chip ${value === t ? "chip--active" : ""}`}
              onClick={() => onChange(t)}
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
