<template>
  <div class="add-form">
    <div class="title mb10">
      <el-button link type="info" @click="toPrev">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="pl10">{{ `${labelState.pageType === "add" ? getBtnLabel("新增") : getBtnLabel("编辑")}` }}</span>
    </div>
    <el-form ref="formRef" class="form_wrap" :model="formData" :rules="rules" label-width="140px">
      <el-form-item label="显示名称:" prop="show_name">
        <el-input v-model="formData.show_name" placeholder="输入显示名称" />
        <span class="label_desc">显示名称不可输入特殊字符、空格</span>
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

<script setup lang="ts" name="labelForm">
import { onMounted, ref, reactive, onUnmounted } from "vue";
import { ArrowLeft } from "@element-plus/icons-vue";
import { addLabel } from "@/api/modules/assetManagement";
import { localGet, localRemove } from "@/utils";
import { ElMessage } from "element-plus";
import { labelState } from "./state";
import OrderDialog from "@/components/OrderDialog/index.vue";
import { OrderDialogProps } from "@/components/OrderDialog/interface";
import { checkChineseLettertNumber } from "@/utils/eleValidate";

const formRef = ref();
const getTypeLabel = () => {
  let label = "位置";
  switch (labelState.activeName) {
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
const getBtnLabel = (flag: any) => {
  let str = getTypeLabel();
  return `${flag}${str}`;
};
const orderDialog = ref();
let orderProps = ref<OrderDialogProps>({
  task_type: "operate",
  log_object: "tag",
  log_action: "update",
  params: {},
  unuse_params: ""
});
const formData = ref<Record<string, string>>({
  show_name: ""
});
const rules = reactive<Record<string, any>>({
  show_name: [
    { required: true, message: "请输入显示名称", trigger: "blur" },
    { validator: checkChineseLettertNumber, trigger: "blur" }
  ]
});
onMounted(() => {
  if (labelState.pageType === "detail") {
    // 编辑页面
    let { show_name, id } = localGet("labelObject-edit");
    formData.value = {
      show_name,
      id
    };
  }
});
const clear = () => {
  formRef.value.resetFields();
  if (labelState.pageType === "detail") {
    const selectedItem = localGet("labelObject-edit");
    formData.value.id = selectedItem.id;
  }
};
const toPrev = () => {
  labelState.pageType = "list";
};
const onSubmit = () => {
  formRef.value.validate(async (valid: any) => {
    if (valid) {
      let res: any = "";
      if (labelState.pageType === "add") {
        let { show_name } = formData.value;
        let addParams = {
          showname_list: show_name,
          label_type: labelState.activeName
        };
        try {
          res = await addLabel(addParams);
        } catch (error) {
          console.log(`新增标签错误: ${error}`);
        }
        if (res.message.includes("failed")) {
          ElMessage({
            message: "标签保存失败: 显示名称不可重复",
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
        let { show_name, id } = localGet("labelObject-edit");
        const unuse_params_item = {
          标签类型: getTypeLabel(),
          显示名称: show_name
        };
        orderProps.value = {
          task_type: "operate",
          log_object: "tag",
          log_action: "update",
          params: {
            label_type: labelState.activeName,
            label_id: id,
            showname: formData.value.show_name
          },
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
    log_object: "tag",
    log_action: "update",
    params: {},
    unuse_params: ""
  };
  toPrev();
};

onUnmounted(() => {
  localRemove("labelObject-edit");
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
    padding-left: 5px;
    font-size: 12px;
    color: #9ea7b4;
  }
}
</style>
