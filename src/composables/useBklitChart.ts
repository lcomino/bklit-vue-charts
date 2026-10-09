import { computed, ref, toValue, type MaybeRefOrGetter } from "vue";
import type { ChartSeries } from "../types";

export function useBklitChart(source: MaybeRefOrGetter<ChartSeries[]>) {
  const activeLabel = ref<string | null>(null);
  const activeSeriesId = ref<string | null>(null);
  const hiddenSeries = ref(new Set<string>());
  const series = computed(() => toValue(source));
  const visibleSeries = computed(() => series.value.filter((item) => !hiddenSeries.value.has(item.id)));
  const labels = computed(() => [...new Set(series.value.flatMap((item) => item.data.map((point) => point.label)))]);
  function setHover(label: string | null, seriesId: string | null = null) { activeLabel.value = label; activeSeriesId.value = label ? seriesId : null; }
  function toggleSeries(id: string) { const next = new Set(hiddenSeries.value); next.has(id) ? next.delete(id) : next.add(id); hiddenSeries.value = next; }
  const rowsAtActiveLabel = computed(() => activeLabel.value ? visibleSeries.value.flatMap((item) => { const point = item.data.find((entry) => entry.label === activeLabel.value); return point ? [{ series: item, point }] : []; }) : []);
  return { activeLabel, activeSeriesId, hiddenSeries, series, visibleSeries, labels, rowsAtActiveLabel, setHover, toggleSeries };
}
