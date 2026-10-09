<script setup lang="ts">
import { computed, ref, watch } from "vue";

export interface ChartBrushSelection { start: number; end: number }
const props = withDefaults(defineProps<{ labels: string[]; width?: number; height?: number; modelValue?: ChartBrushSelection; minSpan?: number }>(), { width: 720, height: 42, modelValue: undefined, minSpan: 1 });
const emit = defineEmits<{ "update:modelValue": [value: ChartBrushSelection]; select: [value: ChartBrushSelection] }>();
const selection = ref<ChartBrushSelection>(props.modelValue ?? { start: 0, end: Math.max(0, props.labels.length - 1) });
watch(() => props.modelValue, (value) => { if (value) selection.value = value; });
watch(() => props.labels.length, (length) => { selection.value = { start: Math.min(selection.value.start, Math.max(0, length - 1)), end: Math.min(selection.value.end, Math.max(0, length - 1)) }; });
const dragging = ref(false); const dragStart = ref(0); const dragEnd = ref(0);
const maxIndex = computed(() => Math.max(0, props.labels.length - 1));
const range = computed(() => dragging.value ? { start: Math.min(dragStart.value, dragEnd.value), end: Math.max(dragStart.value, dragEnd.value) } : selection.value);
const xFor = (index: number) => maxIndex.value ? index / maxIndex.value * props.width : props.width / 2;
function indexAt(event: PointerEvent) { const rect = (event.currentTarget as SVGElement).getBoundingClientRect(); return Math.round(Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width))) * maxIndex.value); }
function start(event: PointerEvent) { dragging.value = true; dragStart.value = indexAt(event); dragEnd.value = dragStart.value; (event.currentTarget as SVGElement).setPointerCapture?.(event.pointerId); }
function move(event: PointerEvent) { if (dragging.value) dragEnd.value = indexAt(event); }
function finish(event: PointerEvent) { if (!dragging.value) return; dragEnd.value = indexAt(event); dragging.value = false; const span = Math.max(props.minSpan, Math.abs(dragEnd.value - dragStart.value)); const start = Math.min(dragStart.value, dragEnd.value); const value = { start, end: Math.min(maxIndex.value, start + span) }; selection.value = value; emit("update:modelValue", value); emit("select", value); }
</script>

<template><svg class="bklit-chart-brush" :viewBox="`0 0 ${width} ${height}`" role="slider" aria-label="Selecionar intervalo do gráfico" :aria-valuemin="range.start" :aria-valuemax="range.end" tabindex="0" @pointerdown="start" @pointermove="move" @pointerup="finish" @pointercancel="finish"><rect width="100%" height="100%" rx="5" class="bklit-chart-brush-track" /><rect :x="xFor(range.start)" y="3" :width="Math.max(2, xFor(range.end) - xFor(range.start))" :height="height - 6" rx="4" class="bklit-chart-brush-selection" /><line :x1="xFor(range.start)" :x2="xFor(range.start)" y1="2" :y2="height - 2" class="bklit-chart-brush-handle" /><line :x1="xFor(range.end)" :x2="xFor(range.end)" y1="2" :y2="height - 2" class="bklit-chart-brush-handle" /></svg></template>
