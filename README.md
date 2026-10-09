# Bklit Vue Charts

An unofficial, Vue-native port of the open-source chart catalog from [Bklit UI](https://github.com/bklit/bklit-ui). It includes 17 chart families, reusable chart primitives, and the three chart stat-card blocks from the Bklit Blocks catalog. Components are built for Vue 3 and TypeScript; they do not require React or the upstream application.

This project is independent from Fillrate and can be installed by other Vue applications. The port follows the upstream visual and interaction patterns where practical, while using Vue props, emits, composables, and slots rather than copying React APIs. See [NOTICE.md](./NOTICE.md) for attribution and scope.

## Catalog

| Family | Components |
| --- | --- |
| Cartesian | `BklitLineChart`, `BklitAreaChart`, `BklitBarChart`, `BklitComposedChart` |
| Other charts | `BklitCandlestickChart`, `BklitChoroplethChart`, `BklitFunnelChart`, `BklitGauge`, `BklitHeatmapChart`, `BklitProfitLossLine`, `BklitRadarChart`, `BklitScatterChart`, `BklitSankeyChart`, `BklitSunburstChart`, `BklitLiveLineChart`, `BklitPieChart`, `BklitRingChart` |
| Blocks | `BklitAreaStatBlock`, `BklitLineStatBlock`, `BklitChoroplethStatBlock`, `BklitStatCard` |
| Utilities | `BklitChartLegend`, `BklitGrid`, `BklitBackground`, `BklitReferenceArea`, `BklitProjectionLine`, `BklitTooltip`, `BklitChartBrush`, `BklitXAxis`, `BklitYAxis`, `BklitCustomIndicator`, `useBklitChart` |

The line and area charts share an interactive crosshair, nearest-series selection, a rolling tooltip, a spring-like stroke highlight around the active point, and opacity reduction on non-active series. The stat-card blocks update their displayed value, period, and trend while hovering the chart. Pie and ring charts animate value changes and segment visibility.

## Install

Install directly from GitHub:

```sh
npm install github:lcomino/bklit-vue-charts
```

Vue 3 is a peer dependency. Import the stylesheet once in your app entry point:

```ts
import "bklit-vue-charts/style.css";
```

## Example

```vue
<script setup lang="ts">
import { BklitAreaChart } from "bklit-vue-charts";
import type { ChartSeries } from "bklit-vue-charts";

const series: ChartSeries[] = [{
  id: "revenue",
  name: "Revenue",
  color: "#7355e8",
  data: [
    { label: "Mon", value: 18 },
    { label: "Tue", value: 31 },
    { label: "Wed", value: 23 },
  ],
}];
</script>

<template>
  <BklitAreaChart :series="series" :height="320" />
</template>
```

For a block, pass values and the series used for its chart:

```vue
<BklitAreaStatBlock
  title="Total Revenue"
  :value="8100"
  :trend="17.4"
  :data="[42, 38, 47, 59, 68, 91]"
  :labels="['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']"
  :format-value="(value) => `$${value.toLocaleString()}`"
/>
```

## Development

```sh
npm install
npm run dev
```

The demo page shows every chart family and all three blocks. Run `npm run typecheck` to check declarations and `npm run build` to create the distributable bundle and type declarations.

## Port scope

The port is an independently maintained Vue implementation, not a line-for-line React API port. Choropleth currently accepts GeoJSON Polygon and MultiPolygon coordinates, with a simple fitted longitude/latitude projection; Sankey lays out a directed acyclic flow graph; and the remaining chart APIs are Vue-native equivalents. Complex projection systems, TopoJSON decoding, and upstream React-specific contexts are not included.
