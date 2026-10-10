<template>
  <div class="card systemStatus-container">
    <div class="license-label mb15">
      <span class="title">系统资源使用情况</span>
      <div class="search">
        <el-form label-width="100px" v-if="isCluster">
          <el-form-item label="node节点:">
            <el-select v-model="selectedNode" placeholder="选择node节点" style="width: 300px" @change="getStatus">
              <el-option v-for="(item, index) in nodeList" :key="`nodeList_${index}`" :label="item.text" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-form>
        <el-button class="ml12" @click="getStatus">刷新</el-button>
      </div>
    </div>
    <el-form label-width="100px" v-loading="isLoading">
      <el-form-item v-for="(item, index) in paramsOptions" :key="`paramsOptions_${index}`" :label="item.title">
        <el-progress :percentage="formParams[item.type]" :color="customColorMethod" class="progress-contain" />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts" name="systemStatus">
import { onMounted, reactive, ref } from "vue";
import { useUserStore } from "@/stores/modules/user";
import { getClusterNodes } from "@/api/modules/manager";
import { getSystemStatus } from "@/api/modules/system";

const isCluster = useUserStore().isCluster;
const paramsOptions = reactive<Record<string, string>[]>([
  {
    title: "CPU占用率",
    type: "cpu"
  },
  {
    title: "硬盘占用率",
    type: "disk"
  },
  {
    title: "内存占用率",
    type: "mem"
  }
]);
let formParams = reactive<Record<string, number>>({
  cpu: 0,
  disk: 0,
  mem: 0
});
const nodeList = ref<Record<string, string>[]>([]);
const selectedNode = ref("");
const isLoading = ref(false);

const customColorMethod = (percentage: number) => {
  if (percentage <= 60) {
    return "#67c23a";
  } else if (percentage <= 80) {
    return "#409eff";
  } else {
    return "#f56c6c";
  }
};

onMounted(async () => {
  if (isCluster) {
    try {
      const nodeListRes = await getClusterNodes();
      nodeList.value = ((nodeListRes || {}).data || {}).affected_items.map((clusterNode: Record<string, string>) => ({
        value: clusterNode.name,
        text: `${clusterNode.name} (${clusterNode.type})`
      }));
      selectedNode.value = nodeList.value[0].value;
    } catch (error) {
      console.log(`查询节点列表错误: ${error}`);
    }
  }
  getStatus();
});

const getStatus = async () => {
  try {
    isLoading.value = true;
    const res = await getSystemStatus(selectedNode.value);
    const { cpu, disk, mem } = ((res || {}).data || {}).affected_items[0]?.node_api_config;
    formParams.cpu = parseInt(cpu);
    formParams.disk = parseInt(disk);
    formParams.mem = parseInt(mem);
    isLoading.value = false;
  } catch (error) {
    console.log(`查询系统资源使用情况错误: ${error}`);
  }
};
</script>

<style scoped lang="scss">
.systemStatus-container {
  .license-label {
    display: flex;
    justify-content: space-between;
    span {
      line-height: 32px;
    }
    .search {
      display: flex;
    }
  }
  .progress-contain {
    flex-grow: 1;
  }
}
</style>

<style scoped lang="scss">
.systemStatus-container {
  .el-form-item--default {
    margin-bottom: 0;
  }
}
</style>
