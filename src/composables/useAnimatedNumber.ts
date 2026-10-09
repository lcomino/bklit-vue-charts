import { onBeforeUnmount, onMounted, ref, watch, type Ref } from "vue";

export function useAnimatedNumber(
  target: Ref<number>,
  formatter: (value: number) => string,
  duration = 260,
) {
  const current = ref(target.value);
  const display = ref(formatter(target.value));
  let frame = 0;

  onMounted(() => {
    watch(target, (next) => {
      cancelAnimationFrame(frame);
      const from = current.value;
      const start = performance.now();
      const tick = (time: number) => {
        const progress = Math.min(1, (time - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 4);
        current.value = from + (next - from) * eased;
        display.value = formatter(current.value);
        if (progress < 1) frame = requestAnimationFrame(tick);
        else {
          current.value = next;
          display.value = formatter(next);
        }
      };
      frame = requestAnimationFrame(tick);
    }, { flush: "post" });
  });

  onBeforeUnmount(() => cancelAnimationFrame(frame));
  return display;
}
