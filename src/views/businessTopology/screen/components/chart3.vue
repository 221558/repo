<template>
  <itemHeader title="工作负载流量数Top10" />
  <el-carousel class="echart-warp" arrow="never">
    <el-carousel-item v-if="data.option1y?.length > 0">
      <ECharts :option="option1" />
    </el-carousel-item>
    <el-carousel-item v-if="data.option2y?.length > 0">
      <ECharts :option="option2" />
    </el-carousel-item>
  </el-carousel>
</template>

<script setup lang="ts" name="chart3">
import { onMounted, ref, computed, ComputedRef } from "vue";
import itemHeader from "./itemHeader.vue";
import { getChart3 } from "@/api/modules/screen";
import { ECOption } from "@/components/ECharts/config";
import ECharts from "@/components/ECharts/index.vue";
import { state } from "../state";

let data = ref<Record<string, any>>({});
const option1: ECOption | ComputedRef = computed(() => ({
  tooltip: {
    trigger: "axis",
    backgroundColor: "rgba(50, 50, 50, 0.7)",
    borderColor: "#333",
    textStyle: {
      color: "#B6BCC5"
    },
    axisPointer: {
      type: "shadow"
    }
  },
  legend: {
    textStyle: {
      color: "#819fcd"
    },
    top: `${20 * state.scale}`,
    right: `${5 * state.scale}`,
    itemHeight: `${5 * state.scale}`
  },
  grid: {
    containLabel: true,
    top: "20%",
    left: "5%",
    bottom: "0",
    right: "5%"
  },
  xAxis: [
    {
      type: "value",
      max: data.value.maxY,
      show: false
    }
  ],
  yAxis: [
    {
      type: "category",
      inverse: true,
      axisLine: {
        show: false
      },
      axisLabel: {
        color: "#819fcd"
      },
      axisTick: {
        show: false
      },
      data: data.value.option1y
    }
  ],
  series: [
    {
      name: "入站流量",
      type: "bar",
      barWidth: 14 * state.scale,
      stack: "A",
      itemStyle: {
        color: "#1698f0"
      },
      emphasis: {
        focus: "series"
      },
      data: data.value.option1in
    },
    {
      name: "出站流量",
      type: "bar",
      stack: "A",
      itemStyle: {
        color: "#25d390"
      },
      emphasis: {
        focus: "series"
      },
      data: data.value.option1out
    }
  ]
}));

const option2: ECOption | ComputedRef = computed(() => ({
  tooltip: {
    trigger: "axis",
    backgroundColor: "rgba(50, 50, 50, 0.7)",
    borderColor: "#333",
    textStyle: {
      color: "#B6BCC5"
    },
    axisPointer: {
      type: "shadow"
    }
  },
  legend: {
    textStyle: {
      color: "#819fcd"
    },
    top: `${20 * state.scale}`,
    right: `${5 * state.scale}`,
    itemHeight: `${5 * state.scale}`
  },
  grid: {
    containLabel: true,
    top: "20%",
    left: "5%",
    bottom: "0",
    right: "5%"
  },
  xAxis: [
    {
      type: "value",
      max: data.value.maxY,
      show: false
    }
  ],
  yAxis: [
    {
      type: "category",
      inverse: true,
      axisLine: {
        show: false
      },
      axisLabel: {
        color: "#819fcd"
      },
      axisTick: {
        show: false
      },
      data: data.value.option2y
    }
  ],
  series: [
    {
      name: "入站流量",
      type: "bar",
      barWidth: 14 * state.scale,
      stack: "A",
      itemStyle: {
        color: "#1698f0"
      },
      emphasis: {
        focus: "series"
      },
      data: data.value.option2in
    },
    {
      name: "出站流量",
      type: "bar",
      stack: "A",
      itemStyle: {
        color: "#25d390"
      },
      emphasis: {
        focus: "series"
      },
      data: data.value.option2out
    }
  ]
}));

onMounted(async () => {
  let option1y: string[] = [];
  let option1in: number[] = [];
  let option1out: number[] = [];
  let option2y: string[] = [];
  let option2in: number[] = [];
  let option2out: number[] = [];
  let total: number[] = [];
  try {
    const res = await getChart3();
    const affected_items = ((res || {}).data || {}).affected_items ?? [];
    affected_items.slice(0, 5).forEach(item => {
      option1y.push(item.ip);
      option1in.push(item.in_num);
      option1out.push(item.out_num);
      total.push(item.total_num);
    });
    affected_items.slice(5, 10).forEach(item => {
      option2y.push(item.ip);
      option2in.push(item.in_num);
      option2out.push(item.out_num);
      total.push(item.total_num);
    });
  } catch (error) {
    console.log(`chart3查询错误: ${error}`);
  }

  data.value = {
    option1y,
    option1in,
    option1out,
    option2y,
    option2in,
    option2out,
    maxY: total.length > 0 ? total[0] : 0
  };
});
</script>

<style scoped lang="scss">
.echart-warp {
  height: calc(100% - 60em);
}
</style>
