<template>
  <div class="card no-card agents-policy-warp">
    <div class="title mb10">
      <el-button link type="info" @click="toPrev">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="pl10">{{ route.query.show_name }}工作组策略</span>
    </div>
    <div class="table-warp">
      <ProTable :data="list" :columns="columns" :tool-button="false">
        <!-- 策略名 -->
        <template #name="scope">
          <el-tooltip effect="dark" content="编辑策略下规则" placement="top">
            <el-button
              type="primary"
              link
              :disabled="!isRoutePermission('/securityPolicy/policyManage/ruleManage/:id')"
              @click="toRule(scope.row)"
            >
              {{ scope.row.name }}
            </el-button>
          </el-tooltip>
        </template>
      </ProTable>
    </div>
  </div>
</template>

<script setup lang="ts" name="groupPolicy">
import { reactive, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { formatDate, localSet, isRoutePermission } from "@/utils";
import ProTable from "@/components/ProTable/index.vue";
import { ColumnProps } from "@/components/ProTable/interface";
import { getPolicyList } from "@/api/modules/policyManage";
import { groupState } from "./state";

const route = useRoute();
const router = useRouter();

const list = ref<Record<string, any>[]>([]);
const columns = reactive<ColumnProps[]>([
  {
    prop: "name",
    label: "策略名"
  },
  {
    prop: "loc_name",
    label: "位置标签"
  },
  {
    prop: "org_name",
    label: "组织标签"
  },
  {
    prop: "bus_name",
    label: "业务标签"
  },
  {
    prop: "state_label",
    label: "下发状态"
  },
  {
    prop: "type_label",
    label: "策略类型"
  },
  {
    prop: "time",
    label: "修改时间",
    render: scope => formatDate(new Date(scope.row.time))
  }
]);

onMounted(async () => {
  getList();
});

const getList = async () => {
  try {
    const data = await getPolicyList({ group_name: route.params.id });
    list.value = ((data || {}).data || {}).affected_items.map((item: Record<string, any>) => {
      item.state_label = item.state === "enable" ? "已下发" : "未下发";
      item.type_label = groupState.policyOptions.find((k: Record<string, any>) => k.id === item.type)?.label ?? "-";
      return item;
    });
  } catch (error) {
    console.log(`查询策略列表错误: ${error}`);
  }
};

const toRule = (item: Record<string, any>) => {
  localSet("policyManage-edit", item);
  router.push({
    path: `/securityPolicy/policyManage/ruleManage/${item.name}`
  });
};

const toPrev = () => {
  router.push(`/assetManagement/group`);
};
</script>

<style scoped lang="scss">
.agents-policy-warp {
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
