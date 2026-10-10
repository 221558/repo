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
          <el-tag class="ml8" type="info">{{ state.secondAgent.tag_name }}</el-tag>
        </div>
        <div class="detail-tag mt10">
          <span>服务访问者：{{ state.firstAgent.name }}</span>
          <el-tag class="ml8" type="info">{{ state.firstAgent.tag_name }}</el-tag>
        </div>
        <div v-if="state.type === 'green'">
          <p class="mt10 mb5">已有规则 ({{ state.existRule.length }})</p>
          <el-table :data="state.existRule" max-height="200" scrollbar-always-on>
            <el-table-column
              v-for="(column, index) in columnsRule"
              :key="`rule_${index}`"
              :prop="column.field"
              :label="column.name"
            >
              <template #default="scope">
                <component :is="column.render" v-bind="scope.row" v-if="column.render" />
                <span v-else>{{ scope.row[column.field] ?? "-" }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <p v-if="state.type === 'red'" class="mt10">
          <el-button
            type="primary"
            link
            v-if="state.type === 'red'"
            @click="toPolicy"
            :disabled="!isRoutePermission('/businessTopology/trafficMonitoring/policy')"
          >
            匹配规则
          </el-button>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="trafficDetail">
import { ref, reactive, onMounted, watch } from "vue";
import { ElMessage } from "element-plus";
import { formatDate, localSet, isRoutePermission } from "@/utils";
import { useRouter } from "vue-router";
import { topologyState } from "../state";
import { getAgentList } from "@/api/modules/assets";
import { getTrafficPort, getGreenTrafficMatch, getTrafficMatch } from "@/api/modules/topology";

const router = useRouter();
const isLoading = ref<boolean>(false);
const state = reactive<Record<string, any>>({
  firstAgent: {},
  secondAgent: {},
  traffic: [],
  type: "",
  existRule: []
});

const columns = ref<Record<string, any>[]>([
  {
    name: "端口",
    render: (item: Record<string, any>) => `${item["destport"] ?? "未知"}`
  },
  {
    name: "连接次数",
    render: (item: Record<string, any>) => `${item["total"] ?? "未知"}`
  }
]);

const columnsRule = ref<Record<string, any>[]>([
  {
    field: "name",
    name: "策略集"
  },
  {
    field: "serviceto_name",
    name: "服务者"
  },
  {
    field: "service",
    name: "服务",
    render: (item: Record<string, any>) => (item.config_type === "manual" ? item.service_name ?? "-" : item.service ?? "-")
  },
  {
    field: "servicefrom_name",
    name: "访问者"
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
    state.firstAgent = agent;
  } catch (error) {
    console.log(`流量来源负载查询错误：${error}`);
  }

  try {
    const rawAgents = await getAgentList({ q: `ip=${topologyState.selectedDetail.target}` });
    let agent = ((rawAgents || {}).data || {}).affected_items[0];
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

const getExistRule = async () => {
  try {
    const trafficRes = await getGreenTrafficMatch({
      srcip: topologyState.selectedDetail.source,
      dstip: topologyState.selectedDetail.target
    });
    const { affected_items } = (trafficRes || {}).data || {};
    state.existRule = affected_items;
  } catch (error) {
    console.log(`已有规则列表查询错误：${error}`);
  }
};

const toPolicy = async () => {
  try {
    if (topologyState.selectedDetail.noGroupTag) {
      ElMessage({
        message: `需要先为服务者、访问者所在工作组配置标签，才可进行规则匹配`,
        type: "info"
      });
      return;
    }
    const params = {
      srcip: topologyState.selectedDetail.source,
      dstip: topologyState.selectedDetail.target,
      service_list: state.traffic.map((k: Record<string, any>) => `${k.protocol}/${k.destport}`).join(",")
    };
    const rawItems: any = await getTrafficMatch(params);
    if (rawItems.rule_status === 0) {
      ElMessage({
        message: "规则已存在",
        type: "info"
      });
    } else if (rawItems.rule_status === 1) {
      ElMessage({
        message: `规则需要下发，存在在以下策略集中：${rawItems.message}`,
        type: "info"
      });
    } else if (rawItems.rule_status === 2) {
      localSet("traffic-detail", { srcip: topologyState.selectedDetail.source, destip: topologyState.selectedDetail.target });
      localSet("flow-match", rawItems);
      router.push({
        path: `/businessTopology/trafficMonitoring/policy`
      });
    } else if (rawItems.rule_status === 3) {
      ElMessage({
        message: `需要先设置以下代理的组件标签和工作组：${rawItems.message}`,
        type: "info"
      });
    } else if (rawItems.rule_status === 4) {
      ElMessage({
        message: `无需创建规则`,
        type: "info"
      });
    }
  } catch (error) {
    console.log(`查询流量匹配策略错误: ${error}`);
  }
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
  Promise.all([getAgentData(), getTrafficData()])
    .then(async () => {
      state.type === "green" && (await getExistRule());
      isLoading.value = false;
    })
    .catch(error => {
      console.log(error);
    });
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
