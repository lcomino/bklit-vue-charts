<script setup lang="ts">
import { ref, watch } from "vue";
export interface ChartLegendItem { id: string; label: string; color: string; kind?: "line" | "area" | "bar" }
const props = withDefaults(defineProps<{ items: ChartLegendItem[]; modelValue?: string[]; compact?: boolean }>(), { modelValue: undefined, compact: false });
const emit = defineEmits<{ "update:modelValue": [value: string[]]; change: [id: string, visible: boolean] }>();
const internalVisible = ref(new Set(props.modelValue ?? props.items.map((item) => item.id)));
watch(() => props.modelValue, (value) => { if (value) internalVisible.value = new Set(value); });
watch(() => props.items.map((item) => item.id), (ids) => { const next = new Set([...internalVisible.value].filter((id) => ids.includes(id))); ids.forEach((id) => { if (!internalVisible.value.has(id) && props.modelValue === undefined) next.add(id); }); internalVisible.value = next; });
function isVisible(id: string) { return props.modelValue?.includes(id) ?? internalVisible.value.has(id); }
function toggle(id: string) { const current = new Set(props.modelValue ?? internalVisible.value); const visible = !current.has(id); visible ? current.add(id) : current.delete(id); if (props.modelValue === undefined) internalVisible.value = current; emit("update:modelValue", [...current]); emit("change", id, visible); }
</script>

<template><div class="bklit-legend" :class="{ 'is-compact': compact }" role="group" aria-label="Séries do gráfico"><button v-for="item in items" :key="item.id" type="button" class="bklit-legend-item" :class="{ 'is-muted': !isVisible(item.id) }" :aria-pressed="isVisible(item.id)" @click="toggle(item.id)"><span class="bklit-legend-marker" :class="{ 'is-line': item.kind === 'line' }" :style="{ '--series-color': item.color }" />{{ item.label }}</button></div></template>
