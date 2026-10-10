<template>
  <div class="card no-card">
    <ProTable ref="proTable" :columns="columns" :request-api="getList" :tool-button="false" :data-callback="dataCallback">
      <template #tableHeader>
        <el-button type="primary" class="mb20" @click="toAdd">新增策略</el-button>
      </template>
      <!-- 操作 -->
      <template #operation="scope">
        <el-tooltip effect="dark" content="编辑策略" placement="top">
          <el-button link type="primary" size="small" @click="toEdit(scope.row)">
            <el-icon><Edit /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip effect="dark" content="删除策略" placement="top">
          <el-button link type="primary" size="small" @click="toRemove(scope.row)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </el-tooltip>
      </template>
    </ProTable>
  </div>
</template>

<script setup lang="tsx" name="alarmPolicy">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import ProTable from "@/components/ProTable/index.vue";
import { ProTableInstance, ColumnProps } from "@/components/ProTable/interface";
import { formatDate, localSet } from "@/utils";
import { useHandleData } from "@/hooks/useHandleData";
import { getAlarmPolicy, removeAlarmPolicy } from "@/api/modules/alarmCenter";

const router = useRouter();
const proTable = ref<ProTableInstance>();
const columns = reactive<ColumnProps[]>([
  {
    prop: "name",
    label: "规则名称"
  },
  {
    prop: "type",
    label: "规则模板",
    render: scope => {
      const options: Record<string, string> = {
        drop_packets: "异常访问",
        system: "系统日志",
        operation: "操作日志"
      };
      return options[scope.row.type] ?? "-";
    }
  },
  {
    prop: "level",
    label: "告警级别",
    width: "100",
    render: scope => (
      <div>
        {scope.row.level === "high" && (
          <el-tag type="danger" size="large">
            高
          </el-tag>
        )}
        {scope.row.level === "normal" && <el-tag size="large">中</el-tag>}
        {scope.row.level === "low" && (
          <el-tag type="success" size="large">
            低
          </el-tag>
        )}
      </div>
    )
  },
  {
    prop: "state",
    label: "启用状态",
    width: "150",
    render: scope => (
      <div>
        {scope.row.state === "enable" && <el-text type="success">已开启</el-text>}
        {scope.row.state === "disable" && <el-text type="danger">未开启</el-text>}
      </div>
    )
  },
  {
    prop: "last_c_user",
    label: "创建人"
  },
  {
    prop: "last_c_time",
    label: "创建时间",
    width: "200",
    render: scope => formatDate(new Date(scope.row.last_c_time))
  },
  {
    prop: "last_m_user",
    label: "更新人"
  },
  {
    prop: "last_m_time",
    label: "更新时间",
    width: "200",
    render: scope => formatDate(new Date(scope.row.last_m_time))
  },
  { prop: "operation", label: "操作", fixed: "right", width: 120, align: "left", hideOverflowTooltip: true }
]);

const getList = (params: any) => {
  const newParams = JSON.parse(JSON.stringify(params));
  const limit = newParams.pageSize;
  const offset = (newParams.pageNum - 1) * newParams.pageSize;
  const param = {
    limit,
    offset
  };
  return getAlarmPolicy(param);
};

const dataCallback = (data: any, totalParam?: any) => {
  return {
    list: data.affected_items,
    total: data.total_affected_items,
    pageNum: totalParam.pageNum,
    pageSize: totalParam.pageSize
  };
};

const toAdd = () => {
  router.push(`/alarmCenter/alarmPolicy/add`);
};

const toEdit = (item: Record<string, any>) => {
  localSet("alarm-policy-edit", item);
  router.push({
    path: `/alarmCenter/alarmPolicy/edit/${item.id}`
  });
};

const toRemove = async (item: Record<string, any>) => {
  await useHandleData(removeAlarmPolicy, { alert_policy_id: item.id }, `删除该告警策略`);
  proTable.value?.getTableList();
};
</script>
