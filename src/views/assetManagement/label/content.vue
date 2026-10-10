<template>
  <div class="label-container">
    <el-row class="pb20">
      <el-button type="primary" @click="toAdd">新增标签</el-button>
      <el-button type="primary" icon="Delete" @click="removeMore" :disabled="selectedList.length === 0"> 批量删除 </el-button>
    </el-row>
    <el-table :data="state.list" border scrollbar-always-on v-loading="state.loading" @selection-change="selectionChange">
      <el-table-column type="selection" width="55" />
      <el-table-column
        v-for="(column, index) in columns"
        :key="`label_${index}`"
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
      <!-- 无数据 -->
      <template #empty>
        <div class="table-empty">
          <slot name="empty">
            <img src="@/assets/images/notData.png" alt="notData" />
            <div>暂无数据</div>
          </slot>
        </div>
      </template>
      <!-- 操作 -->
      <el-table-column fixed="right" label="操作" width="120">
        <template #default="scope">
          <el-tooltip effect="dark" :content="`编辑数据`" placement="top">
            <el-button link type="primary" size="small" @click="edit(scope.row)">
              <el-icon><Edit /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip effect="dark" :content="`删除数据`" placement="top">
            <el-button link type="primary" size="small" @click="remove([scope.row])">
              <el-icon><Delete /></el-icon>
            </el-button>
          </el-tooltip>
        </template>
      </el-table-column>
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

<script setup lang="ts" name="content">
import { onMounted, reactive, watch, ref } from "vue";
import { ColumnProps } from "@/components/PageTable/interface";
import { localSet, formatDate } from "@/utils";
import { getTagList } from "@/api/modules/assets";
import { labelState } from "./state";
import { ElMessageBox } from "element-plus";
import OrderDialog from "@/components/OrderDialog/index.vue";
import { OrderDialogProps } from "@/components/OrderDialog/interface";

const columns = reactive<ColumnProps[]>([
  {
    field: "show_name",
    name: "显示名称",
    showOverflowTooltip: true
  },
  {
    field: "last_m_time",
    name: "修改时间",
    render: (item: Record<string, any>) => formatDate(new Date(item.last_m_time)),
    showOverflowTooltip: true
  },
  {
    field: "last_m_user",
    name: "修改人",
    showOverflowTooltip: true
  }
]);

const state = ref<Record<string, any>>({
  loading: false,
  list: [],
  currentPage: 1,
  pageSize: 10,
  total: 0
});
let selectedList = ref<Record<string, any>[]>([]);
const orderDialog = ref();
let orderProps = ref<OrderDialogProps>({
  task_type: "operate",
  log_object: "tag",
  log_action: "delete",
  params: {},
  unuse_params: ""
});

const getTypeLabel = (type: string) => {
  let label = "位置";
  switch (type) {
    case "loc":
      label = "位置";
      break;
    case "org":
      label = "组织";
      break;
    case "business":
      label = "业务";
      break;
    case "component":
      label = "组件";
      break;
    default:
      label = "位置";
      break;
  }
  return `${label}标签`;
};

const getList = async () => {
  try {
    state.value.loading = true;
    let params = {
      label_type: labelState.activeName,
      offset: (state.value.currentPage - 1) * state.value.pageSize,
      limit: state.value.pageSize
    };
    const rawItems = await getTagList(params);
    state.value.list = ((rawItems || {}).data || {}).affected_items;
    state.value.total = ((rawItems || {}).data || {}).total_affected_items;
    state.value.loading = false;
  } catch (error) {
    console.log(`查询标签列表错误: ${error}`);
  }
};
const toAdd = () => {
  labelState.pageType = "add";
};
const edit = (data: Record<string, any>) => {
  localSet("labelObject-edit", data);
  labelState.pageType = "detail";
};
const removeMore = async () => {
  await remove(selectedList.value);
};
const selectionChange = (selection: Record<string, any>[]) => {
  selectedList.value = selection;
};
const remove = async (selectedItems: Record<string, any>[]) => {
  ElMessageBox.confirm("确认删除该标签?", "温馨提示", { type: "warning" }).then(async () => {
    const unuse_params_arr = selectedItems.map((item: Record<string, any>) => ({
      标签类型: getTypeLabel(item.type),
      名称: item.name,
      显示名称: item.show_name
    }));
    const labels_list = selectedItems.map((item: Record<string, any>) => item.id).join(",");
    orderProps.value = {
      task_type: "operate",
      log_object: "tag",
      log_action: "delete",
      params: {
        labels_list
      },
      unuse_params: JSON.stringify(unuse_params_arr)
    };
    orderDialog.value?.judgeSwitch();
  });
};
const orderDialogCallback = () => {
  orderProps.value = {
    task_type: "operate",
    log_object: "tag",
    log_action: "delete",
    params: {},
    unuse_params: ""
  };
  getList();
};
onMounted(async () => {
  getList();
});

watch(
  () => [labelState.activeName],
  async () => {
    getList();
  }
);

const handleSizeChange = (val: number) => {
  state.value.pageSize = val;
  state.value.currentPage = 1;
  getList();
};

const handleCurrentChange = (val: number) => {
  state.value.currentPage = val;
  getList();
};
</script>
<style scoped lang="scss">
.label-container {
  .query-form {
    width: 40%;
  }
}
</style>
