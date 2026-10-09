<script setup lang="ts">
import { arc as d3Arc } from "d3-shape";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = withDefaults(defineProps<{
  id: string;
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
  color: string;
  index: number;
  active: boolean;
  dimmed: boolean;
  hoverOffset: number;
  showGlow: boolean;
  padAngle: number;
  cornerRadius: number;
}>(), {
  hoverOffset: 10,
  showGlow: true,
  padAngle: 0.012,
  cornerRadius: 3,
});
defineEmits<{ pointerenter: [id: string]; pointerleave: [] }>();

const drawnStart = ref(props.startAngle);
const drawnEnd = ref(props.startAngle);
const ready = ref(false);
let frame = 0;
let delayTimer = 0;
let springFrame = 0;
let velocity = { x: 0, y: 0 };
const springOffset = ref({ x: 0, y: 0 });

function springTo(target: { x: number; y: number }) {
  cancelAnimationFrame(springFrame);
  let previousTime = performance.now();
  const tick = (time: number) => {
    const dt = Math.min(0.032, Math.max(0.001, (time - previousTime) / 1000));
    previousTime = time;
    for (const axis of ["x", "y"] as const) {
      const acceleration = 400 * (target[axis] - springOffset.value[axis]) - 25 * velocity[axis];
      velocity[axis] += acceleration * dt;
      springOffset.value[axis] += velocity[axis] * dt;
    }
    if (Math.abs(target.x - springOffset.value.x) < 0.01 && Math.abs(target.y - springOffset.value.y) < 0.01 && Math.abs(velocity.x) < 0.05 && Math.abs(velocity.y) < 0.05) {
      springOffset.value = target;
      velocity = { x: 0, y: 0 };
    } else springFrame = requestAnimationFrame(tick);
  };
  springFrame = requestAnimationFrame(tick);
}

function animateAngles(fromStart: number, fromEnd: number, toStart: number, toEnd: number, duration: number) {
  cancelAnimationFrame(frame);
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || duration <= 0) {
    drawnStart.value = toStart;
    drawnEnd.value = toEnd;
    return;
  }
  const started = performance.now();
  const tick = (time: number) => {
    const progress = Math.min(1, (time - started) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    drawnStart.value = fromStart + (toStart - fromStart) * eased;
    drawnEnd.value = fromEnd + (toEnd - fromEnd) * eased;
    if (progress < 1) frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
}

onMounted(() => {
  const start = props.startAngle;
  drawnStart.value = start;
  drawnEnd.value = start;
  ready.value = true;
  delayTimer = window.setTimeout(() => {
    animateAngles(start, start, props.startAngle, props.endAngle, 820);
  }, props.index * 70);
});

watch(() => [props.startAngle, props.endAngle] as const, ([start, end]) => {
  if (!ready.value) return;
  animateAngles(drawnStart.value, drawnEnd.value, start, end, 360);
});
watch(() => props.active, (active) => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    springOffset.value = active ? offset.value : { x: 0, y: 0 };
    return;
  }
  springTo(active ? offset.value : { x: 0, y: 0 });
});

onBeforeUnmount(() => {
  window.clearTimeout(delayTimer);
  cancelAnimationFrame(frame);
  cancelAnimationFrame(springFrame);
});

const path = computed(() => d3Arc<unknown>()
  .innerRadius(props.innerRadius)
  .outerRadius(props.outerRadius)
  .cornerRadius(props.cornerRadius)
  .padAngle(props.padAngle)({ startAngle: drawnStart.value, endAngle: drawnEnd.value } as never) ?? "");
const hitboxPath = computed(() => d3Arc<unknown>()
  .innerRadius(props.innerRadius)
  .outerRadius(props.outerRadius)
  .cornerRadius(props.cornerRadius)
  .padAngle(props.padAngle)({ startAngle: props.startAngle, endAngle: props.endAngle } as never) ?? "");
const offset = computed(() => {
  const middle = (props.startAngle + props.endAngle) / 2;
  return { x: Math.sin(middle) * props.hoverOffset, y: -Math.cos(middle) * props.hoverOffset };
});
watch(offset, (next) => { if (props.active) springTo(next); });
</script>

<template>
  <path
    :d="hitboxPath"
    fill="transparent"
    pointer-events="all"
    @pointerenter="$emit('pointerenter', id)"
    @pointerleave="$emit('pointerleave')"
  />
  <g
    class="bklit-pie-slice-group"
    :style="{
      transform: `translate(${springOffset.x}px, ${springOffset.y}px)`,
      opacity: dimmed ? 0.4 : 1,
    }"
  >
    <path
      :d="path"
      :fill="color"
      class="bklit-pie-slice"
      pointer-events="none"
      :style="{ filter: showGlow && active ? `drop-shadow(0 0 12px ${color})` : 'none' }"
    />
  </g>
</template>
