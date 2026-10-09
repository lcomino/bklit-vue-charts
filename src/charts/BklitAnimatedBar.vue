<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, watch } from "vue";

const props = withDefaults(defineProps<{
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  radius: number;
  delay?: number;
  animateUpdates?: boolean;
}>(), { delay: 0, animateUpdates: true });

const geometry = reactive({ x: props.x, y: props.y, width: props.width, height: props.height });
let frame = 0;
let mounted = false;

function animateTo(next: typeof geometry) {
  cancelAnimationFrame(frame);
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    Object.assign(geometry, next);
    return;
  }
  const from = { ...geometry };
  const start = performance.now();
  const tick = (time: number) => {
    const t = Math.min(1, (time - start) / 360);
    const eased = 1 - Math.pow(1 - t, 3);
    for (const key of ["x", "y", "width", "height"] as const) {
      geometry[key] = from[key] + (next[key] - from[key]) * eased;
    }
    if (t < 1) frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
}

onMounted(() => { mounted = true; });
watch(() => [props.x, props.y, props.width, props.height] as const, ([x, y, width, height]) => {
  if (!mounted) return;
  if (props.animateUpdates) animateTo({ x, y, width, height });
  else Object.assign(geometry, { x, y, width, height });
});
onBeforeUnmount(() => cancelAnimationFrame(frame));
</script>

<template>
  <rect
    class="bklit-bar-rect"
    :x="geometry.x"
    :y="geometry.y"
    :width="geometry.width"
    :height="geometry.height"
    :rx="radius"
    :fill="color"
    :style="{ '--bar-delay': `${delay}ms` }"
  />
</template>
