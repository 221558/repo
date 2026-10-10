<template>
  <div class="card system-log-warp">
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
      <el-form-item label="系统模块：">
        <el-select v-model="queryForm.log_module" placeholder="请选择系统模块" clearable @change="() => getLogData()">
          <el-option
            v-for="(item, index) in logModuleOptions"
            :key="`logModuleOptions_${index}`"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="日志级别：">
        <el-select v-model="queryForm.level" placeholder="请选择日志级别" clearable @change="() => getLogData()">
          <el-option label="错误" value="error" />
          <el-option label="信息" value="info" />
          <el-option label="告警" value="warning" />
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
    <div class="mt5 btn-wrap" v-if="state.logList.length === 100">
      <el-button type="primary" link :icon="RefreshRight" @click="getMore">加载更多日志</el-button>
    </div>
  </div>
</template>

<script setup lang="ts" name="systemLogObject">
import { onMounted, reactive, ref, onUnmounted } from "vue";
import { ElTable } from "element-plus";
import { getSystemLog } from "@/api/modules/logCenter";
import { formatDate, filterQueryForm } from "@/utils";
import { Check, Close, RefreshRight } from "@element-plus/icons-vue";
import { ElMessageBox } from "element-plus";
import { useDownloadList } from "@/hooks/useDownloadList";
import { logEventOptions, logModuleOptions } from "@/config/mappingDict";

const now = new Date().getTime();
const start = now - 24 * 60 * 60 * 1000;
const queryForm = reactive<Record<string, any>>({
  log_module: "",
  level: "",
  time: [start, now],
  limit: 100,
  offset: 0,
  lasttime: undefined
});
const state = reactive<Record<string, any>>({
  isLoading: false,
  logArr: [],
  logList: [],
  exportList: []
});
const refresh = ref(false);
const logLevelOptions = ref<Record<string, any>[]>([
  { label: "错误", value: "error" },
  { label: "信息", value: "info" },
  { label: "告警", value: "warning" }
]);
const columns = reactive<Record<string, any>[]>([
  {
    field: "time",
    name: "时间",
    render: (item: Record<string, any>) => formatDate(new Date(item.time * 1000)),
    width: "200"
  },
  {
    field: "module",
    name: "系统模块",
    render: (item: Record<string, any>) =>
      logModuleOptions.find((option: Record<string, string>) => option.value === item.module)?.label ?? "-"
  },
  {
    field: "event",
    name: "系统事件",
    render: (item: Record<string, any>) =>
      logEventOptions.find((option: Record<string, string>) => option.value === item.event)?.label ?? "-"
  },
  {
    field: "info",
    name: "内容"
  },
  {
    field: "level",
    name: "日志级别",
    render: (item: Record<string, any>) =>
      logLevelOptions.value.find((option: Record<string, string>) => option.value === item.level)?.label ?? "-"
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
  ElMessageBox.confirm("确认导出系统日志?", "温馨提示", { type: "warning" }).then(async () => {
    const csvColumns = columns.map((item: Record<string, any>) => ({
      label: item.name,
      value: item.field
    }));
    const params = filterQueryForm({
      log_module: queryForm.log_module,
      level: queryForm.level,
      starttime: String(queryForm.time[0]).slice(0, 10),
      endtime: String(queryForm.time[1]).slice(0, 10)
    });
    const dataCallBack = (item: Record<string, any>) => {
      item.time = formatDate(new Date(item.time * 1000));
      item.module = logModuleOptions.find((option: Record<string, string>) => option.value === item.module)?.label ?? "-";
      item.event = logEventOptions.find((option: Record<string, string>) => option.value === item.event)?.label ?? "-";
      item.level = logLevelOptions.value.find((option: Record<string, string>) => option.value === item.level)?.label ?? "-";
      return item;
    };
    useDownloadList(getSystemLog, "系统日志", csvColumns, params, true, false, true, dataCallBack, "time");
  });
};

const getLogData = async (flag: boolean = false) => {
  try {
    let logParams: Record<string, any> = {
      ...filterQueryForm({
        log_module: queryForm.log_module,
        level: queryForm.level,
        starttime: String(queryForm.time[0]).slice(0, 10),
        endtime: String(queryForm.time[1]).slice(0, 10),
        limit: queryForm.limit,
        offset: flag ? queryForm.offset : 0
      })
    };
    if (flag) {
      logParams.lasttime = queryForm.lasttime;
    }
    const data: any = await getSystemLog(logParams);
    const { affected_items } = (data || {}).data || {};
    state.logArr = affected_items;
    if (affected_items.length > 0) {
      queryForm.lasttime = affected_items[affected_items.length - 1].time;
    }
    if (flag) {
      // 查询更多时拼接数据
      state.logList = state.logList.concat([...state.logArr]);
    } else {
      state.logList = [...state.logArr];
    }
  } catch (error) {
    console.log(`查询系统日志错误: ${error}`);
  }
};
const getMore = async () => {
  queryForm.offset += 100;
  getLogData(true);
};
onMounted(async () => {
  getLogData();
});
</script>
<style scoped lang="scss">
.system-log-warp {
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
