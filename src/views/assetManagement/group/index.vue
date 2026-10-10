<template>
  <div class="card group-container">
    <el-row class="pb20">
      <el-button type="primary" @click="toAdd">新增工作组</el-button>
      <el-button type="primary" @click="downloadFile">导出</el-button>
      <el-button type="primary" @click="getGroupsList">刷新</el-button>
    </el-row>
    <el-table ref="tableRef" :data="state.list" border scrollbar-always-on v-loading="state.isLoading">
      <el-table-column
        v-for="(column, index) in columns"
        :key="`address_${index}`"
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
      <el-table-column fixed="right" label="操作" width="170">
        <template #default="scope">
          <el-tooltip
            effect="dark"
            :content="scope.row.name === 'default' ? '默认组不可查看分组下工作负载' : '查看分组下工作负载'"
            placement="top"
          >
            <el-button link type="primary" size="small" @click="toAgentList(scope.row)" :disabled="scope.row.name === 'default'">
              <el-icon><DataBoard /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip effect="dark" content="查看分组下策略" placement="top">
            <el-button link type="primary" size="small" @click="toPolicy(scope.row)">
              <el-icon><ScaleToOriginal /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip
            effect="dark"
            :content="scope.row.mode === 'auto' ? 'K8工作组不可启动' : '启动组内工作负载'"
            placement="top"
          >
            <el-button link type="primary" size="small" @click="toStart(scope.row)" :disabled="scope.row.mode === 'auto'">
              <el-icon><VideoPlay /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip
            effect="dark"
            :content="scope.row.mode === 'auto' ? 'K8工作组不可关闭' : '关闭组内工作负载'"
            placement="top"
          >
            <el-button link type="primary" size="small" @click="toStop(scope.row)" :disabled="scope.row.mode === 'auto'">
              <el-icon><SwitchButton /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip effect="dark" :content="scope.row.name === 'default' ? '默认组不可编辑' : '编辑工作组'" placement="top">
            <el-button link type="primary" size="small" @click="toEdit(scope.row)" :disabled="scope.row.name === 'default'">
              <el-icon><Edit /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip
            effect="dark"
            :content="
              scope.row.name === 'default' ? '默认组不可删除' : scope.row.mode === 'auto' ? 'K8工作组不可删除' : '删除工作组'
            "
            placement="top"
          >
            <el-button
              link
              type="primary"
              size="small"
              @click="toRemove(scope.row)"
              :disabled="scope.row.name === 'default' || scope.row.mode === 'auto'"
            >
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
    <el-pagination
      v-if="state.total !== 0"
      v-model:current-page="state.currentPage"
      v-model:page-size="state.pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :background="true"
      layout="total, sizes, prev, pager, next, jumper"
      :total="state.total"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
    <OrderDialog
      ref="orderDialog"
      :task_type="orderProps.task_type"
      :log_object="orderProps.log_object"
      :log_action="orderProps.log_action"
      :params="orderProps.params"
      :unuse_params="orderProps.unuse_params"
      @callback-fn="orderDialogCallback"
    />
  </div>
</template>

<script setup lang="ts" name="groupManage">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { groupState, createState } from "./state";
import { useHandleData } from "@/hooks/useHandleData";
import { getGroupList, getGroupAgent, toStartAgent, toStopAgent } from "@/api/modules/assets";
import { localSet } from "@/utils";
import { ElMessageBox, ElMessage } from "element-plus";
import { useDownloadList } from "@/hooks/useDownloadList";
import OrderDialog from "@/components/OrderDialog/index.vue";
import { OrderDialogProps } from "@/components/OrderDialog/interface";

const router = useRouter();
const state = ref<Record<string, any>>({
  isLoading: false,
  list: [],
  currentPage: 1,
  pageSize: 10,
  total: 0
});
const columns = ref<Record<string, any>[]>([
  {
    field: "show_name",
    name: "显示名称"
  },
  {
    field: "count",
    name: "代理"
  },
  {
    field: "loc_show_name",
    name: "位置标签"
  },
  {
    field: "org_show_name",
    name: "组织标签"
  },
  {
    field: "business_show_name",
    name: "业务标签"
  },
  {
    field: "policy_status",
    name: "策略状态",
    render: (item: Record<string, any>) =>
      groupState.policyStatusOptions.find((k: Record<string, any>) => k.id === item.policy_status)?.label ?? "-"
  }
]);
const orderDialog = ref();
let orderProps = ref<OrderDialogProps>({
  task_type: "operate",
  log_object: "group",
  log_action: "delete",
  params: {},
  unuse_params: ""
});
onMounted(async () => {
  state.value.isLoading = true;
  Object.assign(groupState, createState());
  await getGroupsList();
});

const getGroupsList = async () => {
  state.value.isLoading = true;
  try {
    const limit = state.value.pageSize;
    const offset = (state.value.currentPage - 1) * state.value.pageSize;
    const groups = await getGroupList({ limit, offset });
    state.value.list = ((groups || {}).data || {}).affected_items;
    state.value.total = ((groups || {}).data || {}).total_affected_items;
  } catch (error) {
    console.log(`分组列表错误: ${error}`);
  }
  state.value.isLoading = false;
};

const handleSizeChange = (val: number) => {
  state.value.pageSize = val;
  state.value.currentPage = 1;
  getGroupsList();
};

const handleCurrentChange = (val: number) => {
  state.value.currentPage = val;
  getGroupsList();
};

const toAdd = () => {
  router.push(`/assetManagement/group/add`);
};

const toAgentList = (item: Record<string, any>) => {
  router.push({
    path: `/assetManagement/group/agents/${item.name}`,
    query: {
      show_name: item.show_name,
      mode: item.mode
    }
  });
};

const toPolicy = (item: Record<string, any>) => {
  router.push({
    path: `/assetManagement/group/policy/${item.name}`,
    query: {
      show_name: item.show_name
    }
  });
};

const toEdit = (item: Record<string, any>) => {
  localSet("group-edit", item);
  router.push({
    path: `/assetManagement/group/edit/${item.name}`
  });
};

const toStart = async (item: Record<string, any>) => {
  let agents_list = "";
  try {
    const agentsRes = await getGroupAgent({
      urlId: item.name,
      params: { limit: 0, q: `id!=000;(status=disconnected,status=never_connected)`, select: "id,status" }
    });
    agents_list = ((agentsRes || {}).data || {}).affected_items.map(k => k.id).join(",");
  } catch (error) {
    console.log(`代理列表错误: ${error}`);
  }
  if (agents_list) {
    await useHandleData(
      toStartAgent,
      { agents_list },
      `启动该组内工作负载`,
      "warning",
      "启动该组内工作负载成功，执行需要一定时间，工作负载状态延迟后更新"
    );
  } else {
    ElMessage.warning("该分组内没有未连接状态的工作负载");
  }
};

const toStop = async (item: Record<string, any>) => {
  let agents_list = "";
  try {
    const agentsRes = await getGroupAgent({
      urlId: item.name,
      params: { limit: 0, q: `id!=000;(status=active)`, select: "id,status" }
    });
    agents_list = ((agentsRes || {}).data || {}).affected_items.map(k => k.id).join(",");
  } catch (error) {
    console.log(`代理列表错误: ${error}`);
  }
  if (agents_list) {
    await useHandleData(
      toStopAgent,
      { agents_list },
      `关闭该组内工作负载`,
      "warning",
      "关闭该组内工作负载成功，执行需要一定时间，工作负载状态延迟后更新"
    );
  } else {
    ElMessage.warning("该分组内没有已连接状态的工作负载");
  }
};

const toRemove = async (item: Record<string, any>) => {
  ElMessageBox.confirm("确认删除该工作组?", "温馨提示", { type: "warning" }).then(async () => {
    const unuse_params_item = {
      名称: item.name,
      显示名称: item.show_name,
      位置: item.loc_show_name,
      组织: item.org_show_name,
      业务: item.business_show_name,
      描述: item.description
    };
    orderProps.value = {
      task_type: "operate",
      log_object: "group",
      log_action: "delete",
      params: {
        groups_list: item.name
      },
      unuse_params: JSON.stringify([unuse_params_item])
    };
    orderDialog.value?.judgeSwitch();
  });
};

const orderDialogCallback = () => {
  orderProps.value = {
    task_type: "operate",
    log_object: "group",
    log_action: "delete",
    params: {},
    unuse_params: ""
  };
  getGroupsList();
};

const downloadFile = () => {
  ElMessageBox.confirm("确认导出工作组?", "温馨提示", { type: "warning" }).then(async () => {
    const csvColumns = columns.value.map((item: Record<string, any>) => ({
      label: item.name,
      value: item.field
    }));
    const dataCallBack = (item: Record<string, any>) => {
      item.loc_show_name = item.loc_show_name ?? "-";
      item.org_show_name = item.org_show_name ?? "-";
      item.business_show_name = item.business_show_name ?? "-";
      item.policy_status =
        groupState.policyStatusOptions.find((k: Record<string, any>) => k.id === item.policy_status)?.label ?? "-";
      return item;
    };
    useDownloadList(getGroupList, "工作组列表", csvColumns, {}, false, false, true, dataCallBack);
  });
};
</script>
