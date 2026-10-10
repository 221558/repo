<template>
  <div class="card no-card agents-list-warp">
    <div class="title mb10">
      <el-button link type="info" @click="toPrev">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="pl10">{{ route.query.show_name }}</span>
    </div>
    <div class="table-warp">
      <ProTable
        ref="proTable"
        :columns="columns"
        :request-api="getList"
        :init-param="initParam"
        :tool-button="false"
        :data-callback="dataCallback"
      >
        <template #tableHeader>
          <div class="btn-warp mt2 mb5">
            <el-button type="primary" @click="toAgentManage" v-if="route.query.mode !== 'auto'">管理工作负载</el-button>
            <el-button type="primary" @click="downloadFile">导出</el-button>
            <el-button type="primary" @click="refresh">刷新</el-button>
          </div>
        </template>
      </ProTable>
    </div>
  </div>
</template>

<script setup lang="ts" name="agentsList">
import { reactive, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import ProTable from "@/components/ProTable/index.vue";
import { ProTableInstance } from "@/components/ProTable/interface";
import { ColumnProps } from "@/components/ProTable/interface";
import { getAgentOsList, getGroupAgent } from "@/api/modules/assets";
import { ElMessageBox } from "element-plus";
import { useDownloadList } from "@/hooks/useDownloadList";
import { checkIp, checkAgentName } from "@/utils/eleValidate";

const route = useRoute();
const router = useRouter();

const proTable = ref<ProTableInstance>();
const initParam = reactive({ pageSize: 10, pageNum: 1, q: `id!=000;(group=${route.params.id})`, sort: "+id" });
const dataCallback = (data: any, totalParam?: any) => {
  return {
    list: data.affected_items,
    total: data.total_affected_items,
    pageNum: totalParam.pageNum,
    pageSize: totalParam.pageSize
  };
};
const statusGender = ref([
  { value: "active", text: "已连接" },
  { value: "disconnected", text: "未连接" },
  { value: "never_connected", text: "从未连接" }
]);
let osGender = ref<Record<string, any>[]>([]);
const columns = reactive<ColumnProps[]>([
  {
    prop: "id",
    label: "ID"
  },
  {
    prop: "ip",
    label: "IP",
    search: {
      el: "input",
      order: 3,
      props: { filterable: true },
      rules: [
        {
          validator: (rule: any, value: any, callback: any) => checkIp(rule, value, callback),
          trigger: "blur"
        }
      ]
    }
  },
  {
    prop: "name",
    label: "主机名",
    search: {
      el: "input",
      order: 5,
      props: { filterable: true },
      rules: [
        {
          validator: checkAgentName,
          trigger: "blur"
        }
      ]
    }
  },
  {
    prop: "version",
    label: "版本",
    render: scope => scope.row.version?.split(" ")[1] ?? "-"
  },
  {
    prop: "os_name",
    label: "操作系统",
    enum: osGender,
    search: { el: "select", order: 4, props: { filterable: true }, key: "os.platform" },
    fieldNames: { label: "platform", value: "platform" },
    render: scope => {
      const name = ((scope.row || {}).os || {}).name ?? "-";
      const version = ((scope.row || {}).os || {}).version ?? "-";
      return !name && !version ? "-" : `${name} ${version}`;
    }
  },
  {
    prop: "status",
    label: "状态",
    enum: statusGender,
    search: { el: "select", order: 1, props: { filterable: true } },
    fieldNames: { label: "text", value: "value" }
  }
]);

let searchParams = reactive<Record<string, any>>({});

onMounted(async () => {
  await getInitList();
});

const getInitList = async () => {
  try {
    const listRes = await getAgentOsList();
    osGender.value = ((listRes || {}).data || {}).affected_items.map(k => ({
      platform: k.os.platform
    }));
  } catch (error) {
    console.log(`操作系统列表错误: ${error}`);
  }
};

const query = () => {
  const limit = searchParams.pageSize;
  const offset = (searchParams.pageNum - 1) * searchParams.pageSize;
  const filterArr = columns.filter(column => column.search).map(column => column.search?.key ?? column.prop);
  let q = `id!=000;daemonset_id!=0`;
  filterArr.forEach((k: any) => {
    if (searchParams[k]) {
      q = `${q};(${k}=${searchParams[k]})`;
    }
  });
  return {
    limit,
    offset,
    q,
    sort: "+id"
  };
};

const getList = (params: any) => {
  searchParams = JSON.parse(JSON.stringify(params));
  const param = {
    urlId: route.params.id,
    params: query()
  };
  return getGroupAgent(param);
};

const refresh = () => {
  proTable.value?.search();
};

const toAgentManage = () => {
  router.push(`/assetManagement/group/agentsManage/${route.params.id}`);
};

const downloadFile = () => {
  ElMessageBox.confirm("确认导出工作负载列表?", "温馨提示", { type: "warning" }).then(async () => {
    const csvColumns = columns.map((item: Record<string, any>) => ({
      label: item.label,
      value: item.prop
    }));
    const param = {
      urlId: route.params.id,
      params: query()
    };
    const dataCallBack = (item: Record<string, any>) => {
      item.version = item.version?.split(" ")[1] ?? "-";
      const name = ((item || {}).os || {}).name ?? "-";
      const version = ((item || {}).os || {}).version ?? "-";
      item.os_name = !name && !version ? "-" : `${name} ${version}`;
      item.status = statusGender.value.find((status: Record<string, any>) => status.value === item.status)?.text ?? "-";
      return item;
    };
    useDownloadList(getGroupAgent, `${route.params.id}组工作负载列表`, csvColumns, param, true, true, true, dataCallBack);
  });
};

const toPrev = () => {
  router.push(`/assetManagement/group`);
};
</script>

<style scoped lang="scss">
.agents-list-warp {
  display: flex;
  flex-direction: column;
  height: 100%;
  .table-warp {
    flex-grow: 1;
  }
}
.title {
  height: 30px;
  border-bottom: 1px solid #dcdfe6;
}
</style>
