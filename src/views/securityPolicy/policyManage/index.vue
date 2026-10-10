<template>
  <div class="card no-card policy-manage-container">
    <ProTable ref="proTable" :data="list" :columns="columns" :tool-button="false" :fuzzy-query="true">
      <template #tableHeader="scope">
        <div class="btn-warp mb5">
          <el-button type="primary" @click="toAdd">新增策略</el-button>
          <el-button type="primary" icon="Delete" @click="remove(scope.selectedList)" :disabled="scope.selectedList.length === 0">
            批量删除
          </el-button>
        </div>
      </template>
      <!-- 策略名 -->
      <template #name="scope">
        <el-tooltip effect="dark" content="编辑规则" placement="top">
          <el-button
            type="primary"
            link
            :disabled="!isRoutePermission('/securityPolicy/policyManage/ruleManage/:id')"
            @click="toRule(scope.row)"
          >
            {{ scope.row.name }}
          </el-button>
        </el-tooltip>
      </template>
      <!-- 操作 -->
      <template #operation="scope">
        <el-tooltip effect="dark" content="编辑规则" placement="top">
          <el-button link type="primary" size="small" @click="toRule(scope.row)">
            <el-icon><Operation /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip effect="dark" content="策略下发" placement="top" v-if="scope.row.state === 'disable'">
          <el-button link type="primary" size="small" @click="toSend(scope.row, 'enable')">
            <el-icon><FolderAdd /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip effect="dark" content="策略取消下发" placement="top" v-if="scope.row.state === 'enable'">
          <el-button link type="primary" size="small" @click="toSend(scope.row, 'disable')">
            <el-icon><FolderRemove /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip effect="dark" content="编辑策略" placement="top">
          <el-button link type="primary" size="small" @click="edit(scope.row)">
            <el-icon><Edit /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip effect="dark" :content="scope.row.state === 'enable' ? '已下发状态策略不可删除' : '删除策略'" placement="top">
          <el-button link type="primary" size="small" @click="remove([scope.row])" :disabled="scope.row.state === 'enable'">
            <el-icon><Delete /></el-icon>
          </el-button>
        </el-tooltip>
      </template>
    </ProTable>
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

<script setup lang="ts" name="addressObject">
import { onMounted, reactive, ref } from "vue";
import { ElMessageBox, ElMessage } from "element-plus";
import ProTable from "@/components/ProTable/index.vue";
import { ProTableInstance, ColumnProps } from "@/components/ProTable/interface";
import { getPolicyList } from "@/api/modules/policyManage";
import { useRouter } from "vue-router";
import { formatDate, localSet, isRoutePermission } from "@/utils";
import { policyManageState, createState } from "./state";
import { getTagList } from "@/api/modules/assets";
import OrderDialog from "@/components/OrderDialog/index.vue";
import { OrderDialogProps } from "@/components/OrderDialog/interface";

const router = useRouter();
let isLoading = ref(false);
let list = ref<Record<string, any>[]>([]);
const orderDialog = ref();
let orderProps = ref<OrderDialogProps>({
  task_type: "operate",
  log_object: "policy",
  log_action: "",
  params: {},
  unuse_params: ""
});
const proTable = ref<ProTableInstance>();
const columns = reactive<ColumnProps[]>([
  { type: "selection", fixed: "left", width: 70, selectable: (item: Record<string, any>) => item.state === "disable" },
  {
    prop: "name",
    label: "策略名"
  },
  {
    prop: "loc_name",
    label: "位置标签"
  },
  {
    prop: "org_name",
    label: "组织标签"
  },
  {
    prop: "bus_name",
    label: "业务标签"
  },
  {
    prop: "state_label",
    label: "下发状态"
  },
  {
    prop: "type_label",
    label: "策略类型"
  },
  {
    prop: "time",
    label: "修改时间",
    render: scope => formatDate(new Date(scope.row.time))
  },
  { prop: "operation", label: "操作", fixed: "right", width: 120, align: "left", hideOverflowTooltip: true }
]);
const toAdd = () => {
  router.push(`/securityPolicy/policyManage/add`);
};
const toRule = (item: Record<string, any>) => {
  localSet("policyManage-edit", item);
  router.push({
    path: `/securityPolicy/policyManage/ruleManage/${item.name}`
  });
};
const toSend = (item: Record<string, any>, type: string) => {
  try {
    if (item.rulenum === 0 && type === "enable") {
      ElMessage({
        type: "warning",
        message: "该策略下无规则，请先编辑规则后再进行策略下发"
      });
    } else {
      ElMessageBox.confirm(`确认${type === "enable" ? "下发" : "取消下发"}该策略?`, "温馨提示", { type: "warning" }).then(
        async () => {
          const unuse_params_item = {
            策略名: item.name,
            策略类型: item.type_label,
            下发状态: item.state_label,
            位置: item.loc_name,
            组织: item.org_name,
            业务: item.bus_name,
            描述: item.info
          };
          orderProps.value = {
            task_type: "operate",
            log_object: "policy",
            log_action: "send",
            params: {
              pktpolicy_name: item.name,
              pktpolicy_state: type
            },
            unuse_params: JSON.stringify([unuse_params_item])
          };
          orderDialog.value?.judgeSwitch();
        }
      );
    }
  } catch (error) {
    console.log(`策略发送错误: ${error}`);
  }
};
const edit = (data: Record<string, any>) => {
  localSet("policyManage-edit", data);
  router.push({
    path: `/securityPolicy/policyManage/edit/${data.name}`
  });
};
const remove = async (selectedItems: Record<string, any>[]) => {
  ElMessageBox.confirm("确认删除该策略?", "温馨提示", { type: "warning" }).then(async () => {
    const unuse_params_arr = selectedItems.map((item: Record<string, any>) => ({
      策略名: item.name,
      策略类型: item.type_label,
      下发状态: item.state_label,
      位置: item.loc_name,
      组织: item.org_name,
      业务: item.bus_name,
      描述: item.info
    }));
    const pktpolicy_list = selectedItems.map((item: Record<string, any>) => item.name).join(",");
    orderProps.value = {
      task_type: "operate",
      log_object: "policy",
      log_action: "delete",
      params: {
        pktpolicy_list
      },
      unuse_params: JSON.stringify(unuse_params_arr)
    };
    orderDialog.value?.judgeSwitch();
  });
};
const orderDialogCallback = () => {
  orderProps.value = {
    task_type: "operate",
    log_object: "policy",
    log_action: "",
    params: {},
    unuse_params: ""
  };
  proTable.value?.clearSelection();
  getList();
};
const getList = async () => {
  try {
    isLoading.value = true;
    const data = await getPolicyList();
    list.value = ((data || {}).data || {}).affected_items.map((item: Record<string, any>) => {
      item.state_label = item.state === "enable" ? "已下发" : "未下发";
      item.type_label = policyManageState.policyOptions.find((k: Record<string, any>) => k.id === item.type)?.label ?? "-";
      return item;
    });
    isLoading.value = false;
  } catch (error) {
    console.log(`查询策略列表错误: ${error}`);
  }
};
onMounted(async () => {
  isLoading.value = true;
  Object.assign(policyManageState, createState());
  getInitList();
  getList();
});

const getInitList = async () => {
  try {
    const tagItems = await getTagList({ label_type: "loc" });
    let tagList = ((tagItems || {}).data || {}).affected_items.map(k => ({
      id: k.id,
      label: k.show_name,
      type: "loc"
    }));
    tagList.unshift({
      id: "no_loc",
      label: "不限位置",
      type: "loc"
    });
    policyManageState.tagList1 = tagList;
  } catch (error) {
    console.log(`位置标签列表错误: ${error}`);
  }

  try {
    const tagItems = await getTagList({ label_type: "org" });
    let tagList = ((tagItems || {}).data || {}).affected_items.map(k => ({
      id: k.id,
      label: k.show_name,
      type: "org"
    }));
    tagList.unshift({
      id: "no_org",
      label: "不限组织",
      type: "org"
    });
    policyManageState.tagList2 = tagList;
  } catch (error) {
    console.log(`组织标签列表错误: ${error}`);
  }

  try {
    const tagItems = await getTagList({ label_type: "business" });
    let tagList = ((tagItems || {}).data || {}).affected_items.map(k => ({
      id: k.id,
      label: k.show_name,
      type: "business"
    }));
    tagList.unshift({
      id: "no_business",
      label: "不限业务",
      type: "business"
    });
    policyManageState.tagList3 = tagList;
  } catch (error) {
    console.log(`业务标签列表错误: ${error}`);
  }
};
</script>
<style scoped lang="scss">
.policy-manage-container {
  .query-form {
    width: 40%;
  }
}
</style>
