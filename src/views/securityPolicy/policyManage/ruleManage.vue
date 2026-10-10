<template>
  <div class="card ruleManage">
    <div class="title mb10">
      <el-button link type="info" @click="toPrev">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="pl10">{{ `${route.params.id}策略规则管理` }}</span>
    </div>
    <PageTable
      :columns="columns"
      :data="list"
      :on-edit="edit"
      :on-del="remove"
      :disabled-edit="disabledEdit"
      :disabled-edit-msg="disabledEditMsg"
    >
      <template #btn-warp>
        <el-row class="pb20">
          <el-button type="primary" @click="toAdd">新增规则</el-button>
        </el-row>
      </template>
    </PageTable>
    <ruleDialog
      :visible="dialogVisible"
      :dialog-type="dialogType"
      :selected-rule="selectedRule"
      @closed-dialog="closedDialog"
    ></ruleDialog>
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

<script setup lang="ts" name="ruleManage">
import { onMounted, reactive, ref, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { policyManageState } from "./state";
import { ColumnProps } from "@/components/PageTable/interface";
import PageTable from "@/components/PageTable/index.vue";
import { getPolicyRule } from "@/api/modules/policyManage";
import { getTagList } from "@/api/modules/assets";
import { getServiceList, getAddressList } from "@/api/modules/security";
import ruleDialog from "./ruleDialog.vue";
import { localRemove } from "@/utils";
import { ElMessageBox } from "element-plus";
import OrderDialog from "@/components/OrderDialog/index.vue";
import { OrderDialogProps } from "@/components/OrderDialog/interface";

let list = ref<Record<string, any>[]>([]);
const columns = reactive<ColumnProps[]>([
  {
    field: "area_label",
    name: "范围"
  },
  {
    field: "direction_label",
    name: "流量方向"
  },
  {
    field: "config_type_label",
    name: "规则类型"
  },
  {
    field: "to_type_label",
    name: "服务者类型"
  },
  {
    field: "serviceto_name",
    name: "服务者"
  },
  {
    field: "service_label",
    name: "服务"
  },
  {
    field: "from_type_label",
    name: "访问者类型"
  },
  {
    field: "servicefrom_name",
    name: "访问者"
  }
]);

let dialogVisible = ref(false);
let dialogType = ref("");
let selectedRule = reactive({});

const orderDialog = ref();
let orderProps = ref<OrderDialogProps>({
  task_type: "operate",
  log_object: "rule",
  log_action: "delete",
  params: {},
  unuse_params: ""
});

const route = useRoute();
const router = useRouter();

onMounted(async () => {
  await getInitList();
  getList();
});

const getInitList = async () => {
  try {
    const tagItems = await getTagList({ label_type: "component" });
    let tagList = ((tagItems || {}).data || {}).affected_items.map(k => ({
      id: k.id,
      label: k.show_name
    }));
    policyManageState.tagList4 = tagList;
  } catch (error) {
    console.log(`组件标签列表错误: ${error}`);
  }

  try {
    const data: any = await getServiceList();
    policyManageState.serviceOptions = ((data || {}).data || {}).affected_items.map((k: Record<string, any>) => ({
      id: k.id.toString(),
      label: k.show_name
    }));
  } catch (error) {
    console.log(`服务对象列表错误: ${error}`);
  }

  try {
    const data: any = await getAddressList();
    policyManageState.addressOptions = ((data || {}).data || {}).affected_items.map((k: Record<string, any>) => ({
      id: k.id,
      label: k.show_name
    }));
  } catch (error) {
    console.log(`地址对象列表错误: ${error}`);
  }
};

const getList = async () => {
  try {
    const data: any = await getPolicyRule({ pktpolicy_name: route.params.id });
    list.value = ((data || {}).data || {}).affected_items.map((item: Record<string, any>) => {
      item.area_label = policyManageState.scopeOptions.find((k: Record<string, any>) => k.id === item.area)?.label ?? "-";
      item.direction_label =
        policyManageState.directionOptions.find((k: Record<string, any>) => k.id === item.direction)?.label ?? "-";
      item.config_type_label = item.config_type === "manual" ? "手动生成" : "自动生成";
      item.to_type_label = policyManageState.typeOptions.find((k: Record<string, any>) => k.id === item.to_type)?.label ?? "-";
      item.service_label = item.config_type === "manual" ? item.service_name ?? "-" : item.service ?? "-";
      item.from_type_label =
        policyManageState.typeOptions.find((k: Record<string, any>) => k.id === item.from_type)?.label ?? "-";
      return item;
    });
  } catch (error) {
    console.log(`查询策略规则错误: ${error}`);
  }
};

const toPrev = () => {
  router.push(`/securityPolicy/policyManage`);
};

const toAdd = () => {
  dialogType.value = "add";
  selectedRule = {};
  dialogVisible.value = true;
};

const disabledEdit = (data: Record<string, any>) => {
  return data.config_type === "auto";
};

const disabledEditMsg = () => "自动生成的规则不可编辑";

const edit = (data: Record<string, any>) => {
  dialogType.value = "detail";
  selectedRule = data;
  dialogVisible.value = true;
};

const remove = async (data: Record<string, any>) => {
  ElMessageBox.confirm("确认删除该规则?", "温馨提示", { type: "warning" }).then(async () => {
    const unuse_params_item = {
      范围: data.area_label,
      流量方向: data.direction_label,
      服务者类型: data.to_type_label,
      服务者: data.serviceto_name,
      服务: data.service_label,
      访问者类型: data.from_type_label,
      访问者: data.servicefrom_name
    };
    orderProps.value = {
      task_type: "operate",
      log_object: "rule",
      log_action: "delete",
      params: {
        pktrule_num: data.id,
        pktpolicy_name: data.name
      },
      unuse_params: JSON.stringify([unuse_params_item])
    };
    orderDialog.value?.judgeSwitch();
  });
};

const orderDialogCallback = () => {
  orderProps.value = {
    task_type: "operate",
    log_object: "rule",
    log_action: "delete",
    params: {},
    unuse_params: ""
  };
  getList();
};

const closedDialog = (isGetList: boolean) => {
  dialogVisible.value = false;
  dialogType.value = "";
  selectedRule = {};
  if (isGetList) getList();
};

onUnmounted(() => {
  localRemove("policyManage-edit");
});
</script>

<style scoped lang="scss">
.ruleManage {
  .title {
    height: 30px;
    border-bottom: 1px solid #dcdfe6;
  }
}
</style>
