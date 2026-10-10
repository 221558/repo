<template>
  <div class="content-box">
    <div
      id="screen-warp"
      class="screen-warp"
      :class="{ 'full-screen': isFullScreen, 'screen-detail': state.chartType === 'in' }"
      ref="screenWarpRef"
    >
      <!-- <el-tooltip effect="dark" :content="isFullScreen ? '退出全屏' : '全屏展示'" :auto-close="3000">
        <el-button :icon="isFullScreen ? Crop : FullScreen" type="primary" class="full-btn" @click="changeFull" />
      </el-tooltip> -->
      <el-tooltip effect="dark" content="关闭大屏" :auto-close="3000">
        <el-button :icon="CloseBold" type="primary" class="full-btn" @click="closeLarge" />
      </el-tooltip>
      <div class="screen-contain content-box" ref="screenRef">
        <div class="screen-title" />
        <div class="screen-box">
          <div class="screen-out" v-if="state.chartType === 'out'">
            <div class="col-warp">
              <div class="item-warp">
                <Chart2 />
              </div>
              <div class="item-warp">
                <chart3 />
              </div>
              <div class="item-warp">
                <chart4 />
              </div>
            </div>
            <div class="col-center-warp">
              <div class="item-topology-warp">
                <chart1 />
              </div>
              <div class="item-center-warp">
                <chart8 />
              </div>
            </div>
            <div class="col-warp">
              <div class="item-warp">
                <chart5 />
              </div>
              <div class="item-warp">
                <chart6 />
              </div>
              <div class="item-warp">
                <chart9 />
              </div>
            </div>
          </div>
          <chart1Detail v-if="state.chartType === 'in'" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="screen">
import { ref, onBeforeMount, onMounted, onBeforeUnmount } from "vue";
// import { FullScreen, Crop } from "@element-plus/icons-vue";
import { CloseBold } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import { state, createState } from "./state";
import chart1 from "./components/chart1.vue";
import chart1Detail from "./components/chart1-detail.vue";
import Chart2 from "./components/chart2.vue";
import chart3 from "./components/chart3.vue";
import chart4 from "./components/chart4.vue";
import chart5 from "./components/chart5.vue";
import chart6 from "./components/chart6.vue";
// import chart7 from "./components/chart7.vue"; // 安全管理告警
import chart8 from "./components/chart8.vue";
import chart9 from "./components/chart9.vue";

onBeforeMount(async () => {
  Object.assign(state, createState());
});

const screenWarpRef = ref<HTMLElement | null>(null);
const screenRef = ref<HTMLElement | null>(null);
let isFullScreen = ref(false);
const router = useRouter();

onMounted(() => {
  resize();
  window.addEventListener("resize", resize);
});

// 设置响应式
const resize = () => {
  state.scale = getScale();
  if (screenRef.value) {
    screenRef.value.style.fontSize = getScale() + "px";
  }
};

// 根据浏览器大小推断缩放比例
const getScale = (width = 1920, height = 1365) => {
  const warpWidth = screenWarpRef.value?.clientWidth ?? 0;
  const warpHeight = screenWarpRef.value?.clientHeight ?? 0;
  let ww = warpWidth / width;
  let wh = warpHeight / height;
  return Math.min(ww, wh);
};

// const changeFull = () => {
//   isFullScreen.value = !isFullScreen.value;
//   nextTick(() => {
//     const myEvent = new Event("resize");
//     window.dispatchEvent(myEvent);
//   });
// };

const closeLarge = () => {
  router.back();
};

onBeforeUnmount(() => {
  window.removeEventListener("resize", resize);
});
</script>

<style scoped lang="scss">
.screen-warp {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-around;
  width: 100%;
  height: 100%;
  background: url("@/assets/images/screen/background.png") no-repeat 0 0 / 100% 100%;
}
.screen-detail {
  background: url("@/assets/images/screen/detail-bg.png") no-repeat 0 0 / 100% 100%;
}
.full-screen {
  position: fixed;
  inset: 0;
}
.screen-contain {
  flex-shrink: 0;
  width: 1920em;
  height: 1365em;
  .screen-title {
    width: 100%;
    height: 86em;
    background: url("@/assets/images/screen/title-bg.png") no-repeat center 0 / auto 100%;
  }
  .screen-box {
    flex-grow: 1;
    width: 100%;
    padding: 50em 25em 33em;
  }
  .screen-out {
    display: flex;
    justify-content: space-between;
    height: 100%;
  }
  .col-warp {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 460em;
  }
  .col-center-warp {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 920em;
  }
  .item-warp {
    width: 100%;
    height: 370em;
    background: url("@/assets/images/screen/item-bg.png") no-repeat 0 0 / 100% 100%;
  }
  .item-topology-warp {
    width: 100%;
    height: 783em;
  }
  .item-center-warp {
    width: 100%;
    height: 370em;
    background: url("@/assets/images/screen/item-center-bg.png") no-repeat 0 0 / 100% 100%;
  }
}
.full-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
  background: transparent;
  border: none;
}
</style>

<style lang="scss">
.screen-warp {
  .el-carousel__container {
    height: 100%;
  }
}
</style>
