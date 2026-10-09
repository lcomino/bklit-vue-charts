<script setup lang="ts">
import { arc as d3Arc } from "d3-shape";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps<{
  index: number;
  value: number;
  maxValue: number;
  color: string;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  hovered: boolean;
  dimmed: boolean;
  pushedOut: boolean;
}>();
defineEmits<{ hoverstart: []; hoverend: [] }>();

const expand = ref(0);
const progress = ref(0);
const hoverScale = ref(1);
const targetProgress = computed(() => Math.max(0, Math.min(1, props.value / Math.max(1, props.maxValue))));
let frame = 0;
let delayTimer = 0;
let springFrame = 0;
let springVelocity = 0;

function springTo(target: number) {
  cancelAnimationFrame(springFrame);
  let previousTime = performance.now();
  const tick = (time: number) => {
    const dt = Math.min(0.032, Math.max(0.001, (time - previousTime) / 1000));
    previousTime = time;
    const acceleration = 400 * (target - hoverScale.value) - 25 * springVelocity;
    springVelocity += acceleration * dt;
    hoverScale.value += springVelocity * dt;
    if (Math.abs(target - hoverScale.value) < 0.001 && Math.abs(springVelocity) < 0.01) {
      hoverScale.value = target;
      springVelocity = 0;
    } else springFrame = requestAnimationFrame(tick);
  };
  springFrame = requestAnimationFrame(tick);
}

function animateProgress(from: number, to: number, duration: number) {
  cancelAnimationFrame(frame);
  const started = performance.now();
  const tick = (time: number) => {
    const t = Math.min(1, (time - started) / duration);
    progress.value = from + (to - from) * (1 - Math.pow(1 - t, 3));
    if (t < 1) frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
}

onMounted(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    expand.value = 1;
    progress.value = targetProgress.value;
    return;
  }
  delayTimer = window.setTimeout(() => {
    const started = performance.now();
    const tick = (time: number) => {
      const t = Math.min(1, (time - started) / 1050);
      expand.value = Math.min(1, t / 0.42);
      if (t > 0.32) {
        const p = Math.min(1, (t - 0.32) / 0.68);
        progress.value = targetProgress.value * (1 - Math.pow(1 - p, 3));
      }
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  }, props.index * 80);
});

watch(targetProgress, (next) => {
  if (expand.value < 1) return;
  animateProgress(progress.value, next, 520);
});
watch(() => [props.hovered, props.pushedOut] as const, () => {
  springTo(props.hovered ? 1.03 : props.pushedOut ? 1.02 : 1);
});

onBeforeUnmount(() => {
  window.clearTimeout(delayTimer);
  cancelAnimationFrame(frame);
  cancelAnimationFrame(springFrame);
});

const bgPath = computed(() => d3Arc<never>()
  .innerRadius(props.innerRadius * expand.value)
  .outerRadius(props.outerRadius * expand.value)
  .cornerRadius((props.outerRadius - props.innerRadius) * expand.value / 2)({
    startAngle: props.startAngle,
    endAngle: props.endAngle,
  } as never) ?? "");
const progressPath = computed(() => {
  if (progress.value <= 0.001) return "";
  const end = props.startAngle + (props.endAngle - props.startAngle) * progress.value;
  const radiusScale = expand.value;
  return d3Arc<never>()
    .innerRadius(props.innerRadius * radiusScale)
    .outerRadius(props.outerRadius * radiusScale)
    .cornerRadius((props.outerRadius - props.innerRadius) * radiusScale / 2)({
      startAngle: props.startAngle,
      endAngle: end,
    } as never) ?? "";
});
const transform = computed(() => `scale(${hoverScale.value})`);
</script>

<template>
  <path
    class="bklit-ring-hitbox"
    :d="bgPath"
    fill="transparent"
    pointer-events="all"
    @pointerenter="$emit('hoverstart')"
    @pointerleave="$emit('hoverend')"
  />
  <g
    class="bklit-ring-layer"
    :transform="transform"
    :style="{ opacity: dimmed ? 0.35 : 1 }"
    pointer-events="none"
  >
    <path :d="bgPath" fill="#eeebf0" />
    <path v-if="progressPath" :d="progressPath" :fill="color" />
  </g>
</template>
