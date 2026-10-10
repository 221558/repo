<template>
  <div class="tool-bar-ri">
    <el-button :icon="DataAnalysis" class="mr20" @click="toLarge">监控大屏</el-button>
    <Message class="mr20" v-if="role === 'audit' || role === 'admin'" />
    <Task class="mr20" v-if="role === 'audit' || role === 'system' || role === 'admin'" />
    <Platform />
    <span class="username">{{ username }}</span>
    <Avatar />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useUserStore } from "@/stores/modules/user";
import { DataAnalysis } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import Avatar from "./components/Avatar.vue";
import Platform from "./components/Platform.vue";
import Message from "./components/Message.vue";
import Task from "./components/Task.vue";

const userStore = useUserStore();
const username = computed(() => userStore.userInfo.name);
const role = userStore.userInfo.role;
const router = useRouter();

const toLarge = () => {
  router.push(`/screen`);
};
</script>

<style scoped lang="scss">
.tool-bar-ri {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-right: 25px;
  .header-icon {
    display: flex;
    align-items: center;
    & > * {
      margin-left: 21px;
      color: var(--el-header-text-color);
    }
  }
  .username {
    margin: 0 20px;
    font-size: 15px;
    color: var(--el-header-text-color);
  }
}
</style>
