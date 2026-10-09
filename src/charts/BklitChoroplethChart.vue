<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import BklitTooltip from "../components/BklitTooltip.vue";
import type { TooltipRow } from "../types";

export type GeoCoordinates = number[][][] | number[][][][];
export interface ChoroplethFeature { id: string; name: string; value: number; color?: string; geometry: { type: "Polygon" | "MultiPolygon"; coordinates: GeoCoordinates } }
const props = withDefaults(defineProps<{ features: ChoroplethFeature[]; height?: number; lowColor?: string; highColor?: string; formatValue?: (value: number) => string }>(), {
  height: 320, lowColor: "#e9e2fa", highColor: "#7355e8", formatValue: (value: number) => value.toLocaleString(),
});
const emit = defineEmits<{ "feature-hover": [feature: ChoroplethFeature | null] }>();
const host = ref<HTMLDivElement | null>(null); const width = ref(720); const active = ref<ChoroplethFeature | null>(null); const mouse = ref({ x: 0, y: 0 }); let observer: ResizeObserver | undefined;
onMounted(() => { if (host.value && typeof ResizeObserver !== "undefined") { observer = new ResizeObserver(([entry]) => { if (entry) width.value = Math.max(320, entry.contentRect.width); }); observer.observe(host.value); } });
onBeforeUnmount(() => observer?.disconnect());
type Ring = number[][];
function rings(feature: ChoroplethFeature): Ring[] { const coords = feature.geometry.coordinates as unknown as (number[][][] | number[][][][]); return feature.geometry.type === "Polygon" ? (coords as number[][][]) : (coords as number[][][][]).flat(); }
const bounds = computed(() => {
  const coords = props.features.flatMap((feature) => rings(feature).flat());
  return { minX: Math.min(...coords.map((p) => p[0] ?? 0)), maxX: Math.max(...coords.map((p) => p[0] ?? 1)), minY: Math.min(...coords.map((p) => p[1] ?? 0)), maxY: Math.max(...coords.map((p) => p[1] ?? 1)) };
});
function project(point: number[]) { const b = bounds.value; const scale = Math.min((width.value - 64) / Math.max(.001, b.maxX - b.minX), (props.height - 50) / Math.max(.001, b.maxY - b.minY)); const mapW = (b.maxX - b.minX) * scale; const mapH = (b.maxY - b.minY) * scale; return { x: (width.value - mapW) / 2 + ((point[0] ?? 0) - b.minX) * scale, y: (props.height - mapH) / 2 + (b.maxY - (point[1] ?? 0)) * scale }; }
const paths = computed(() => { const values = props.features.map((feature) => feature.value); const min = Math.min(0, ...values); const max = Math.max(1, ...values); return props.features.map((feature) => ({ ...feature, path: rings(feature).map((ring) => ring.map((point, index) => { const p = project(point); return `${index ? "L" : "M"}${p.x},${p.y}`; }).join(" ") + "Z").join(" "), opacity: .35 + .65 * (feature.value - min) / Math.max(1, max - min) })); });
const rows = computed<TooltipRow[]>(() => active.value ? [{ id: active.value.id, label: active.value.name, value: active.value.value, color: active.value.color ?? props.highColor, formatValue: props.formatValue }] : []);
function activate(feature: ChoroplethFeature, event: PointerEvent) { active.value = feature; emit("feature-hover", feature); const rect = host.value?.getBoundingClientRect(); if (rect) mouse.value = { x: event.clientX - rect.left, y: event.clientY - rect.top }; }
function clearActive() { active.value = null; emit("feature-hover", null); }
</script>

<template>
  <div ref="host" class="bklit-chart bklit-choropleth-wrap" :style="{ height: `${height}px` }">
    <svg class="bklit-choropleth-svg" :viewBox="`0 0 ${width} ${height}`" role="img" aria-label="Mapa de intensidade" @pointerleave="clearActive">
      <path v-for="feature in paths" :key="feature.id" :d="feature.path" :fill="feature.color ?? highColor" :fill-opacity="feature.opacity" stroke="white" stroke-width=".7" class="bklit-choropleth-region" :class="{ 'is-muted': active !== null && active.id !== feature.id }" @pointerenter="activate(feature, $event)" />
    </svg>
    <BklitTooltip :open="active !== null" :x="mouse.x" :y="mouse.y" :container-width="width" :container-height="height" :label="active?.name ?? ''" :rows="rows" :format-value="formatValue" />
  </div>
</template>
