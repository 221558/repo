<template>
  <div class="card no-card contact-container">
    <ProTable ref="proTable" :columns="columns" :request-api="getList" :tool-button="false" :data-callback="dataCallback">
      <template #tableHeader="scope">
        <div>
          <el-button type="primary" @click="toAdd">新增联系人</el-button>
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

<script setup lang="ts" name="contactManagement">
import { reactive, ref } from "vue";
import ProTable from "@/components/ProTable/index.vue";
import { ProTableInstance, ColumnProps } from "@/components/ProTable/interface";
import { useHandleData } from "@/hooks/useHandleData";
import { getContact, deleteContact } from "@/api/modules/contactManagement";
import { useRouter } from "vue-router";
import { localSet } from "@/utils";

const router = useRouter();
const proTable = ref<ProTableInstance>();
const columns = reactive<ColumnProps[]>([
  { type: "selection", fixed: "left", width: 70 },
  {
    prop: "id",
    label: "ID",
    width: "80"
  },
  {
    prop: "name",
    label: "姓名",
    search: {
      el: "input",
      order: 1,
      props: { filterable: true },
      key: "liaison_name"
    }
  },
  {
    prop: "email",
    label: "邮箱",
    search: {
      el: "input",
      order: 2,
      props: { filterable: true },
      key: "email_address"
    },
    width: "240"
  },
  {
    prop: "last_m_time",
    label: "修改时间",
    width: "200"
  },
  {
    prop: "last_m_user",
    label: "修改人"
  },
  { prop: "operation", label: "操作", fixed: "right", width: 120, align: "left", hideOverflowTooltip: true }
]);

const getList = async (params: any) => {
  const newParams = JSON.parse(JSON.stringify(params));
  const limit = newParams.pageSize;
  const offset = (newParams.pageNum - 1) * newParams.pageSize;
  const param = {
    limit,
    offset,
    liaison_name: newParams.liaison_name,
    email_address: newParams.email_address
  };
  return getContact(param);
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
  router.push(`/contactManagement/add`);
};

const edit = (data: Record<string, any>) => {
  localSet("contactManagement-edit", data);
  router.push({
    path: `/contactManagement/edit/${data.id}`
  });
};

const remove = async (selectedItems: Record<string, any>[]) => {
  const liaison_object_list = selectedItems
    .map((item: Record<string, any>) => {
      return item.id;
    })
    .join(",");
  await useHandleData(deleteContact, { liaison_object_list }, `删除该数据`, "warning");
  proTable.value?.getTableList();
};
</script>
<style scoped lang="scss">
.contact-container {
  .query-form {
    width: 40%;
  }
}
</style>
