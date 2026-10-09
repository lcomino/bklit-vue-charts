<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

export interface SankeyNode { id: string; name: string; color?: string }
export interface SankeyLink { source: string; target: string; value: number; color?: string }
const props = withDefaults(defineProps<{ nodes: SankeyNode[]; links: SankeyLink[]; height?: number; nodeWidth?: number }>(), { height: 360, nodeWidth: 14 });
const host = ref<HTMLDivElement | null>(null); const width = ref(720); const active = ref<string | null>(null); let observer: ResizeObserver | undefined;
onMounted(() => { if (host.value && typeof ResizeObserver !== "undefined") { observer = new ResizeObserver(([entry]) => { if (entry) width.value = Math.max(320, entry.contentRect.width); }); observer.observe(host.value); } });
onBeforeUnmount(() => observer?.disconnect());
const layout = computed(() => {
  const margin = { top: 18, right: 24, bottom: 18, left: 24 };
  const levels = new Map(props.nodes.map((node) => [node.id, 0]));
  for (let pass = 0; pass < props.nodes.length; pass += 1) props.links.forEach((link) => { if (levels.has(link.source) && levels.has(link.target)) levels.set(link.target, Math.max(levels.get(link.target)!, levels.get(link.source)! + 1)); });
  const maxLevel = Math.max(0, ...levels.values());
  const columns = Array.from({ length: maxLevel + 1 }, (_, level) => props.nodes.filter((node) => levels.get(node.id) === level));
  const plotHeight = props.height - margin.top - margin.bottom;
  const gap = 14;
  const incoming = new Map<string, number>(); const outgoing = new Map<string, number>();
  props.links.forEach((link) => { outgoing.set(link.source, (outgoing.get(link.source) ?? 0) + link.value); incoming.set(link.target, (incoming.get(link.target) ?? 0) + link.value); });
  const flowOf = (node: SankeyNode) => Math.max(incoming.get(node.id) ?? 0, outgoing.get(node.id) ?? 0, 1);
  const columnTotals = columns.map((nodes) => nodes.reduce((sum, node) => sum + flowOf(node), 0));
  const maxFlow = Math.max(1, ...columnTotals);
  const scale = (plotHeight - gap * Math.max(0, ...columns.map((nodes) => nodes.length - 1))) / maxFlow;
  const nodeHeight = (node: SankeyNode) => Math.max(6, flowOf(node) * scale);
  const nodeMap = new Map<string, { node: SankeyNode; x: number; y: number; width: number; height: number; level: number }>();
  columns.forEach((nodes, level) => {
    const totalHeight = nodes.reduce((sum, node) => sum + nodeHeight(node), 0) + Math.max(0, nodes.length - 1) * gap;
    let top = margin.top + Math.max(0, (plotHeight - totalHeight) / 2);
    nodes.forEach((node) => { const height = nodeHeight(node); nodeMap.set(node.id, { node, x: margin.left + level * ((width.value - margin.left - margin.right - props.nodeWidth) / Math.max(1, maxLevel)), y: top, width: props.nodeWidth, height, level }); top += height + gap; });
  });
  const sourceUsed = new Map<string, number>(); const targetUsed = new Map<string, number>();
  const links = props.links.flatMap((link, index) => {
    const source = nodeMap.get(link.source); const target = nodeMap.get(link.target); if (!source || !target) return [];
    const thickness = Math.max(2, link.value * scale);
    const sourceOffset = sourceUsed.get(link.source) ?? 0; const targetOffset = targetUsed.get(link.target) ?? 0;
    sourceUsed.set(link.source, sourceOffset + thickness); targetUsed.set(link.target, targetOffset + thickness);
    const sy = source.y + sourceOffset + thickness / 2; const ty = target.y + targetOffset + thickness / 2; const sx = source.x + source.width; const tx = target.x; const curve = Math.max(20, (tx - sx) * .48);
    return [{ ...link, index, thickness, d: `M${sx},${sy} C${sx + curve},${sy} ${tx - curve},${ty} ${tx},${ty}`, sourceNode: source, targetNode: target }];
  });
  return { nodes: [...nodeMap.values()], links };
});
</script>

<template>
  <div ref="host" class="bklit-chart bklit-sankey-wrap" :style="{ height: `${height}px` }">
    <svg class="bklit-sankey-svg" :viewBox="`0 0 ${width} ${height}`" role="img" aria-label="Diagrama Sankey" @pointerleave="active = null">
      <path v-for="link in layout.links" :key="link.index" :d="link.d" fill="none" :stroke="link.color ?? link.sourceNode.node.color ?? '#7355e8'" :stroke-width="link.thickness" stroke-linecap="round" :stroke-opacity="active && active !== link.source && active !== link.target ? .12 : active ? .65 : .3" class="bklit-sankey-link" @pointerenter="active = link.source" />
      <g v-for="item in layout.nodes" :key="item.node.id" class="bklit-sankey-node" @pointerenter="active = item.node.id">
        <rect :x="item.x" :y="item.y" :width="item.width" :height="item.height" rx="4" :fill="item.node.color ?? '#7355e8'" />
        <text :x="item.level === 0 ? item.x - 8 : item.x + item.width + 8" :y="item.y + item.height / 2 + 4" :text-anchor="item.level === 0 ? 'end' : 'start'">{{ item.node.name }}</text>
      </g>
    </svg>
  </div>
</template>
