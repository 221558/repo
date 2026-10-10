<template>
  <div class="card arrange-container">
    <div class="title mb10">
      <el-button link type="info" @click="toPrev">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="pl10">批量部署任务列表（{{ state.taskList.length }}）</span>
      <el-row class="pt20 pb20">
        <el-button type="primary" @click="toAdd">部署任务</el-button>
        <el-button type="primary" @click="getTask">刷新</el-button>
      </el-row>
      <el-table ref="tableRef" :data="state.taskList" border scrollbar-always-on>
        <el-table-column
          v-for="(column, index) in columns"
          :key="`task_${index}`"
          :prop="column.field"
          :label="column.name"
          :width="column.width"
          :show-overflow-tooltip="column.showOverflowTooltip"
        >
          <template #default="scope">
            <component :is="column.render" v-bind="scope.row" v-if="column.render" />
            <span v-else>{{ scope.row[column.field] ?? "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作">
          <template #default="scope">
            <el-tooltip effect="dark" content="详情" placement="top">
              <el-button link type="primary" size="small" @click="info(scope.row)">
                <el-icon><View /></el-icon>
              </el-button>
            </el-tooltip>
            <!-- 安装代理（未运行的）、重新安装（运行完成的）、卸载代理（运行完成的）、查看运行结果（运行完成的） -->
            <template v-if="scope.row.status === 'ready'">
              <el-tooltip effect="dark" content="安装代理" placement="top">
                <el-button link type="primary" size="small" @click="install(scope.row)">
                  <SvgIcon name="play" :icon-style="{ width: '14px', height: '14px' }" />
                </el-button>
              </el-tooltip>
            </template>

            <template v-if="scope.row.status === 'success' || scope.row.status === 'failed'">
              <el-tooltip effect="dark" content="重新安装" placement="top">
                <el-button link type="primary" size="small" @click="install(scope.row)">
                  <SvgIcon name="play" :icon-style="{ width: '14px', height: '14px' }" />
                </el-button>
              </el-tooltip>
              <el-tooltip effect="dark" content="卸载代理" placement="top">
                <el-button link type="primary" size="small" @click="uninstall(scope.row)">
                  <SvgIcon name="uninstall" :icon-style="{ width: '14px', height: '14px' }" />
                </el-button>
              </el-tooltip>
              <el-tooltip effect="dark" content="查看运行结果" placement="top">
                <el-button link type="primary" size="small" @click="statusInfo(scope.row)">
                  <el-icon><Document /></el-icon>
                </el-button>
              </el-tooltip>
            </template>
            <el-tooltip effect="dark" content="删除" placement="top">
              <el-button link type="primary" size="small" @click="remove(scope.row)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </el-tooltip>
          </template>
        </el-table-column>
        <!-- 无数据 -->
        <template #empty>
          <div class="table-empty">
            <slot name="empty">
              <img src="@/assets/images/notData.png" alt="notData" />
              <div>暂无数据</div>
            </slot>
          </div>
        </template>
      </el-table>
    </div>
    <install-dialog
      :visible="state.installDialogVisible"
      :group-list="state.groupList"
      :version-list="state.versionList"
      @closed-dialog="closedInstallDialog"
      @submit-dialog="toInstallDialog"
      :selected="state.arrange"
    ></install-dialog>
  </div>
</template>

<script setup lang="ts" name="managerToolArrange">
import { ArrowLeft } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import { onMounted, reactive } from "vue";
import { getTaskList, removeTask, getVersionList, getTaskInfo } from "@/api/modules/assetManagement";
import { getGroupList } from "@/api/modules/assets";
import { ColumnProps } from "@/components/PageTable/interface";
import { formatDate, localSet } from "@/utils";
import { Delete, View, Document } from "@element-plus/icons-vue";
import SvgIcon from "@/components/SvgIcon/index.vue";
import { useHandleData } from "@/hooks/useHandleData";
import installDialog from "./installDialog.vue";
import { ElMessage } from "element-plus";
const router = useRouter();
const toPrev = () => {
  router.push(`/assetManagement/managerTool`);
};
const state = reactive<Record<string, any>>({
  taskList: [],
  installDialogVisible: false,
  groupList: [],
  versionList: [],
  arrange: {}
});
const toInstallDialog = async ({ install }: Record<string, any>) => {
  await installSub({
    login_alias: state.arrange.task,
    login_operation: "install",
    version: install.version,
    group_name: install.group_name,
    address: document.location.hostname
  });

  getTask();
  state.installDialogVisible = false;
};
const closedInstallDialog = () => {
  state.installDialogVisible = false;
};
const statusInfo = (data: Record<string, any>) => {
  localSet("manageTool-status", data);
  router.push(`/assetManagement/managerTool/statusInfo`);
};
const installSub = async (task: Record<string, any>) => {
  try {
    const data: any = await getTaskInfo(task);
    if (data.message.includes("failed")) {
      ElMessage({
        message: `安装代理失败`,
        type: "error"
      });
    } else {
      ElMessage({
        message: `代理开始安装，请稍后刷新列表查看任务状态`,
        type: "success"
      });
    }
  } catch (error) {
    console.log(`安装代理错误: ${error}`);
  }
};
const uninstall = async (data: Record<string, any>) => {
  await useHandleData(
    getTaskInfo,
    {
      login_alias: data.task,
      login_operation: "uninstall"
    },
    `卸载该代理`,
    "warning",
    "代理开始卸载，请稍后刷新列表查看任务状态"
  );
  getTask();
};
const install = (data: Record<string, any>) => {
  state.arrange = { ...data };
  state.installDialogVisible = true;
};
const toAdd = () => {
  router.push(`/assetManagement/managerTool/service`);
};
const info = (data: Record<string, any>) => {
  localSet("manageTool-info", data);
  router.push(`/assetManagement/managerTool/taskInfo`);
};
const remove = async (data: Record<string, any>) => {
  await useHandleData(removeTask, { login_alias: data.task, login_operation: "del" }, `删除该数据`);
  getTask();
};
const getTask = async () => {
  try {
    const data: any = await getTaskList();
    state.taskList = [...((data || {}).data || {}).affected_items];
  } catch (error) {
    console.log(`查询批量部署任务列表错误: ${error}`);
  }
};
const columns = reactive<ColumnProps[]>([
  {
    field: "task",
    name: "任务名称"
  },
  {
    field: "createtime",
    name: "创建时间",
    render: (item: Record<string, any>) => formatDate(new Date(item.createtime))
  },
  {
    field: "status",
    name: "状态",
    render: (item: Record<string, any>) => formateStatus(item.status)
  }
]);
const formateStatus = (status: string) => {
  let obj = statsuOpt.find((item: Record<string, any>) => item.value === status);
  if (obj) {
    return obj.label;
  } else {
    return "-";
  }
};
const statsuOpt = [
  { label: "未运行", value: "ready" },
  { label: "运行中", value: "doing" },
  { label: "运行成功", value: "success" },
  { label: "运行失败", value: "failed" }
];
const getGroup = async () => {
  try {
    const data: any = await getGroupList({ limit: 0 });
    state.groupList = ((data || {}).data || {}).affected_items;
  } catch (error) {
    console.log(`查询安装分组错误: ${error}`);
  }
};
const getVersion = async () => {
  try {
    const data: any = await getVersionList();
    state.versionList = ((data || {}).data || {}).affected_items;
  } catch (error) {
    console.log(`查询安装版本错误: ${error}`);
  }
};
onMounted(() => {
  getTask();
  getGroup();
  getVersion();
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
