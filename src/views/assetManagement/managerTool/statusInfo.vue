<template>
  <div class="card arrange-container">
    <div class="title mb10">
      <el-button link type="info" @click="toPrev">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="pl10">任务运行日志</span>
    </div>
    <div class="contain-warp">
      <el-row class="pt20 pb20">
        <el-col :span="12">任务名称：{{ state.task.task }}</el-col>
        <el-col :span="12">任务完成时间：{{ state.task.logtime }}</el-col>
      </el-row>
      <el-row class="mb10">
        <span class="mb10">安装成功：</span>
        <el-tag type="success" class="mr10 mb10" v-for="(ip, index) in state.task.success" :key="`success_${index}`">{{
          ip
        }}</el-tag>
      </el-row>
      <el-row class="mb10">
        <span class="mb10">安装失败：</span>
        <el-tag type="danger" class="mr10 mb10" v-for="(ip, index) in state.task.failed" :key="`failed_${index}`">{{
          ip
        }}</el-tag>
      </el-row>
      <span>运行日志</span>
      <div class="cli mt20">
        <code class="codeWarp">
          {{ state.task.log }}
        </code>
        <el-button link type="primary" size="small" @click="screen">
          <el-icon><FullScreen /></el-icon>
        </el-button>
      </div>
    </div>
    <log-dialog :visible="state.logDialogVisible" :log="state.task.log" @closed-dialog="closedLogDialog"></log-dialog>
  </div>
</template>

<script setup lang="ts" name="managerToolStatus">
import { ArrowLeft, FullScreen } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import { onMounted, onUnmounted, reactive } from "vue";
import { getTaskInfo } from "@/api/modules/assetManagement";
import { localGet, localRemove } from "@/utils";
import logDialog from "./logDialog.vue";
const router = useRouter();
const toPrev = () => {
  router.push(`/assetManagement/managerTool/arrange`);
};
const state = reactive<Record<string, any>>({
  task: {},
  logDialogVisible: false
});
const screen = () => {
  state.logDialogVisible = true;
};
const getTask = async () => {
  let res: Record<string, any> = {};
  try {
    let task = localGet("manageTool-status");
    const data: any = await getTaskInfo({ login_alias: task.task, login_operation: "status" });
    let arr = ((data || {}).data || {}).affected_items;
    res = arr[0] || {};
    const resultStr = arr[0].result.slice(1, arr[0].result.length - 1);
    const resultArr = resultStr.split(", ");
    const resultObj = resultArr.map((list: Record<string, any>) => {
      const str = list.slice(1, list.length - 1);
      return {
        ip: str.split(" | ")[0],
        result: str.split(" | ")[1]
      };
    });
    res.success = resultObj
      .filter((item: Record<string, any>) => item.result === "SUCCESS")
      .map((item: Record<string, any>) => item.ip);
    res.failed = resultObj
      .filter((item: Record<string, any>) => item.result === "FAILED" || item.result === "UNREACHABLE")
      .map((item: Record<string, any>) => item.ip);
  } catch (error) {
    console.log(`查询任务运行日志错误: ${error}`);
  }
  state.task = res;
};
const closedLogDialog = ({ visible }: Record<string, any>) => {
  state.logDialogVisible = visible;
};
onUnmounted(() => {
  localRemove("manageTool-status");
});
onMounted(() => {
  getTask();
});
</script>
<style scoped lang="scss">
.arrange-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.contain-warp {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow-y: auto;
}
.title {
  flex-shrink: 0;
  height: 30px;
  border-bottom: 1px solid #dcdfe6;
}
.codeWarp {
  flex-grow: 1;
  word-break: break-all;
  white-space: pre-wrap;
}
.cli {
  display: flex;
  align-items: flex-start;
  height: auto;
  padding: 30px;
  text-align: left;
  letter-spacing: normal;
  background: #f5f7fa;
  i {
    font-size: 20px;
  }
}
</style>
