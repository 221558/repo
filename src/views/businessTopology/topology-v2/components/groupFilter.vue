<template>
  <el-select v-model="topologyState.groupFilterType" @change="toReset" class="mr12">
    <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
  </el-select>
  <el-popover
    placement="bottom"
    :width="380"
    trigger="click"
    v-if="topologyState.groupFilterType === 'group'"
    :teleported="false"
    @show="onShowGroupPopover"
  >
    <template #reference>
      <el-button class="mr12">选择工作组</el-button>
    </template>
    <div>
      <p class="filter-title">工作组</p>
      <div class="filter-contain">
        <el-input v-model="filterText" placeholder="过滤工作组" class="mb10" v-debounce:input="filterData" />
        <el-tree
          ref="groupTreeRef"
          class="tree-warp"
          :data="groupTree"
          show-checkbox
          node-key="id"
          :expand-on-click-node="false"
          check-on-click-node
          :filter-node-method="filterNode"
        >
          <template #default="{ node }">
            <span class="custom-tree-node">
              <span>{{ JSON.parse(node.label).show_name }}</span>
              <span>
                <el-tag class="ml8">{{ JSON.parse(node.label).loc_show_name }}</el-tag>
                <el-tag class="ml8" type="success">{{ JSON.parse(node.label).org_show_name }}</el-tag>
                <el-tag class="ml8" type="warning">{{ JSON.parse(node.label).business_show_name }}</el-tag>
              </span>
            </span>
          </template>
        </el-tree>
      </div>
      <div class="popover-footer">
        <el-button @click="allCheckGroup">全选</el-button>
        <el-button @click="noCheckGroup">全不选</el-button>
        <el-button type="primary" @click="toFilterGroup">确认</el-button>
      </div>
    </div>
  </el-popover>
  <el-popover
    placement="bottom"
    :width="380"
    trigger="click"
    v-if="topologyState.groupFilterType === 'tag'"
    :teleported="false"
    @show="onShowTagPopover"
  >
    <template #reference>
      <el-button class="mr12">选择标签</el-button>
    </template>
    <div>
      <p class="filter-title">标签</p>
      <div class="filter-contain">
        <el-input v-model="filterText" placeholder="过滤标签" class="mb10" v-debounce:input="filterData" />
        <el-tree
          ref="tagTreeRef"
          class="tree-warp"
          :data="tagTree"
          show-checkbox
          node-key="id"
          :expand-on-click-node="false"
          check-on-click-node
          default-expand-all
          :filter-node-method="filterNode"
        ></el-tree>
      </div>
      <div class="popover-footer">
        <el-button type="primary" @click="toFilterTag">确认</el-button>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts" name="groupFilter">
import { ref, nextTick, computed } from "vue";
import { ElTree } from "element-plus";
import mittBus from "@/utils/mittBus";
import { topologyState } from "../state";

const options = ref([
  { value: "group", label: "按工作组" },
  { value: "tag", label: "按标签" }
]);

const filterText = ref("");

const groupTreeRef = ref<InstanceType<typeof ElTree>>();
const groupTree = computed(() => {
  return topologyState.groupList.map((k: Record<string, string>) => ({
    id: k.name,
    label: `{"show_name":"${k.show_name}","loc_show_name":"${k.loc_show_name}","org_show_name":"${k.org_show_name}","business_show_name":"${k.business_show_name}"}`
  }));
});

const onShowGroupPopover = () => {
  filterText.value = "";
  filterData();
  groupTreeRef.value!.setCheckedKeys(topologyState.selectedGroup);
};

const filterData = () => {
  groupTreeRef.value && groupTreeRef.value.filter(filterText.value);
  tagTreeRef.value && tagTreeRef.value.filter(filterText.value);
};

const filterNode = (value: string, data: Record<string, any>) => {
  if (!value) return true;

  try {
    const labels = Object.values(JSON.parse(data.label));
    const filterArr = labels.filter((label: any) => label.includes(value));
    return filterArr.length > 0;
  } catch (error) {
    return data.label.includes(value);
  }
};

const tagTreeRef = ref<InstanceType<typeof ElTree>>();

const tagTree = computed(() => {
  return [
    {
      id: "loc",
      label: "位置标签",
      children: topologyState.tagList1
    },
    {
      id: "org",
      label: "组织标签",
      children: topologyState.tagList2
    },
    {
      id: "business",
      label: "业务标签",
      children: topologyState.tagList3
    }
  ];
});

const onShowTagPopover = () => {
  filterText.value = "";
  filterData();
  tagTreeRef.value!.setCheckedKeys(topologyState.selectedTag);
};

const toReset = async () => {
  topologyState.selectedGroup = groupTree.value.map((k: Record<string, string>) => k.id);
  topologyState.selectedTag = [...topologyState.tagList1, ...topologyState.tagList2, ...topologyState.tagList3].map(
    (k: Record<string, string>) => k.id
  );
  buildChart();
};

const allCheckGroup = () => {
  groupTreeRef.value!.setCheckedKeys(topologyState.groupList.map((k: Record<string, string>) => k.name));
};

const noCheckGroup = () => {
  groupTreeRef.value!.setCheckedKeys([]);
};

const toFilterGroup = async () => {
  topologyState.selectedGroup = groupTreeRef.value!.getCheckedKeys();
  buildChart();
};

const toFilterTag = async () => {
  topologyState.selectedTag = tagTreeRef.value!.getCheckedKeys(true);
  buildChart();
};

const buildChart = async () => {
  topologyState.isLoading = true;

  Promise.all([topologyState.getNodesOut(), topologyState.getEdgesOut()])
    .then(() => {
      topologyState.isLoading = false;
      nextTick(() => {
        mittBus.emit("buildChartOut");
      });
    })
    .catch(error => {
      console.log(error);
    });
};
</script>

<style scoped lang="scss">
.filter-contain {
  min-height: 192px;
}
</style>
