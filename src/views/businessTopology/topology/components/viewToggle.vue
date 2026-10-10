<template>
  <el-select v-model="topologyState.viewSelected" @change="toSearch" class="mr12">
    <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
  </el-select>
</template>

<script setup lang="ts" name="viewToggle">
import { ref, nextTick } from "vue";
import mittBus from "@/utils/mittBus";
import { topologyState } from "../state";

const options = ref([
  { value: "group", label: "工作组视图" },
  { value: "loc", label: "位置标签视图" },
  { value: "org", label: "组织标签视图" },
  { value: "business", label: "业务标签视图" }
]);

const toSearch = async () => {
  topologyState.isLoading = true;

  Promise.all([topologyState.getCombos(), topologyState.getNodes(), topologyState.getEdges()])
    .then(() => {
      topologyState.isLoading = false;
      nextTick(() => {
        mittBus.emit("buildChart");
      });
    })
    .catch(error => {
      console.log(error);
    });
};
</script>
