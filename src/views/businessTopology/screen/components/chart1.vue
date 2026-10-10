<template>
  <div class="chart1-warp content-box">
    <div class="chart1-title-warp">
      <div class="chart-title">
        <div class="title-bg bg1" />
        <div class="title-text">
          <p>活跃负载数/总负载数</p>
          <p class="color1">{{ detail.allactive }}/{{ detail.allagents }}</p>
        </div>
      </div>
      <div class="line" />
      <div class="chart-title">
        <div class="title-bg bg2" />
        <div class="title-text">
          <p>正常访问数</p>
          <p class="color2">{{ detail.normal }}</p>
        </div>
      </div>
      <div class="line" />
      <div class="chart-title">
        <div class="title-bg bg3" />
        <div class="title-text">
          <p>异常访问数</p>
          <p class="color3">{{ detail.abnormal }}</p>
        </div>
      </div>
    </div>
    <Chart1Out />
  </div>
</template>

<script setup lang="ts" name="chart1">
import { onMounted, ref } from "vue";
import { getChart1Total } from "@/api/modules/screen";
import Chart1Out from "./chart1-out.vue";

const detail = ref<Record<string, any>>({
  allactive: 0,
  allagents: 0,
  normal: 0,
  abnormal: 0
});

onMounted(async () => {
  getDetail();
});

const getDetail = async () => {
  try {
    const res = await getChart1Total();
    detail.value = (res || {}).data || {};
  } catch (error) {
    console.log(`chart1数量统计错误: ${error}`);
  }
};
</script>

<style scoped lang="scss">
.chart1-warp {
  .chart1-title-warp {
    display: flex;
    align-items: center;
    justify-content: space-around;
    width: 100%;
    height: 105em;
    .chart-title {
      display: flex;
      justify-content: center;
    }
    .title-bg {
      width: 76em;
      height: 65em;
      background-size: 100%;
    }
    .bg1 {
      background: url("@/assets/images/screen/chart1-title-bg1.png") no-repeat 0 0 / 100% 100%;
    }
    .bg2 {
      background: url("@/assets/images/screen/chart1-title-bg2.png") no-repeat 0 0 / 100% 100%;
    }
    .bg3 {
      background: url("@/assets/images/screen/chart1-title-bg3.png") no-repeat 0 0 / 100% 100%;
    }
    .title-text {
      max-width: 210em;
      padding-left: 18em;
      color: #ffffff;
      p {
        max-width: 192em;
        overflow: hidden;
        font-size: 20em;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .color1 {
        font-size: 36em;
        color: #0dc59f;
      }
      .color2 {
        font-size: 36em;
        color: #28cfff;
      }
      .color3 {
        font-size: 36em;
        color: #ffa336;
      }
    }
    .line {
      width: 20em;
      height: 100%;
      background: url("@/assets/images/screen/chart1-line-bg.png") no-repeat center center / 3em 130%;
    }
  }
}
</style>
