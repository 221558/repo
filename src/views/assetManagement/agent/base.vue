<template>
  <div class="detail-base-warp">
    <div class="base-contain">
      <div v-for="(item, index) in baseList" :key="`baseList_${index}`" class="pb30">
        <p class="pb5">{{ item.title }}</p>
        <p class="value">{{ item.render ? item.render(allStats) : item.field ? allStats[item.field] ?? "-" : "-" }}</p>
      </div>
    </div>
    <el-divider border-style="dashed" class="mt10 mb10" />
    <div class="base-contain">
      <div v-for="(item, index) in hardwareList" :key="`hardwareList_${index}`" class="pb30">
        <p class="pb5">{{ item.title }}</p>
        <p class="value">{{ item.render ? item.render(allStats) : item.field ? allStats[item.field] ?? "-" : "-" }}</p>
      </div>
    </div>
    <el-divider border-style="dashed" class="mt10 mb10" />
    <div class="base-contain">
      <div v-for="(item, index) in usageList" :key="`usageList_${index}`" class="pb30">
        <p class="pb5">{{ item.title }}</p>
        <p class="value">{{ allStats[item.field] ?? "-" }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="agentDetailBase">
import { ref, onMounted } from "vue";
import { getUsage, getHardware, getOs } from "@/api/modules/assets";
import { formatDate } from "@/utils";

const props = defineProps<{ agentData: Record<string, any> }>();

const allStats = ref<Record<string, any>>({});
const baseList = ref([
  { title: "ID", field: "id" },
  { title: "IP", field: "ip" },
  {
    title: "代理状态",
    render: (item: Record<string, any>) => {
      const options: Record<string, any> = {
        never_connected: "从未连接",
        disconnected: "未连接",
        active: "已连接",
        pending: "挂起"
      };
      return options[item.status];
    }
  },
  {
    title: "网络状态",
    render: (item: Record<string, any>) => {
      return item.netbor === "netbreak" ? "断网" : "连接";
    }
  },
  {
    title: "组",
    render: (item: Record<string, any>) => {
      return item.group ? item.group.join("，") : "-";
    }
  },
  {
    title: "集群节点",
    render: (item: Record<string, any>) => {
      return item.node_name && item.node_name !== "unknown" ? item.node_name : "-";
    }
  },
  { title: "组件标签", field: "tag_show" },
  {
    title: "注册日期",
    render: (item: Record<string, any>) => {
      return formatDate(new Date(item.dateAdd));
    }
  },
  {
    title: "上次连接",
    render: (item: Record<string, any>) => {
      return formatDate(new Date(item.lastKeepAlive));
    }
  },
  {
    title: "最近扫描时间",
    render: (item: Record<string, any>) => {
      return formatDate(new Date(item.scan_time));
    }
  }
]);
const hardwareList = ref([
  {
    title: "操作系统",
    field: "os_name",
    render: (item: Record<string, any>) => {
      const name = ((item || {}).os || {}).name ?? "-";
      const version = ((item || {}).os || {}).version ?? "-";
      return !name && !version ? "-" : `${name} ${version}`;
    }
  },
  { title: "CPU", field: "cpu_name" },
  { title: "内存", field: "ram" },
  { title: "核数", field: "cores" },
  { title: "架构", field: "architecture" }
]);
const usageList = ref([
  { title: "CPU占比", field: "cpu" },
  { title: "内存占比", field: "mem" },
  { title: "硬盘占比", field: "disk" },
  { title: "实时网速", field: "net" }
]);

onMounted(async () => {
  getInitList();
});

const getInitList = async () => {
  let realTime = {},
    baseHardwar = {},
    baseOs = {};

  try {
    const rawItems = await getUsage({
      node_name: props.agentData.node_name,
      id: props.agentData.id
    });
    const data = (rawItems || {}).data;
    realTime = {
      cpu: data.cpu,
      disk: data.disk,
      mem: data.mem,
      net: data.net,
      netbor: data.netbor
    };
  } catch (error) {
    console.log(`硬件信息错误: ${error}`);
  }

  try {
    const rawItems = await getHardware(props.agentData.id);
    const baseInfo = ((rawItems || {}).data || {}).affected_items[0];
    baseHardwar = {
      cpu_name: baseInfo.cpu?.name,
      ram: (baseInfo.ram?.total / 1024).toFixed(2),
      cores: baseInfo.cpu?.cores
    };
  } catch (error) {
    console.log(`硬件信息错误: ${error}`);
  }

  try {
    const rawItems = await getOs(props.agentData.id);
    const baseInfo = ((rawItems || {}).data || {}).affected_items[0];
    baseOs = {
      architecture: baseInfo.architecture,
      scan_time: baseInfo.scan?.time
    };
  } catch (error) {
    console.log(`硬件信息错误: ${error}`);
  }

  allStats.value = {
    ...props.agentData,
    ...realTime,
    ...baseHardwar,
    ...baseOs
  };
};
</script>

<style scoped lang="scss">
.base-contain {
  > div {
    width: 25%;
  }
  .value {
    font-weight: 600;
  }
}
</style>
