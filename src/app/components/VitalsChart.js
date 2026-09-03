"use client";

import { useState, useMemo } from "react";
import { evaluateVital } from "../lib/healthStandards";
import { TrendingUp, Calendar, Info, ChevronRight, Activity } from "lucide-react";

export default function VitalsChart({ data = [], vitalType = "Blood Pressure" }) {
  const [rangeFilter, setRangeFilter] = useState("30D"); // "All", "30D", "3M", "6M", "1Y"
  const [activePoint, setActivePoint] = useState(null);

  const isBP = vitalType.toLowerCase().includes("pressure") || vitalType === "BP";

  // Filter and sort items chronologically
  const chartItems = useMemo(() => {
    let filtered = data.filter((item) => {
      const itType = (item.type || "").toLowerCase();
      const targetType = vitalType.toLowerCase();
      if (isBP) return itType.includes("pressure") || itType === "bp";
      return itType.includes(targetType);
    });

    const now = new Date();
    if (rangeFilter === "30D") {
      const cut = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((d) => new Date(d.recorded_at) >= cut);
    } else if (rangeFilter === "3M") {
      const cut = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((d) => new Date(d.recorded_at) >= cut);
    } else if (rangeFilter === "6M") {
      const cut = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((d) => new Date(d.recorded_at) >= cut);
    } else if (rangeFilter === "1Y") {
      const cut = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((d) => new Date(d.recorded_at) >= cut);
    }

    const sorted = [...filtered].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );

    return sorted
      .map((item) => {
        const evaluation = evaluateVital(item.type, item.value);
        if (isBP) {
          const parts = String(item.value)
            .split(/[/|\-\s]+/)
            .map((p) => parseFloat(p))
            .filter((n) => !isNaN(n));
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
      })
      .filter((item) =>
        isBP
          ? item.systolic !== null && item.diastolic !== null
          : item.numericVal !== null
      );
  }, [data, vitalType, rangeFilter, isBP]);

  // Statistics Calculation
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
        unit: "mmHg",
        status: latest.evaluation?.status || "Normal",
        updatedAt: latest.recorded_at,
      };
    } else {
      const vals = chartItems.map((c) => c.numericVal);
      const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
      const latest = chartItems[chartItems.length - 1];
      const unit = latest.evaluation?.parsed?.unit || "";
      return {
        latest: `${latest.numericVal}`,
        average: `${avg}`,
        unit: unit || "units",
        status: latest.evaluation?.status || "Normal",
        updatedAt: latest.recorded_at,
      };
    }
  }, [chartItems, isBP]);

  // SVG Dimension Constants
  const svgWidth = 500;
  const svgHeight = 220;
  const padTop = 30;
  const padBottom = 35;
  const padLeft = 45;
  const padRight = 25;

  const innerWidth = svgWidth - padLeft - padRight;
  const innerHeight = svgHeight - padTop - padBottom;

  const pointsData = useMemo(() => {
    if (chartItems.length === 0) return null;

    let minVal, maxVal;
    if (isBP) {
      const allVals = chartItems.flatMap((c) => [c.systolic, c.diastolic]);
      minVal = Math.floor(Math.min(...allVals, 50) / 10) * 10;
      maxVal = Math.ceil(Math.max(...allVals, 150) / 10) * 10;
    } else {
      const vals = chartItems.map((c) => c.numericVal);
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const pad = (max - min) * 0.2 || 5;
      minVal = Math.floor(min - pad);
      maxVal = Math.ceil(max + pad);
    }

    const valSpan = maxVal - minVal || 1;

    const coords = chartItems.map((item, idx) => {
      const x =
        chartItems.length === 1
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

    // Reference Band: Normal Healthy Range
    let normalTopY, normalBottomY;
    if (isBP) {
      normalTopY = padTop + innerHeight - ((120 - minVal) / valSpan) * innerHeight;
      normalBottomY = padTop + innerHeight - ((80 - minVal) / valSpan) * innerHeight;
    } else if (vitalType.toLowerCase().includes("glucose")) {
      normalTopY = padTop + innerHeight - ((140 - minVal) / valSpan) * innerHeight;
      normalBottomY = padTop + innerHeight - ((70 - minVal) / valSpan) * innerHeight;
    } else if (vitalType.toLowerCase().includes("heart")) {
      normalTopY = padTop + innerHeight - ((100 - minVal) / valSpan) * innerHeight;
      normalBottomY = padTop + innerHeight - ((60 - minVal) / valSpan) * innerHeight;
    }

    return { coords, minVal, maxVal, normalTopY, normalBottomY };
  }, [chartItems, isBP, innerWidth, innerHeight, vitalType]);

  function formatDate(dStr) {
    if (!dStr) return "";
    const d = new Date(dStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div className="bg-gradient-to-br from-[#1E1B4B] via-[#2E1065] to-[#1E1B4B] text-white rounded-3xl p-5 shadow-xl shadow-indigo-950/30 border border-indigo-500/20 relative overflow-hidden mb-6">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-medium">
            <span>{vitalType} Detail</span>
            <Info size={13} className="text-indigo-400" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white mt-0.5">
            {stats ? stats.latest : "--"}{" "}
            <span className="text-xs font-semibold text-indigo-300 font-normal">
              {stats?.unit}
            </span>
          </h2>
          <p className="text-[11px] text-indigo-300/80 mt-0.5">
            Updated: {stats?.updatedAt ? formatDate(stats.updatedAt) : "No record"} • Measured in {stats?.unit || "standard units"}
          </p>
        </div>

        {/* Time Filters */}
        <div className="flex rounded-xl p-1 bg-white/10 backdrop-blur-md border border-white/10">
          {["All", "30D", "3M", "6M", "1Y"].map((r) => (
            <button
              key={r}
              onClick={() => setRangeFilter(r)}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all"
              style={{
                backgroundColor: rangeFilter === r ? "white" : "transparent",
                color: rangeFilter === r ? "#1E1B4B" : "#C7D2FE",
                boxShadow: rangeFilter === r ? "0 2px 6px rgba(0,0,0,0.2)" : "none",
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      {chartItems.length < 2 ? (
        <div className="py-12 text-center rounded-2xl bg-white/5 border border-dashed border-white/10 relative z-10">
          <Activity size={24} className="mx-auto text-indigo-300/60 mb-2" />
          <p className="text-xs font-bold text-white">Need at least 2 readings</p>
          <p className="text-[11px] text-indigo-300 mt-0.5">
            Log readings over time to view clinical trend curves.
          </p>
        </div>
      ) : (
        pointsData && (
          <div className="relative z-10">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-44 sm:h-52 overflow-visible"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Shaded Healthy Range Band */}
              {pointsData.normalTopY && pointsData.normalBottomY && (
                <g>
                  <rect
                    x={padLeft}
                    y={Math.min(pointsData.normalTopY, pointsData.normalBottomY)}
                    width={innerWidth}
                    height={Math.abs(pointsData.normalBottomY - pointsData.normalTopY)}
                    fill="rgba(56, 189, 248, 0.12)"
                    rx={6}
                  />
                  <line
                    x1={padLeft}
                    y1={Math.min(pointsData.normalTopY, pointsData.normalBottomY)}
                    x2={padLeft + innerWidth}
                    y2={Math.min(pointsData.normalTopY, pointsData.normalBottomY)}
                    stroke="#38BDF8"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                    opacity="0.4"
                  />
                  <line
                    x1={padLeft}
                    y1={Math.max(pointsData.normalTopY, pointsData.normalBottomY)}
                    x2={padLeft + innerWidth}
                    y2={Math.max(pointsData.normalTopY, pointsData.normalBottomY)}
                    stroke="#38BDF8"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                    opacity="0.4"
                  />
                </g>
              )}

              {/* Grid Reference Lines */}
              {[0, 0.5, 1].map((pct, i) => {
                const y = padTop + pct * innerHeight;
                const val = Math.round(pointsData.maxVal - pct * (pointsData.maxVal - pointsData.minVal));
                return (
                  <g key={i}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={padLeft + innerWidth}
                      y2={y}
                      stroke="rgba(255, 255, 255, 0.1)"
                      strokeWidth="1"
                    />
                    <text
                      x={padLeft - 8}
                      y={y + 3}
                      fill="#94A3B8"
                      fontSize="9"
                      textAnchor="end"
                      fontWeight="bold"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Non-BP Line and Area */}
              {!isBP && (
                <g>
                  {/* Area fill */}
                  <path
                    d={`
                      M ${pointsData.coords[0].x} ${padTop + innerHeight}
                      ${pointsData.coords.map((c) => `L ${c.x} ${c.y}`).join(" ")}
                      L ${pointsData.coords[pointsData.coords.length - 1].x} ${padTop + innerHeight}
                      Z
                    `}
                    fill="url(#chartGradient)"
                  />
                  {/* Main Line */}
                  <path
                    d={`M ${pointsData.coords.map((c) => `${c.x} ${c.y}`).join(" L ")}`}
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Points */}
                  {pointsData.coords.map((c, i) => (
                    <circle
                      key={i}
                      cx={c.x}
                      cy={c.y}
                      r="4.5"
                      fill="white"
                      stroke="#0284C7"
                      strokeWidth="2.5"
                      className="cursor-pointer transition-transform hover:scale-125"
                    />
                  ))}
                </g>
              )}

              {/* Blood Pressure Lines */}
              {isBP && (
                <g>
                  <path
                    d={`M ${pointsData.coords.map((c) => `${c.x} ${c.ySys}`).join(" L ")}`}
                    fill="none"
                    stroke="#F43F5E"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d={`M ${pointsData.coords.map((c) => `${c.x} ${c.yDia}`).join(" L ")}`}
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {pointsData.coords.map((c, i) => (
                    <g key={i}>
                      <circle cx={c.x} cy={c.ySys} r="4" fill="white" stroke="#F43F5E" strokeWidth="2" />
                      <circle cx={c.x} cy={c.yDia} r="4" fill="white" stroke="#38BDF8" strokeWidth="2" />
                    </g>
                  ))}
                </g>
              )}

              {/* X-axis Date Labels */}
              {pointsData.coords.map((c, i) => {
                // Show dates selectively to avoid clutter
                if (pointsData.coords.length > 5 && i % 2 !== 0 && i !== pointsData.coords.length - 1) return null;
                return (
                  <text
                    key={i}
                    x={c.x}
                    y={svgHeight - 10}
                    fill="#94A3B8"
                    fontSize="9"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    {formatDate(c.recorded_at)}
                  </text>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10 text-[11px] text-indigo-200">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-sky-400/20 border border-sky-400" />
                  Healthy target range
                </span>
                {isBP && (
                  <>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Systolic
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-sky-400" />
                      Diastolic
                    </span>
                  </>
                )}
              </div>
              <span className="text-[10px] text-indigo-300 font-semibold">
                {chartItems.length} readings analyzed
              </span>
            </div>
          </div>
        )
      )}
    </div>
  );
}
