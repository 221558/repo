<template>
  <div class="detail-tag">
    <span>{{ generatorState.selectedGroup.label }}：</span>
    <el-tag class="ml8">{{ generatorState.selectedGroup.loc_show_name }}</el-tag>
    <el-tag class="ml8" type="success">{{ generatorState.selectedGroup.org_show_name }}</el-tag>
    <el-tag class="ml8" type="warning">{{ generatorState.selectedGroup.business_show_name }}</el-tag>
  </div>
  <PageTable
    :columns="columns"
    :data="list"
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
    <el-button type="primary" @click="toAddRule" :disabled="selectedList.length === 0">确认</el-button>
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
            v-for="(item, index) in generatorState.tagList1"
            :key="`locOptions_${index}`"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="组织:" prop="pktpolicy_org">
        <el-select v-model="formData.pktpolicy_org" filterable placeholder="选择组织标签" disabled>
          <el-option
            v-for="(item, index) in generatorState.tagList2"
            :key="`orgOptions_${index}`"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="业务:" prop="pktpolicy_bus">
        <el-select v-model="formData.pktpolicy_bus" filterable placeholder="选择业务标签" disabled>
          <el-option
            v-for="(item, index) in generatorState.tagList3"
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
        <el-button type="primary" @click="toSave">确认</el-button>
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

<script setup lang="ts" name="step4">
import { onMounted, ref, reactive, nextTick } from "vue";
import { ElMessage } from "element-plus";
import { formatDate } from "@/utils";
import { ColumnProps } from "@/components/PageTable/interface";
import PageTable from "@/components/PageTable/index.vue";
import { getPolicyList, addPolicy } from "@/api/modules/policyManage";
import { generatorState } from "../state";
import OrderDialog from "@/components/OrderDialog/index.vue";
import { OrderDialogProps } from "@/components/OrderDialog/interface";

let list = ref<Record<string, any>[]>([]);
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
let selectedList = ref<Record<string, any>[]>([]);

let dialogVisible = ref(false);
const formRef = ref();
let formData = ref<Record<string, any>>({
  pktpolicy_name: "", // 策略名称
  pktpolicy_type: "white",
  pktpolicy_loc: generatorState.selectedGroup.loc ?? "no_loc",
  pktpolicy_org: generatorState.selectedGroup.org ?? "no_org",
  pktpolicy_bus: generatorState.selectedGroup.business ?? "no_business",
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
  log_object: "auto_policy",
  log_action: "add",
  params: {},
  unuse_params: ""
});

onMounted(() => {
  getList();
});

const getList = async () => {
  try {
    const params = {
      loc_id: generatorState.selectedGroup.loc ?? "",
      org_id: generatorState.selectedGroup.org ?? "",
      business_id: generatorState.selectedGroup.business ?? "",
      pktpolicy_type: "white"
    };
    const resItems = await getPolicyList(params);
    list.value = ((resItems || {}).data || {}).affected_items.map((item: Record<string, any>) => {
      item.state_label = item.state === "enable" ? "已下发" : "未下发";
      item.type_label = item.type === "white" ? "白名单" : "黑名单";
      return item;
    });
  } catch (error) {
    console.log(`规则列表错误: ${error}`);
  }
};

const selectionChange = (selection: Record<string, any>[]) => {
  selectedList.value = selection;
};

const toAdd = () => {
  dialogVisible.value = true;
  nextTick(() => formRef.value.clearValidate());
};

const toClose = () => {
  dialogVisible.value = false;
  formData.value = {
    pktpolicy_name: "", // 策略名称
    pktpolicy_type: "white",
    pktpolicy_loc: generatorState.selectedGroup.loc ?? "no_loc",
    pktpolicy_org: generatorState.selectedGroup.org ?? "no_org",
    pktpolicy_bus: generatorState.selectedGroup.business ?? "no_business",
    pktpolicy_info: "" // 描述
  };
};

const toSave = async () => {
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

const toAddRule = async () => {
  orderProps.value = {
    task_type: "operate",
    log_object: "auto_policy",
    log_action: "add",
    params: {
      task_id: generatorState.step2Form.task_id,
      pktpolicy_name: selectedList.value[0].name
    },
    unuse_params: ""
  };
  orderDialog.value?.judgeSwitch();
};

const orderDialogCallback = () => {
  orderProps.value = {
    task_type: "operate",
    log_object: "auto_policy",
    log_action: "add",
    params: {},
    unuse_params: ""
  };
  generatorState.selectedGroup = {};
  generatorState.currentStep = 1;
};
</script>
