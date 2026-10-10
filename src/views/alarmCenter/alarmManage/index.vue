<template>
  <div class="card no-card">
    <ProTable ref="proTable" :columns="columns" :request-api="getList" :tool-button="false" :data-callback="dataCallback">
      <template #tableHeader="scope">
        <div>
          <el-button type="primary" icon="Delete" :disabled="!scope.isSelected" @click="delAlarm(scope.selectedList)">
            批量删除
          </el-button>
          <el-dropdown trigger="click" :disabled="!scope.isSelected || checkSelectedStatus(scope.selectedList)" class="ml12">
            <el-button :disabled="!scope.isSelected || checkSelectedStatus(scope.selectedList)">
              批量编辑<el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="openBatch('treated', scope.selectedList)"> 处理 </el-dropdown-item>
                <el-dropdown-item @click="openBatch('ignored', scope.selectedList)">忽略</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </template>
      <el-table-column type="expand" width="60">
        <template #header>详情</template>
        <template #default="props">
          <el-form label-width="120">
            <el-row>
              <el-col :span="6" v-for="(detail_key, index) in Object.keys(props.row.details)" :key="`detail_${index}`">
                <el-form-item :label="`${detail_key}:`">
                  <span>{{ props.row.details[detail_key] }}</span>
                </el-form-item>
              </el-col>
              <el-col :span="6" v-if="props.row.type === 'drop_packets'">
                <el-form-item label="告警级别:">
                  <span>{{ levelTransform(props.row.level) }}</span>
                </el-form-item>
              </el-col>
              <el-col :span="12" v-if="props.row.type === 'drop_packets'">
                <el-form-item label="top10阻断关系:">
                  <el-link type="primary" @click="toTop10(props.row.top10)">点击查看</el-link>
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="说明:" width="100%">
              <span>{{ props.row.description ?? "-" }}</span>
            </el-form-item>
          </el-form>
        </template>
      </el-table-column>
      <!-- 操作 -->
      <template #operation="scope">
        <el-tooltip effect="dark" content="处理告警" placement="top" v-if="scope.row.status === 'untreated'">
          <el-button link type="primary" size="small" @click="openDrawer('treated', scope.row)">
            <el-icon><Notification /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip effect="dark" content="忽略告警" placement="top" v-if="scope.row.status === 'untreated'">
          <el-button link type="primary" size="small" @click="openDrawer('ignored', scope.row)">
            <el-icon><MuteNotification /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip effect="dark" content="查看" placement="top" v-if="scope.row.status !== 'untreated'">
          <el-button link type="primary" size="small" @click="openView(scope.row)">
            <el-icon><View /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip effect="dark" content="删除告警" placement="top">
          <el-button link type="primary" size="small" @click="delAlarm([scope.row])">
            <el-icon><Delete /></el-icon>
          </el-button>
        </el-tooltip>
      </template>
    </ProTable>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle.slice(0, 2)"
      width="500px"
      draggable
      @close="toClose"
      :close-on-press-escape="false"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" label-width="100px" :rules="isEdit ? rules : {}">
        <el-form-item :label="`${dialogTitle}:`" prop="value">
          <el-input v-if="isEdit" v-model="formData.value" type="textarea" :placeholder="`请输入${dialogTitle}`" :rows="4" />
          <p v-else>{{ formData.value }}</p>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="toClose">取消</el-button>
          <el-button v-if="isEdit" type="primary" @click="toSaveEdit">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog
      v-model="dialogTop10Visible"
      title="TOP10阻断关系"
      width="500px"
      draggable
      @close="toCloseTop10"
      :close-on-press-escape="false"
      :close-on-click-modal="false"
    >
      <ProTable :data="top10List" :columns="columnsTop10" :tool-button="false" />
    </el-dialog>
    <OrderDialog
      ref="orderDialog"
      :task_type="orderProps.task_type"
      :alert_id="orderProps.alert_id"
      :params="orderProps.params"
      :unuse_params="orderProps.unuse_params"
      @callback-fn="orderDialogCallback"
    />
  </div>
</template>

<script setup lang="tsx" name="alarmManage">
import { reactive, ref, computed } from "vue";
import ProTable from "@/components/ProTable/index.vue";
import { ProTableInstance, ColumnProps } from "@/components/ProTable/interface";
import { formatDate } from "@/utils";
import { useHandleData } from "@/hooks/useHandleData";
import { logActionOptions, logObjectOptions, logEventOptions, logModuleOptions, operInfoTransform } from "@/config/mappingDict";
import { getAlarmManage, removeAlarmManage } from "@/api/modules/alarmCenter";
import OrderDialog from "@/components/OrderDialog/index.vue";
import { OrderDialogProps } from "@/components/OrderDialog/interface";

const orderDialog = ref();
let orderProps = ref<OrderDialogProps>({
  task_type: "alert",
  alert_id: "",
  params: {},
  unuse_params: ""
});
let selectedItems = ref<Record<string, any>[]>([]);
const proTable = ref<ProTableInstance>();
const columns = reactive<ColumnProps[]>([
  { type: "selection", fixed: "left", width: 70 },
  {
    prop: "id",
    label: "ID"
  },
  {
    prop: "name",
    label: "告警标题",
    render: scope => `规则【${scope.row.name}】触发告警`
  },
  {
    prop: "type",
    label: "告警类型",
    width: "150",
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
    prop: "status",
    label: "告警状态",
    width: "150",
    render: scope => (
      <div>
        {scope.row.status === "untreated" && <el-text type="danger">未处理</el-text>}
        {scope.row.status === "treated" && <el-text type="success">已处理</el-text>}
        {scope.row.status === "ignored" && <el-text type="primary">已忽略</el-text>}
      </div>
    )
  },
  {
    prop: "time",
    label: "告警时间",
    width: "200",
    render: scope => formatDate(new Date(scope.row.time * 1000))
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
  return getAlarmManage(param);
};

const dataCallback = (data: any, totalParam?: any) => {
  const list = data.affected_items.map((item: Record<string, any>) => {
    if (item.type === "drop_packets")
      item.object_type = item.obj.replace("agent", "工作负载").replace("address", "地址对象").replace("ips", "IP");
    item.oper_info = [];
    if (item.type === "operation" && item.info) {
      item.oper_info = operInfoTransform(item.info.split("@#"));
    }
    item.description = item.description === "None" ? "-" : item.description;
    item.details = getDetails(item);
    return item;
  });
  return {
    list,
    total: data.total_affected_items,
    pageNum: totalParam.pageNum,
    pageSize: totalParam.pageSize
  };
};

const directionTransform = (direction: string) => {
  const options: Record<string, string> = {
    in: "入方向",
    out: "出方向",
    all: "入方向、出方向"
  };
  return options[direction] ?? "-";
};
const levelTransform = (level: string) => {
  const options: Record<string, string> = {
    high: "高",
    normal: "中",
    low: "低"
  };
  return options[level] ?? "-";
};
const logModuleTransform = (value: string) => {
  return logModuleOptions.find((option: Record<string, string>) => option.value === value)?.label ?? "-";
};
const logEventTransform = (value: string) => {
  return logEventOptions.find((option: Record<string, string>) => option.value === value)?.label ?? "-";
};
const sysLevelTransform = (value: string) => {
  const sysLevelOptions: Record<string, string>[] = [
    { label: "错误", value: "error" },
    { label: "信息", value: "info" },
    { label: "告警", value: "warning" }
  ];
  return sysLevelOptions.find((option: Record<string, string>) => option.value === value)?.label ?? "-";
};
const logObjectTransform = (value: string) => {
  return logObjectOptions.find((option: Record<string, string>) => option.value === value)?.label ?? "-";
};
const actionTransform = (value: string) => {
  return logActionOptions.find((option: Record<string, string>) => option.value === value)?.label ?? "-";
};
const stateTransform = (value: string) => {
  const stateOptions: Record<string, string>[] = [
    { label: "失败", value: "failed" },
    { label: "成功", value: "success" }
  ];
  return stateOptions.find((option: Record<string, string>) => option.value === value)?.label ?? "-";
};
const checkSelectedStatus = (selectedList: Record<string, any>[]) => {
  const pod = selectedList.find((item: Record<string, any>) => item.status !== "untreated");
  if (pod) {
    return true;
  } else {
    return false;
  }
};

const dialogTop10Visible = ref(false);
const top10List = ref<Record<string, any>[]>([]);
const columnsTop10 = reactive<ColumnProps[]>([
  {
    prop: "srcip",
    label: "来源IP"
  },
  {
    prop: "destip",
    label: "目的IP"
  },
  {
    prop: "service",
    label: "服务"
  },
  {
    prop: "count",
    label: "数量"
  }
]);
const toTop10 = (top10: string) => {
  const list = top10.split(",").map((item: string) => {
    const i = item.split("@");
    return {
      srcip: i[0] ?? "-",
      destip: i[1] ?? "-",
      service: `${i[3] ?? "-"}/${i[2] ?? "-"}`,
      count: i[4] ?? "-"
    };
  });
  top10List.value = list;
  dialogTop10Visible.value = true;
};
const toCloseTop10 = () => {
  dialogTop10Visible.value = false;
  top10List.value = [];
};

const dialogVisible = ref(false);
const isEdit = ref(false);
const dialogType = ref("");
const dialogTitle = computed(() => {
  let type = "";
  switch (dialogType.value) {
    case "treated":
      type = "处理意见";
      break;
    default:
      type = "忽略说明";
      break;
  }
  return type;
});
const formRef = ref();
const formData = ref<Record<string, any>>({
  alert_list: "",
  value: ""
});
const rules = reactive<Record<string, any>>({
  value: [{ required: true, message: `请输入${dialogTitle.value}`, trigger: "blur" }]
});

const toClose = () => {
  formRef.value.clearValidate();
  dialogVisible.value = false;
  isEdit.value = false;
  selectedItems.value = [];
  dialogType.value = "";
  formData.value = {
    alert_list: "",
    value: ""
  };
};

const openBatch = (type: string, itemArr: Record<string, any>[]) => {
  dialogType.value = type;
  const alert_list = itemArr.map(item => item.id).join(",");
  formData.value = {
    alert_list,
    value: ""
  };
  isEdit.value = true;
  selectedItems.value = itemArr;
  dialogVisible.value = true;
};

const openDrawer = (type: string, item: Record<string, any>) => {
  dialogType.value = type;
  formData.value = {
    alert_list: item.id,
    value: item.treat_info
  };
  isEdit.value = true;
  selectedItems.value = [item];
  dialogVisible.value = true;
};

const openView = (item: Record<string, any>) => {
  dialogType.value = item.status;
  formData.value = {
    alert_list: "",
    value: item.treat_info
  };
  isEdit.value = false;
  dialogVisible.value = true;
};

const getDetails = (item: Record<string, any>) => {
  let res = {};
  if (item.type === "drop_packets") {
    res = {
      规则名称: item.name,
      告警对象: item.object_type,
      方向: directionTransform(item.direction),
      ...(item.direction === "in" || item.direction === "all"
        ? {
            目标端口: item.service
          }
        : {}),
      触发频率: item.frequency
    };
  } else if (item.type === "system") {
    res = {
      规则名称: item.name,
      系统模块: logModuleTransform(item.module),
      系统事件: logEventTransform(item.event),
      日志级别: sysLevelTransform(item.sys_level),
      内容: item.info ?? "-"
    };
  } else if (item.type === "operation") {
    res = {
      规则名称: item.name,
      用户: item.user,
      操作对象: logObjectTransform(item.object),
      动作: actionTransform(item.action),
      执行状态: stateTransform(item.state)
    };
    let oper_info: Record<string, string> = {};
    item.oper_info.forEach((info_item: Record<string, string>) => {
      oper_info[info_item.label] = info_item.value ?? "-";
    });
  }

  return res;
};

const toSaveEdit = async () => {
  formRef.value.validate(async (valid: any) => {
    if (valid) {
      const typeOptions: Record<string, string> = {
        drop_packets: "异常访问",
        system: "系统日志",
        operation: "操作日志"
      };
      const levelOptions: Record<string, string> = {
        high: "高",
        normal: "中",
        low: "低"
      };
      const unuse_params_arr = selectedItems.value.map((item: Record<string, any>) =>
        Object.assign(
          {
            告警标题: `规则【${item.name}】触发告警`,
            告警类型: typeOptions[item.type] ?? "-",
            告警级别: levelOptions[item.level] ?? "-"
          },
          getDetails(item),
          {
            说明: item.description ?? "-"
          }
        )
      );
      orderProps.value = {
        task_type: "alert",
        alert_id: formData.value.alert_list,
        params: {
          alert_list: formData.value.alert_list,
          treat_type: dialogType.value,
          treat_info: formData.value.value
        },
        unuse_params: JSON.stringify(unuse_params_arr)
      };
      toClose();
      orderDialog.value?.judgeSwitch();
    } else {
      return false;
    }
  });
};

const orderDialogCallback = () => {
  orderProps.value = {
    task_type: "alert",
    alert_id: "",
    params: {},
    unuse_params: ""
  };
  proTable.value?.getTableList();
};

const delAlarm = async (itemArr: Record<string, any>[]) => {
  const list = itemArr.map(item => item.id).join(",");
  await useHandleData(removeAlarmManage, { alert_list: list }, `删除该告警`);
  proTable.value?.getTableList();
};
</script>
