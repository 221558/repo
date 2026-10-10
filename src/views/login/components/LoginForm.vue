<template>
  <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" size="large" v-loading="loading">
    <el-form-item prop="username">
      <el-input v-model="loginForm.username" placeholder="用户名">
        <template #prefix>
          <el-icon class="el-input__icon">
            <user />
          </el-icon>
        </template>
      </el-input>
    </el-form-item>
    <el-form-item prop="password">
      <el-input v-model.trim="loginForm.password" type="password" placeholder="密码" show-password autocomplete="new-password">
        <template #prefix>
          <el-icon class="el-input__icon">
            <lock />
          </el-icon>
        </template>
      </el-input>
    </el-form-item>
  </el-form>
  <div class="login-btn">
    <el-button size="large" type="primary" @click="handleSubmit(loginFormRef)"> 登录 </el-button>
  </div>
  <ValidateCode :visible="dialogVisible" @validate-success="validateSuccess" @closed-dialog="closedDialog"></ValidateCode>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { HOME_URL } from "@/config";
import { getTimeState, formatDate } from "@/utils";
import { WzLogin } from "@/api/interface/user";
import { ElNotification, ElMessage } from "element-plus";
import { loginWazuh, getCurrentUser, getUserLock, updateUserLock, saveLoginLog, getLoginIPCheck } from "@/api/modules/login";
import { getIsCluster } from "@/api/modules/manager";
import { useUserStore } from "@/stores/modules/user";
import { useTabsStore } from "@/stores/modules/tabs";
import { useKeepAliveStore } from "@/stores/modules/keepAlive";
import { initDynamicRouter } from "@/routers/modules/dynamicRouter";
import type { ElForm } from "element-plus";
import { getLoginConfig } from "@/api/modules/system";
import ValidateCode from "./validateCode.vue";

const router = useRouter();
const userStore = useUserStore();
const tabsStore = useTabsStore();
const keepAliveStore = useKeepAliveStore();

type FormInstance = InstanceType<typeof ElForm>;
const loginFormRef = ref<FormInstance>();
const loginRules = reactive({
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }]
});

const loading = ref(false);
const loginForm = reactive<WzLogin.ReqLoginForm>({
  username: "",
  password: ""
});

const dialogVisible = ref(false);
// 登录配置信息，查询IP黑名单、尝试次数、锁定时间等
let loginConfig = ref<Record<string, any>>({
  attempttimes: "",
  blackloggingip: "",
  lockedtimes: "",
  passwordrules: "",
  pwdlen: ""
});
// 查询用户锁定时间与尝试次数
let userLock = ref<Record<string, any>>({
  Bjtimestamp: "",
  attempttimes: "",
  user: ""
});
// 登录失败时记录的次数
let failedCount = ref(0);

onMounted(() => {
  toGetLoginConfig();
  // 监听 enter 事件（调用登录）
  document.onkeydown = (e: KeyboardEvent) => {
    e = (window.event as KeyboardEvent) || e;
    if (e.code === "Enter" || e.code === "enter" || e.code === "NumpadEnter") {
      if (loading.value) return;
      handleSubmit(loginFormRef.value);
    }
  };
});

const toGetLoginConfig = async () => {
  try {
    const data = await getLoginConfig();
    const params = ((data || {}).data || {}).affected_items[0];
    loginConfig.value = params;
  } catch (error) {
    console.log(`查询登录配置信息失败: ${error}`);
  }
};

const handleSubmit = (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  formEl.validate(async valid => {
    if (!valid) return;
    loading.value = true;
    checkCode();
  });
};

const checkCode = async () => {
  try {
    const userLockItems = await getUserLock(loginForm.username);
    const userLockInfo = ((userLockItems || {}).data || {}).affected_items[0];
    userLock.value = userLockInfo;
    failedCount.value = userLockInfo.attempttimes ? 1 + parseInt(userLockInfo.attempttimes) : 1;
    if (userLockInfo.attempttimes >= 1) {
      // 验证码验证
      dialogVisible.value = true;
    } else {
      await checkLock();
    }
  } catch (error) {
    console.log("查询用户登录锁定信息错误", error);
  }
};

const validateSuccess = () => {
  dialogVisible.value = false;
  checkLock();
};

const closedDialog = () => {
  dialogVisible.value = false;
  loading.value = false;
};

const checkLock = async () => {
  try {
    const timestamp = new Date().getTime();
    const timeBetween = userLock.value.Bjtimestamp ? Math.floor((timestamp - userLock.value.Bjtimestamp) / (1000 * 60)) : 0; // 上次登录失败间隔分钟
    const IPCheckRes = await getLoginIPCheck();
    const IPCheck = ((IPCheckRes || {}).data || {}).affected_items[0];

    if (!IPCheck) {
      ElMessage({
        message: `您的IP禁止登录，请联系管理员`,
        type: "error"
      });
    } else if (
      !userLock.value.user ||
      !loginConfig.value.lockedtimes ||
      parseInt(userLock.value.attempttimes) < parseInt(loginConfig.value.attempttimes)
    ) {
      // 该用户没触发锁定，可以继续登录
      await login(timestamp);
    } else if (timeBetween >= parseInt(loginConfig.value.lockedtimes)) {
      // 该用户触发了锁定，但是过了锁定时间，可以继续登录
      await updateUserLock({
        webloguser: loginForm.username,
        Bjtimestamp: timestamp,
        attempttimes: 0
      });
      failedCount.value = 1;
      await login(timestamp);
    } else {
      // 该用户在锁定，不可登录
      ElMessage({
        message: `该用户已锁定，请${loginConfig.value.lockedtimes - timeBetween}分钟后尝试`,
        type: "error"
      });
    }
  } catch (error) {
    console.log("验证锁定错误", error);
  }
  loading.value = false;
};

// 登录
const login = async (timestamp: number) => {
  try {
    // 1.执行登录接口，查询当前用户信息
    const { data } = await loginWazuh({ ...loginForm });
    userStore.setToken(data.token);

    const userInfoRes = await getCurrentUser();
    let userInfo = ((userInfoRes || {}).data || {}).affected_items[0];
    userStore.setUserInfo({
      name: userInfo.username,
      role: userInfo.user_tag,
      id: userInfo.id
    });

    // 2.记录登录成功日志，查询集群状态
    await saveLoginLog({
      login_user: loginForm.username,
      Bjtimestamp: formatDate(new Date(timestamp)),
      result: "success"
    });

    const clusterStatus = await getIsCluster();
    const clusterData: any = (clusterStatus || {}).data;
    const isCluster = clusterData.enabled === "yes" && clusterData.running === "yes";
    userStore.setIsCluster(isCluster);

    // 3.添加动态路由
    await initDynamicRouter();

    // 4.清空 tabs、keepAlive 数据
    tabsStore.setTabs([]);
    keepAliveStore.setKeepAliveName([]);

    // 5.跳转到首页
    router.push(HOME_URL);
    ElNotification({
      title: getTimeState(),
      message: "欢迎登录微隔离管控系统",
      type: "success",
      duration: 3000
    });
  } catch (error) {
    // 更新用户登录锁定信息，记录登录尝试次数
    await updateUserLock({
      webloguser: loginForm.username,
      Bjtimestamp: timestamp,
      attempttimes: failedCount.value
    });
    // 记录登录失败日志
    await saveLoginLog({
      login_user: loginForm.username,
      Bjtimestamp: formatDate(new Date(timestamp)),
      result: "failed"
    });
  }
};
</script>

<style scoped lang="scss">
@import "../index.scss";
</style>
