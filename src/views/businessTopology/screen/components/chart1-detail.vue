<template>
  <div class="chart1-detail-warp content-box" id="chart1-detail-warp">
    <span class="detail-back" @click="toBack" />
    <div class="current-warp">
      <swiper
        :slides-per-view="5"
        :centered-slides="true"
        :space-between="30"
        :navigation="true"
        :mousewheel="true"
        :slide-to-clicked-slide="true"
        :modules="modules"
        :initial-slide="initialGrout"
        class="swiper-current"
      >
        <swiper-slide v-for="(item, index) in groupList" :key="`currentGroups_${index}`">
          <div
            class="group-warp"
            :class="{ 'current-group-warp': item.id === state.selectedGroup.name }"
            @click="selectGroup(item)"
          >
            <span>{{ item.label }}</span>
          </div>
        </swiper-slide>
      </swiper>
    </div>
    <div class="detail-warp" id="detail-warp">
      <div class="group-list-warp">
        <swiper
          :direction="'vertical'"
          :slides-per-view="5"
          :centered-slides="true"
          :space-between="30"
          :navigation="true"
          :mousewheel="true"
          :slide-to-clicked-slide="true"
          :modules="modules"
          :initial-slide="initialIn"
          class="swiper-current"
        >
          <swiper-slide v-for="(item, index) in inGroupList" :key="`inGroupList_${index}`">
            <div
              class="group-in-warp"
              :class="{ 'group-in-warp-active': item.id === state.selectInGroup }"
              @click="selectedInGroup(item)"
            >
              <div class="group-in" />
              <span>{{ item.label }}</span>
            </div>
          </swiper-slide>
        </swiper>
      </div>
      <chart1Topology />
      <div class="group-list-warp">
        <swiper
          :direction="'vertical'"
          :slides-per-view="5"
          :centered-slides="true"
          :space-between="30"
          :navigation="true"
          :mousewheel="true"
          :slide-to-clicked-slide="true"
          :modules="modules"
          :initial-slide="initialOut"
          class="swiper-current"
        >
          <swiper-slide v-for="(item, index) in outGroupList" :key="`outGroupList_${index}`">
            <div
              class="group-in-warp"
              :class="{ 'group-in-warp-active': item.id === state.selectOutGroup }"
              @click="selectedOutGroup(item)"
            >
              <div class="group-in" />
              <span>{{ item.label }}</span>
            </div>
          </swiper-slide>
        </swiper>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="chart1-detail">
import { onBeforeMount, onUnmounted, ref } from "vue";
import chart1Topology from "./chart1-topology.vue";
import { Swiper, SwiperSlide } from "swiper/vue"; // swiper 所需组件
import { Mousewheel, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import mittBus from "@/utils/mittBus";
import { state } from "../state";
import { getChart1TopologyGroup } from "@/api/modules/screen";

const groupList = ref<Record<string, any>[]>([]);
const modules = [Mousewheel, Navigation];
const inGroupList = ref<Record<string, any>[]>([]);
const outGroupList = ref<Record<string, any>[]>([]);
const initialGrout = ref<number>(0);
const initialIn = ref<number>(2);
const initialOut = ref<number>(2);

onBeforeMount(async () => {
  getCurrentGroups();
  await getInOutGroups();
  mittBus.emit("initTopology");
});

const getCurrentGroups = () => {
  groupList.value = state.groupList.map((group: Record<string, any>) => ({
    id: group.name,
    label: group.show_name ?? group.name
  }));
  initialGrout.value = state.groupList.findIndex((group: Record<string, any>) => group.name === state.selectedGroup.name);
};

const getInOutGroups = async () => {
  try {
    const res = await getChart1TopologyGroup({ group_name: state.selectedGroup.name });
    const l = (((res || {}).data || {}).affected_items || [])[0] ?? {};
    let inGroup: Record<string, any>[] = [];
    let outGroup: Record<string, any>[] = [];

    // 正常入流量
    const inPacketArr = l.in_packet && l.in_packet !== "empty" ? l.in_packet.split(",") : [];
    inPacketArr.forEach((group: String) => {
      const item = {
        id: group.split(":")[0],
        label: group.split(":")[1]
      };
      if (!inGroup.find((k: Record<string, any>) => k.id === item.id)) {
        inGroup.push(item);
      }
    });
    // 异常入流量
    const inDropArr = l.in_drop && l.in_drop !== "empty" ? l.in_drop.split(",") : [];
    inDropArr.forEach((group: String) => {
      const item = {
        id: group.split(":")[0],
        label: group.split(":")[1]
      };
      if (!inGroup.find((k: Record<string, any>) => k.id === item.id)) {
        inGroup.push(item);
      }
    });

    // 正常出流量
    const outPacketArr = l.out_packet && l.out_packet !== "empty" ? l.out_packet.split(",") : [];
    outPacketArr.forEach((group: String) => {
      const item = {
        id: group.split(":")[0],
        label: group.split(":")[1]
      };
      if (!outGroup.find((k: Record<string, any>) => k.id === item.id)) {
        outGroup.push(item);
      }
    });
    // 异常出流量
    const outDropArr = l.out_drop && l.out_drop !== "empty" ? l.out_drop.split(",") : [];
    outDropArr.forEach((group: String) => {
      const item = {
        id: group.split(":")[0],
        label: group.split(":")[1]
      };
      if (!outGroup.find((k: Record<string, any>) => k.id === item.id)) {
        outGroup.push(item);
      }
    });

    inGroupList.value = inGroup;
    outGroupList.value = outGroup;
    state.selectInGroup = inGroup.length > 2 ? inGroup[2].id : inGroup.length > 0 ? inGroup[inGroup.length - 1].id : "";
    state.selectOutGroup = outGroup.length > 2 ? outGroup[2].id : outGroup.length > 0 ? outGroup[outGroup.length - 1].id : "";
  } catch (error) {
    console.log(`组间流量错误: ${error}`);
  }
};

const selectGroup = async (item: Record<string, any>) => {
  state.selectedGroup = {
    name: item.id,
    show_name: item.label
  };
  await getInOutGroups();
  mittBus.emit("buildTopology");
};

const selectedInGroup = (item: Record<string, any>) => {
  state.selectInGroup = item.id;
  mittBus.emit("buildTopology");
};

const selectedOutGroup = (item: Record<string, any>) => {
  state.selectOutGroup = item.id;
  mittBus.emit("buildTopology");
};

const toBack = () => {
  state.selectedGroup = {};
  state.chartType = "out";
  state.selectInGroup = "";
  state.selectOutGroup = "";
};

onUnmounted(() => {
  mittBus.off("setDetailHeight");
});
</script>

<style scoped lang="scss">
.chart1-detail-warp {
  position: relative;
  height: 1196em;
  padding: 0 60em;
  .detail-back {
    position: absolute;
    top: 0;
    left: 0;
    display: block;
    width: 46em;
    height: 105em;
    cursor: pointer;
    background: url("@/assets/images/screen/detail-back.png") no-repeat 0 0 / 100% 100%;
  }
  .current-warp {
    position: relative;
    width: 100%;
    height: 105em;
    padding: 0 60em;
  }
  .detail-warp {
    display: flex;

    // flex-grow: 1;
    justify-content: space-between;
    width: 100%;
    height: 1091em;
    .group-list-warp {
      position: relative;
      width: 105em;
      height: 100%;
      padding: 60em 0;
    }
    .group-list-warp:nth-child(1) {
      background: url("@/assets/images/screen/detail_in.png") no-repeat center bottom / 100% auto;
    }
    .group-list-warp:nth-child(3) {
      background: url("@/assets/images/screen/detail_out.png") no-repeat center bottom / 100% auto;
    }
  }
  .swiper-current {
    height: 100%;
    .group-warp {
      height: 100%;
      padding: 0 30em;
      line-height: 105em;
      color: #6da3e4;
      text-align: center;
      cursor: pointer;
      background: url("@/assets/images/screen/detail-group-bg.png") no-repeat 0 0 / 100% 100%;
      span {
        display: block;
        overflow: hidden;
        font-size: 40em;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
    .current-group-warp {
      font-weight: bolder;
      color: #ffffff;
      background: url("@/assets/images/screen/detail-current-group-bg.png") no-repeat 0 0 / 100% 100%;
    }
  }
  .group-in-warp {
    width: 100%;
    height: 100%;
    text-align: center;
    cursor: pointer;
    opacity: 0.5;
    .group-in {
      width: 100%;
      height: calc(100% - 40em);
      margin-bottom: 8em;
      background: url("@/assets/images/screen/detail-group.png") no-repeat 0 0 / 100% 100%;
    }
    span {
      display: inline-block;
      width: 100%;
      overflow: hidden;
      font-size: 24em;
      color: #6da3e4;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  .group-in-warp-active {
    opacity: 1;
  }
}
</style>

<style lang="scss">
.chart1-detail-warp {
  .current-warp {
    .swiper-button-prev {
      width: 46em;
    }
    .swiper-button-next {
      width: 46em;
    }
  }
  .group-list-warp {
    .swiper-button-prev {
      top: 60em;
      left: 0;
      width: 105em;
      height: 20em;
      transform: rotate(90deg);
    }
    .swiper-button-next {
      top: calc(100% - 20em);
      left: 0;
      width: 105em;
      height: 20em;
      transform: rotate(90deg);
    }
  }
}
</style>
