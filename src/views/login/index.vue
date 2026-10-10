<template>
  <div class="login-box">
    <div class="login-form">
      <div class="login-logo">
        <img src="@/assets/images/logo-cict.png" alt="login" />
      </div>
      <LoginForm />
    </div>
    <div class="login-footer">
      <h4>Company：中讯邮电咨询设计院有限公司</h4>
      <span>Copyright ©2022-2024 Dimpt All Rights Reserved</span>
    </div>
  </div>
</template>

<script setup lang="ts" name="login">
import { ref, onMounted } from "vue";
import { getPlatform } from "@/api/modules/login";
import LoginForm from "./components/LoginForm.vue";
// import SwitchDark from "@/components/SwitchDark/index.vue";

const platform = ref({
  login_platform_name: ""
});

onMounted(async () => {
  const res = await getPlatform();
  platform.value = ((res || {}).data || {}).data;
});
</script>

<style scoped lang="scss">
@import "./index.scss";
</style>
