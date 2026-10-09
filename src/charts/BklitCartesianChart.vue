<script setup lang="ts">
import { area as d3Area, curveMonotoneX, line as d3Line } from "d3-shape";
import { max, min } from "d3-array";
import { interpolateString } from "d3-interpolate";
import { scaleLinear, scalePoint, type ScaleLinear } from "d3-scale";
import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref, watch } from "vue";
import BklitTooltip from "../components/BklitTooltip.vue";
import BklitAnimatedBar from "./BklitAnimatedBar.vue";
import { chartPalette, type CartesianChartKind, type CartesianKind, type ChartAxis, type ChartPoint, type ChartSeries, type TooltipRow } from "../types";

const props = withDefaults(defineProps<{
  series: ChartSeries[];
  kind?: CartesianChartKind;
  axes?: ChartAxis[];
  height?: number;
  stacked?: boolean;
  showTotal?: boolean;
  showLegend?: boolean;
  xTickCount?: number;
  formatValue?: (value: number) => string;
  ariaLabel?: string;
}>(), {
  kind: "line",
  axes: () => [{ id: "primary", side: "left" }],
  height: 320,
  stacked: false,
  showTotal: true,
  showLegend: true,
  xTickCount: undefined,
  formatValue: (value: number) => value.toLocaleString(),
  ariaLabel: "Gráfico",
});

const host = ref<HTMLDivElement | null>(null);
const width = ref(720);
const hostSize = ref({ width: 720, height: props.height });
const revealProgress = ref(0);
const activeLabel = ref<string | null>(null);
const activeSeriesId = ref<string | null>(null);
const mouse = ref({ x: 0, y: 0 });
const visibleIds = ref(new Set(props.series.map((series) => series.id)));
const instanceId = getCurrentInstance()?.uid ?? 0;
const seriesClipId = `bklit-series-clip-${instanceId}`;
let resizeObserver: ResizeObserver | undefined;
let revealFrame = 0;
let pathFrame = 0;
let pathsReady = false;
const displayPaths = ref(new Map<string, string>());

function areaGradientIdFor(series: ChartSeries) {
  return `bklit-area-gradient-${instanceId}-${series.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}
function hoverClipIdFor(series: ChartSeries) {
  return `bklit-hover-clip-${instanceId}-${series.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}
function bklitEasing(time: number) {
  const coordinate = (position: number, a: number, b: number) => 3 * (1 - position) ** 2 * position * a + 3 * (1 - position) * position ** 2 * b + position ** 3;
  let low = 0;
  let high = 1;
  for (let i = 0; i < 12; i += 1) {
    const mid = (low + high) / 2;
    if (coordinate(mid, 0.85, 0.15) < time) low = mid;
    else high = mid;
  }
  return coordinate((low + high) / 2, 0, 1);
}

watch(() => props.series.map(({ id }) => id), (ids, previousIds) => {
  const available = new Set(ids);
  const previous = new Set(previousIds);
  const next = new Set([...visibleIds.value].filter((id) => available.has(id)));
  ids.forEach((id) => { if (!previous.has(id)) next.add(id); });
  visibleIds.value = next;
});

onMounted(() => {
  if (host.value && typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(([entry]) => {
      if (entry) {
        hostSize.value = { width: entry.contentRect.width, height: entry.contentRect.height };
        width.value = Math.max(320, entry.contentRect.width);
      }
    });
    resizeObserver.observe(host.value);
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    revealProgress.value = 1;
    return;
  }
  const start = performance.now();
  const reveal = (time: number) => {
    const progress = Math.min(1, (time - start) / 1100);
    revealProgress.value = bklitEasing(progress);
    if (progress < 1) revealFrame = requestAnimationFrame(reveal);
  };
  revealFrame = requestAnimationFrame(reveal);
});
onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  cancelAnimationFrame(revealFrame);
  cancelAnimationFrame(pathFrame);
  cancelAnimationFrame(hoverSpringFrame);
});

const chartHeight = computed(() => props.height);
const plot = computed(() => ({
  top: 18,
  right: props.axes.some((axis) => axis.side === "right") ? 58 : 18,
  bottom: 36,
  left: props.axes.some((axis) => axis.side !== "right") ? 58 : 18,
}));
const plotBottom = computed(() => chartHeight.value - plot.value.bottom);
const plotRight = computed(() => width.value - plot.value.right);
const labels = computed(() => {
  const seen = new Set<string>();
  props.series.forEach((series) => series.data.forEach((point) => seen.add(point.label)));
  return [...seen];
});
const xScale = computed(() => scalePoint<string>().domain(labels.value).range([plot.value.left, plotRight.value]).padding(0.35));
const allAxes = computed(() => props.axes.length ? props.axes : [{ id: "primary", side: "left" as const }]);
const yScales = computed(() => {
  const result = new Map<string, ScaleLinear<number, number>>();
  allAxes.value.forEach((axis) => {
    const matching = props.series.filter((series) => (series.axisId ?? "primary") === axis.id);
    const axisValues = matching.flatMap((series) => series.data.map((point) => point.value));
    let low = axis.min ?? Math.min(0, min(axisValues) ?? 0);
    let high = axis.max ?? (max(axisValues) ?? 1);
    if (props.stacked) {
      if (matching.some((series) => seriesKind(series) === "bar")) {
        const barSeries = matching.filter((series) => seriesKind(series) === "bar");
        const positiveSums = labels.value.map((label) => barSeries.reduce((total, series) => total + Math.max(0, series.data.find((point) => point.label === label)?.value ?? 0), 0));
        const negativeSums = labels.value.map((label) => barSeries.reduce((total, series) => total + Math.min(0, series.data.find((point) => point.label === label)?.value ?? 0), 0));
        high = axis.max ?? Math.max(high, max(positiveSums) ?? 1);
        low = axis.min ?? Math.min(low, min(negativeSums) ?? 0);
      }
      if (matching.some((series) => seriesKind(series) === "area")) {
        const areaSeries = matching.filter((series) => seriesKind(series) === "area");
        const sums = labels.value.map((label) => areaSeries.reduce((total, series) => total + (series.data.find((point) => point.label === label)?.value ?? 0), 0));
        high = axis.max ?? Math.max(high, max(sums) ?? 1);
      }
    }
    if (high <= low) high = low + 1;
    result.set(axis.id, scaleLinear<number, number>().domain([low, high]).nice().range([plotBottom.value, plot.value.top]));
  });
  return result;
});
const visibleSeries = computed(() => props.series.filter((series) => visibleIds.value.has(series.id)));
const axisTicks = computed(() => {
  const axis = allAxes.value.find((item) => item.side !== "right") ?? allAxes.value[0];
  return axis ? yScales.value.get(axis.id)?.ticks(4).map((value) => ({
    value,
    y: yScales.value.get(axis.id)!(value),
    label: axis.tickFormat?.(value) ?? props.formatValue(value),
  })) ?? [] : [];
});
const xTicks = computed(() => {
  const count = props.xTickCount;
  if (!count || count >= labels.value.length) return labels.value.map((label) => ({ label, x: xScale.value(label) ?? 0 }));
  const step = Math.max(1, Math.ceil((labels.value.length - 1) / Math.max(1, count - 1)));
  return labels.value.flatMap((label, index) => index === 0 || index === labels.value.length - 1 || index % step === 0 ? [{ label, x: xScale.value(label) ?? 0 }] : []);
});
const activeX = computed(() => activeLabel.value ? xScale.value(activeLabel.value) ?? null : null);
const activePointIndex = computed(() => activeLabel.value === null ? -1 : labels.value.indexOf(activeLabel.value));
const hoverBand = computed(() => {
  if (activePointIndex.value < 0) return { x: 0, width: 0 };
  const start = xScale.value(labels.value[Math.max(0, activePointIndex.value - 1)]!) ?? 0;
  const end = xScale.value(labels.value[Math.min(labels.value.length - 1, activePointIndex.value + 1)]!) ?? start;
  return { x: start, width: Math.max(0, end - start) };
});
const springHoverBand = ref({ x: 0, width: 0 });
let hoverSpringFrame = 0;
let hasHoveredBand = false;
watch(hoverBand, (target) => {
  cancelAnimationFrame(hoverSpringFrame);
  if (!activeLabel.value) { hasHoveredBand = false; return; }
  if (!hasHoveredBand || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    springHoverBand.value = target;
    hasHoveredBand = true;
    return;
  }
  let previousTime = performance.now();
  let velocityX = 0;
  let velocityWidth = 0;
  const tick = (now: number) => {
    const dt = Math.min(.032, Math.max(.001, (now - previousTime) / 1000));
    previousTime = now;
    const spring = (value: number, velocity: number, destination: number) => {
      velocity += (destination - value) * 250 * dt;
      velocity *= Math.exp(-24 * dt);
      return { value: value + velocity * dt, velocity };
    };
    const x = spring(springHoverBand.value.x, velocityX, target.x);
    const width = spring(springHoverBand.value.width, velocityWidth, target.width);
    velocityX = x.velocity;
    velocityWidth = width.velocity;
    springHoverBand.value = { x: x.value, width: width.value };
    if (Math.abs(target.x - x.value) > .2 || Math.abs(target.width - width.value) > .2 || Math.abs(velocityX) > .2 || Math.abs(velocityWidth) > .2) hoverSpringFrame = requestAnimationFrame(tick);
    else springHoverBand.value = target;
  };
  hoverSpringFrame = requestAnimationFrame(tick);
});

function seriesKind(series: ChartSeries): CartesianKind {
  return series.kind ?? (props.kind === "composed" ? "line" : props.kind);
}
function seriesColor(series: ChartSeries) {
  const index = props.series.findIndex(({ id }) => id === series.id);
  return series.color ?? chartPalette[index % chartPalette.length];
}
function yFor(series: ChartSeries, value: number) {
  return yScales.value.get(series.axisId ?? "primary")?.(value) ?? plotBottom.value;
}
function stackedBase(series: ChartSeries, label: string) {
  const kind = seriesKind(series);
  if (!props.stacked || (kind !== "bar" && kind !== "area")) return 0;
  const peers = visibleSeries.value.filter((item) => seriesKind(item) === kind && (item.axisId ?? "primary") === (series.axisId ?? "primary"));
  const index = peers.findIndex((item) => item.id === series.id);
  return peers.slice(0, index).reduce((total, item) => {
    const value = item.data.find((point) => point.label === label)?.value ?? 0;
    if (kind === "bar") {
      const current = series.data.find((point) => point.label === label)?.value ?? 0;
      if (Math.sign(value) !== Math.sign(current)) return total;
    }
    return total + value;
  }, 0);
}
function linePath(series: ChartSeries) {
  const stacked = seriesKind(series) === "area" && props.stacked;
  const generator = d3Line<ChartPoint>()
    .defined((point) => Number.isFinite(point.value) && xScale.value(point.label) !== undefined)
    .x((point) => xScale.value(point.label) ?? 0)
    .y((point) => yFor(series, point.value + (stacked ? stackedBase(series, point.label) : 0)))
    .curve(curveMonotoneX);
  return generator(series.data) ?? "";
}
function areaPath(series: ChartSeries) {
  const generator = d3Area<ChartPoint>()
    .defined((point) => Number.isFinite(point.value) && xScale.value(point.label) !== undefined)
    .x((point) => xScale.value(point.label) ?? 0)
    .y0((point) => yFor(series, stackedBase(series, point.label)))
    .y1((point) => yFor(series, point.value + stackedBase(series, point.label)))
    .curve(curveMonotoneX);
  return generator(series.data) ?? "";
}

const targetPaths = computed(() => {
  const paths = new Map<string, string>();
  visibleSeries.value.filter((series) => seriesKind(series) !== "bar").forEach((series) => {
    paths.set(`${series.id}:line`, linePath(series));
    if (seriesKind(series) === "area") paths.set(`${series.id}:area`, areaPath(series));
  });
  return paths;
});

watch(targetPaths, (next) => {
  cancelAnimationFrame(pathFrame);
  const previous = displayPaths.value;
  const target = new Map(next);
  if (!pathsReady || revealProgress.value < 1 || typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    displayPaths.value = target;
    pathsReady = true;
    return;
  }
  const transitions = [...target].flatMap(([id, to]) => {
    const from = previous.get(id);
    const sameGeometry = from?.replace(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi, "#") === to.replace(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi, "#");
    return from && from !== to && sameGeometry ? [[id, interpolateString(from, to)] as const] : [];
  });
  if (!transitions.length) {
    displayPaths.value = target;
    return;
  }
  const start = performance.now();
  const tick = (time: number) => {
    const progress = Math.min(1, (time - start) / 360);
    const eased = 1 - Math.pow(1 - progress, 3);
    const framePaths = new Map(target);
    transitions.forEach(([id, interpolate]) => framePaths.set(id, interpolate(eased)));
    displayPaths.value = framePaths;
    if (progress < 1) pathFrame = requestAnimationFrame(tick);
    else displayPaths.value = target;
  };
  pathFrame = requestAnimationFrame(tick);
}, { flush: "post", immediate: true });

const bars = computed(() => {
  const barSeries = visibleSeries.value.filter((series) => seriesKind(series) === "bar");
  const step = labels.value.length > 1 ? (plotRight.value - plot.value.left) / (labels.value.length - 1) : plotRight.value - plot.value.left;
  const slot = Math.max(12, step * 0.72);
  const barWidth = props.stacked ? slot : slot / Math.max(1, barSeries.length);
  return labels.value.flatMap((label, pointIndex) => {
    return barSeries.map((series, seriesIndex) => {
      const point = series.data.find((item) => item.label === label);
      const value = point?.value ?? 0;
      const base = props.stacked ? stackedBase(series, label) : 0;
      const x = xScale.value(label) ?? 0;
      const yTop = yFor(series, base + value);
      const yBase = yFor(series, base);
      return {
        key: `${series.id}:${label}`,
        x: props.stacked ? x - barWidth / 2 : x - slot / 2 + seriesIndex * barWidth,
        y: Math.min(yTop, yBase),
        width: Math.max(2, barWidth - (props.stacked ? 0 : 3)),
        height: Math.max(0, Math.abs(yBase - yTop)),
        color: seriesColor(series),
        series,
        pointIndex,
      };
    });
  });
});

const tooltipRows = computed<TooltipRow[]>(() => {
  if (!activeLabel.value) return [];
  return visibleSeries.value.flatMap((series) => {
    const point = series.data.find((item) => item.label === activeLabel.value);
    if (!point) return [];
    return [{
      id: series.id,
      label: series.name,
      value: point.value,
      color: seriesColor(series),
      formatValue: series.formatValue ?? props.formatValue,
      kind: seriesKind(series),
    }];
  });
});
const tooltipTotal = computed<number | undefined>(() => {
  if (!props.stacked || !activeLabel.value) return undefined;
  const primaryAxisId = allAxes.value.find((axis) => axis.side !== "right")?.id ?? allAxes.value[0]?.id ?? "primary";
  return visibleSeries.value
    .filter((series) => (series.axisId ?? "primary") === primaryAxisId && (seriesKind(series) === "bar" || seriesKind(series) === "area"))
    .reduce((sum, series) => sum + (series.data.find((point) => point.label === activeLabel.value)?.value ?? 0), 0);
});
function handlePointerMove(event: PointerEvent) {
  if (!host.value || !labels.value.length) return;
  const bounds = host.value.getBoundingClientRect();
  const localX = event.clientX - bounds.left;
  const localY = event.clientY - bounds.top;
  const chartX = localX * width.value / Math.max(1, bounds.width);
  const chartY = localY * chartHeight.value / Math.max(1, bounds.height);
  if (chartX < plot.value.left || chartX > plotRight.value || chartY < plot.value.top || chartY > plotBottom.value) {
    activeLabel.value = null;
    activeSeriesId.value = null;
    return;
  }
  const nearest = labels.value.reduce((best, label) => {
    const distance = Math.abs((xScale.value(label) ?? 0) - chartX);
    return distance < best.distance ? { label, distance } : best;
  }, { label: labels.value[0], distance: Infinity });
  activeLabel.value = nearest.label;
  const activeBars = bars.value.filter((bar) => bar.key.endsWith(`:${nearest.label}`));
  const candidates = visibleSeries.value.map((series) => {
    const kind = seriesKind(series);
    const point = series.data.find((item) => item.label === nearest.label);
    if (!point) return { id: series.id, distance: Infinity };
    if (kind === "bar") {
      const bar = activeBars.find((item) => item.series.id === series.id);
      if (!bar) return { id: series.id, distance: Infinity };
      const horizontal = Math.max(bar.x - chartX, 0, chartX - (bar.x + bar.width));
      const vertical = Math.max(bar.y - chartY, 0, chartY - (bar.y + bar.height));
      return { id: series.id, distance: Math.hypot(horizontal, vertical) };
    }
    const value = point.value + (kind === "area" && props.stacked ? stackedBase(series, nearest.label) : 0);
    return { id: series.id, distance: Math.abs(yFor(series, value) - chartY) };
  });
  activeSeriesId.value = candidates.reduce((best, item) => item.distance < best.distance ? item : best, { id: null as string | null, distance: Infinity }).id;
  mouse.value = { x: localX, y: localY };
}
function handlePointerLeave() {
  activeLabel.value = null;
  activeSeriesId.value = null;
}
function toggleSeries(id: string) {
  const next = new Set(visibleIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  visibleIds.value = next;
}
</script>

<template>
  <div ref="host" class="bklit-chart" :style="{ height: `${chartHeight}px` }">
    <svg class="bklit-chart-svg" :viewBox="`0 0 ${width} ${chartHeight}`" :aria-label="ariaLabel" role="img" @pointermove="handlePointerMove" @pointerleave="handlePointerLeave">
      <defs>
        <clipPath :id="seriesClipId">
          <rect :x="plot.left" y="0" :width="(plotRight - plot.left) * revealProgress" :height="chartHeight" />
        </clipPath>
        <template v-for="series in props.series.filter((item) => seriesKind(item) === 'area')" :key="series.id">
          <linearGradient :id="areaGradientIdFor(series)" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" :stop-color="seriesColor(series)" stop-opacity=".28" />
            <stop offset="100%" :stop-color="seriesColor(series)" stop-opacity="0" />
          </linearGradient>
        </template>
        <template v-for="series in visibleSeries.filter((item) => seriesKind(item) !== 'bar')" :key="`hover-${series.id}`">
          <clipPath :id="hoverClipIdFor(series)">
            <rect :x="springHoverBand.x" y="0" :width="springHoverBand.width" :height="chartHeight" />
          </clipPath>
        </template>
      </defs>
      <g class="bklit-grid">
        <g v-for="tick in axisTicks" :key="tick.value">
          <line :x1="plot.left" :x2="plotRight" :y1="tick.y" :y2="tick.y" />
          <text :x="plot.left - 10" :y="tick.y + 4" text-anchor="end">{{ tick.label }}</text>
        </g>
      </g>

      <g v-for="axis in allAxes" :key="axis.id" class="bklit-axis">
        <template v-if="visibleSeries.some((series) => (series.axisId ?? 'primary') === axis.id)">
          <text
            v-if="axis.label"
            class="bklit-axis-title"
            :transform="axis.side === 'right' ? `translate(${width - 12} ${chartHeight / 2}) rotate(90)` : `translate(13 ${chartHeight / 2}) rotate(-90)`"
            text-anchor="middle"
          >{{ axis.label }}</text>
          <g v-if="axis.side === 'right'" class="bklit-right-ticks">
            <text v-for="tick in yScales.get(axis.id)?.ticks(4) ?? []" :key="tick" :x="plotRight + 10" :y="(yScales.get(axis.id)?.(tick) ?? 0) + 4">{{ axis.tickFormat?.(tick) ?? formatValue(tick) }}</text>
          </g>
        </template>
      </g>

      <g class="bklit-crosshair" v-if="activeX !== null">
        <line :x1="activeX" :x2="activeX" :y1="plot.top" :y2="plotBottom" />
      </g>

      <g class="bklit-series" :clip-path="`url(#${seriesClipId})`">
        <g v-for="bar in bars" :key="bar.key" class="bklit-bar-series bklit-series-item" :class="{ 'is-muted': activeSeriesId !== null && activeSeriesId !== bar.series.id }">
          <BklitAnimatedBar
            :x="bar.x"
            :y="bar.y"
            :width="bar.width"
            :height="bar.height"
            :radius="props.stacked ? 2 : 4"
            :color="bar.color"
            :delay="bar.pointIndex * 60"
            :animate-updates="revealProgress >= 1"
          />
        </g>
        <g v-for="series in visibleSeries.filter((item) => seriesKind(item) !== 'bar')" :key="series.id" class="bklit-series-item" :class="{ 'is-muted': activeSeriesId !== null && activeSeriesId !== series.id }">
          <path v-if="seriesKind(series) === 'area'" class="bklit-area-path" :d="displayPaths.get(`${series.id}:area`) ?? areaPath(series)" :fill="`url(#${areaGradientIdFor(series)})`" />
          <path class="bklit-line-path" :d="displayPaths.get(`${series.id}:line`) ?? linePath(series)" :stroke="seriesColor(series)" />
          <path
            v-if="activeLabel && activeSeriesId === series.id"
            class="bklit-line-hover-highlight"
            :d="displayPaths.get(`${series.id}:line`) ?? linePath(series)"
            :stroke="seriesColor(series)"
            :clip-path="`url(#${hoverClipIdFor(series)})`"
          />
          <circle
            v-if="activeLabel && activeSeriesId === series.id && series.data.some((point) => point.label === activeLabel)"
            class="bklit-point-marker"
            :cx="xScale(activeLabel) ?? 0"
            :cy="yFor(series, (series.data.find((point) => point.label === activeLabel)?.value ?? 0) + (seriesKind(series) === 'area' && stacked ? stackedBase(series, activeLabel) : 0))"
            :fill="seriesColor(series)"
          />
        </g>
      </g>

      <g class="bklit-x-axis">
        <text v-for="tick in xTicks" :key="tick.label" :x="tick.x" :y="plotBottom + 25" text-anchor="middle">{{ tick.label }}</text>
      </g>
    </svg>

    <div v-if="showLegend" class="bklit-legend" role="group" aria-label="Séries do gráfico">
      <button
        v-for="series in props.series"
        :key="series.id"
        type="button"
        class="bklit-legend-item"
        :class="{ 'is-muted': !visibleIds.has(series.id) }"
        :aria-pressed="visibleIds.has(series.id)"
        @click="toggleSeries(series.id)"
      >
        <span class="bklit-legend-marker" :class="{ 'is-line': seriesKind(series) !== 'bar' }" :style="{ '--series-color': seriesColor(series) }" />
        {{ series.name }}
      </button>
    </div>

    <BklitTooltip
      :open="activeLabel !== null && tooltipRows.length > 0"
      :x="mouse.x"
      :y="mouse.y"
      :container-width="hostSize.width"
      :container-height="hostSize.height"
      :label="activeLabel ?? ''"
      :rows="tooltipRows"
      :total="showTotal ? tooltipTotal : undefined"
      :format-value="formatValue"
    />
  </div>
</template>
