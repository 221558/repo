<template>
  <itemHeader title="工作负载属性" />
  <div class="echart-warp">
    <div class="box"><ECharts :option="option1" /></div>
    <div class="box"><ECharts :option="option2" /></div>
  </div>
</template>

<script setup lang="ts" name="chart2">
import { onMounted, ref, computed, ComputedRef } from "vue";
import itemHeader from "./itemHeader.vue";
import { getChart2 } from "@/api/modules/screen";
import { ECOption } from "@/components/ECharts/config";
import ECharts from "@/components/ECharts/index.vue";
import { firstUpperCase } from "@/utils";
import { state } from "../state";

let data = ref<Record<string, any>>({});
const option1: ECOption | ComputedRef = computed(() => ({
  title: {
    text: "工作负载类型分布",
    left: "center",
    bottom: `40%`,
    textStyle: {
      color: "#ACB1B9",
      fontSize: `${20 * state.scale}`
    }
  },
  tooltip: {
    trigger: "item",
    backgroundColor: "rgba(50, 50, 50, 0.7)",
    borderColor: "#333",
    textStyle: {
      color: "#ACB1B9"
    }
  },
  legend: {
    type: "scroll",
    textStyle: {
      color: "#819fcd"
    },
    orient: "vertical",
    left: "center",
    top: "58%",
    bottom: `${20 * state.scale}`,
    itemWidth: `${25 * state.scale}`,
    itemHeight: `${10 * state.scale}`,
    pageButtonGap: `${5 * state.scale}`,
    pageIconSize: `${10 * state.scale}`,
    pageTextStyle: {
      color: "#819fcd"
    },
    icon: "circle"
  },
  grid: {
    containLabel: true,
    top: "0%",
    left: "5%",
    bottom: "0",
    right: "5%"
  },
  series: [
    {
      name: "工作负载类型分布",
      type: "pie",
      center: ["50%", "27%"],
      radius: ["30%", "55%"],
      label: {
        show: false
      },
      data: data.value.option1
    }
  ]
}));

const option2: ECOption | ComputedRef = computed(() => ({
  title: {
    text: "操作系统分布",
    left: "center",
    bottom: `40%`,
    textStyle: {
      color: "#ACB1B9",
      fontSize: `${20 * state.scale}`
    }
  },
  tooltip: {
    trigger: "item",
    backgroundColor: "rgba(50, 50, 50, 0.7)",
    borderColor: "#333",
    textStyle: {
      color: "#B6BCC5"
    }
  },
  legend: {
    type: "scroll",
    textStyle: {
      color: "#819fcd"
    },
    orient: "vertical",
    left: "center",
    top: "58%",
    bottom: `${20 * state.scale}`,
    itemWidth: `${25 * state.scale}`,
    itemHeight: `${10 * state.scale}`,
    pageButtonGap: `${5 * state.scale}`,
    pageIconSize: `${10 * state.scale}`,
    pageTextStyle: {
      color: "#819fcd"
    },
    icon: "circle"
  },
  grid: {
    containLabel: true,
    top: "0%",
    left: "5%",
    bottom: "0",
    right: "5%"
  },
  series: [
    {
      name: "操作系统分布",
      type: "pie",
      center: ["50%", "27%"],
      radius: ["30%", "55%"],
      label: {
        show: false
      },
      data: data.value.option2
    }
  ]
}));

onMounted(async () => {
  let option1: Record<string, any>[] = [],
    option2: Record<string, any>[] = [];
  try {
    const res = await getChart2();
    const dataRes: Record<string, any> = (res || {}).data || {};
    Object.keys(dataRes).forEach((key: string) => {
      const option1Keys: Record<string, string> = {
        type_normal: "主机",
        type_pod: "容器"
      };
      if (Object.keys(option1Keys).includes(key)) {
        option1.push({ value: dataRes[key], name: option1Keys[key] });
      } else {
        option2.push({ value: dataRes[key], name: firstUpperCase(key) });
      }
    });
  } catch (error) {
    console.log(`chart2查询错误: ${error}`);
  }
  data.value = {
    option1,
    option2
  };
});
</script>

<style scoped lang="scss">
.echart-warp {
  display: flex;
  height: calc(100% - 60em);
  .box {
    width: 50%;
  }
}
</style>
