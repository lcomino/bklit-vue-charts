# Bklit Vue Charts

An unofficial Vue 3 port of the open-source chart components from Bklit UI. The goal is to bring the same precise chart styling, animated hover behavior, and reusable building blocks to Vue applications.

This is a standalone project so it can later be consumed by Fillrate without coupling the chart library to the dashboard. The port is being built in milestones; this first preview includes reusable Cartesian charts, a pie chart, a rolling number, interactive legend toggles, and the animated tooltip foundation.

## Current status

| Component | Status |
| --- | --- |
| Line chart | Preview |
| Area chart | Preview |
| Bar chart | Preview |
| Composed chart | Preview |
| Pie chart | Preview |
| Ring / donut chart | Preview |
| Candlestick, funnel, gauge, radar, scatter, Sankey, heatmap, choropleth, sunburst | Planned |
| Brush, live chart, markers, reference areas, legends, tooltip/date ticker primitives | In progress |

## Development

```sh
npm install
npm run dev
```

## Usage

```vue
<script setup lang="ts">
import { BklitAreaChart } from "bklit-vue-charts";
import "bklit-vue-charts/style.css";

const series = [
  {
    id: "revenue",
    name: "Revenue",
    color: "#7355e8",
    data: [
      { label: "Mon", value: 18 },
      { label: "Tue", value: 31 },
      { label: "Wed", value: 23 },
    ],
  },
];
</script>

<template>
  <BklitAreaChart :series="series" :height="320" />
</template>
```

See `src/demo` for interactive examples. See [NOTICE.md](./NOTICE.md) for attribution and scope.
