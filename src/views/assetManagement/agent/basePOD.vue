<template>
  <div class="detail-base-warp">
    <div class="base-contain">
      <div v-for="(item, index) in baseList" :key="`baseList_${index}`" class="pb30">
        <p class="pb5">{{ item.title }}</p>
        <p class="value">
          {{ item.render ? item.render(allStats) : item.field && allStats[item.field] !== "None" ? allStats[item.field] : "-" }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="agentDetailBasePOD">
import { ref, onMounted } from "vue";
import { getPOD } from "@/api/modules/assets";

const props = defineProps<{ agentData: Record<string, any> }>();

const allStats = ref<Record<string, any>>({});
const baseList = ref([
  { title: "名称", field: "name" },
  { title: "IP", field: "ip" },
  { title: "UID", field: "uid" },
  { title: "命名空间", field: "ns" },
  { title: "节点", field: "node" },
  { title: "控制器（类型/名称）", field: "controller" },
  {
    title: "服务（类型/名称）",
    render: (item: Record<string, any>) =>
      item.services && item.services !== "None" ? item.services?.split(",").join(" | ") : "-"
  }
]);

onMounted(async () => {
  getInitList();
});

const getInitList = async () => {
  let baseInfo: Record<string, any> = {};
  try {
    const rawItems = await getPOD(props.agentData.ip);
    baseInfo = (rawItems || {}).data;
  } catch (error) {
    console.log(`硬件信息错误: ${error}`);
  }

  allStats.value = {
    ...props.agentData,
    ...baseInfo
  };
};
</script>

<style scoped lang="scss">
.base-contain {
  > div {
    width: 33%;
  }
  > div:nth-child(7) {
    width: 100%;
  }
  .value {
    font-weight: 600;
  }
}
</style>
