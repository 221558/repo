<template>
  <div class="detail-warp" v-loading="isLoading">
    <div class="detail-contain">
      <div class="detail-title">
        <p class="mb12">业务流量</p>
        <el-link type="primary" @click="toClose">关闭</el-link>
      </div>
      <div class="detail pt12">
        <el-row align="middle">
          <el-col :span="10">
            <div class="agent-warp">
              <span
                class="mr8"
                :class="{ active: state.firstAgent.status === 'active', disconnected: state.firstAgent.status !== 'active' }"
              ></span>
              <div>
                <p class="agent-title">{{ state.firstAgent.name }}</p>
                <p class="agent-status">{{ state.firstAgent.ip }}</p>
              </div>
            </div>
          </el-col>
          <el-col :span="4" class="traffic-type">
            <el-icon size="20" :color="state.type === 'green' ? '#0099CC' : '#ed9797'" class="legend-img"><Right /></el-icon>
          </el-col>
          <el-col :span="10">
            <div class="agent-warp">
              <span
                class="mr8"
                :class="{ active: state.secondAgent.status === 'active', disconnected: state.secondAgent.status !== 'active' }"
              ></span>
              <div>
                <p class="agent-title">{{ state.secondAgent.name }}</p>
                <p class="agent-status">{{ state.secondAgent.ip }}</p>
              </div>
            </div>
          </el-col>
        </el-row>
        <p class="mt5 mb5">端口 ({{ state.traffic.length }})</p>
        <el-table :data="state.traffic" max-height="200" scrollbar-always-on>
          <el-table-column v-for="(column, index) in columns" :key="`service_${index}`" :prop="column.field" :label="column.name">
            <template #default="scope">
              <component :is="column.render" v-bind="scope.row" v-if="column.render" />
              <span v-else>{{ scope.row[column.field] ?? "-" }}</span>
            </template>
          </el-table-column>
        </el-table>
        <p class="mt10">最新访问时间：{{ formatDate(new Date(state.traffic[0]?.time)) ?? "无" }}</p>
        <div class="detail-tag mt10">
          <span>服务提供者：{{ state.secondAgent.name }}</span>
          <el-tag class="ml8" type="info">{{ state.secondAgent.tagShowname }}</el-tag>
        </div>
        <div class="detail-tag mt10">
          <span>服务访问者：{{ state.firstAgent.name }}</span>
          <el-tag class="ml8" type="info">{{ state.firstAgent.tagShowname }}</el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="trafficDetail">
import { ref, reactive, onMounted, watch } from "vue";
import { formatDate } from "@/utils";
import { topologyState } from "../state";
import { getAgentList } from "@/api/modules/assets";
import { getTrafficPort } from "@/api/modules/topology";

const isLoading = ref<boolean>(false);
const state = reactive<Record<string, any>>({
  firstAgent: {},
  secondAgent: {},
  traffic: [],
  type: ""
});

const columns = ref<Record<string, any>[]>([
  {
    name: "端口",
    render: (item: Record<string, any>) => `${item["port"] ?? "未知"}`
  },
  {
    name: "连接次数",
    render: (item: Record<string, any>) => `${item["total"] ?? "未知"}`
  }
]);

const toClose = () => {
  topologyState.selectedDetail = {};
  topologyState.modalType = "";
};

const getAgentData = async () => {
  try {
    const rawAgents = await getAgentList({ q: `ip=${topologyState.selectedDetail.source}` });
    let agent = ((rawAgents || {}).data || {}).affected_items[0];
    agent.tagShowname = topologyState.tagList4.find((k: Record<string, string>) => k.id == agent.tag)?.label ?? "无";
    state.firstAgent = agent;
  } catch (error) {
    console.log(`流量来源负载查询错误：${error}`);
  }

  try {
    const rawAgents = await getAgentList({ q: `ip=${topologyState.selectedDetail.target}` });
    let agent = ((rawAgents || {}).data || {}).affected_items[0];
    agent.tagShowname = topologyState.tagList4.find((k: Record<string, string>) => k.id == agent.tag)?.label ?? "无";
    state.secondAgent = agent;
  } catch (error) {
    console.log(`流量目的负载查询错误：${error}`);
  }
};

const getTrafficData = async () => {
  try {
    const trafficRes = await getTrafficPort({
      flow: topologyState.selectedDetail.edgeType,
      srcip: topologyState.selectedDetail.source,
      dstip: topologyState.selectedDetail.target
    });
    const { affected_items } = (trafficRes || {}).data || {};
    state.traffic = affected_items;
  } catch (error) {
    console.log(`流量端口列表查询错误：${error}`);
  }
  state.type = topologyState.selectedDetail.edgeType;
};

watch(
  () => [topologyState.selectedDetail, topologyState.modalType],
  async () => {
    if (topologyState.modalType === "traffic") {
      sarchData();
    }
  }
);

onMounted(() => {
  sarchData();
});

const sarchData = async () => {
  isLoading.value = true;
  await getAgentData();
  await getTrafficData();
  isLoading.value = false;
};
</script>

<style scoped lang="scss">
.agent-warp {
  display: flex;
  align-items: center;
  span {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
  .active {
    background-color: #017d73;
  }
  .disconnected {
    background-color: #bd271e;
  }
}
.traffic-type {
  text-align: center;
}
</style>
