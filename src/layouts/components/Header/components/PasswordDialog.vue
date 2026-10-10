<template>
  <el-dialog
    v-model="dialogVisible"
    title="修改密码"
    width="600px"
    draggable
    @closed="closedDialog"
    :close-on-press-escape="false"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" class="form_wrap" :model="formData" :rules="rules" label-width="100px">
      <el-form-item label="当前密码:" prop="curPassword">
        <el-input v-model="formData.curPassword" type="password" placeholder="输入当前密码" show-password />
      </el-form-item>
      <el-form-item label="新密码:" prop="password">
        <el-input v-model="formData.password" type="password" placeholder="输入新密码" show-password />
      </el-form-item>
      <el-form-item label="确认密码:" prop="repassword">
        <el-input v-model="formData.repassword" type="password" placeholder="输入确认密码" show-password />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="onSubmit">确认</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { getLoginConfig, editUser } from "@/api/modules/system";
import { watch } from "vue";
import { useRouter } from "vue-router";
import { loginWazuh } from "@/api/modules/login";
import { ElMessage } from "element-plus";
import { useUserStore } from "@/stores/modules/user";
import { LOGIN_URL } from "@/config";

const router = useRouter();
const formRef = ref();
let formData = ref<Record<string, any>>({
  curPassword: "",
  password: "",
  repassword: ""
});
let passwordrules = reactive([]);
const passwordLength = ref("8");
const passwordHelpText = ref("");
const userStore = useUserStore();
const loginUser = computed(() => userStore.userInfo);

const toGetPasswordRuld = async () => {
  try {
    const data = await getLoginConfig();
    let params = ((data || {}).data || {}).affected_items[0];
    passwordrules = params.passwordrules.split(",");
    passwordLength.value = params.pwdlen;

    const passwordHelpOptions = {
      upper: "大写字母",
      lower: "小写字母",
      num: "数字字符",
      spechar: "特殊字符"
    };
    let helpText = `密码长度至少${passwordLength.value}位，`;
    if (passwordrules.length > 0) {
      helpText += `且必须包含`;
    }
    passwordrules.map(k => {
      helpText += `${passwordHelpOptions[k]}、`;
    });
    helpText = helpText.substring(0, helpText.length - 1);
    passwordHelpText.value = helpText;
  } catch (error) {
    console.log(`查询修改密码规则失败: ${error}`);
  }
};
const checkPassword = (rule: any, value: any, callback: any) => {
  // 密码规则验证
  const regexpOptions: Record<string, RegExp> = {
    upper: /[A-Z]/,
    lower: /[a-z]/,
    num: /[0-9]/,
    spechar: new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？+-]")
  };
  let isCheck = true;
  passwordrules.map(k => {
    if (!regexpOptions[k].test(value)) {
      isCheck = false;
    }
  });
  if (isCheck && value.length >= passwordLength.value) {
    callback();
  } else {
    callback(new Error(passwordHelpText.value));
  }
};
const checkRepassword = (rule: any, value: any, callback: any) => {
  if (value === formData.value.password) {
    callback();
  } else {
    callback(new Error("确认密码必须与新密码一致！"));
  }
};
const rules = reactive<Record<string, any>>({
  curPassword: [{ required: true, message: "请输入当前密码", trigger: "blur" }],
  password: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { validator: checkPassword, trigger: "blur" }
  ],
  repassword: [
    { required: true, message: "请输入确认密码", trigger: "blur" },
    { validator: checkRepassword, trigger: "blur" }
  ]
});
const dialogVisible = ref(false);
const openDialog = () => {
  dialogVisible.value = true;
};
const onSubmit = async () => {
  formRef.value.validate(async (valid: any) => {
    if (valid) {
      try {
        await loginWazuh({ username: loginUser.value.name, password: formData.value.curPassword, params: { checkpwd: true } });
        await subPass();
      } catch (error) {
        console.log(`验证用户失败: ${error}`);
      }
    } else {
      return false;
    }
  });
};
const subPass = async () => {
  try {
    let { id, role } = loginUser.value;
    let { password } = formData.value;
    let editParams: Record<string, string> = {
      user_tag: role,
      password
    };
    let editRes: any = await editUser(editParams, id);
    if (editRes.message.includes("failed.")) {
      ElMessage({
        message: "保存失败",
        type: "error"
      });
    } else {
      closedDialog();
      // 1.修改密码后，后台自动清除登录，不必执行退出登录接口

      // 2.清除 Token
      userStore.setToken("");

      // 3.清除用户信息
      userStore.setUserInfo({});

      // 4.重置集群状态
      userStore.setIsCluster(false);

      // 5.重定向到登陆页
      router.replace(LOGIN_URL);
      ElMessage.success("密码重置，请重新登录");
    }
  } catch (error) {
    console.log(`修改密码错误: ${error}`);
  }
};
const closedDialog = () => {
  formRef.value.resetFields();
  dialogVisible.value = false;
};

watch(dialogVisible, newValue => {
  if (newValue) {
    toGetPasswordRuld();
  }
});

defineExpose({ openDialog });
</script>
