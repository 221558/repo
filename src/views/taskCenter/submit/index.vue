<template>
  <div class="card no-card submit-warp">
    <el-tabs v-model="activeType">
      <el-tab-pane label="未完成" name="undo" />
      <el-tab-pane label="已完成" name="done" />
    </el-tabs>
    <div class="submit-contain">
      <ProTable
        ref="proTable"
        :columns="columns"
        :request-api="getList"
        :init-param="initParam"
        :tool-button="false"
        :data-callback="dataCallback"
      >
        <!-- 操作 -->
        <template #operation="scope">
          <el-tooltip effect="dark" content="任务详情" placement="top">
            <el-button link type="primary" size="small" @click="toDetail(scope.row)">
              <el-icon><View /></el-icon>
            </el-button>
          </el-tooltip>
        </template>
      </ProTable>
    </div>
  </div>
</template>

<script setup lang="ts" name="submit">
import { reactive, ref, watch } from "vue";
import ProTable from "@/components/ProTable/index.vue";
import { ProTableInstance, ColumnProps } from "@/components/ProTable/interface";
import { formatDate } from "@/utils";
import { useRouter } from "vue-router";
import { getWorkOrder } from "@/api/modules/taskCenter";
import { taskTypeOptions, taskLevelOptions, taskStatusOptions } from "@/config/mappingDict";

const router = useRouter();
const activeType = ref<string>("undo");
const proTable = ref<ProTableInstance>();
const initParam = reactive({ task_direction: "send" });
const columns = reactive<ColumnProps[]>([
  {
    prop: "id",
    label: "任务号",
    search: {
      el: "input",
      order: 1,
      key: "task_id",
      props: { filterable: true, placeholder: "请输入" }
    }
  },
  {
    prop: "type",
    label: "任务类型",
    enum: taskTypeOptions,
    search: { el: "select", order: 2, key: "task_type", props: { filterable: true } }
  },
  {
    prop: "level",
    label: "优先级",
    enum: taskLevelOptions,
    search: { el: "select", order: 3, key: "task_level", props: { filterable: true } }
  },
  {
    prop: "status",
    label: "任务状态",
    enum: taskStatusOptions,
    search: { el: "select", order: 4, key: "task_status", props: { filterable: true } }
  },
  {
    prop: "creater",
    label: "创建人"
  },
  {
    prop: "treater",
    label: "处理人",
    search: {
      el: "input",
      order: 5,
      props: { filterable: true, placeholder: "请输入" }
    }
  },
  {
    prop: "time",
    label: "创建时间",
    width: "200",
    render: scope => formatDate(new Date(scope.row.time * 1000))
  },
  { prop: "operation", label: "操作", fixed: "right", width: 120, align: "left", hideOverflowTooltip: true }
]);

const getList = (params: any) => {
  const newParams = JSON.parse(JSON.stringify(params));
  newParams.task_class = activeType.value;
  newParams.limit = newParams.pageSize;
  newParams.offset = (newParams.pageNum - 1) * newParams.pageSize;

  delete newParams.pageSize;
  delete newParams.pageNum;

  return getWorkOrder(newParams);
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

const toDetail = (item: Record<string, any>) => {
  router.push({
    path: `/taskCenter/submit/detail`,
    query: {
      task_id: item.id
    }
  });
};
</script>

<style scoped lang="scss">
.submit-warp {
  height: 100%;
  .submit-contain {
    height: calc(100% - 54px);
  }
}
</style>
