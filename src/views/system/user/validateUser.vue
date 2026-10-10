<template>
  <el-dialog
    :model-value="visible"
    title="验证用户"
    style="width: 30%"
    @closed="closedDialog"
    :close-on-press-escape="false"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <el-form-item label="当前密码:" prop="password">
        <el-input v-model="formData.password" type="password" placeholder="输入密码" show-password />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="onSubmit"> 确定 </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup name="managerToolInstallDialog">
import { reactive, ref } from "vue";
const formRef = ref();
defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});
let formData = reactive<Record<string, any>>({
  password: ""
});
const rules = reactive<Record<string, any>>({
  password: [{ required: true, message: "请输入密码", trigger: "blur" }]
});
let $emit = defineEmits(["closedDialog", "submitDialog"]);
const closedDialog = () => {
  $emit("closedDialog");
  formRef.value.resetFields();
};

const onSubmit = () => {
  formRef.value.validate(async (valid: any) => {
    if (valid) {
      $emit("submitDialog", {
        password: formData.password
      });
      formRef.value.resetFields();
    } else {
      return false;
    }
  });
};
</script>
<style scoped>
.el-button--text {
  margin-right: 15px;
}
.dialog-footer button:first-child {
  margin-right: 10px;
}
</style>
