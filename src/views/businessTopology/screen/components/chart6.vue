<template>
  <itemHeader title="工作负载标签Top10" />
  <div class="tab">
    <itemButton text="位置" @click="changeTab('loc')" :class="isActive === 'loc' ? 'active' : ''" />
    <itemButton text="组织" @click="changeTab('org')" :class="isActive === 'org' ? 'active' : ''" />
    <itemButton text="业务" @click="changeTab('business')" :class="isActive === 'business' ? 'active' : ''" />
    <itemButton text="组件" @click="changeTab('com')" :class="isActive === 'com' ? 'active' : ''" />
  </div>
  <el-carousel class="echart-warp" arrow="never">
    <el-carousel-item v-if="data.option1y?.length > 0">
      <ECharts :option="option1" />
    </el-carousel-item>
    <el-carousel-item v-if="data.option2y?.length > 0">
      <ECharts :option="option2" />
    </el-carousel-item>
  </el-carousel>
</template>

<script setup lang="ts" name="chart6">
import itemHeader from "./itemHeader.vue";
import itemButton from "./itemButton.vue";
import { ref, onMounted, computed, ComputedRef } from "vue";
import { getChart6 } from "@/api/modules/screen";
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
    show: false
  },
  grid: {
    containLabel: true,
    top: "0",
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
      name: "使用频率",
      type: "bar",
      barWidth: 14 * state.scale,
      itemStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 1,
          y2: 0,
          colorStops: [
            {
              offset: 0,
              color: "#143751" // 0% 处的颜色
            },
            {
              offset: 1,
              color: "#4accee" // 100% 处的颜色
            }
          ],
          global: false // 缺省为 false
        },
        borderRadius: 5 * state.scale
      },
      emphasis: {
        focus: "series"
      },
      data: data.value.option1
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
    show: false
  },
  grid: {
    containLabel: true,
    top: "0",
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
      name: "使用频率",
      type: "bar",
      barWidth: 14 * state.scale,
      itemStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 1,
          y2: 0,
          colorStops: [
            {
              offset: 0,
              color: "#143751" // 0% 处的颜色
            },
            {
              offset: 1,
              color: "#4accee" // 100% 处的颜色
            }
          ],
          global: false // 缺省为 false
        },
        borderRadius: 5 * state.scale
      },
      emphasis: {
        focus: "series"
      },
      data: data.value.option2
    }
  ]
}));
const isActive = ref("loc");

onMounted(() => {
  getData();
});

const getData = async () => {
  let option1y: string[] = [];
  let option1: number[] = [];
  let option2y: string[] = [];
  let option2: number[] = [];
  let total: number[] = [];
  try {
    const res: Record<string, any> = await getChart6({ lables_type: isActive.value });
    const detail = (res || {}).data;

    detail.slice(0, 5).forEach((item: Record<string, any>) => {
      option1y.push(item.name);
      option1.push(item.frequency);
      total.push(item.frequency);
    });
    detail.slice(5, 10).forEach((item: Record<string, any>) => {
      option2y.push(item.name);
      option2.push(item.frequency);
      total.push(item.frequency);
    });
  } catch (error) {
    console.log(`chart6查询错误: ${error}`);
  }
  data.value = {
    option1y,
    option1,
    option2y,
    option2,
    maxY: total.length > 0 ? total[0] : 0
  };
};

const changeTab = (type: string) => {
  isActive.value = type;
  getData();
};
</script>
<style scoped lang="scss">
.tab {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin: 15em;
  div {
    flex-grow: 1;
    margin: 0 10em;
  }
  .active {
    color: rgb(94 211 249 / 80%);
    background: url("@/assets/images/screen/item-button-bg-2.png") no-repeat 0 0 / 100% 100%;
  }
}
.echart-warp {
  height: calc(100% - 130em);
}
</style>
