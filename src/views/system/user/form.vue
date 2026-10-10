<template>
  <div class="card add-form">
    <div class="title mb10">
      <el-button link type="info" @click="toPrev">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="pl10">{{ `${subFlag === 0 ? "新增" : "编辑"}用户` }}</span>
    </div>
    <el-form ref="formRef" class="form_wrap" :model="formData" :rules="subFlag === 0 ? addRules : editRules" label-width="140px">
      <el-form-item label="用户名:" prop="username">
        <el-input v-model="formData.username" :disabled="subFlag === 1" placeholder="输入用户名" />
        <span class="label_desc">指定唯一的用户名。一旦创建了用户，就不能编辑该名称</span>
      </el-form-item>
      <el-form-item label="角色:" prop="user_tag">
        <el-select v-model="formData.user_tag" placeholder="选择角色" style="width: 300px">
          <el-option label="用户管理员" value="adminuser" />
          <el-option label="审计管理员" value="audit" />
          <el-option label="系统管理员" value="system" />
        </el-select>
      </el-form-item>
      <el-form-item label="密码:" prop="password">
        <el-input v-model="formData.password" type="password" placeholder="输入密码" show-password />
        <span class="label_desc">{{ passwordHelpText }}</span>
      </el-form-item>
      <el-form-item label="确认密码:" prop="repassword">
        <el-input v-model="formData.repassword" type="password" placeholder="输入确认密码" show-password />
        <span class="label_desc">两次密码输入必须一致</span>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit"> 保存 </el-button>
        <el-button plain @click="clear"> 清空 </el-button>
      </el-form-item>
    </el-form>
    <validate-user
      :visible="validateUserVisible"
      @closed-dialog="closedValidateUserDialog"
      @submit-dialog="toValidateUser"
    ></validate-user>
  </div>
</template>

<script setup lang="ts" name="userForm">
import { onMounted, ref, reactive, onUnmounted, computed } from "vue";
import { ArrowLeft } from "@element-plus/icons-vue";
import { useRoute, useRouter } from "vue-router";
import { addUser, editUser, getLoginConfig } from "@/api/modules/system";
import { ElMessage } from "element-plus";
import { localGet, localRemove } from "@/utils";
import validateUser from "./validateUser.vue";
import { loginWazuh } from "@/api/modules/login";
import { useUserStore } from "@/stores/modules/user";

const formRef = ref();
const router = useRouter();
let formData = ref<Record<string, any>>({
  username: "",
  user_tag: "",
  password: "",
  repassword: ""
});
const userStore = useUserStore();
const loginUser = computed(() => userStore.userInfo);

let subFlag = ref(0); // 0=新增，1=编辑
let validateUserVisible = ref(false);
const toValidateUser = async ({ password }: Record<string, any>) => {
  try {
    await loginWazuh({ username: loginUser.value.name, password, params: { checkpwd: true } });
    validateUserVisible.value = false;
    await subUser();
  } catch (error) {
    console.log(`验证用户失败: ${error}`);
  }
};
const closedValidateUserDialog = () => {
  validateUserVisible.value = false;
};

let passwordrules = reactive([]);
const passwordLength = ref("8");
const passwordHelpText = ref("");

const subUser = async () => {
  if (subFlag.value === 0) {
    let { username, user_tag, password } = formData.value;
    let addParams = {
      username,
      user_tag,
      password
    };
    try {
      const addRes: any = await addUser(addParams);
      if (addRes.message.includes("failed")) {
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
    } catch (error) {
      console.log(`新增用户错误: ${error}`);
    }
  } else {
    try {
      let { id, user_tag, password } = formData.value;
      let editParams: Record<string, string> = {
        user_tag
      };
      if (password) editParams.password = password;
      let editRes: any = await editUser(editParams, id);
      if (editRes.message.includes("failed")) {
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
    } catch (error) {
      console.log(`修改用户错误: ${error}`);
    }
  }
};
onMounted(() => {
  toGetPasswordRuld();
  const route = useRoute();
  if (route.params.id) {
    subFlag.value = 1;
    const selectedItem = localGet("userObject-edit");
    formData.value = {
      username: selectedItem.username,
      user_tag: selectedItem.user_tag,
      id: selectedItem.id
    };
  }
});

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
    console.log(`查询登录用户信息失败: ${error}`);
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
  if ((!value && subFlag.value === 1) || (isCheck && value.length >= passwordLength.value)) {
    // 编辑时可以不传密码，不传即为不修改密码
    callback();
  } else {
    callback(new Error(passwordHelpText.value));
  }
};
const checkRepassword = (rule: any, value: any, callback: any) => {
  if (value === formData.value.password) {
    callback();
  } else {
    callback(new Error("确认密码必须与密码一致！"));
  }
};
const checkUsername = (rule: any, value: any, callback: any) => {
  const reg = /^[0-9a-zA-Z]*$/g;
  if (value.length >= 4 && value.length <= 64 && reg.test(value)) {
    callback();
  } else {
    callback(new Error("用户名长度在4~64之间，只能输入数字字母"));
  }
};

const addRules = reactive<Record<string, any>>({
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { validator: checkUsername, trigger: "blur" }
  ],
  user_tag: [{ required: true, message: "请选择角色", trigger: "change" }],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { validator: checkPassword, trigger: "blur" }
  ],
  repassword: [
    { required: true, message: "请输入确认密码", trigger: "blur" },
    { validator: checkRepassword, trigger: "blur" }
  ]
});

const editRules = reactive<Record<string, any>>({
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  user_tag: [{ required: true, message: "请选择角色", trigger: "change" }],
  password: [{ validator: checkPassword, trigger: "blur" }],
  repassword: [{ validator: checkRepassword, trigger: "blur" }]
});

const toPrev = () => {
  router.push(`/system/user`);
};

const onSubmit = async () => {
  formRef.value.validate(async (valid: any) => {
    if (valid) {
      validateUserVisible.value = true;
    } else {
      return false;
    }
  });
};

const clear = () => {
  if (subFlag.value === 0) {
    formRef.value.resetFields();
  } else {
    formData.value.user_tag = "";
    formData.value.password = "";
    formData.value.repassword = "";
  }
};

onUnmounted(() => {
  localRemove("userObject-edit");
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
