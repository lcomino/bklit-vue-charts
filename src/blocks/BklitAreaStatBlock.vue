<script setup lang="ts">
import BklitStatCard from "./BklitStatCard.vue";
withDefaults(defineProps<{ title?: string; value: number; data: number[]; labels?: string[]; trend?: number; color?: string; formatValue?: (value: number) => string }>(), { title: "Total Revenue", trend: 12.4, color: "#7355e8", formatValue: (value: number) => value.toLocaleString() });
</script>
<template><BklitStatCard :title="title" :value="value" :data="data" :labels="labels" :trend="trend" :color="color" variant="area" average-label="Avg" :format-value="formatValue" /></template>
