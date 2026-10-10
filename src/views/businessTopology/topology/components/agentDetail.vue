<template>
  <div class="detail-warp" v-loading="isLoading">
    <div class="detail-contain">
      <div class="detail-title">
        <p class="mb12">工作负载</p>
        <el-link type="primary" @click="toClose">关闭</el-link>
      </div>
      <div class="detail pt12">
        <el-row align="middle">
          <el-col :span="12">
            <img src="@/assets/topology-img/agent-icon.png" width="80" alt="负载" class="legend-img" />
          </el-col>
          <el-col :span="12">
            <p class="agent-title">{{ state.agentData.name }}</p>
            <p class="agent-status">{{ `${statusText[state.agentData.status] ?? "-"} ${state.agentData.ip ?? "-"}` }}</p>
          </el-col>
        </el-row>
        <p>服务 ({{ state.serviceData.length }})</p>
        <el-table :data="state.serviceData" max-height="200" scrollbar-always-on>
          <el-table-column v-for="(column, index) in columns" :key="`service_${index}`" :prop="column.field" :label="column.name">
            <template #default="scope">
              <component :is="column.render" v-bind="scope.row" v-if="column.render" />
              <span v-else>{{ scope.row[column.field] ?? "-" }}</span>
            </template>
          </el-table-column>
        </el-table>
        <div class="detail-tag mt10">
          <span>工作环境：</span>
          <el-tag class="ml8">{{ state.agentData.tagList?.loc }}</el-tag>
          <el-tag class="ml8" type="success">{{ state.agentData.tagList?.org }}</el-tag>
          <el-tag class="ml8" type="warning">{{ state.agentData.tagList?.business }}</el-tag>
        </div>
        <el-row align="middle" justify="space-between">
          <el-col v-for="(usage, index) in usageList" :key="`usage_${index}`" :span="usage.span" class="mt15">
            <div class="detail-tag">
              <el-icon color="#0087FF" size="32" class="mr20">
                <component :is="usage.icon" />
              </el-icon>
              <div>
                <p>{{ usage.title }}</p>
                <p class="usage-detail">{{ state.agentData[usage.field] }}</p>
              </div>
            </div>
          </el-col>
        </el-row>
        <div class="detail-tag mt10">
          <span>组件：</span>
          <el-tag class="ml8" type="info">{{ state.agentData.tagList?.component }}</el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="agentDetail">
import { ref, reactive, onMounted, watch } from "vue";
import { topologyState } from "../state";
import { getAgentTag, getAgentService } from "@/api/modules/topology";
import { getUsage } from "@/api/modules/assets";

const state = reactive<Record<string, any>>({
  agentData: {},
  serviceData: []
});

const statusText = ref<Record<string, any>>({
  active: "已连接",
  disconnected: "未连接",
  never_connected: "从未连接",
  pending: "挂起"
});

const columns = ref<Record<string, any>[]>([
  {
    name: "地址",
    render: (item: Record<string, any>) => `${item["local.ip"] ?? "未知"}`
  },
  {
    name: "协议/端口",
    render: (item: Record<string, any>) => `${item.protocol ?? "未知"}/${item["local.port"] ?? "未知"}`
  }
]);

const usageList = ref<Record<string, any>[]>([
  { title: "CPU", field: "cpu", icon: "Briefcase", span: 6 },
  { title: "内存", field: "mem", icon: "Platform", span: 6 },
  { title: "硬盘", field: "disk", icon: "WalletFilled", span: 6 },
  { title: "网络", field: "net", icon: "Promotion", span: 24 }
]);

const isLoading = ref<boolean>(false);

const toClose = () => {
  topologyState.selectedDetail = {};
  topologyState.modalType = "";
};

const getAgentData = async () => {
  let usageData: Record<string, string> = {};
  let tagList: Record<string, string> = {
    loc: "无",
    org: "无",
    business: "无",
    component: "无"
  };

  try {
    const usageItems = await getUsage({ id: topologyState.selectedDetail.id, node_name: topologyState.selectedDetail.node_name });
    usageData = (usageItems || {}).data || {};
  } catch (error) {
    console.log(error);
  }

  try {
    const tagItems = await getAgentTag(topologyState.selectedDetail.id);
    ((tagItems || {}).data || {}).affected_items?.forEach(k => {
      tagList[k.type] = k.show_name;
    });
  } catch (error) {
    console.log(error);
  }

  state.agentData = {
    cpu: usageData.cpu,
    disk: usageData.disk,
    mem: usageData.mem,
    net: usageData.net,
    netbor: usageData.netbor,
    tagList,
    ...topologyState.selectedDetail
  };
};

const getServiceData = async () => {
  try {
    const rawItems = await getAgentService(topologyState.selectedDetail.id);
    state.serviceData = ((rawItems || {}).data || {}).affected_items.map((item: Record<string, any>) => ({
      "local.ip": item.local?.ip,
      protocol: item.protocol,
      "local.port": item.local?.port
    }));
  } catch (error) {
    console.log(error);
  }
};

watch(
  () => [topologyState.selectedDetail, topologyState.modalType],
  async () => {
    if (topologyState.modalType === "agent") {
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
  await getServiceData();
  isLoading.value = false;
};
</script>
