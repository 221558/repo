<template>
  <div class="detail-base-warp">
    <PageTable :columns="columns" :data="list" :is-edit="false" :is-del="false"></PageTable>
  </div>
</template>

<script setup lang="ts" name="rule">
import { onMounted, reactive, ref } from "vue";
import { ColumnProps } from "@/components/PageTable/interface";
import PageTable from "@/components/PageTable/index.vue";
import { localGet } from "@/utils";
import { getPolicyRule } from "@/api/modules/policyManage";

const scopeOptions = ref<Record<string, any>[]>([
  { id: "in", label: "范围内" },
  { id: "out", label: "范围外" }
]);
const directionOptions = ref<Record<string, any>[]>([
  { id: "in", label: "入方向流量" },
  { id: "out", label: "出方向流量" }
]);
const typeOptions = ref<Record<string, any>[]>([
  { id: "tag", label: "组件" },
  { id: "address", label: "地址对象" }
]);
const list = ref<Record<string, any>[]>([]);
const columns = reactive<ColumnProps[]>([
  {
    field: "area_label",
    name: "范围"
  },
  {
    field: "direction_label",
    name: "流量方向"
  },
  {
    field: "config_type_label",
    name: "规则类型"
  },
  {
    field: "to_type_label",
    name: "服务者类型"
  },
  {
    field: "serviceto_name",
    name: "服务者"
  },
  {
    field: "service_label",
    name: "服务"
  },
  {
    field: "from_type_label",
    name: "访问者类型"
  },
  {
    field: "servicefrom_name",
    name: "访问者"
  }
]);

onMounted(async () => {
  getList();
});

const getList = async () => {
  try {
    const selectedItem = localGet("agent-detail");
    const data: any = await getPolicyRule({ client_id: selectedItem.id });
    list.value = ((data || {}).data || {}).affected_items.map((item: Record<string, any>) => {
      item.area_label = scopeOptions.value.find((k: Record<string, any>) => k.id === item.area)?.label ?? "-";
      item.direction_label = directionOptions.value.find((k: Record<string, any>) => k.id === item.direction)?.label ?? "-";
      item.config_type_label = item.config_type === "manual" ? "手动生成" : "自动生成";
      item.to_type_label = typeOptions.value.find((k: Record<string, any>) => k.id === item.to_type)?.label ?? "-";
      item.service_label = item.config_type === "manual" ? item.service_name ?? "-" : item.service ?? "-";
      item.from_type_label = typeOptions.value.find((k: Record<string, any>) => k.id === item.from_type)?.label ?? "-";
      return item;
    });
  } catch (error) {
    console.log(`查询策略规则错误: ${error}`);
  }
};
</script>
