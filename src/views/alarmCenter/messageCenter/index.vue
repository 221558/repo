<template>
  <div class="card no-card message-warp">
    <el-tabs v-model="activeType">
      <el-tab-pane label="未读" name="unread" />
      <el-tab-pane label="已读" name="read" />
    </el-tabs>
    <div class="message-contain">
      <ProTable ref="proTable" :columns="columns" :request-api="getList" :tool-button="false" :data-callback="dataCallback" />
    </div>
  </div>
</template>

<script setup lang="ts" name="messageCenter">
import { reactive, ref, watch } from "vue";
import ProTable from "@/components/ProTable/index.vue";
import { ProTableInstance, ColumnProps } from "@/components/ProTable/interface";
import { formatDate } from "@/utils";
import { getAlarmManage } from "@/api/modules/alarmCenter";

const activeType = ref<string>("unread");
const proTable = ref<ProTableInstance>();
const columns = reactive<ColumnProps[]>([
  {
    prop: "time",
    label: "时间",
    width: "200",
    render: scope => formatDate(new Date(scope.row.time * 1000))
  },
  {
    prop: "name",
    label: "通知",
    render: scope => `规则【${scope.row.name}】触发告警`
  }
]);

const getList = (params: any) => {
  const newParams = JSON.parse(JSON.stringify(params));
  const limit = newParams.pageSize;
  const offset = (newParams.pageNum - 1) * newParams.pageSize;
  const param = {
    limit,
    offset,
    read_flag: activeType.value === "unread" ? 0 : 1
  };
  return getAlarmManage(param, false);
};

const dataCallback = (data: any, totalParam?: any) => {
  return {
    list: data.affected_items,
    total: data.total_affected_items,
    pageNum: totalParam.pageNum,
    pageSize: totalParam.pageSize
  };
};

watch(
  () => activeType.value,
  () => {
    proTable.value?.reset();
  }
);
</script>

<style scoped lang="scss">
.message-warp {
  height: 100%;
  .message-contain {
    height: calc(100% - 54px);
  }
}
</style>
