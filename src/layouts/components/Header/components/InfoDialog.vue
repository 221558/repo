<template>
  <el-dialog
    v-model="dialogVisible"
    title="个人信息"
    width="500px"
    draggable
    :close-on-press-escape="false"
    :close-on-click-modal="false"
  >
    <el-form label-width="80px">
      <el-form-item label="用户名:">
        <span>{{ loginUser.name }}</span>
      </el-form-item>
      <el-form-item label="角色:">
        <span>{{ loginUser.role_name }}</span>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogVisible = false">确认</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useUserStore } from "@/stores/modules/user";

const userStore = useUserStore();
const loginUser = computed(() => {
  const roleOptions = [
    { value: "adminuser", label: "用户管理员" },
    { value: "audit", label: "审计管理员" },
    { value: "system", label: "系统管理员" },
    { value: "admin", label: "超级管理员" }
  ];
  const tole = roleOptions.find((k: Record<string, string>) => k.value === userStore.userInfo.role);
  return {
    name: userStore.userInfo.name,
    role_name: tole?.label ?? userStore.userInfo.role
  };
});

const dialogVisible = ref(false);
const openDialog = () => {
  dialogVisible.value = true;
};

defineExpose({ openDialog });
</script>
