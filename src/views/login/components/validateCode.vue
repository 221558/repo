<template>
  <el-dialog
    :model-value="props.visible"
    title="验证"
    style="width: 550px"
    class="validateCode-container"
    :show-close="false"
    :append-to-body="true"
    :close-on-press-escape="false"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <el-form-item label="验证码:" prop="input">
        <el-input v-model="formData.input" class="password-warp mr10" placeholder="输入验证码" />
        <canvas ref="verify" :width="verifyOptions.width" :height="verifyOptions.height" @click="verifyState.handleDraw"></canvas>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="toClose">取消</el-button>
        <el-button type="primary" @click="onSubmit">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup name="validateCode">
import { ref, reactive, watch, nextTick } from "vue";
import { ElMessage } from "element-plus";
import { useVerifyCode } from "@/hooks/useVerifyCode";
import { VerifyCode } from "@/hooks/interface";

interface propsType {
  visible?: boolean;
}
const props = withDefaults(defineProps<propsType>(), {
  visible: false
});

const formRef = ref();
const verify = ref();
let formData = ref<Record<string, string>>({
  input: ""
});
const rules = reactive<Record<string, any>>({
  input: [{ required: true, message: "请输入验证码", trigger: "blur" }]
});
const verifyOptions: VerifyCode.OptionsType = {
  width: 120,
  height: 40
};
const verifyState = useVerifyCode(verify, verifyOptions);

watch(
  () => props.visible,
  async (val: boolean) => {
    if (val) {
      nextTick(() => verifyState.handleDraw());
    }
  }
);

let $emit = defineEmits(["closedDialog", "validateSuccess"]);
const toClose = () => {
  $emit("closedDialog");
  formRef.value.resetFields();
};

const onSubmit = () => {
  formRef.value.validate(async (valid: any) => {
    if (valid) {
      if (verifyState.imgCode.value.toLowerCase() === formData.value.input.toLowerCase()) {
        $emit("validateSuccess");
        formRef.value.resetFields();
      } else {
        verifyState.handleDraw();
        formRef.value.resetFields();
        ElMessage({
          message: `验证码错误，请重新输入`,
          type: "error"
        });
      }
    } else {
      return false;
    }
  });
};
</script>

<style scoped lang="scss">
.validateCode-container {
  .password-warp {
    flex-grow: 1;
  }
  .code-warp {
    cursor: pointer;
  }
}
</style>

<style lang="scss">
.validateCode-container {
  .el-form-item__content {
    flex-wrap: nowrap;
  }
}
</style>
