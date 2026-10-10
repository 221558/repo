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
              <span class="mr8"></span>
              <div>
                <p class="agent-title">{{ state.sourceNode.name }}</p>
              </div>
            </div>
          </el-col>
          <el-col :span="4" class="traffic-type">
            <el-icon size="20" :color="'#5D7092'" class="legend-img"><Right /></el-icon>
          </el-col>
          <el-col :span="10">
            <div class="agent-warp">
              <span
                class="mr8"
                :class="{ active: state.agent.status === 'active', disconnected: state.agent.status !== 'active' }"
              ></span>
              <div>
                <p class="agent-title">{{ state.agent.name }}</p>
                <p class="agent-status">{{ state.agent.ip }}</p>
              </div>
            </div>
          </el-col>
        </el-row>
        <p class="mt5 mb5">流量 ({{ state.traffic.length }})</p>
        <el-table :data="state.traffic" max-height="200" scrollbar-always-on>
          <el-table-column
            v-for="(column, index) in columns"
            :key="`service_${index}`"
            :prop="column.field"
            :label="column.name"
            :width="column.width"
          >
            <template #default="scope">
              <component :is="column.render" v-bind="scope.row" v-if="column.render" />
              <span v-else>{{ scope.row[column.field] ?? "-" }}</span>
            </template>
          </el-table-column>
        </el-table>
        <p class="mt10">最新访问时间：{{ formatDate(new Date(state.traffic[0]?.m_time)) ?? "无" }}</p>
        <div class="detail-tag mt10">
          <span>服务提供者：{{ state.agent.name }}</span>
          <el-tag class="ml8" type="info">{{ state.agent.tagShowname }}</el-tag>
        </div>
        <div class="detail-tag mt10">
          <span>服务访问者：{{ topologyState.selectedDetail.source.includes("_address") ? "地址表" : "外网" }}</span>
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
  agent: {},
  sourceNode: {},
  traffic: []
});

const columns = ref<Record<string, any>[]>([
  {
    name: "来源IP",
    render: (item: Record<string, any>) => `${item["srcip"] ?? "未知"}`
  },
  {
    name: "来源端口",
    width: 90,
    render: (item: Record<string, any>) => `${item["srcport"] ?? "未知"}`
  },
  {
    name: "目的端口",
    width: 90,
    render: (item: Record<string, any>) => `${item["destport"] ?? "未知"}`
  },
  {
    name: "协议",
    width: 60,
    render: (item: Record<string, any>) => `${item["protocol"] ?? "未知"}`
  },
  {
    name: "状态",
    width: 60,
    render: (item: Record<string, any>) => `${item["flow_type"] === "green" ? "正常" : "异常"}`
  }
]);

const toClose = () => {
  topologyState.selectedDetail = {};
  topologyState.modalType = "";
};

const getAgentData = async () => {
  try {
    const rawAgents = await getAgentList({ q: `ip=${topologyState.selectedDetail.target}` });
    let agent = ((rawAgents || {}).data || {}).affected_items[0];
    agent.tagShowname = topologyState.tagList4.find((k: Record<string, string>) => k.id == agent.tag)?.label ?? "无";
    state.agent = agent;
  } catch (error) {
    console.log(`流量目的负载查询错误：${error}`);
  }

  try {
    const groupName = topologyState.selectedDetail.source.split("_")[0];
    const group = topologyState.groupList.find((k: Record<string, any>) => k.name === groupName);
    state.sourceNode = {
      name: `${group.show_name ?? group.name}${topologyState.selectedDetail.source.includes("_address") ? "地址表" : "外网"}`
    };
  } catch (error) {
    console.log(`流量来源信息查询错误：${error}`);
  }
};

const getTrafficData = async () => {
  try {
    const trafficRes = await getTrafficPort({
      srcip: topologyState.selectedDetail.ips,
      dstip: topologyState.selectedDetail.target
    });
    const { affected_items } = (trafficRes || {}).data || {};
    state.traffic = affected_items;
  } catch (error) {
    console.log(`流量端口列表查询错误：${error}`);
  }
};

watch(
  () => [topologyState.selectedDetail, topologyState.modalType],
  async () => {
    if (topologyState.modalType === "otherTraffic") {
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
