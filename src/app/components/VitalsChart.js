"use client";

import { useState, useMemo } from "react";
import { evaluateVital } from "../lib/healthStandards";
import { TrendingUp, Calendar, Info } from "lucide-react";

export default function VitalsChart({ data = [], vitalType = "Blood Pressure" }) {
  const [rangeFilter, setRangeFilter] = useState("30d"); // "7d", "30d", "all"
  const [activePoint, setActivePoint] = useState(null);

  // Filter and sort items chronologically
  const chartItems = useMemo(() => {
    const isBP = vitalType.toLowerCase().includes("pressure") || vitalType === "BP";

    let filtered = data.filter((item) => {
      const itType = (item.type || "").toLowerCase();
      const targetType = vitalType.toLowerCase();
      if (isBP) return itType.includes("pressure") || itType === "bp";
      return itType.includes(targetType);
    });

    // Apply time range filter
    const now = new Date();
    if (rangeFilter === "7d") {
      const cut = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((d) => new Date(d.recorded_at) >= cut);
    } else if (rangeFilter === "30d") {
      const cut = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((d) => new Date(d.recorded_at) >= cut);
    }

    // Sort oldest to newest
    const sorted = [...filtered].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );

    // Map parsed values
    return sorted.map((item) => {
      const evaluation = evaluateVital(item.type, item.value);
      if (isBP) {
        const parts = String(item.value).split(/[/|\-\s]+/).map((p) => parseFloat(p)).filter((n) => !isNaN(n));
        return {
          ...item,
          systolic: parts[0] || null,
          diastolic: parts[1] || null,
          evaluation,
        };
      } else {
        const match = String(item.value).match(/[-+]?[0-9]*\.?[0-9]+/);
        const val = match ? parseFloat(match[0]) : null;
        return {
          ...item,
          numericVal: val,
          evaluation,
        };
      }
    }).filter((item) => isBP ? (item.systolic !== null && item.diastolic !== null) : item.numericVal !== null);
  }, [data, vitalType, rangeFilter]);

  const isBP = vitalType.toLowerCase().includes("pressure") || vitalType === "BP";

  // Calculate stats
  const stats = useMemo(() => {
    if (chartItems.length === 0) return null;

    if (isBP) {
      const systolics = chartItems.map((c) => c.systolic);
      const diastolics = chartItems.map((c) => c.diastolic);
      const avgSys = Math.round(systolics.reduce((a, b) => a + b, 0) / systolics.length);
      const avgDia = Math.round(diastolics.reduce((a, b) => a + b, 0) / diastolics.length);
      const latest = chartItems[chartItems.length - 1];
      return {
        latest: `${latest.systolic}/${latest.diastolic}`,
        average: `${avgSys}/${avgDia}`,
        min: `${Math.min(...systolics)}/${Math.min(...diastolics)}`,
        max: `${Math.max(...systolics)}/${Math.max(...diastolics)}`,
        count: chartItems.length,
      };
    } else {
      const vals = chartItems.map((c) => c.numericVal);
      const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
      const latest = chartItems[chartItems.length - 1];
      const unit = latest.evaluation?.parsed?.unit || "";
      return {
        latest: `${latest.numericVal} ${unit}`.trim(),
        average: `${avg} ${unit}`.trim(),
        min: `${Math.min(...vals)} ${unit}`.trim(),
        max: `${Math.max(...vals)} ${unit}`.trim(),
        count: chartItems.length,
      };
    }
  }, [chartItems, isBP]);

  // Chart coordinate computation
  const svgWidth = 500;
  const svgHeight = 200;
  const padTop = 20;
  const padBottom = 30;
  const padLeft = 35;
  const padRight = 20;

  const innerWidth = svgWidth - padLeft - padRight;
  const innerHeight = svgHeight - padTop - padBottom;

  const pointsData = useMemo(() => {
    if (chartItems.length === 0) return null;

    let minVal, maxVal;
    if (isBP) {
      const allVals = chartItems.flatMap((c) => [c.systolic, c.diastolic]);
      minVal = Math.floor(Math.min(...allVals, 60) / 10) * 10;
      maxVal = Math.ceil(Math.max(...allVals, 140) / 10) * 10;
    } else {
      const vals = chartItems.map((c) => c.numericVal);
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const pad = (max - min) * 0.15 || 5;
      minVal = Math.floor(min - pad);
      maxVal = Math.ceil(max + pad);
    }

    const valSpan = maxVal - minVal || 1;

    const coords = chartItems.map((item, idx) => {
      const x = chartItems.length === 1
        ? padLeft + innerWidth / 2
        : padLeft + (idx / (chartItems.length - 1)) * innerWidth;

      if (isBP) {
        const ySys = padTop + innerHeight - ((item.systolic - minVal) / valSpan) * innerHeight;
        const yDia = padTop + innerHeight - ((item.diastolic - minVal) / valSpan) * innerHeight;
        return { ...item, x, ySys, yDia };
      } else {
        const y = padTop + innerHeight - ((item.numericVal - minVal) / valSpan) * innerHeight;
        return { ...item, x, y };
      }
    });

    return { coords, minVal, maxVal };
  }, [chartItems, isBP, innerWidth, innerHeight]);

  function formatDate(dStr) {
    if (!dStr) return "";
    const d = new Date(dStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div className="bg-white rounded-2xl p-4 border mb-6" style={{ borderColor: "var(--color-border)" }}>
      {/* Header & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} color="var(--color-primary)" />
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            {vitalType} Trend
          </h3>
        </div>
        <div className="flex rounded-lg p-0.5 border" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
          {["7d", "30d", "all"].map((r) => (
            <button
              key={r}
              onClick={() => setRangeFilter(r)}
              className="px-2 py-0.5 text-[11px] font-medium rounded-md transition-colors"
              style={{
                backgroundColor: rangeFilter === r ? "white" : "transparent",
                color: rangeFilter === r ? "var(--color-primary)" : "var(--color-text-muted)",
                boxShadow: rangeFilter === r ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
              }}
            >
              {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="bg-slate-50/70 rounded-xl p-2 border" style={{ borderColor: "var(--color-border)" }}>
            <span className="text-[10px] text-gray-500">Latest</span>
            <p className="text-xs font-semibold text-gray-900 mt-0.5">{stats.latest}</p>
          </div>
          <div className="bg-slate-50/70 rounded-xl p-2 border" style={{ borderColor: "var(--color-border)" }}>
            <span className="text-[10px] text-gray-500">Average</span>
            <p className="text-xs font-semibold text-gray-900 mt-0.5">{stats.average}</p>
          </div>
          <div className="bg-slate-50/70 rounded-xl p-2 border" style={{ borderColor: "var(--color-border)" }}>
            <span className="text-[10px] text-gray-500">Min</span>
            <p className="text-xs font-semibold text-gray-900 mt-0.5">{stats.min}</p>
          </div>
          <div className="bg-slate-50/70 rounded-xl p-2 border" style={{ borderColor: "var(--color-border)" }}>
            <span className="text-[10px] text-gray-500">Max</span>
            <p className="text-xs font-semibold text-gray-900 mt-0.5">{stats.max}</p>
          </div>
        </div>
      )}

      {/* Chart Canvas */}
      {chartItems.length < 2 ? (
        <div className="py-8 text-center rounded-xl bg-slate-50/50 border border-dashed" style={{ borderColor: "var(--color-border)" }}>
          <Info size={24} className="mx-auto text-gray-400 mb-1" />
          <p className="text-xs font-medium" style={{ color: "var(--color-text)" }}>
            {chartItems.length === 0 ? "No readings in this date range" : "Need at least 2 readings to draw a trend"}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Log readings consistently to track clinical changes over time.
          </p>
        </div>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-44 overflow-visible select-none"
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.01" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.33, 0.66, 1].map((ratio, i) => {
              const y = padTop + innerHeight * ratio;
              const val = Math.round(pointsData.maxVal - ratio * (pointsData.maxVal - pointsData.minVal));
              return (
                <g key={i}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={svgWidth - padRight}
                    y2={y}
                    stroke="#E2E8F0"
                    strokeDasharray="3 3"
                    strokeWidth="0.8"
                  />
                  <text
                    x={padLeft - 6}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="9"
                    fill="#94A3B8"
                    className="font-mono"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Blood Pressure Dual Lines */}
            {isBP && pointsData && (
              <>
                {/* Systolic Line */}
                <path
                  d={pointsData.coords.reduce(
                    (acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x} ${pt.ySys}`,
                    ""
                  )}
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Diastolic Line */}
                <path
                  d={pointsData.coords.reduce(
                    (acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x} ${pt.yDia}`,
                    ""
                  )}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data point circles */}
                {pointsData.coords.map((pt, i) => (
                  <g key={i} className="cursor-pointer" onClick={() => setActivePoint(pt)}>
                    <circle
                      cx={pt.x}
                      cy={pt.ySys}
                      r={activePoint?.id === pt.id ? 5 : 3.5}
                      fill="var(--color-primary)"
                      stroke="white"
                      strokeWidth="2"
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.yDia}
                      r={activePoint?.id === pt.id ? 5 : 3.5}
                      fill="#3B82F6"
                      stroke="white"
                      strokeWidth="2"
                    />
                    {/* Date label on X axis */}
                    <text
                      x={pt.x}
                      y={svgHeight - 6}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#64748B"
                    >
                      {formatDate(pt.recorded_at)}
                    </text>
                  </g>
                ))}
              </>
            )}

            {/* Single Value Trend Lines (Weight, Glucose, Heart Rate, etc) */}
            {!isBP && pointsData && (
              <>
                {/* Area under curve */}
                <path
                  d={`
                    ${pointsData.coords.reduce((acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`, "")}
                    L ${pointsData.coords[pointsData.coords.length - 1].x} ${padTop + innerHeight}
                    L ${pointsData.coords[0].x} ${padTop + innerHeight}
                    Z
                  `}
                  fill="url(#areaGradient)"
                />
                {/* Line */}
                <path
                  d={pointsData.coords.reduce(
                    (acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`,
                    ""
                  )}
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Dots */}
                {pointsData.coords.map((pt, i) => (
                  <g key={i} className="cursor-pointer" onClick={() => setActivePoint(pt)}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={activePoint?.id === pt.id ? 5 : 3.5}
                      fill="var(--color-primary)"
                      stroke="white"
                      strokeWidth="2"
                    />
                    <text
                      x={pt.x}
                      y={svgHeight - 6}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#64748B"
                    >
                      {formatDate(pt.recorded_at)}
                    </text>
                  </g>
                ))}
              </>
            )}
          </svg>

          {/* Active tooltip popover */}
          {activePoint && (
            <div
              className="mt-2 p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all"
              style={{
                backgroundColor: activePoint.evaluation?.badgeBg || "#F8FAFC",
                borderColor: activePoint.evaluation?.borderColor || "var(--color-border)",
              }}
            >
              <div>
                <span className="font-semibold text-gray-900">
                  {activePoint.type}: {activePoint.value}
                </span>
                <span className="text-[10px] text-gray-500 ml-2">
                  ({formatDate(activePoint.recorded_at)})
                </span>
              </div>
              {activePoint.evaluation && (
                <span
                  className="px-2 py-0.5 rounded-md font-semibold text-[10px]"
                  style={{
                    backgroundColor: "white",
                    color: activePoint.evaluation.badgeText,
                    border: `1px solid ${activePoint.evaluation.borderColor}`,
                  }}
                >
                  {activePoint.evaluation.status}
                </span>
              )}
            </div>
          )}

          {/* Legend */}
          {isBP && (
            <div className="flex items-center justify-center gap-4 mt-2 text-[11px] text-gray-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
                <span>Systolic (Top)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Diastolic (Bottom)</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
