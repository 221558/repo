<template>
  <div class="card content-box topology-page">
    <div class="oper-warp">
      <GroupFilter />
      <MoveAgent />
      <div :style="{ flexGrow: 1 }" />
      <ViewToggle />
      <Legend />
      <TrafficAgentFilter />
      <el-button class="ml12" @click="refresh">刷新</el-button>
    </div>
    <div class="topology-warp" v-loading="topologyState.isLoading">
      <Chart />
      <AgentDetail v-if="topologyState.modalType === 'agent'" />
      <GroupDetail v-if="topologyState.modalType === 'group'" />
      <TrafficDetail v-if="topologyState.modalType === 'traffic'" />
      <OtherTrafficDetail v-if="topologyState.modalType === 'otherTraffic'" />
    </div>
  </div>
</template>

<script setup lang="ts" name="topology">
import { onMounted, onBeforeMount, nextTick } from "vue";
import mittBus from "@/utils/mittBus";
import { topologyState, createState } from "./state";
import { getGroupList, getTagList } from "@/api/modules/assets";
import Chart from "./components/chart.vue";
import TrafficAgentFilter from "./components/trafficAgentFilter.vue";
import Legend from "./components/legend.vue";
import ViewToggle from "./components/viewToggle.vue";
import AgentDetail from "./components/agentDetail.vue";
import GroupFilter from "./components/groupFilter.vue";
import MoveAgent from "./components/moveAgent.vue";
import GroupDetail from "./components/groupDetail.vue";
import TrafficDetail from "./components/trafficDetail.vue";
import OtherTrafficDetail from "./components/otherTrafficDetail.vue";

onBeforeMount(async () => {
  Object.assign(topologyState, createState());
});

onMounted(async () => {
  topologyState.isLoading = true;

  await getInitList();
  Promise.all([topologyState.getCombos(), topologyState.getNodes(), topologyState.getEdges()])
    .then(() => {
      topologyState.isLoading = false;
      nextTick(() => {
        mittBus.emit("buildChart");
      });
    })
    .catch(error => {
      console.log(error);
    });
});

const refresh = async () => {
  topologyState.isLoading = true;
  Promise.all([topologyState.getCombos(), topologyState.getNodes(), topologyState.getEdges()])
    .then(() => {
      topologyState.isLoading = false;
      nextTick(() => {
        mittBus.emit("buildChart");
      });
    })
    .catch(error => {
      console.log(error);
    });
};

const getInitList = async () => {
  let selectedTag: string[] = [];
  try {
    const tagItems = await getTagList({ label_type: "loc" });
    let tagList: Record<string, string>[] = [];
    ((tagItems || {}).data || {}).affected_items.forEach(k => {
      selectedTag.push(k.id);
      tagList.push({
        id: k.id,
        label: k.show_name
      });
    });
    selectedTag.push("no_loc");
    tagList.unshift({ id: "no_loc", label: "无标签" });
    topologyState.tagList1 = tagList;
  } catch (error) {
    console.log(`位置标签列表错误: ${error}`);
  }

  try {
    const tagItems = await getTagList({ label_type: "org" });
    let tagList: Record<string, string>[] = [];
    ((tagItems || {}).data || {}).affected_items.forEach(k => {
      selectedTag.push(k.id);
      tagList.push({
        id: k.id,
        label: k.show_name
      });
    });
    selectedTag.push("no_org");
    tagList.unshift({ id: "no_org", label: "无标签" });
    topologyState.tagList2 = tagList;
  } catch (error) {
    console.log(`组织标签列表错误: ${error}`);
  }

  try {
    const tagItems = await getTagList({ label_type: "business" });
    let tagList: Record<string, string>[] = [];
    ((tagItems || {}).data || {}).affected_items.forEach(k => {
      selectedTag.push(k.id);
      tagList.push({
        id: k.id,
        label: k.show_name
      });
    });
    selectedTag.push("no_business");
    tagList.unshift({ id: "no_business", label: "无标签" });
    topologyState.tagList3 = tagList;
  } catch (error) {
    console.log(`业务标签列表错误: ${error}`);
  }
  topologyState.selectedTag = selectedTag;

  try {
    const tagItems = await getTagList({ label_type: "component" });
    let tagList = ((tagItems || {}).data || {}).affected_items.map(k => ({
      id: String(k.id),
      label: k.show_name
    }));
    topologyState.tagList4 = tagList;
  } catch (error) {
    console.log(`组件标签列表错误: ${error}`);
  }

  try {
    const groups = await getGroupList({ limit: 0 });
    let groupList: Record<string, string>[] = [],
      selectedGroup: string[] = [];
    ((groups || {}).data || {}).affected_items.forEach(k => {
      let label = k.show_name ? k.show_name : k.name;
      selectedGroup.push(k.name);
      groupList.push({
        name: k.name,
        show_name: k.show_name,
        description: k.description,
        loc_show_name: k.loc_show_name ?? "无标签",
        org_show_name: k.org_show_name ?? "无标签",
        business_show_name: k.business_show_name ?? "无标签",
        loc: k.loc,
        org: k.org,
        business: k.business,
        count: k.count,
        policy_status: k.policy_status,
        label,
        searchableLabel: `${label} ${k.loc_show_name ?? "无标签"} ${k.org_show_name ?? "无标签"} ${
          k.business_show_name ?? "无标签"
        }`
      });
    });
    topologyState.groupList = groupList;
    topologyState.selectedGroup = selectedGroup;
  } catch (error) {
    console.log(`分组列表错误: ${error}`);
  }
};
</script>

<style scoped lang="scss">
.oper-warp {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  padding-bottom: 10px;
  border-bottom: 1px solid #eeeff1;
}
.topology-warp {
  position: relative;
  width: 100%;
  height: calc(100% - 43px);
  background: #edf1f2;
}
</style>

<style lang="scss">
.topology-page {
  .g6-minimap {
    position: absolute;
    bottom: 1px;
    left: 0;
    background: #f7f7f7;
  }
  .g6-minimap-container {
    height: 100%;
    border: 1px solid #e2e2e2;
  }
  .g6-minimap-viewport {
    border: 2px solid rgb(25 128 255);
  }
  .g6-component-tooltip {
    background-color: rgb(255 255 255 / 80%);
    box-shadow: rgb(174 174 174) 0 0 10px;
  }
  .tooltip-p {
    font-size: 16px;
    user-select: none;
    -webkit-touch-callout: none;
  }
  .el-tree-node__content {
    height: auto;
    padding: 5px 0;
    border-bottom: 1px dashed #eef2f7;
  }
  .el-checkbox__input.is-checked + .el-checkbox__label {
    color: #606266;
  }
  .oper-warp {
    .el-input:not(.filter-contain .el-input) {
      width: 135px;
    }
  }
  .detail-warp {
    position: absolute;
    top: 16px;
    left: 16px;
    width: 410px;
    max-height: 700px;
    overflow: hidden auto;
    box-shadow: rgb(0 0 0 / 12%) 0 0 12px 0;
    .detail-contain {
      padding: 12px;
      background: #ffffff;
      border: 1px solid #e4e7ed;
      border-radius: 4px;
    }
    .detail-title {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      p {
        font-weight: bolder;
        color: #1a1c21;
      }
    }
    .detail {
      border-top: 1px solid #d3dae6;
    }
    .agent-title {
      font-size: 18px;
      font-weight: bold;
      line-height: 25px;
      word-break: break-all;
    }
    .agent-status {
      word-break: break-all;
    }
    .detail-tag {
      display: flex;
      align-items: center;
    }
    .usage-detail {
      font-weight: 600;
    }
  }
  .filter-title {
    margin: 0 0 12px;
    font-weight: bolder;
    color: #1a1c21;
  }
  .filter-contain {
    padding: 12px 0;
    border-top: 1px solid #d3dae6;
  }
  .custom-tree-node {
    display: flex;
    flex-grow: 1;
    align-items: center;
    justify-content: space-between;
  }
  .tree-warp {
    max-height: 150px;
    overflow-y: auto;
  }
  .popover-footer {
    display: flex;
    justify-content: flex-end;
  }
}
</style>
