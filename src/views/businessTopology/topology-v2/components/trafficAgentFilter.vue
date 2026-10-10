<template>
  <el-popover placement="bottom" :width="300" trigger="click" @show="onShowPopover" :teleported="false">
    <template #reference>
      <el-button class="ml12">过滤</el-button>
    </template>
    <div>
      <p class="filter-title">过滤</p>
      <div class="filter-contain">
        <p class="mt3 mb5">流量筛选</p>
        <el-row>
          <el-col :span="12">
            <el-checkbox-group v-model="lineStatusSelected" class="check-box">
              <el-checkbox label="in_packet">正常</el-checkbox>
              <el-checkbox label="in_drop">异常</el-checkbox>
            </el-checkbox-group>
          </el-col>
          <el-col :span="12" v-show="topologyState.chartType === 'in'">
            <el-checkbox-group v-model="lineTypeSelected" class="check-box">
              <el-checkbox label="in_group">组内</el-checkbox>
              <el-checkbox label="out_group">组间</el-checkbox>
            </el-checkbox-group>
          </el-col>
        </el-row>
        <p class="mt10 mb5" v-show="topologyState.chartType === 'in'">负载筛选</p>
        <el-row v-show="topologyState.chartType === 'in'">
          <el-col :span="12">
            <el-checkbox-group v-model="agentPolicyStatusSelected" class="check-box">
              <el-checkbox label="build">建设</el-checkbox>
              <el-checkbox label="test">测试</el-checkbox>
              <el-checkbox label="protect">防护</el-checkbox>
            </el-checkbox-group>
          </el-col>
          <el-col :span="12">
            <el-checkbox-group v-model="agentStatusSelected" class="check-box">
              <el-checkbox label="active">在线</el-checkbox>
              <el-checkbox label="no_active">离线</el-checkbox>
            </el-checkbox-group>
          </el-col>
        </el-row>
      </div>
      <div class="popover-footer">
        <el-button
          type="primary"
          @click="toSearch"
          :disabled="
            (topologyState.chartType === 'out' && lineStatusSelected.length === 0) ||
            (topologyState.chartType === 'in' &&
              (lineStatusSelected.length === 0 ||
                lineTypeSelected.length === 0 ||
                agentPolicyStatusSelected.length === 0 ||
                agentStatusSelected.length === 0))
          "
        >
          确认
        </el-button>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts" name="trafficAgentFilter">
import { ref, nextTick } from "vue";
import mittBus from "@/utils/mittBus";
import { topologyState } from "../state";

let lineStatusSelected = ref([]);
let lineTypeSelected = ref([]);
let agentPolicyStatusSelected = ref([]);
let agentStatusSelected = ref([]);

const onShowPopover = () => {
  lineStatusSelected.value = topologyState.lineStatusSelected;
  lineTypeSelected.value = topologyState.lineTypeSelected;
  agentPolicyStatusSelected.value = topologyState.agentPolicyStatusSelected;
  agentStatusSelected.value = topologyState.agentStatusSelected;
};

const toSearch = async () => {
  topologyState.isLoading = true;

  topologyState.lineStatusSelected = lineStatusSelected;
  topologyState.lineTypeSelected = lineTypeSelected;
  topologyState.agentPolicyStatusSelected = agentPolicyStatusSelected;
  topologyState.agentStatusSelected = agentStatusSelected;

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
</script>

<style scoped lang="scss">
.filter-contain {
  .check-box {
    display: flex;
    flex-direction: column;
  }
}
</style>
