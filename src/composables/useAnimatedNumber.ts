import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref } from "vue";

export function useAnimatedNumber(
  target: Ref<number>,
  formatter: (value: number) => string,
  duration = 260,
  animateOnMount = false,
) {
  const current = ref(animateOnMount ? 0 : target.value);
  const display = computed(() => formatter(current.value));
  let frame = 0;

  function animateTo(next: number, animationDuration: number) {
    cancelAnimationFrame(frame);
    if (typeof window === "undefined" || animationDuration <= 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      current.value = next;
      return;
    }
    const from = current.value;
    const start = performance.now();
    const tick = (time: number) => {
      const progress = Math.min(1, (time - start) / animationDuration);
      const eased = 1 - Math.pow(1 - progress, 4);
      current.value = from + (next - from) * eased;
      if (progress < 1) frame = requestAnimationFrame(tick);
      else current.value = next;
    };
    frame = requestAnimationFrame(tick);
  }

  onMounted(() => {
    if (animateOnMount) animateTo(target.value, duration);
  });
  const stopWatch = watch(target, (next) => animateTo(next, duration), { flush: "post" });

  onBeforeUnmount(() => {
    stopWatch();
    cancelAnimationFrame(frame);
  });
  return display;
}
