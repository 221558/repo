<template>
  <el-popover placement="bottom" :width="380" trigger="click" @show="onShowPopover" :teleported="false">
    <template #reference>
      <el-button class="ml12">查找工作负载</el-button>
    </template>
    <div>
      <p class="filter-title">工作负载</p>
      <div class="filter-contain">
        <el-input v-model="filterText" placeholder="过滤工作负载" class="mb10" v-debounce:input="filterData" />
        <el-tree
          ref="treeRef"
          class="tree-warp"
          :data="treeData"
          show-checkbox
          node-key="id"
          :expand-on-click-node="false"
          check-on-click-node
          :filter-node-method="filterNode"
          @check-change="checkChange"
        >
          <template #default="{ node }">
            <span class="custom-tree-node">
              <div>
                <p>{{ JSON.parse(node.label).name }}</p>
                <p class="agent-ip">{{ JSON.parse(node.label).ip }}</p>
              </div>
              <span>
                <el-tag class="ml8" type="info">{{ JSON.parse(node.label).tag_show }}</el-tag>
              </span>
            </span>
          </template>
        </el-tree>
      </div>
      <div class="popover-footer">
        <el-button type="primary" @click="toMoveAgent">确认</el-button>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts" name="moveAgent">
import { ref, computed } from "vue";
import { ElTree } from "element-plus";
import mittBus from "@/utils/mittBus";
import { topologyState } from "../state";

const filterText = ref("");

const treeRef = ref<InstanceType<typeof ElTree>>();
const treeData = computed(() => {
  return topologyState.agentList.map((k: Record<string, string>) => ({
    id: k.ip,
    label: `{"name":"${k.name}","ip":"${k.ip}","tag_show":"${k.tag_show}"}`,
    group: k.group,
    ip: k.ip
  }));
});

const onShowPopover = () => {
  filterText.value = "";
  filterData();
  treeRef.value!.setCheckedKeys([]);
};

const filterData = () => {
  treeRef.value!.filter(filterText.value);
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

const checkChange = (data: Record<string, any>, isChecked: boolean) => {
  if (isChecked) {
    treeRef.value!.setCheckedKeys([data.id]);
  }
};

const toMoveAgent = async () => {
  const selected = treeRef.value!.getCheckedNodes();
  if (selected.length > 0) {
    mittBus.emit("moveAgent", selected[0]);
  }
};
</script>

<style scoped lang="scss">
.filter-contain {
  min-height: 192px;
}
.agent-ip {
  font-size: 12px;
  color: #909399;
}
</style>
