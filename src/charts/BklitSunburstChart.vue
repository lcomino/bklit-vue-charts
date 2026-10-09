<script setup lang="ts">
import { computed, ref } from "vue";
import { arc as d3Arc } from "d3-shape";
import { chartPalette } from "../types";

export interface SunburstNode { name: string; value?: number; color?: string; children?: SunburstNode[] }
const props = withDefaults(defineProps<{ data: SunburstNode; size?: number; innerRadius?: number; formatValue?: (value: number) => string }>(), {
  size: 360, innerRadius: 48, formatValue: (value: number) => value.toLocaleString(),
});
const focusPath = ref<SunburstNode[]>([]); const hoveredName = ref<string | null>(null);
const root = computed(() => focusPath.value.at(-1) ?? props.data);
function nodeValue(node: SunburstNode): number { return node.children?.length ? node.children.reduce((sum, item) => sum + nodeValue(item), 0) : Math.max(0, node.value ?? 0); }
const sectors = computed(() => {
  const result: Array<{ node: SunburstNode; name: string; value: number; start: number; end: number; depth: number; color: string }> = [];
  const layout = (nodes: SunburstNode[], start: number, end: number, depth: number) => {
    const total = nodes.reduce((sum, node) => sum + nodeValue(node), 0) || 1;
    let angle = start;
    nodes.forEach((node, index) => {
      const span = (end - start) * nodeValue(node) / total;
      const next = angle + span;
      const color = node.color ?? chartPalette[(index + depth) % chartPalette.length]!;
      result.push({ node, name: node.name, value: nodeValue(node), start: angle, end: next, depth, color });
      if (node.children?.length && depth < 3) layout(node.children, angle, next, depth + 1);
      angle = next;
    });
  };
  layout(root.value.children ?? [root.value], -Math.PI / 2, 3 * Math.PI / 2, 0);
  return result;
});
const radius = computed(() => props.size / 2 - 8);
const band = computed(() => Math.max(22, (radius.value - props.innerRadius) / 3));
function path(sector: typeof sectors.value[number]) { return d3Arc<unknown>().innerRadius(props.innerRadius + sector.depth * band.value).outerRadius(Math.min(radius.value, props.innerRadius + (sector.depth + 1) * band.value - 2)).padAngle(.006).cornerRadius(2)({ startAngle: sector.start, endAngle: sector.end } as never) ?? ""; }
function descend(node: SunburstNode) { if (node.children?.length) focusPath.value = [...focusPath.value, node]; }
const total = computed(() => nodeValue(root.value));
</script>

<template>
  <div class="bklit-sunburst-wrap">
    <nav v-if="focusPath.length" class="bklit-sunburst-breadcrumb" aria-label="Navegação hierárquica"><button @click="focusPath = []">{{ data.name }}</button><template v-for="(item, index) in focusPath" :key="index"><span> / </span><button @click="focusPath = focusPath.slice(0, index + 1)">{{ item.name }}</button></template></nav>
    <svg class="bklit-sunburst-svg" :viewBox="`0 0 ${size} ${size}`" role="img" aria-label="Gráfico sunburst" @pointerleave="hoveredName = null">
      <g :transform="`translate(${size / 2} ${size / 2})`">
        <path v-for="(sector, index) in sectors" :key="`${sector.name}-${sector.depth}-${index}`" :d="path(sector)" :fill="sector.color" :fill-opacity="hoveredName && hoveredName !== sector.name ? .28 : .86" stroke="white" stroke-width="1.2" class="bklit-sunburst-sector" @pointerenter="hoveredName = sector.name" @click="descend(sector.node)" />
        <circle :r="innerRadius - 2" fill="white" />
        <text y="-3" text-anchor="middle" class="bklit-sunburst-center-label">{{ hoveredName ?? root.name }}</text>
        <text y="18" text-anchor="middle" class="bklit-sunburst-center-value">{{ formatValue(total) }}</text>
      </g>
    </svg>
  </div>
</template>
