<template>
  <div class="card oper-log-warp">
    <el-form :inline="true" :model="queryForm">
      <el-form-item label="时间：">
        <el-date-picker
          v-model="queryForm.time"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="x"
          @change="() => getLogData()"
        />
      </el-form-item>
      <el-form-item label="用户:">
        <el-select v-model="queryForm.login_user" placeholder="请选择用户" filterable clearable @change="() => getLogData()">
          <el-option
            v-for="(item, index) in loginUserOptions"
            :key="`loginUserOptions_${index}`"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="操作对象:">
        <el-select v-model="queryForm.log_object" placeholder="请选择操作对象" filterable clearable @change="handleChangeObject">
          <el-option
            v-for="(item, index) in logObjectOptions"
            :key="`loginObjectOptions_${index}`"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="动作:">
        <el-select v-model="queryForm.log_action" placeholder="请选择动作" filterable clearable @change="handleChangeAction">
          <el-option
            v-for="(item, index) in logActionOptions"
            :key="`logActionOptions_${index}`"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="执行状态:">
        <el-select v-model="queryForm.result" placeholder="请选择执行状态" filterable clearable @change="() => getLogData()">
          <el-option
            v-for="(item, index) in logResultOptions"
            :key="`logResultOptions_${index}`"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="实时：">
        <el-switch v-model="refresh" inline-prompt :active-icon="Check" :inactive-icon="Close" @change="changeRefresh" />
      </el-form-item>
    </el-form>
    <el-button type="primary" @click="downloadFile" class="mt2 mb20" :disabled="state.logList.length === 0">导出</el-button>
    <el-table :data="state.logList" border scrollbar-always-on>
      <el-table-column
        v-for="(column, index) in columns"
        :key="`login_log_${index}`"
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
    <div class="mt5 btn-wrap" v-if="state.logArr.length === 100">
      <el-button type="primary" link :icon="RefreshRight" @click="getMore">加载更多日志</el-button>
    </div>
  </div>
</template>

<script setup lang="tsx" name="operationLogObject">
import { onMounted, onUnmounted, reactive, ref, computed } from "vue";
import { ElTable } from "element-plus";
import { getOperationLog } from "@/api/modules/logCenter";
import { getUserList } from "@/api/modules/system";
import { formatDate, filterQueryForm } from "@/utils";
import { Check, Close, RefreshRight } from "@element-plus/icons-vue";
import { ElMessageBox } from "element-plus";
import { useDownloadList } from "@/hooks/useDownloadList";
import {
  logActionOptions as logActionAll,
  logObjectOptions as logObjectAll,
  logActionMap,
  logObjectMap,
  operInfoTransform,
  adminOptions
} from "@/config/mappingDict";

const state = reactive<Record<string, any>>({
  isLoading: false,
  logArr: [],
  logList: [],
  exportList: []
});
const now = new Date().getTime();
const start = now - 24 * 60 * 60 * 1000;
const queryForm = reactive<Record<string, any>>({
  time: [start, now],
  login_user: "",
  log_object: "",
  log_action: "",
  result: "",
  limit: 100,
  offset: 0
});
const logObject = ref<string>("");
const logAction = ref<string>("");
const loginUserOptions = ref<Record<string, any>[]>([]);
const logResultOptions = ref<Record<string, any>[]>([
  { label: "失败", value: "failed" },
  { label: "成功", value: "success" }
]);
const logObjectOptions = computed(() => {
  if (!queryForm.log_object && queryForm.log_action) {
    return logActionMap[queryForm.log_action];
  } else {
    return logObjectAll;
  }
});
const logActionOptions = computed(() => {
  if (queryForm.log_object && !queryForm.log_action) {
    return logObjectMap[queryForm.log_object];
  } else {
    return logActionAll;
  }
});
const refresh = ref(false);
const columns = reactive<Record<string, any>[]>([
  {
    field: "time",
    name: "时间",
    width: "200",
    render: (item: Record<string, any>) => formatDate(new Date(item.time * 1000)),
    showOverflowTooltip: true
  },
  {
    field: "user",
    name: "用户",
    width: "120"
  },
  {
    field: "object",
    name: "操作对象",
    width: "150",
    render: (item: Record<string, any>) =>
      logObjectAll.find((option: Record<string, string>) => option.value === item.object)?.label ?? "-"
  },
  {
    field: "action",
    name: "动作",
    width: "150",
    render: (item: Record<string, any>) =>
      logActionAll.find((option: Record<string, string>) => option.value === item.action)?.label ?? "-"
  },
  {
    field: "state",
    name: "执行状态",
    width: "120",
    render: (item: Record<string, any>) =>
      logResultOptions.value.find((option: Record<string, string>) => option.value === item.state)?.label ?? "-"
  },
  {
    field: "oper_info",
    name: "内容",
    render: (item: Record<string, any>) => {
      return (
        <div>
          {item.oper_info?.map((info: Record<string, string>, index: number) => (
            <p key={`oper_info_${index}`}>
              {info.label}: {info.value}
            </p>
          ))}
        </div>
      );
    }
  }
]);
let timeId: number;
const changeRefresh = () => {
  queryForm.offset = 0;
  if (refresh.value) {
    timeId = window.setInterval(() => {
      getLogData();
    }, 5 * 1000);
  } else {
    window.clearInterval(timeId);
  }
};
onUnmounted(() => {
  window.clearInterval(timeId);
});

const downloadFile = () => {
  ElMessageBox.confirm("确认导出操作日志?", "温馨提示", { type: "warning" }).then(async () => {
    const csvColumns = columns.map((item: Record<string, any>) => ({
      label: item.name,
      value: item.field
    }));
    const param = filterQueryForm({
      login_user: queryForm.login_user,
      log_object: queryForm.log_object,
      log_action: queryForm.log_action,
      result: queryForm.result,
      starttime: String(queryForm.time[0]).slice(0, 10),
      endtime: String(queryForm.time[1]).slice(0, 10)
    });
    const dataCallBack = (item: Record<string, any>) => {
      item.time = formatDate(new Date(item.time * 1000));
      item.object = logObjectAll.find((option: Record<string, string>) => option.value === item.object)?.label ?? "-";
      item.action = logActionAll.find((option: Record<string, string>) => option.value === item.action)?.label ?? "-";
      item.state = logResultOptions.value.find((option: Record<string, string>) => option.value === item.state)?.label ?? "-";
      item.oper_info = [];
      if (item.info) {
        item.oper_info = operInfoTransform(item.info.split("@#"))
          .map((info: Record<string, string>) => `${info.label}: ${info.value}`)
          .join(", ");
      }
      return item;
    };
    useDownloadList(getOperationLog, "操作日志", csvColumns, param, true, false, true, dataCallBack);
  });
};

const getLogData = async (flag: boolean = false) => {
  try {
    let logParams: Record<string, any> = {
      ...filterQueryForm({
        login_user: queryForm.login_user,
        log_object: queryForm.log_object,
        log_action: queryForm.log_action,
        result: queryForm.result,
        starttime: String(queryForm.time[0]).slice(0, 10),
        endtime: String(queryForm.time[1]).slice(0, 10),
        limit: queryForm.limit,
        offset: flag ? queryForm.offset : 0
      })
    };
    const data: any = await getOperationLog(logParams);
    state.logArr = ((data || {}).data || {}).affected_items.map((item: Record<string, any>) => {
      item.oper_info = [];
      if (item.info) {
        item.oper_info = operInfoTransform(item.info.split("@#"));
      }
      return item;
    });
    if (flag) {
      // 查询更多时拼接数据
      state.logList = state.logList.concat([...state.logArr]);
    } else {
      state.logList = [...state.logArr];
    }
  } catch (error) {
    console.log(`查询操作日志列表错误: ${error}`);
  }
};
const getMore = async () => {
  queryForm.offset += 100;
  getLogData(true);
};
onMounted(async () => {
  getLoginUserOptions();
  getLogData();
});

const getLoginUserOptions = async () => {
  try {
    const data: any = await getUserList();
    const userList = ((data || {}).data || {}).affected_items.map((k: Record<string, any>) => ({
      label: k.username,
      value: k.username
    }));
    loginUserOptions.value = adminOptions.concat(userList);
  } catch (error) {
    console.log(`查询用户列表错误: ${error}`);
  }
};

const handleChangeObject = (val: string) => {
  if (logObject.value && logAction.value && val) {
    logAction.value = "";
    queryForm.log_action = "";
  }
  logObject.value = val;
  getLogData();
};

const handleChangeAction = (val: string) => {
  if (logObject.value && logAction.value && val) {
    logObject.value = "";
    queryForm.log_object = "";
  }
  logAction.value = val;
  getLogData();
};
</script>
<style scoped lang="scss">
.oper-log-warp {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  height: 100%;
}
.btn-wrap {
  width: 100%;
  text-align: center;
}
</style>
