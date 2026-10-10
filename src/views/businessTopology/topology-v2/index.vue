<template>
  <div class="card content-box topology-page">
    <div class="oper-warp">
      <GroupFilter v-if="topologyState.chartType === 'out'" />
      <MoveAgent v-if="topologyState.chartType === 'in'" />
      <div :style="{ flexGrow: 1 }" />
      <ViewToggle v-if="topologyState.chartType === 'out'" />
      <Legend />
      <TrafficAgentFilter />
      <el-popover placement="bottom" trigger="click">
        <template #reference>
          <el-button class="ml12" type="primary" icon="Plus" circle />
        </template>
        <div class="add_warp">
          <div class="add_title">新增</div>
          <el-menu class="el-menu-add">
            <el-menu-item
              :disabled="!isRoutePermission('/assetManagement/group/add')"
              @click="() => router.push('/assetManagement/group/add')"
            >
              新建工作组
            </el-menu-item>
            <el-menu-item
              :disabled="!isRoutePermission('/assetManagement/managerTool/proxy')"
              true
              @click="() => router.push('/assetManagement/managerTool/proxy')"
            >
              安装新代理
            </el-menu-item>
          </el-menu>
        </div>
      </el-popover>
      <el-button class="ml12" icon="Refresh" circle @click="refresh" />
    </div>
    <div class="topology-warp" v-loading="topologyState.isLoading">
      <ChartOut v-if="topologyState.chartType === 'out'" />
      <ChartIn v-if="topologyState.chartType === 'in'" />
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
import { isRoutePermission } from "@/utils";
import { useRouter } from "vue-router";
import { topologyState, createState } from "./state";
import { getTagList } from "@/api/modules/assets";
import ChartOut from "./components/chart-out.vue";
import ChartIn from "./components/chart-in.vue";
import TrafficAgentFilter from "./components/trafficAgentFilter.vue";
import Legend from "./components/legend.vue";
import ViewToggle from "./components/viewToggle.vue";
import AgentDetail from "./components/agentDetail.vue";
import GroupFilter from "./components/groupFilter.vue";
import MoveAgent from "./components/moveAgent.vue";
import GroupDetail from "./components/groupDetail.vue";
import TrafficDetail from "./components/trafficDetail.vue";
import OtherTrafficDetail from "./components/otherTrafficDetail.vue";

const router = useRouter();

onBeforeMount(async () => {
  Object.assign(topologyState, createState());
});

onMounted(async () => {
  topologyState.isLoading = true;

  await getInitList();
  Promise.all([topologyState.getNodesOut(), topologyState.getEdgesOut()])
    .then(() => {
      topologyState.isLoading = false;
      nextTick(() => {
        mittBus.emit("buildChartOut");
      });
    })
    .catch(error => {
      console.log(error);
    });
});

const refresh = async () => {
  topologyState.isLoading = true;
  let arr: any[] = [];
  if (topologyState.chartType === "out") {
    arr = [topologyState.getNodesOut(), topologyState.getEdgesOut()];
  } else {
    topologyState.initDataIn();
    const getNodes = topologyState.combosIn.map((combo: Record<string, any>) => topologyState.getNodesIn(combo.id));
    const getEdgesOut = topologyState.combosIn.map((combo: Record<string, any>) => topologyState.getEdgesInOut(combo.id));
    arr = [...getNodes, topologyState.getEdgesInIn(), ...getEdgesOut];
  }
  Promise.all(arr)
    .then(() => {
      topologyState.isLoading = false;
      nextTick(() => {
        if (topologyState.chartType === "out") {
          mittBus.emit("buildChartOut");
        } else {
          mittBus.emit("buildChartIn");
        }
      });
    })
    .catch(error => {
      console.log(error);
    });
};

const getInitList = async () => {
  return Promise.all([
    topologyState.getGroupLabelOptions(),
    getTagList({ label_type: "component" }),
    topologyState.getInitGroupList()
  ]).then((values: Record<string, any>[]) => {
    let tagList4: Record<string, string>[] = [];

    tagList4 = ((values[1] || {}).data || {}).affected_items.map((k: Record<string, any>) => ({
      id: String(k.id),
      label: k.show_name
    }));
    topologyState.tagList4 = tagList4;
  });
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
.add_warp {
  .add_title {
    padding-bottom: 10px;
    font-weight: bolder;
    color: #1a1c21;
    border-bottom: 1px solid #d3dae6;
  }
}
.el-menu-add {
  background-color: #ffffff;
  border-right: none;
  .el-menu-item {
    height: 32px;
    padding: 5px 0 !important;
    line-height: 22px;
    color: #606266;
    &:hover {
      color: #2d8cf0;
      background-color: #eaf4fe;
    }
  }
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
  .el-table {
    border: 1px solid #ebeef5;
  }
  .el-table .el-table__header .el-table__cell,
  .el-table .el-table__row {
    font-size: 12px;
  }
  .el-table .cell {
    line-height: 18px;
  }
  .el-table .el-table__row {
    height: 18px;
  }
  .el-table--default .el-table__cell {
    padding: 4px 0;
  }
  .el-table__inner-wrapper::before {
    display: none;
  }
}
</style>
