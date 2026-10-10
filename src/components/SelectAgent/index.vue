<template>
  <div class="nail-msg" v-if="selected">
    <span class="mr5" @click="showDialog">{{ selected }}</span>
    <el-tooltip class="box-item" effect="dark" content="取消固定代理" placement="top">
      <el-icon @click="onCancel"><Flag /></el-icon>
    </el-tooltip>
  </div>
  <el-button v-else link type="primary" @click="showDialog">
    <SvgIcon name="daili" :icon-style="{ width: '20px', height: '20px' }" /><span class="pl5">选择代理</span>
  </el-button>
  <el-dialog
    :model-value="dialogVisible"
    title="选择代理"
    style="width: 80%; height: 80%"
    @closed="closeDialog"
    class="no-card"
    :close-on-press-escape="false"
    :close-on-click-modal="false"
  >
    <ProTable
      ref="proTable"
      :columns="columns"
      :request-api="getList"
      :init-param="initParam"
      :tool-button="false"
      :data-callback="dataCallback"
    >
    </ProTable>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="onSubmit"> 确定 </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="tsx" name="SelectAgent">
import { reactive, ref, onMounted } from "vue";
import { Flag } from "@element-plus/icons-vue";
import SvgIcon from "@/components/SvgIcon/index.vue";
import ProTable from "@/components/ProTable/index.vue";
import { ProTableInstance, ColumnProps } from "@/components/ProTable/interface";
import { getGroupList, getAgentOsList, getAgentList } from "@/api/modules/assets";

let selected = ref<string | undefined>("");
const dialogVisible = ref(false);

const proTable = ref<ProTableInstance>();
const initParam = reactive({ pageSize: 10, pageNum: 1, q: "id!=000", sort: "+id" });
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
let groupsGender = ref<Record<string, any>[]>([]);
let osGender = ref<Record<string, any>[]>([]);
const columns = reactive<ColumnProps[]>([
  {
    label: "单选",
    type: "radio",
    width: 80,
    align: "center"
  },
  {
    prop: "id",
    label: "ID"
  },
  {
    prop: "ip",
    label: "IP",
    search: { el: "input", order: 3, props: { filterable: true } }
  },
  {
    prop: "name",
    label: "主机名",
    search: { el: "input", order: 5, props: { filterable: true } }
  },
  {
    prop: "group",
    label: "组",
    enum: groupsGender,
    // search: { el: "select", order: 2, props: { filterable: true } },
    search: {
      order: 2,
      // 自定义 search 显示内容
      render: scope => {
        return (
          <el-select vModel_trim={scope.searchParam.group} placeholder="请选择" style="width: 100%" clearable>
            {groupsGender.value.map(item => {
              return (
                <el-option
                  label={item.show_name}
                  value={item.name}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                  <span>{item.show_name}</span>
                  <span>
                    <el-tag class="ml8">{item.loc_show_name ?? "无标签"}</el-tag>
                    <el-tag class="ml8" type="success">
                      {item.org_show_name ?? "无标签"}
                    </el-tag>
                    <el-tag class="ml8" type="warning">
                      {item.business_show_name ?? "无标签"}
                    </el-tag>
                  </span>
                </el-option>
              );
            })}
          </el-select>
        );
      }
    },
    fieldNames: { label: "show_name", value: "name" },
    render: scope => {
      const options = proTable.value?.enumMap.get("group");
      return scope.row.group
        ?.map((group: string[]) => options?.find(option => option.name === group)?.show_name ?? "-")
        .join("，");
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

onMounted(async () => {
  await getInitList();
});

const getInitList = async () => {
  try {
    const groups = await getGroupList({ limit: 0 });
    groupsGender.value = ((groups || {}).data || {}).affected_items;
  } catch (error) {
    console.log(`分组列表错误: ${error}`);
  }

  try {
    const listRes = await getAgentOsList();
    osGender.value = ((listRes || {}).data || {}).affected_items.map(k => ({
      platform: k.os.platform
    }));
  } catch (error) {
    console.log(`操作系统列表错误: ${error}`);
  }
};

const showDialog = () => {
  dialogVisible.value = true;
  proTable.value?.reset();
};
const closeDialog = () => {
  dialogVisible.value = false;
};

const getList = (params: any) => {
  const newParams = JSON.parse(JSON.stringify(params));
  const limit = newParams.pageSize;
  const offset = (newParams.pageNum - 1) * newParams.pageSize;
  const filterArr = columns.filter(column => column.search).map(column => column.search?.key ?? column.prop);
  let q = "id!=000;daemonset_id!=0";
  filterArr.forEach((k: any) => {
    if (newParams[k]) {
      q = `${q};(${k}=${newParams[k]})`;
    }
  });
  const param = {
    limit,
    offset,
    q,
    sort: "+id"
  };
  return getAgentList(param);
};

const $emit = defineEmits(["onChangeSelected"]);
const onCancel = () => {
  selected.value = "";
  if (proTable.value?.radio) proTable.value.radio = "";
  $emit("onChangeSelected", {});
};

const onSubmit = () => {
  selected.value = proTable.value?.radio;
  $emit("onChangeSelected", proTable.value?.radio);
  closeDialog();
};
</script>

<style scoped lang="scss">
.nail-msg {
  height: 40px;
  padding: 0 5px;
  line-height: 40px;
  color: #2d8cf0;
  cursor: pointer;
  background: #eaf4fe;
  i:hover {
    cursor: pointer;
  }
}
</style>
