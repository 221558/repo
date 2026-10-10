<template>
  <div class="platform">
    <el-popover placement="bottom" :width="310" trigger="click">
      <template #reference>
        <el-icon :size="20" style="cursor: pointer"><Help /></el-icon>
      </template>
      <div class="platform-warp">
        <div class="platform-title">版本信息</div>
        <p>名称：{{ platform.version_name }}</p>
        <p>型号：{{ platform.version_type }}</p>
        <p>序列号：{{ platform.version_serial_number }}</p>
        <p>版本号：{{ platform.version_number }}</p>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getPlatform } from "@/api/modules/login";
import { Help } from "@element-plus/icons-vue";

const platform = ref({
  version_name: "",
  version_type: "",
  version_serial_number: "",
  version_number: ""
});

onMounted(async () => {
  const res = await getPlatform();
  platform.value = ((res || {}).data || {}).data;
});
</script>

<style scoped lang="scss">
.platform {
  height: 20px;
}
.platform-warp {
  .platform-title {
    padding-bottom: 10px;
    font-weight: bolder;
    color: #1a1c21;
    border-bottom: 1px solid #d3dae6;
  }
  p {
    padding-top: 10px;
  }
}
</style>
