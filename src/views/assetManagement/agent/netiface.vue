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

<script setup lang="ts" name="netiface">
import { ref, reactive } from "vue";
import ProTable from "@/components/ProTable/index.vue";
import { ProTableInstance, ColumnProps } from "@/components/ProTable/interface";
import { localGet } from "@/utils";
import { getNetiface } from "@/api/modules/assets";
import { ElMessageBox } from "element-plus";
import { useDownloadList } from "@/hooks/useDownloadList";

const state = ref<Record<string, any>>({
  total: 0,
  exportList: [],
  exportLoading: false
});
const proTable = ref<ProTableInstance>();
const columns = reactive<ColumnProps[]>([
  {
    prop: "name",
    label: "名称"
  },
  {
    prop: "mac",
    label: "MAC"
  },
  {
    prop: "state",
    label: "状态"
  },
  {
    prop: "mtu",
    label: "MTU"
  },
  {
    prop: "type",
    label: "类型"
  }
]);

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
  return getNetiface({
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
  ElMessageBox.confirm("确认导出网络接口?", "温馨提示", { type: "warning" }).then(async () => {
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
    useDownloadList(getNetiface, "网络接口", csvColumns, param, true, true);
    state.value.exportLoading = false;
  });
};
</script>
