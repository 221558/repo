<template>
  <div class="card login-log-warp">
    <el-form ref="formRef" :inline="true" :model="queryForm" :rules="rules">
      <el-form-item label="用户名：" prop="login_user">
        <el-input
          v-model="queryForm.login_user"
          placeholder="请输入用户名："
          v-debounce:input="toSearch"
          clearable
          @clear="toSearch"
        />
      </el-form-item>
      <el-form-item label="登录IP：" prop="login_ip">
        <el-input
          v-model="queryForm.login_ip"
          placeholder="请输入登录IP"
          v-debounce:input="toSearch"
          clearable
          @clear="toSearch"
        />
      </el-form-item>
      <el-form-item label="登录结果：">
        <el-select v-model="queryForm.result" placeholder="请选择登录结果" clearable @change="() => getLogData()">
          <el-option label="成功" value="success" />
          <el-option label="失败" value="failed" />
        </el-select>
      </el-form-item>
      <el-form-item label="降序排序：">
        <el-switch
          @change="() => getLogData()"
          v-model="queryForm.sort"
          inline-prompt
          :active-icon="Check"
          :inactive-icon="Close"
          active-value="+timestamp"
          inactive-value="-timestamp"
        />
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

<script setup lang="ts" name="loginLogObject">
import { onMounted, reactive, ref, onUnmounted } from "vue";
import { ElTable } from "element-plus";
import { getLoginLog } from "@/api/modules/logCenter";
import { formatDate, filterQueryForm } from "@/utils";
import { Check, Close, RefreshRight } from "@element-plus/icons-vue";
import { ElMessageBox } from "element-plus";
import { useDownloadList } from "@/hooks/useDownloadList";
import { checkIp } from "@/utils/eleValidate";

const formRef = ref();
const queryForm = reactive<Record<string, any>>({
  result: "",
  login_user: "",
  login_ip: "",
  sort: "-timestamp",
  limit: 100,
  offset: 0
});
const checkUsername = (rule: any, value: any, callback: any) => {
  const reg = /^[0-9a-zA-Z]*$/g;
  if (!value || reg.test(value)) {
    callback();
  } else {
    callback(new Error("用户名只能输入数字字母"));
  }
};
const rules = reactive<Record<string, any>>({
  login_user: [{ validator: checkUsername, trigger: "blur" }],
  login_ip: [{ validator: (rule: any, value: any, callback: any) => checkIp(rule, value, callback), trigger: "blur" }]
});
const state = reactive<Record<string, any>>({
  isLoading: false,
  logArr: [],
  logList: [],
  exportList: []
});
const refresh = ref(false);
const columns = reactive<Record<string, any>[]>([
  {
    field: "timestamp",
    name: "时间",
    render: (item: Record<string, any>) => formatDate(new Date(item.timestamp)),
    showOverflowTooltip: true
  },
  {
    field: "user",
    name: "用户名",
    width: "120"
  },
  {
    field: "ip",
    name: "登录IP",
    showOverflowTooltip: true
  },
  {
    field: "result",
    name: "登录结果",
    width: "120",
    render: (item: Record<string, any>) => (item.result === "success" ? "成功" : "失败")
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
  ElMessageBox.confirm("确认导出管理员登录日志?", "温馨提示", { type: "warning" }).then(async () => {
    const csvColumns = columns.map((item: Record<string, any>) => ({
      label: item.name,
      value: item.field
    }));
    const param = filterQueryForm(queryForm);
    const dataCallBack = (item: Record<string, any>) => {
      item.timestamp = formatDate(new Date(item.timestamp));
      item.result = item.result === "success" ? "成功" : "失败";
      return item;
    };
    useDownloadList(getLoginLog, "管理员登录日志", csvColumns, param, true, false, true, dataCallBack);
  });
};

const toSearch = () => {
  formRef.value.validate(async (valid: any) => {
    if (valid) {
      getLogData();
    } else {
      return false;
    }
  });
};

const getLogData = async (flag: boolean = false) => {
  try {
    formRef.value.clearValidate();
    let logParams: Record<string, any> = {
      ...filterQueryForm(queryForm)
    };
    logParams.offset = flag ? queryForm.offset : 0;
    const data: any = await getLoginLog(logParams);
    state.logArr = ((data || {}).data || {}).affected_items;
    if (flag) {
      // 查询更多时拼接数据
      state.logList = state.logList.concat([...state.logArr]);
    } else {
      state.logList = [...state.logArr];
    }
  } catch (error) {
    console.log(`查询管理员登录日志列表错误: ${error}`);
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
.login-log-warp {
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
