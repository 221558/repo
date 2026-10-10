<template>
  <div class="detail-base-warp no-card">
    <ProTable
      ref="proTable"
      :columns="columns"
      :request-api="getList"
      :tool-button="false"
      :fuzzy-query="true"
      :data-callback="dataCallback"
    >
      <template #tableHeader="">
        <el-button type="primary" :disabled="state.total === 0" @click="downloadFile" v-loading="state.exportLoading">
          导出
        </el-button>
      </template>
    </ProTable>
  </div>
</template>

<script setup lang="ts" name="port">
import { ref, reactive, onBeforeMount } from "vue";
import ProTable from "@/components/ProTable/index.vue";
import { ProTableInstance, ColumnProps } from "@/components/ProTable/interface";
import { localGet } from "@/utils";
import { getPort } from "@/api/modules/assets";
import { ElMessageBox } from "element-plus";
import { useDownloadList } from "@/hooks/useDownloadList";

const state = ref<Record<string, any>>({
  total: 0,
  exportList: [],
  exportLoading: false
});
const proTable = ref<ProTableInstance>();
let columns = reactive<ColumnProps[]>([]);

onBeforeMount(async () => {
  getColumns();
});

const getColumns = () => {
  const selectedItem = localGet("agent-detail");
  const windowsColumns = [
    { prop: "process", label: "进程" },
    {
      prop: "local.ip",
      label: "本地IP"
    },
    {
      prop: "local.port",
      label: "本地端口"
    },
    { prop: "state", label: "状态" },
    { prop: "protocol", label: "协议" }
  ];
  const defaultColumns = [
    {
      prop: "local.ip",
      label: "本地IP"
    },
    {
      prop: "local.port",
      label: "本地端口"
    },
    { prop: "state", label: "状态" },
    { prop: "protocol", label: "协议" }
  ];
  if ((selectedItem.os || {}).platform === "windows") {
    columns = windowsColumns;
  } else {
    columns = defaultColumns;
  }
};

const getList = async (params: any) => {
  const newParams = JSON.parse(JSON.stringify(params));
  const limit = newParams.pageSize;
  const offset = (newParams.pageNum - 1) * newParams.pageSize;
  const param = {
    limit,
    offset,
    search: newParams.search,
    search_in_fields: newParams.search_in_fields
  };
  const selectedItem = localGet("agent-detail");
  return getPort({
    urlId: selectedItem.id,
    params: param
  });
};
const dataCallback = (data: any, totalParam?: any) => {
  state.value.total = data.total_affected_items;
  return {
    list: data.affected_items,
    total: data.total_affected_items,
    pageNum: totalParam.pageNum,
    pageSize: totalParam.pageSize
  };
};

const downloadFile = () => {
  ElMessageBox.confirm("确认导出端口?", "温馨提示", { type: "warning" }).then(async () => {
    state.value.exportLoading = true;
    const csvColumns = columns.map((item: Record<string, any>) => ({
      label: item.label,
      value: item.prop
    }));
    const selectedItem = localGet("agent-detail");
    const param = {
      urlId: selectedItem.id,
      params: {
        search: state.value.input
      }
    };
    useDownloadList(getPort, "端口", csvColumns, param, true, true);
    state.value.exportLoading = false;
  });
};
</script>
