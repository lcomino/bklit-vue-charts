<script setup lang="ts">
import { pie as d3Pie } from "d3-shape";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import BklitRollingNumber from "../components/BklitRollingNumber.vue";
import BklitPieSlice from "./BklitPieSlice.vue";
import { chartPalette, type PieDatum } from "../types";

const props = withDefaults(defineProps<{
  data: PieDatum[];
  height?: number;
  size?: number;
  innerRadius?: number;
  showLegend?: boolean;
  formatValue?: (value: number) => string;
  defaultLabel?: string;
  padAngle?: number;
  cornerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  hoverOffset?: number;
  showGlow?: boolean;
}>(), {
  height: 320,
  size: undefined,
  innerRadius: 0,
  showLegend: true,
  formatValue: (value: number) => value.toLocaleString(),
  defaultLabel: "Total",
  padAngle: 0,
  cornerRadius: 0,
  startAngle: -Math.PI / 2,
  endAngle: (3 * Math.PI) / 2,
  hoverOffset: 10,
  showGlow: true,
});

const activeId = ref<string | null>(null);
let clearHoverTimer = 0;
function setActive(label: string | null) {
  window.clearTimeout(clearHoverTimer);
  if (label !== null) activeId.value = label;
  else clearHoverTimer = window.setTimeout(() => { activeId.value = null; }, 55);
}
onBeforeUnmount(() => window.clearTimeout(clearHoverTimer));
const visibleIds = ref(new Set(props.data.map((item) => item.label)));
watch(() => props.data.map((item) => item.label), (labels, previousLabels) => {
  const available = new Set(labels);
  const previous = new Set(previousLabels);
  const next = new Set([...visibleIds.value].filter((label) => available.has(label)));
  labels.forEach((label) => { if (!previous.has(label)) next.add(label); });
  visibleIds.value = next;
  if (activeId.value && !available.has(activeId.value)) setActive(null);
});

const visibleData = computed(() => props.data.filter((item) => visibleIds.value.has(item.label) && item.value > 0));
const total = computed(() => visibleData.value.reduce((sum, item) => sum + item.value, 0));
const activeDatum = computed(() => visibleData.value.find((item) => item.label === activeId.value));
const centerValue = computed(() => activeDatum.value?.value ?? total.value);
const centerLabel = computed(() => activeDatum.value?.label ?? props.defaultLabel);
const size = computed(() => props.size ?? Math.max(180, Math.min(360, props.height - 34)));
const radius = computed(() => Math.max(12, size.value / 2 - props.hoverOffset));
const arcs = computed(() => {
  const values = d3Pie<PieDatum>()
    .sort(null)
    .startAngle(props.startAngle)
    .endAngle(props.endAngle)
    .padAngle(props.padAngle)
    .value((datum) => datum.value)(visibleData.value);
  return values.map((datum, index) => {
    const item = visibleData.value[index];
    return {
      datum,
      index,
      color: item?.color ?? chartPalette[Math.max(0, props.data.findIndex((source) => source.label === item?.label)) % chartPalette.length],
    };
  });
});

function toggle(label: string) {
  const next = new Set(visibleIds.value);
  if (next.has(label)) next.delete(label);
  else next.add(label);
  visibleIds.value = next;
  if (activeId.value === label) setActive(null);
}
</script>

<template>
  <div class="bklit-pie-wrap" :style="{ height: `${height}px` }" @pointerleave="setActive(null)">
    <svg class="bklit-pie-svg" :viewBox="`0 0 ${size} ${size}`" role="img" aria-label="Gráfico de participação">
      <g :transform="`translate(${size / 2} ${size / 2})`">
        <BklitPieSlice
          v-for="slice in arcs"
          :key="slice.datum.data.label"
          :id="slice.datum.data.label"
          :start-angle="slice.datum.startAngle"
          :end-angle="slice.datum.endAngle"
          :inner-radius="innerRadius"
          :outer-radius="radius"
          :color="slice.color"
          :index="slice.index"
          :active="activeId === slice.datum.data.label"
          :dimmed="activeId !== null && activeId !== slice.datum.data.label"
          :hover-offset="hoverOffset"
          :show-glow="showGlow"
          :pad-angle="padAngle"
          :corner-radius="cornerRadius"
          @pointerenter="setActive($event)"
          @pointerleave="setActive(null)"
        />
      </g>
    </svg>
    <div v-if="innerRadius > 0" class="bklit-pie-center">
      <span class="bklit-pie-center-label">{{ centerLabel }}</span>
      <BklitRollingNumber class="bklit-pie-center-value" :value="centerValue" :format-value="formatValue" :animate-on-mount="true" :duration="500" />
    </div>
    <div v-if="showLegend" class="bklit-legend bklit-pie-legend" role="group" aria-label="Categorias do gráfico">
      <button
        v-for="(item, index) in data"
        :key="item.label"
        type="button"
        class="bklit-legend-item"
        :class="{ 'is-muted': !visibleIds.has(item.label) }"
        :aria-pressed="visibleIds.has(item.label)"
        @click="toggle(item.label)"
      >
        <span class="bklit-legend-dot" :style="{ '--series-color': item.color ?? chartPalette[Math.max(0, props.data.findIndex((source) => source.label === item.label)) % chartPalette.length] }" />
        {{ item.label }}
      </button>
    </div>
  </div>
</template>
