<template>
  <itemHeader title="历史访问数趋势" />
  <div class="echart-warp">
    <ECharts :option="option" />
  </div>
</template>

<script setup lang="ts" name="chart8">
import { computed, onMounted, ref, ComputedRef } from "vue";
import itemHeader from "./itemHeader.vue";
import { ECOption } from "@/components/ECharts/config";
import ECharts from "@/components/ECharts/index.vue";
import { state } from "../state";
import { getChart8 } from "@/api/modules/screen";

let data = ref<Record<string, any>>({});
const option: ECOption | ComputedRef = computed(() => ({
  color: ["#20E7F0", "#FFB011"],
  tooltip: {
    trigger: "axis",
    backgroundColor: "rgba(50, 50, 50, 0.7)",
    borderColor: "#333",
    textStyle: {
      color: "#B6BCC5"
    }
  },
  legend: {
    textStyle: {
      color: "#819fcd"
    },
    top: `${20 * state.scale}`,
    right: `${5 * state.scale}`,
    itemWidth: `${25 * state.scale}`,
    itemHeight: `${10 * state.scale}`,
    icon: "circle"
  },
  grid: {
    containLabel: true,
    top: "20%",
    left: "5%",
    bottom: "2%",
    right: "5%"
  },
  yAxis: {
    type: "value",
    axisLabel: {
      color: "#B6BCC5"
    },
    splitLine: {
      lineStyle: {
        color: "#45546F"
      }
    }
  },
  xAxis: {
    type: "category",
    data: data.value.optionX,
    axisLabel: {
      color: "#B6BCC5"
    }
  },
  series: [
    {
      name: "正常访问数",
      type: "line",
      data: data.value.normal,
      lineStyle: {
        color: "#20E7F0"
      },
      areaStyle: {
        color: "rgba(32, 231, 240, 0.4)"
      }
    },
    {
      name: "异常访问数",
      type: "line",
      data: data.value.abnormal,
      lineStyle: {
        color: "#FFB011"
      },
      areaStyle: {
        color: "rgba(255, 176, 17, 0.4)"
      }
    }
  ]
}));

onMounted(async () => {
  let optionX: string[] = [];
  let normal: number[] = [];
  let abnormal: number[] = [];
  try {
    const res: Record<string, any> = await getChart8();
    const detail = (res || {}).data;
    detail.forEach((item: Record<string, any>) => {
      optionX.push(item.date);
      normal.push(item.total);
      abnormal.push(item.drop_total);
    });
  } catch (error) {
    console.log(`chart8查询错误: ${error}`);
  }

  data.value = {
    optionX,
    normal,
    abnormal
  };
});
</script>

<style scoped lang="scss">
.echart-warp {
  height: calc(100% - 60em);
}
</style>
