<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { arc as d3Arc } from "d3-shape";
import BklitRollingNumber from "../components/BklitRollingNumber.vue";

const props = withDefaults(defineProps<{ value: number; maxValue?: number; orientation?: "arc" | "linear"; height?: number; totalNotches?: number; activeColor?: string; inactiveColor?: string; suffix?: string; label?: string; formatValue?: (value: number) => string }>(), {
  maxValue: 100, orientation: "arc", height: 240, totalNotches: 24, activeColor: "#7355e8", inactiveColor: "#ebe7ef", suffix: "%", label: "Performance", formatValue: (value: number) => Math.round(value).toLocaleString(),
});
const progress = ref(0);
let frame = 0;
let startTime = 0;
let from = 0;
function animateTo(value: number) {
  cancelAnimationFrame(frame);
  from = progress.value;
  startTime = performance.now();
  const tick = (time: number) => {
    const t = Math.min(1, (time - startTime) / 480);
    const eased = 1 - (1 - t) ** 3;
    progress.value = from + (value - from) * eased;
    if (t < 1) frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
}
onMounted(() => animateTo(Math.min(1, Math.max(0, props.value / Math.max(1, props.maxValue)))));
watch(() => [props.value, props.maxValue], () => animateTo(Math.min(1, Math.max(0, props.value / Math.max(1, props.maxValue)))));
onBeforeUnmount(() => cancelAnimationFrame(frame));
const activeCount = computed(() => Math.round(progress.value * props.totalNotches));
const size = 280;
const arcPath = (index: number) => {
  const gap = 0.035;
  const start = -Math.PI / 2 + Math.PI * index / props.totalNotches + gap / 2;
  const end = -Math.PI / 2 + Math.PI * (index + 1) / props.totalNotches - gap / 2;
  return d3Arc<unknown>().innerRadius(96).outerRadius(112).startAngle(start).endAngle(end)({} as never) ?? "";
};
</script>

<template>
  <div v-if="orientation === 'arc'" class="bklit-gauge bklit-gauge-arc" :style="{ height: `${height}px` }">
    <svg class="bklit-gauge-svg" :viewBox="`0 0 ${size} ${size / 2 + 28}`" role="img" :aria-label="`${label}: ${formatValue(value)}${suffix}`">
      <g :transform="`translate(${size / 2} ${size / 2})`">
        <path v-for="index in totalNotches" :key="index" :d="arcPath(index - 1)" :fill="index <= activeCount ? activeColor : inactiveColor" class="bklit-gauge-notch" />
      </g>
    </svg>
    <div class="bklit-gauge-center"><strong class="bklit-gauge-value"><BklitRollingNumber :value="value" :format-value="formatValue" :duration="480" :animate-on-mount="true" />{{ suffix }}</strong><span class="bklit-gauge-label">{{ label }}</span></div>
  </div>
  <div v-else class="bklit-gauge bklit-gauge-linear">
    <div class="bklit-gauge-linear-heading"><span>{{ label }}</span><strong><BklitRollingNumber :value="value" :format-value="formatValue" :duration="480" :animate-on-mount="true" />{{ suffix }}</strong></div>
    <div class="bklit-gauge-track"><span :style="{ width: `${progress * 100}%`, background: activeColor }" /></div>
  </div>
</template>
