<template>
  <div class="card add-form">
    <div class="title mb10">
      <el-button link type="info" @click="toPrev">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="pl10">{{ `${subFlag === 0 ? "新增" : "编辑"}工作组` }}</span>
    </div>
    <el-form ref="formRef" class="form_wrap" :model="formData" :rules="rules" label-width="140px">
      <el-form-item label="显示名称:" prop="show_name">
        <el-input v-model="formData.show_name" placeholder="输入显示名称" />
        <span class="label_desc">显示名称不可输入特殊字符、空格</span>
      </el-form-item>
      <el-form-item label="位置:" prop="loc">
        <el-select v-model="formData.loc" placeholder="选择位置标签" style="width: 300px">
          <el-option
            v-for="(item, index) in groupState.tagList1"
            :key="`tagList1_${index}`"
            :label="item.label"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="组织:" prop="org">
        <el-select v-model="formData.org" placeholder="选择组织标签" style="width: 300px">
          <el-option
            v-for="(item, index) in groupState.tagList2"
            :key="`tagList2_${index}`"
            :label="item.label"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="业务:" prop="business">
        <el-select v-model="formData.business" placeholder="选择业务标签" style="width: 300px">
          <el-option
            v-for="(item, index) in groupState.tagList3"
            :key="`tagList3_${index}`"
            :label="item.label"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="策略状态:" prop="policy_status">
        <el-select v-model="formData.policy_status" placeholder="选择策略状态" style="width: 300px">
          <el-option
            v-for="(item, index) in groupState.policyStatusOptions"
            :key="`policyStatusOptions_${index}`"
            :label="item.label"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="描述:" prop="description">
        <el-input v-model="formData.description" type="textarea" placeholder="输入描述" :rows="4" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit"> 保存 </el-button>
        <el-button plain @click="clear"> 清空 </el-button>
      </el-form-item>
    </el-form>
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

<script setup lang="ts" name="basicForm">
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { groupState, createState } from "./state";
import { useRoute, useRouter } from "vue-router";
import { localGet, localRemove } from "@/utils";
import { ElMessage } from "element-plus";
import { addGroup, getTagList } from "@/api/modules/assets";
import OrderDialog from "@/components/OrderDialog/index.vue";
import { OrderDialogProps } from "@/components/OrderDialog/interface";
import { checkChineseLettertNumber } from "@/utils/eleValidate";

const router = useRouter();
const formRef = ref();
let subFlag = ref(0); // 0=新增，1=编辑
let formData = ref<Record<string, any>>({
  show_name: "",
  loc: "",
  org: "",
  business: "",
  policy_status: "",
  description: ""
});

const orderDialog = ref();
let orderProps = ref<OrderDialogProps>({
  task_type: "operate",
  log_object: "group",
  log_action: "update",
  params: {},
  unuse_params: ""
});

const rules = reactive<Record<string, any>>({
  show_name: [
    { required: true, message: "请输入显示名称", trigger: "blur" },
    { validator: checkChineseLettertNumber, trigger: "blur" }
  ],
  loc: [{ required: true, message: "请选择位置标签", trigger: "change" }],
  org: [{ required: true, message: "请选择组织标签", trigger: "change" }],
  business: [{ required: true, message: "请选择业务标签", trigger: "change" }],
  policy_status: [{ required: true, message: "请选择策略状态", trigger: "change" }],
  description: [{ required: true, message: "请输入描述", trigger: "blur" }]
});

onMounted(() => {
  Object.assign(groupState, createState());
  getInitList();
  const route = useRoute();
  if (route.params.id) {
    subFlag.value = 1;
    const selectedItem = localGet("group-edit");
    formData.value = {
      show_name: selectedItem.show_name,
      loc: selectedItem.loc,
      org: selectedItem.org,
      business: selectedItem.business,
      policy_status: selectedItem.policy_status,
      description: selectedItem.description
    };
  }
});

const getInitList = async () => {
  try {
    const tagItems = await getTagList({ label_type: "loc" });
    let tagList = ((tagItems || {}).data || {}).affected_items.map(k => ({
      id: k.id,
      label: k.show_name
    }));
    groupState.tagList1 = tagList;
  } catch (error) {
    console.log(`位置标签列表错误: ${error}`);
  }

  try {
    const tagItems = await getTagList({ label_type: "org" });
    let tagList = ((tagItems || {}).data || {}).affected_items.map(k => ({
      id: k.id,
      label: k.show_name
    }));
    groupState.tagList2 = tagList;
  } catch (error) {
    console.log(`组织标签列表错误: ${error}`);
  }

  try {
    const tagItems = await getTagList({ label_type: "business" });
    let tagList = ((tagItems || {}).data || {}).affected_items.map(k => ({
      id: k.id,
      label: k.show_name
    }));
    groupState.tagList3 = tagList;
  } catch (error) {
    console.log(`业务标签列表错误: ${error}`);
  }
};

const toPrev = () => {
  router.push(`/assetManagement/group`);
};

const onSubmit = async () => {
  formRef.value.validate(async (valid: any) => {
    if (valid) {
      const params: Record<string, any> = {
        showname: formData.value.show_name,
        labels_list: `${formData.value.loc},${formData.value.org},${formData.value.business}`,
        policy_status: formData.value.policy_status,
        description: formData.value.description
      };
      let res: any;

      if (subFlag.value === 0) {
        try {
          res = await addGroup(params);
        } catch (error) {
          console.log(`新增工作组错误: ${error}`);
        }

        if (res.message.includes("failed")) {
          ElMessage({
            message: "保存失败",
            type: "error"
          });
        } else {
          ElMessage({
            message: "保存成功",
            type: "success"
          });
          toPrev();
        }
      } else {
        const selectedItem = localGet("group-edit");
        params.group_id = selectedItem.name;
        const unuse_params_item = {
          显示名称: selectedItem.show_name,
          位置: selectedItem.loc_show_name,
          组织: selectedItem.org_show_name,
          业务: selectedItem.business_show_name,
          策略状态:
            groupState.policyStatusOptions.find((k: Record<string, any>) => k.id === selectedItem.policy_status)?.label ?? "-",
          描述: selectedItem.description
        };
        orderProps.value = {
          task_type: "operate",
          log_object: "group",
          log_action: "update",
          params,
          unuse_params: JSON.stringify([unuse_params_item])
        };
        orderDialog.value?.judgeSwitch();
      }
    } else {
      return false;
    }
  });
};

const orderDialogCallback = () => {
  orderProps.value = {
    task_type: "operate",
    log_object: "group",
    log_action: "update",
    params: {},
    unuse_params: ""
  };
  toPrev();
};

const clear = () => {
  formRef.value.resetFields();
};

onUnmounted(() => {
  localRemove("group-edit");
});
</script>

<style scoped lang="scss">
.add-form {
  .title {
    height: 30px;
    border-bottom: 1px solid #dcdfe6;
  }
  .el-input,
  .el-textarea {
    width: 300px !important;
  }
  .label_desc {
    padding-left: 20px;
    font-size: 12px;
    color: #9ea7b4;
  }
}
</style>
