/**
 * Rating History Chart Component
 * 
 * Pure SVG line chart showing Elo rating progression over confirmed matches.
 * Responsive, no external charting library.
 */

import { createSignal, Show, For } from "solid-js";
import type { RatingHistoryEntry } from "../services/player-profile";
import "./RatingChart.css";

// ============================================================================
// Types
// ============================================================================

interface RatingChartProps {
  data: RatingHistoryEntry[];
  width?: number;
  height?: number;
}

// ============================================================================
// Constants
// ============================================================================

const VIEW_BOX = "0 0 400 200";
const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };
const CHART_WIDTH = 400 - PADDING.left - PADDING.right;
const CHART_HEIGHT = 200 - PADDING.top - PADDING.bottom;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Formats a date for axis labels
 */
function formatDateLabel(date: Date): string {
  const month = date.toLocaleString("default", { month: "short" });
  const day = date.getDate();
  return `${month} ${day}`;
}

/**
 * Formats a full date for tooltip
 */
function formatDateFull(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ============================================================================
// Component
// ============================================================================

export function RatingChart(props: RatingChartProps) {
  const [hoveredIndex, setHoveredIndex] = createSignal<number | null>(null);

  // Calculate scales
  function getScales() {
    const data = props.data;
    if (data.length === 0) {
      return null;
    }

    // Rating scale (Y-axis) with 5% padding
    const ratings = data.map((d) => d.rating);
    const minRating = Math.min(...ratings);
    const maxRating = Math.max(...ratings);
    const ratingPadding = (maxRating - minRating) * 0.1 || 50;
    const yMin = Math.floor(minRating - ratingPadding);
    const yMax = Math.ceil(maxRating + ratingPadding);

    // Date scale (X-axis) - evenly distributed
    const xScale = (index: number) =>
      PADDING.left + (index / (data.length - 1 || 1)) * CHART_WIDTH;

    // Y scale
    const yScale = (rating: number) => {
      const normalized = (rating - yMin) / (yMax - yMin);
      return PADDING.top + CHART_HEIGHT - normalized * CHART_HEIGHT;
    };

    return { xScale, yScale, yMin, yMax };
  }

  // Generate path for line
  function getLinePath(): string {
    const scales = getScales();
    if (!scales) return "";

    const { xScale, yScale } = scales;
    const data = props.data;

    if (data.length === 1) {
      return "";
    }

    const points = data.map((d, i) => {
      const x = xScale(i);
      const y = yScale(d.rating);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    });

    return points.join(" ");
  }

  // Generate area path for gradient fill
  function getAreaPath(): string {
    const scales = getScales();
    if (!scales) return "";

    const { xScale, yScale } = scales;
    const data = props.data;

    if (data.length === 1) {
      return "";
    }

    const baseline = PADDING.top + CHART_HEIGHT;
    const points = data.map((d, i) => {
      const x = xScale(i);
      const y = yScale(d.rating);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    });

    // Close the path to form an area
    const lastX = xScale(data.length - 1);
    const firstX = xScale(0);

    return `${points.join(" ")} L ${lastX} ${baseline} L ${firstX} ${baseline} Z`;
  }

  // Get Y-axis tick values
  function getYTicks() {
    const scales = getScales();
    if (!scales) return [];

    const { yMin, yMax } = scales;
    const tickCount = 5;
    const step = (yMax - yMin) / (tickCount - 1);
    return Array.from({ length: tickCount }, (_, i) => Math.round(yMin + i * step));
  }

  // Get X-axis label positions (first, middle, last)
  function getXLabelPositions() {
    const data = props.data;
    if (data.length === 0) return [];

    if (data.length === 1) {
      return [{ index: 0, label: formatDateLabel(data[0].date) }];
    }

    if (data.length === 2) {
      return [
        { index: 0, label: formatDateLabel(data[0].date) },
        { index: 1, label: formatDateLabel(data[1].date) },
      ];
    }

    const midIndex = Math.floor(data.length / 2);
    return [
      { index: 0, label: formatDateLabel(data[0].date) },
      { index: midIndex, label: formatDateLabel(data[midIndex].date) },
      { index: data.length - 1, label: formatDateLabel(data[data.length - 1].date) },
    ];
  }

  // Render empty state
  function renderEmpty() {
    return (
      <div class="rating-chart-empty">
        <svg
          class="empty-icon"
          viewBox="0 0 24 24"
          width="40"
          height="40"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <path d="M3 3v18h18" />
          <path d="M7 16l4-4 4 4 5-5" />
        </svg>
        <p>No rating history yet</p>
        <span>Play matches to see your rating progression</span>
      </div>
    );
  }

  // Render chart
  function renderChart() {
    const scales = getScales();
    const data = props.data;

    if (!scales || data.length === 0) {
      return renderEmpty();
    }

    const { xScale, yScale } = scales;
    const yTicks = getYTicks();
    const xLabels = getXLabelPositions();
    const isSinglePoint = data.length === 1;

    return (
      <div class="rating-chart-wrapper">
        <svg
          class="rating-chart-svg"
          viewBox={VIEW_BOX}
          preserveAspectRatio="xMidYMid meet"
          aria-label="Rating history chart"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="var(--chart-line-color)" stop-opacity="0.2" />
              <stop offset="100%" stop-color="var(--chart-line-color)" stop-opacity="0.02" />
            </linearGradient>
          </defs>

          {/* Y-axis grid lines and labels */}
          <For each={yTicks}>
            {(tick) => (
              <>
                <line
                  class="grid-line"
                  x1={PADDING.left}
                  y1={yScale(tick)}
                  x2={PADDING.left + CHART_WIDTH}
                  y2={yScale(tick)}
                />
                <text
                  class="axis-label y-label"
                  x={PADDING.left - 8}
                  y={yScale(tick)}
                  text-anchor="end"
                  dominant-baseline="middle"
                >
                  {tick}
                </text>
              </>
            )}
          </For>

          {/* X-axis labels */}
          <For each={xLabels}>
            {({ index, label }) => (
              <text
                class="axis-label x-label"
                x={xScale(index)}
                y={PADDING.top + CHART_HEIGHT + 24}
                text-anchor="middle"
              >
                {label}
              </text>
            )}
          </For>

          {/* Area fill (only if more than 1 point) */}
          <Show when={!isSinglePoint}>
            <path class="area-path" d={getAreaPath()} fill="url(#areaGradient)" />
          </Show>

          {/* Line path (only if more than 1 point) */}
          <Show when={!isSinglePoint}>
            <path class="line-path" d={getLinePath()} fill="none" />
          </Show>

          {/* Data points */}
          <For each={data}>
            {(entry, i) => (
              <circle
                class="data-point"
                cx={xScale(i())}
                cy={yScale(entry.rating)}
                r={hoveredIndex() === i() ? 6 : 4}
                onMouseEnter={() => setHoveredIndex(i())}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            )}
          </For>

          {/* Tooltip - conditionally rendered based on hoveredIndex */}
          {(() => {
            const idx = hoveredIndex();
            if (idx === null || idx === undefined) return null;

            const entry = data[idx];
            const x = xScale(idx);
            const y = yScale(entry.rating);
            const tooltipX = x + (x > 300 ? -80 : 10);

            return (
              <g class="tooltip-group">
                <rect
                  class="tooltip-bg"
                  x={tooltipX}
                  y={y - 30}
                  width={90}
                  height={50}
                  rx="4"
                />
                <text class="tooltip-rating" x={tooltipX + 8} y={y - 12}>
                  {entry.rating}
                </text>
                <text class="tooltip-date" x={tooltipX + 8} y={y + 6}>
                  {formatDateFull(entry.date)}
                </text>
                <text class="tooltip-result" x={tooltipX + 8} y={y + 18}>
                  {entry.result === "win" ? "vs " : "vs "}
                  {entry.result}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>
    );
  }

  return (
    <div class="rating-chart-container">
      <Show when={props.data.length > 0}>
        <h3 class="chart-title">Rating History</h3>
      </Show>
      {renderChart()}
    </div>
  );
}

export default RatingChart;
