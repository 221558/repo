<template>
  <el-table :data="policyState.ruleList" border scrollbar-always-on>
    <el-table-column
      v-for="(column, index) in columns"
      :key="`address_${index}`"
      :prop="column.field"
      :label="column.name"
      :width="column.width"
      :show-overflow-tooltip="column.showOverflowTooltip"
    >
      <template #default="scope">
        <component :is="column.render" v-bind="scope.row" v-if="column.render" />
        <span v-else>{{ scope.row[column.field] ?? "-" }}</span>
      </template>
    </el-table-column>
    <!-- 无数据 -->
    <template #empty>
      <div class="table-empty">
        <slot name="empty">
          <img src="@/assets/images/notData.png" alt="notData" />
          <div>暂无数据</div>
        </slot>
      </div>
    </template>
  </el-table>
  <el-row class="pt20 pb20">
    <el-button type="primary" @click="() => (policyState.currentStep = 2)">下一步</el-button>
  </el-row>
</template>

<script setup lang="ts" name="step1">
import { reactive } from "vue";
import { ColumnProps } from "@/components/PageTable/interface";
import { policyState } from "../state";

const columns = reactive<ColumnProps[]>([
  {
    field: "area",
    name: "范围",
    render: (item: Record<string, any>) =>
      policyState.scopeOptions.find((k: Record<string, any>) => k.id === item.area)?.label ?? "-"
  },
  {
    field: "scope_name",
    name: "组外范围"
  },
  {
    field: "direction",
    name: "流量方向",
    render: (item: Record<string, any>) =>
      policyState.directionOptions.find((k: Record<string, any>) => k.id === item.direction)?.label ?? "-"
  },
  {
    field: "to_type",
    name: "服务者类型",
    render: (item: Record<string, any>) =>
      policyState.typeOptions.find((k: Record<string, any>) => k.id === item.to_type)?.label ?? "-"
  },
  {
    field: "service_to_name",
    name: "服务者"
  },
  {
    field: "service",
    name: "服务",
    render: (item: Record<string, any>) => (item.service ? item.service.join("、") : "-")
  },
  {
    field: "from_type",
    name: "访问者类型",
    render: (item: Record<string, any>) =>
      policyState.typeOptions.find((k: Record<string, any>) => k.id === item.from_type)?.label ?? "-"
  },
  {
    field: "service_from_name",
    name: "访问者"
  }
]);
</script>
