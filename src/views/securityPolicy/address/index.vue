<template>
  <div class="card no-card address-container">
    <ProTable
      ref="proTable"
      :columns="columns"
      :request-api="getList"
      :tool-button="false"
      :fuzzy-query="true"
      :data-callback="dataCallback"
    >
      <template #tableHeader="scope">
        <div>
          <el-button type="primary" icon="Plus" @click="toAdd"> 新增地址对象 </el-button>
          <el-button type="primary" icon="Delete" @click="remove(scope.selectedList)" :disabled="!scope.isSelected">
            批量删除
          </el-button>
        </div>
      </template>
      <!-- 操作 -->
      <template #operation="scope">
        <el-tooltip effect="dark" :content="`编辑数据`" placement="top">
          <el-button link type="primary" size="small" @click="edit(scope.row)">
            <el-icon><Edit /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip effect="dark" :content="`删除数据`" placement="top">
          <el-button link type="primary" size="small" @click="remove([scope.row])">
            <el-icon><Delete /></el-icon>
          </el-button>
        </el-tooltip>
      </template>
    </ProTable>
  </div>
</template>

<script setup lang="ts" name="addressObject">
import { reactive, ref } from "vue";
import ProTable from "@/components/ProTable/index.vue";
import { ProTableInstance, ColumnProps } from "@/components/ProTable/interface";
import { getAddressList, removeAddress } from "@/api/modules/security";
import { useRouter } from "vue-router";
import { localSet } from "@/utils";
import { useHandleData } from "@/hooks/useHandleData";

const router = useRouter();
const proTable = ref<ProTableInstance>();
const columns = reactive<ColumnProps[]>([
  { type: "selection", fixed: "left", width: 70 },
  {
    prop: "show_name",
    label: "显示名称"
  },
  {
    prop: "address",
    label: "IP"
  },
  {
    prop: "domain",
    label: "域名",
    render: scope => scope.row.domain ?? "-"
  },
  {
    prop: "description",
    label: "描述"
  },
  {
    prop: "conflict_ip",
    label: "冲突负载IP",
    width: "200",
    render: scope => scope.row.conflict_ip ?? "-"
  },
  {
    prop: "last_m_time",
    label: "修改时间"
  },
  {
    prop: "last_m_user",
    label: "修改人"
  },
  { prop: "operation", label: "操作", fixed: "right", width: 120, align: "left", hideOverflowTooltip: true }
]);
const toAdd = () => {
  router.push(`/securityPolicy/address/add`);
};
const edit = (data: Record<string, any>) => {
  localSet("addressObject-edit", data);
  router.push({
    path: `/securityPolicy/address/edit/${data.id}`
  });
};
const remove = async (selectedItems: Record<string, any>[]) => {
  try {
    const address_object_list = selectedItems
      .map((item: Record<string, any>) => {
        return item.id;
      })
      .join(",");
    await useHandleData(
      removeAddress,
      { address_object_list },
      `删除该数据`,
      "warning",
      "",
      "地址对象删除失败: 该地址对象已被策略规则使用，不可删除"
    );
    proTable.value?.getTableList();
  } catch (error) {
    console.log(`删除地址对象错误: ${error}`);
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
  return getAddressList(param);
};

const dataCallback = (data: any, totalParam?: any) => {
  return {
    list: data.affected_items,
    total: data.total_affected_items,
    pageNum: totalParam.pageNum,
    pageSize: totalParam.pageSize
  };
};
</script>
<style scoped lang="scss">
.address-container {
  .query-form {
    width: 40%;
  }
}
</style>
