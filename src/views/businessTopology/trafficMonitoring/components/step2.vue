<template>
  <PageTable
    ref="pageTable"
    :columns="columns"
    :data="policyList"
    :is-search="false"
    :is-edit="false"
    :is-del="false"
    :is-single-choice="true"
    :on-selection-change="selectionChange"
  >
    <template #btn-warp>
      <el-row class="pt20 pb20">
        <el-button type="primary" @click="toAdd">新增策略</el-button>
      </el-row>
    </template>
  </PageTable>
  <el-row class="pt20 pb20">
    <el-button
      type="primary"
      @click="toNext"
      :disabled="selectedList.length === 0"
      v-if="policyState.currentStep < policyState.stepList.length"
    >
      下一步
    </el-button>
    <el-button
      type="primary"
      @click="toSave"
      :disabled="selectedList.length === 0"
      v-if="policyState.currentStep === policyState.stepList.length"
    >
      确认保存
    </el-button>
  </el-row>
  <el-dialog
    v-model="dialogVisible"
    title="新增策略"
    width="770px"
    draggable
    @close="toClose"
    :close-on-press-escape="false"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="formData" label-width="100px" :rules="rules">
      <el-form-item label="策略名称:" prop="pktpolicy_name">
        <el-input v-model="formData.pktpolicy_name" placeholder="输入策略名称" />
        <span class="label_desc">指定唯一的名称。一旦创建成功，就不能编辑该名称</span>
      </el-form-item>
      <el-form-item label="策略类型:" prop="pktpolicy_type">
        <el-select v-model="formData.pktpolicy_type" filterable placeholder="选择策略类型" disabled>
          <el-option label="白名单" value="white" />
          <el-option label="黑名单" value="black" />
        </el-select>
      </el-form-item>
      <el-form-item label="位置:" prop="pktpolicy_loc">
        <el-select v-model="formData.pktpolicy_loc" filterable placeholder="选择位置标签" disabled>
          <el-option
            v-for="(item, index) in policyState.tagList1"
            :key="`locOptions_${index}`"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="组织:" prop="pktpolicy_org">
        <el-select v-model="formData.pktpolicy_org" filterable placeholder="选择组织标签" disabled>
          <el-option
            v-for="(item, index) in policyState.tagList2"
            :key="`orgOptions_${index}`"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="业务:" prop="pktpolicy_bus">
        <el-select v-model="formData.pktpolicy_bus" filterable placeholder="选择业务标签" disabled>
          <el-option
            v-for="(item, index) in policyState.tagList3"
            :key="`busOptions_${index}`"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="描述:" prop="pktpolicy_info">
        <el-input v-model="formData.pktpolicy_info" type="textarea" placeholder="输入描述" :rows="4" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="toClose">取消</el-button>
        <el-button type="primary" @click="toAddPolicy">确认</el-button>
      </span>
    </template>
  </el-dialog>
  <OrderDialog
    ref="orderDialog"
    :task_type="orderProps.task_type"
    :log_object="orderProps.log_object"
    :log_action="orderProps.log_action"
    :params="orderProps.params"
    :unuse_params="orderProps.unuse_params"
    @callback-fn="orderDialogCallback"
  />
</template>

<script setup lang="ts" name="step2">
import { ref, reactive, onMounted, nextTick, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { localGet, formatDate } from "@/utils";
import { ColumnProps } from "@/components/PageTable/interface";
import PageTable from "@/components/PageTable/index.vue";
import { policyState } from "../state";
import { getTrafficPolicy } from "@/api/modules/topology";
import { addPolicy } from "@/api/modules/policyManage";
import OrderDialog from "@/components/OrderDialog/index.vue";
import { OrderDialogProps } from "@/components/OrderDialog/interface";

const router = useRouter();
const pageTable = ref();
const policyList = ref<Record<string, any>[]>([]);
const selectedList = ref<Record<string, any>[]>([]);
const columns = reactive<ColumnProps[]>([
  {
    field: "name",
    name: "策略名",
    showOverflowTooltip: true
  },
  {
    field: "loc_name",
    name: "位置标签",
    showOverflowTooltip: true
  },
  {
    field: "org_name",
    name: "组织标签",
    showOverflowTooltip: true
  },
  {
    field: "bus_name",
    name: "业务标签",
    showOverflowTooltip: true
  },
  {
    field: "state_label",
    name: "下发状态",
    showOverflowTooltip: true
  },
  {
    field: "type_label",
    name: "策略类型",
    showOverflowTooltip: true
  },
  {
    field: "time",
    name: "修改时间",
    showOverflowTooltip: true,
    render: item => formatDate(new Date(item.time))
  }
]);

let dialogVisible = ref(false);
const formRef = ref();
let formData = ref<Record<string, any>>({
  pktpolicy_name: "", // 策略名称
  pktpolicy_type: "white",
  pktpolicy_loc: "no_loc",
  pktpolicy_org: "no_org",
  pktpolicy_bus: "no_business",
  pktpolicy_info: "" // 描述
});
const rules = reactive<Record<string, any>>({
  pktpolicy_name: [{ required: true, message: "请输入策略名称", trigger: "blur" }],
  pktpolicy_type: [{ required: true, message: "请选择策略类型", trigger: "change" }],
  pktpolicy_loc: [{ required: true, message: "请选择位置标签", trigger: "change" }],
  pktpolicy_org: [{ required: true, message: "请选择组织标签", trigger: "change" }],
  pktpolicy_bus: [{ required: true, message: "请选择业务标签", trigger: "change" }],
  pktpolicy_info: [{ required: true, message: "请输入描述", trigger: "blur" }]
});

const orderDialog = ref();
let orderProps = ref<OrderDialogProps>({
  task_type: "operate",
  log_object: "auto_rule",
  log_action: "add",
  params: {},
  unuse_params: ""
});

onMounted(() => {
  getList();
});

const getList = async () => {
  try {
    const ruleItem = policyState.ruleList[policyState.currentStep - 2];
    const params = {
      srcip: policyState.trafficItem.srcip,
      serfrom_type: ruleItem.from_type,
      dstip: policyState.trafficItem.destip,
      serto_type: ruleItem.to_type,
      pktrule_area: ruleItem.area,
      pktrule_direction: ruleItem.direction
    };
    const resItems = await getTrafficPolicy(params);
    policyList.value = ((resItems || {}).data || {}).affected_items.map((item: Record<string, any>) => {
      item.state_label = item.state === "enable" ? "已下发" : "未下发";
      item.type_label = item.type === "white" ? "白名单" : "黑名单";
      return item;
    });
  } catch (error) {
    console.log(`规则列表错误: ${error}`);
  }
};

const toAdd = () => {
  const flowMatch = localGet("flow-match");
  const scope = policyState.stepList[policyState.currentStep - 1].includes("入") ? flowMatch["in_scope"] : flowMatch["out_scope"];
  formData.value = {
    pktpolicy_name: "", // 策略名称
    pktpolicy_type: "white",
    pktpolicy_loc: scope.loc ?? "no_loc",
    pktpolicy_org: scope.org ?? "no_org",
    pktpolicy_bus: scope.business ?? "no_business",
    pktpolicy_info: "" // 描述
  };
  dialogVisible.value = true;
  nextTick(() => formRef.value.clearValidate());
};

const toClose = () => {
  dialogVisible.value = false;
};

const toAddPolicy = async () => {
  formRef.value.validate(async (valid: any) => {
    if (valid) {
      let params = {
        pktpolicy_name: formData.value.pktpolicy_name,
        pktpolicy_type: formData.value.pktpolicy_type,
        pktpolicy_info: formData.value.pktpolicy_info,
        pktpolicy_loc: formData.value.pktpolicy_loc === "no_loc" ? "0" : formData.value.pktpolicy_loc,
        pktpolicy_org: formData.value.pktpolicy_org === "no_org" ? "0" : formData.value.pktpolicy_org,
        pktpolicy_bus: formData.value.pktpolicy_bus === "no_business" ? "0" : formData.value.pktpolicy_bus
      };
      const resItems = await addPolicy(params);
      if (resItems.message.includes("failed")) {
        ElMessage({
          message: "策略保存失败: 策略名称不可重复",
          type: "error"
        });
      } else {
        ElMessage({
          message: "保存成功",
          type: "success"
        });
        toClose();
        getList();
      }
    } else {
      return false;
    }
  });
};

const selectionChange = (selection: Record<string, any>[]) => {
  selectedList.value = selection;
};

const toNext = () => {
  const ruleItem = policyState.ruleList[policyState.currentStep - 2];
  ruleItem.pktpolicy_name = selectedList.value[0].name;
  selectedList.value = [];
  pageTable.value?.tableElement.clearSelection();
  policyState.currentStep++;
};

watch(
  () => policyState.currentStep,
  () => getList()
);

const toSave = async () => {
  const ruleItem = policyState.ruleList[policyState.currentStep - 2];
  ruleItem.pktpolicy_name = selectedList.value[0].name;
  let unuse_params_arr: Record<string, any>[] = [],
    paramsArr: Record<string, any>[] = [];
  policyState.ruleList.forEach((item: Record<string, any>) => {
    unuse_params_arr.push({
      策略名称: item.pktpolicy_name,
      范围: policyState.scopeOptions.find((k: Record<string, any>) => k.id === item.area)?.label ?? "-",
      组外范围: item.scope,
      流量方向: policyState.directionOptions.find((k: Record<string, any>) => k.id === item.direction)?.label ?? "-",
      服务者类型: policyState.typeOptions.find((k: Record<string, any>) => k.id === item.to_type)?.label ?? "-",
      服务者: item.service_to_name,
      服务: item.service,
      访问者类型: policyState.typeOptions.find((k: Record<string, any>) => k.id === item.from_type)?.label ?? "-",
      访问者: item.service_from_name
    });
    paramsArr.push({
      pktpolicy_name: item.pktpolicy_name,
      pktrule_area: item.area,
      pktrule_scope: item.scope,
      pktrule_direction: item.direction,
      serto_type: item.to_type,
      pktrule_serto: item.service_to,
      service_list: item.service.join(","),
      serfrom_type: item.from_type,
      pktrule_serfrom: item.service_from
    });
  });

  orderProps.value = {
    task_type: "operate",
    log_object: "auto_rule",
    log_action: "add",
    params: {
      paramsArr
    },
    unuse_params: JSON.stringify(unuse_params_arr)
  };
  orderDialog.value?.judgeSwitch();
};

const orderDialogCallback = () => {
  orderProps.value = {
    task_type: "operate",
    log_object: "auto_rule",
    log_action: "add",
    params: {},
    unuse_params: ""
  };
  router.push(`/businessTopology/trafficMonitoring`);
};
</script>
