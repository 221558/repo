<template>
  <div class="card arrange-container">
    <div class="title mb10">
      <el-button link type="info" @click="toPrev">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="pl10">任务详情</span>
      <el-row class="pt20 pb20">
        <el-col :span="12">任务名称：{{ state.task }}</el-col>
        <el-col :span="12">创建时间：{{ state.createtime }}</el-col>
      </el-row>
      <div class="pb10">部署服务器列表</div>
      <PageTable :columns="columns" :data="state.taskList" :is-search="false" :is-edit="false" :is-del="false"> </PageTable>
    </div>
  </div>
</template>

<script setup lang="ts" name="managerToolInfo">
import { ArrowLeft } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import { onMounted, onUnmounted, reactive } from "vue";
import { getTaskInfo } from "@/api/modules/assetManagement";
import { ColumnProps } from "@/components/PageTable/interface";
import PageTable from "@/components/PageTable/index.vue";
import { localGet, localRemove } from "@/utils";
const router = useRouter();
const toPrev = () => {
  router.push(`/assetManagement/managerTool/arrange`);
};
const state = reactive<Record<string, any>>({
  taskList: [],
  task: "",
  createtime: ""
});

const getTask = async () => {
  try {
    let task = localGet("manageTool-info");
    const data: any = await getTaskInfo({ login_alias: task.task, login_operation: "info" });
    let arr = ((data || {}).data || {}).affected_items;
    state.taskList = ((arr[0] || {}).detail || {}).login_info || [];
    state.task = (arr[0] || {}).task;
    state.createtime = (arr[0] || {}).createtime;
  } catch (error) {
    console.log(`查询任务详情错误: ${error}`);
  }
};
onUnmounted(() => {
  localRemove("manageTool-info");
});
const columns = reactive<ColumnProps[]>([
  {
    field: "ip",
    name: "服务器IP"
  },
  {
    field: "user",
    name: "用户名称"
  }
]);
onMounted(() => {
  getTask();
});
</script>
<style scoped lang="scss">
.arrange-container {
  height: 100%;
}
.title {
  height: 30px;
  border-bottom: 1px solid #dcdfe6;
}
</style>
