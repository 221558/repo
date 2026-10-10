<template>
  <div class="task">
    <el-popover placement="bottom" trigger="click">
      <template #reference>
        <el-icon :size="20" style="cursor: pointer" color="#000"><Tickets /></el-icon>
      </template>
      <div class="task-warp">
        <div class="task-title">我的任务</div>
        <el-menu class="el-menu-task">
          <el-menu-item v-if="role === 'audit' || role === 'system'" @click="handleClickMenu('/taskCenter/submit')">
            已提交
          </el-menu-item>
          <el-menu-item v-if="role === 'system' || role === 'admin'" @click="handleClickMenu('/taskCenter/receive')">
            已收到
          </el-menu-item>
        </el-menu>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/modules/user";

const router = useRouter();
const role = useUserStore().userInfo.role;

const handleClickMenu = (path: string) => {
  router.push(path);
};
</script>

<style scoped lang="scss">
.task {
  height: 20px;
}
.task-warp {
  .task-title {
    padding-bottom: 10px;
    font-weight: bolder;
    color: #1a1c21;
    border-bottom: 1px solid #d3dae6;
  }
}
.el-menu-task {
  background-color: #ffffff;
  border-right: none;
  .el-menu-item {
    height: 32px;
    padding: 5px 0 !important;
    line-height: 22px;
    color: #606266;
    &:hover {
      color: #2d8cf0;
      background-color: #eaf4fe;
    }
  }
}
</style>
