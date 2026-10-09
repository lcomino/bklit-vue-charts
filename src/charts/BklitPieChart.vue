<script setup lang="ts">
import { arc as d3Arc, pie as d3Pie, type PieArcDatum } from "d3-shape";
import { computed, ref, watch } from "vue";
import BklitRollingNumber from "../components/BklitRollingNumber.vue";
import { chartPalette, type PieDatum } from "../types";

const props = withDefaults(defineProps<{
  data: PieDatum[];
  height?: number;
  innerRadius?: number;
  showLegend?: boolean;
  formatValue?: (value: number) => string;
}>(), {
  height: 320,
  innerRadius: 0,
  showLegend: true,
  formatValue: (value: number) => value.toLocaleString(),
});

const activeId = ref<string | null>(null);
const visibleIds = ref(new Set(props.data.map((item) => item.id)));
watch(() => props.data.map((item) => item.id).join("|"), () => {
  const next = new Set(props.data.map((item) => item.id));
  visibleIds.value = new Set([...visibleIds.value].filter((id) => next.has(id)));
  next.forEach((id) => visibleIds.value.add(id));
});

const visibleData = computed(() => props.data.filter((item) => visibleIds.value.has(item.id) && item.value > 0));
const total = computed(() => visibleData.value.reduce((sum, item) => sum + item.value, 0));
const activeDatum = computed(() => visibleData.value.find((item) => item.id === activeId.value));
const centerValue = computed(() => activeDatum.value?.value ?? total.value);
const centerLabel = computed(() => activeDatum.value?.name ?? "Total");
const size = computed(() => Math.min(360, props.height));
const radius = computed(() => size.value * 0.42);
const arcs = computed(() => {
  const values = d3Pie<PieDatum>().sort(null).value((datum) => datum.value)(visibleData.value);
  return values.map((datum, index) => {
    const item = visibleData.value[index];
    const arc = d3Arc<PieArcDatum<PieDatum>>()
      .innerRadius(radius.value * props.innerRadius)
      .outerRadius(radius.value + (activeId.value === item?.id ? 5 : 0))
      .cornerRadius(3)
      .padAngle(0.012);
    return { datum, path: arc(datum) ?? "", color: item?.color ?? chartPalette[index % chartPalette.length] };
  });
});

function toggle(id: string) {
  const next = new Set(visibleIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  visibleIds.value = next;
  if (activeId.value === id) activeId.value = null;
}
</script>

<template>
  <div class="bklit-pie-wrap" :style="{ height: `${height}px` }" @pointerleave="activeId = null">
    <svg class="bklit-pie-svg" :viewBox="`0 0 ${size} ${size}`" role="img" aria-label="Gráfico de participação">
      <g :transform="`translate(${size / 2} ${size / 2})`">
        <path
          v-for="slice in arcs"
          :key="slice.datum.data.id"
          class="bklit-pie-slice"
          :d="slice.path"
          :fill="slice.color"
          @pointerenter="activeId = slice.datum.data.id"
        />
      </g>
    </svg>
    <div v-if="innerRadius > 0" class="bklit-pie-center" aria-live="polite">
      <Transition name="bklit-date" mode="out-in">
        <span :key="centerLabel" class="bklit-pie-center-label">{{ centerLabel }}</span>
      </Transition>
      <BklitRollingNumber class="bklit-pie-center-value" :value="centerValue" :format-value="formatValue" />
    </div>
    <div v-if="showLegend" class="bklit-legend bklit-pie-legend" role="group" aria-label="Categorias do gráfico">
      <button
        v-for="(item, index) in data"
        :key="item.id"
        type="button"
        class="bklit-legend-item"
        :class="{ 'is-muted': !visibleIds.has(item.id) }"
        :aria-pressed="visibleIds.has(item.id)"
        @click="toggle(item.id)"
      >
        <span class="bklit-legend-dot" :style="{ '--series-color': item.color ?? chartPalette[index % chartPalette.length] }" />
        {{ item.name }}
      </button>
    </div>
  </div>
</template>
