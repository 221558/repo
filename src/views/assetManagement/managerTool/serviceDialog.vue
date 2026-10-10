<template>
  <el-dialog
    :model-value="visible"
    title="新增服务器"
    style="width: 30%"
    @closed="closedDialog"
    :close-on-press-escape="false"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <el-form-item label="服务器IP:" prop="ip">
        <el-input v-model="formData.ip" />
      </el-form-item>
      <el-form-item label="用户名称:" prop="user">
        <el-input v-model="formData.user" />
      </el-form-item>
      <el-form-item label="用户密码:" prop="pwd">
        <el-input v-model="formData.pwd" type="password" show-password />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="onSubmit"> 确定 </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup name="managerToolServiceDialog">
import { reactive, ref } from "vue";
import { checkIp } from "@/utils/eleValidate";

interface ListType {
  list: any[];
  visible?: boolean;
}
const formRef = ref();
withDefaults(defineProps<ListType>(), {
  visible: false,
  list: () => []
});
let formData = reactive<Record<string, any>>({
  ip: "",
  user: "",
  pwd: ""
});
const rules = reactive<Record<string, any>>({
  ip: [
    { required: true, message: "请输入服务器IP", trigger: "blur" },
    { validator: (rule: any, value: any, callback: any) => checkIp(rule, value, callback), trigger: "blur" }
  ],
  user: [{ required: true, message: "请输入用户名称", trigger: "blur" }],
  pwd: [{ required: true, message: "请输入用户密码", trigger: "blur" }]
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
        service: { ...formData }
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
