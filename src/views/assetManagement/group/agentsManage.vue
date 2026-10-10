<template>
  <div class="card agentsManage">
    <div class="title mb10">
      <el-button link type="info" @click="toPrev">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="pl10">管理{{ currentGroup }}下工作负载</span>
    </div>
    <div class="transfer-warp">
      <div class="transfer-contain">
        <div class="transfer-title">
          <p>组外的工作负载</p>
        </div>
        <div class="transfer" v-loading="isLoading">
          <el-input
            v-model="filterTextOut"
            placeholder="过滤"
            class="mb10"
            v-debounce:input="filterDataOut"
            @clear="filterDataOut"
            clearable
          />
          <el-tree
            ref="treeOut"
            :data="treeOutAgent"
            show-checkbox
            node-key="id"
            @check-change="outCheckChange"
            :check-strictly="inSelected.length > 0"
            :props="{
              disabled: (data, node) =>
                (node.level !== 1 && inSelected.length > 0) || data.os === 'POD' || (node.level === 1 && data.mode === 'auto')
            }"
            :filter-node-method="filterNode"
          >
            <template #default="{ data }">
              <span v-if="data.children">{{ data.label }}</span>
              <el-tooltip v-else effect="dark" :content="data.label" :hide-after="0">
                <span
                  :class="{ label: true, add: data.class === 'add', del: data.class === 'del', change: data.class === 'change' }"
                >
                  {{ data.label }}
                </span>
              </el-tooltip>
            </template>
          </el-tree>
        </div>
      </div>
      <div class="pl30 pr30">
        <el-button
          type="primary"
          :icon="ArrowLeft"
          :disabled="inSelected.length === 0 || outSelected.length === 0"
          @click="handleChangeTree('toDel')"
        >
          移出工作负载
        </el-button>
        <el-button
          type="primary"
          :disabled="outSelected.length === 0 || (outSelected.length > 0 && inSelected.length > 0)"
          @click="handleChangeTree('toAdd')"
        >
          添加工作负载<el-icon class="el-icon--right"><ArrowRight /></el-icon>
        </el-button>
      </div>
      <div class="transfer-contain">
        <div class="transfer-title">
          <p>组内的工作负载</p>
        </div>
        <div class="transfer transfer-in" v-loading="isLoading">
          <el-input
            v-model="filterTextIn"
            placeholder="过滤"
            class="mb10"
            v-debounce:input="filterDataIn"
            @clear="filterDataOut"
            clearable
          />
          <el-tree
            ref="treeIn"
            :data="treeInAgent"
            show-checkbox
            node-key="id"
            @check-change="inCheckChange"
            :props="{
              disabled: data => (outSelected.length > 0 && inSelected.length === 0) || data.os === 'POD'
            }"
            :filter-node-method="filterNode"
          >
            <template #default="{ data }">
              <el-tooltip effect="dark" :content="data.label" :hide-after="0">
                <span :class="{ label: true, add: data.class === 'add', del: data.class === 'del' }">{{ data.label }}</span>
              </el-tooltip>
            </template>
          </el-tree>
        </div>
      </div>
    </div>
    <el-row class="pt20">
      <el-button type="primary" @click="toSave">应用修改</el-button>
    </el-row>
    <OrderDialog
      ref="orderDialog"
      :task_type="orderProps.task_type"
      :log_object="orderProps.log_object"
      :log_action="orderProps.log_action"
      :params="orderProps.params"
      :unuse_params="orderProps.unuse_params"
      @callback-fn="orderDialogCallback"
    />
  </div>
</template>

<script setup lang="ts" name="agentsManage">
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getGroupList, getAgentList, getGroupAgent, getTagList } from "@/api/modules/assets";
import type { TransferKey } from "element-plus";
import { ElTree } from "element-plus";
import { ArrowLeft } from "@element-plus/icons-vue";
import OrderDialog from "@/components/OrderDialog/index.vue";
import { OrderDialogProps } from "@/components/OrderDialog/interface";
import { groupState } from "./state";

const route = useRoute();
const router = useRouter();
const currentGroup = computed(() => groupList.value.find(group => group.name === route.params.id)?.show_name ?? route.params.id);
let taglist4 = reactive<Record<string, any>[]>([]);
let inGroupInit = reactive<TransferKey[]>([]);

const treeOut = ref<InstanceType<typeof ElTree>>();
const treeIn = ref<InstanceType<typeof ElTree>>();
let groupList = ref<Record<string, any>[]>([]);
let treeOutAgent = ref<any>([]);
let treeInAgent = ref<Record<string, any>[]>([]);
let outSelected = ref<Record<string, any>[]>([]);
let inSelected = ref<Record<string, any>[]>([]);

let isLoading = ref<boolean>(false);

const orderDialog = ref();
let orderProps = ref<OrderDialogProps>({
  task_type: "operate",
  log_object: "group",
  log_action: "group_agent",
  params: {},
  unuse_params: ""
});

const outCheckChange = (data: Record<string, any>, isChecked: boolean) => {
  if (inSelected.value.length > 0) {
    // 选中移出分组
    if (isChecked) {
      treeOut.value!.setCheckedKeys([data.id]);
    }
    outSelected.value = treeOut.value!.getCheckedNodes(false);
  } else {
    // 选择移入负载
    outSelected.value = treeOut.value!.getCheckedNodes(true).filter(k => !k.children);
  }
};
const inCheckChange = () => {
  inSelected.value = treeIn.value!.getCheckedNodes(true);
  if (inSelected.value.length === 0) {
    outSelected.value = [];
    treeOut.value!.setCheckedNodes([]);
  }
};

const tag_show = (id: string) => taglist4.find(tag => tag.id == id)?.label ?? "-";
const policy_status_show = (id: string) =>
  groupState.policyStatusOptions.find((status: Record<string, any>) => status.id == id)?.label ?? "-";

onMounted(async () => {
  await getInitList();
});

const getInitList = async () => {
  isLoading.value = true;
  try {
    const groups = await getGroupList({ limit: 0 });
    groupList.value = ((groups || {}).data || {}).affected_items;
  } catch (error) {
    console.log(`分组列表错误: ${error}`);
  }

  try {
    const tagItems = await getTagList({ label_type: "component" });
    const tagList = ((tagItems || {}).data || {}).affected_items.map(k => ({
      id: k.id,
      label: k.show_name
    }));
    taglist4 = tagList;
  } catch (error) {
    console.log(`组件标签列表错误: ${error}`);
  }

  try {
    const listRes = await getAgentList({
      limit: 0,
      q: `id!=000;daemonset_id!=0`,
      select: "id,name,ip,tag,group,os.name,policy_status"
    });
    const list = ((listRes || {}).data || {}).affected_items;
    treeOutAgent.value = groupList.value
      .filter(group => group.name !== route.params.id)
      .map(group => {
        const children = list
          .filter(agent => agent.group && agent.group[0] === group.name)
          .map(k => ({
            id: k.id,
            label: `${k.id} - ${k.name} ( IP: ${k.ip}${
              k.tag ? `, 组件标签: ${tag_show(k.tag)}` : ""
            }, 策略状态: ${policy_status_show(k.policy_status)} )`,
            filterLabel: {
              id: k.id,
              name: k.name,
              ip: k.ip,
              tag: k.tag ? tag_show(k.tag) : "",
              policy_status: policy_status_show(k.policy_status)
            },
            os: k.os?.name,
            group: group.name
          }));
        return {
          id: group.name,
          label: group.show_name ?? group.name,
          filterLabel: {
            name: group.show_name ?? group.name
          },
          mode: group.mode,
          children
        };
      });
  } catch (error) {
    console.log(`组外代理列表错误: ${error}`);
  }

  try {
    const listRes = await getGroupAgent({
      urlId: route.params.id,
      params: { limit: 0, q: `id!=000;daemonset_id!=0`, select: "id,name,ip,tag,os.name,policy_status" }
    });
    const list = ((listRes || {}).data || {}).affected_items;
    inGroupInit = list.map(k => k.id);
    treeInAgent.value = list.map(k => ({
      id: k.id,
      label: `${k.id} - ${k.name} ( IP: ${k.ip}${k.tag ? `, 组件标签: ${tag_show(k.tag)}` : ""}, 策略状态: ${policy_status_show(
        k.policy_status
      )} )`,
      filterLabel: {
        id: k.id,
        name: k.name,
        ip: k.ip,
        tag: k.tag ? tag_show(k.tag) : "",
        policy_status: policy_status_show(k.policy_status)
      },
      os: k.os?.name
    }));
  } catch (error) {
    console.log(`组内代理列表错误: ${error}`);
  }
  isLoading.value = false;
};

const filterTextOut = ref("");
const filterTextIn = ref("");
const filterDataOut = () => {
  treeOut.value && treeOut.value.filter(filterTextOut.value);
};
const filterDataIn = () => {
  treeIn.value && treeIn.value.filter(filterTextIn.value);
};
const filterNode = (value: string, data: Record<string, any>) => {
  if (!value) return true;

  try {
    const labels = Object.values(JSON.parse(data.filterLabel));
    const filterArr = labels.filter((label: any) => label.includes(value));
    return filterArr.length > 0;
  } catch (error) {
    return data.label.includes(value);
  }
};

const handleChangeTree = (type: string) => {
  if (type === "toAdd") {
    // 添加工作负载
    outSelected.value.forEach((selected: Record<string, any>) => {
      if (inGroupInit.indexOf(selected.id) === -1) {
        selected.class = "add";
      } else {
        selected.class = "";
      }
      const groupNode = treeOutAgent.value.find((node: Record<string, any>) => node.id === selected.group);
      groupNode?.children.splice(
        groupNode.children.findIndex((k: Record<string, any>) => k.id === selected.id),
        1
      );
    });
    treeInAgent.value = treeInAgent.value.concat(outSelected.value);
  } else {
    // 移除工作负载
    const group = outSelected.value[0].id;
    inSelected.value.forEach((selected: Record<string, any>) => {
      if (inGroupInit.indexOf(selected.id) !== -1) {
        selected.class = "del";
      } else if (selected.group !== group) {
        selected.class = "change";
      } else {
        selected.class = "";
      }
      selected.group = group;
      treeInAgent.value.splice(
        treeInAgent.value.findIndex((k: Record<string, any>) => k.id === selected.id),
        1
      );

      const groupNode = treeOutAgent.value.find((node: Record<string, any>) => node.id === selected.group);
      groupNode.children.push(selected);
    });
  }
  outSelected.value = [];
  inSelected.value = [];
  treeOut.value!.setCheckedKeys([]);
  treeIn.value!.setCheckedKeys([]);
};

const toSave = async () => {
  const addArr = treeInAgent.value
    .filter((agent: Record<string, any>) => agent.class === "add")
    .map((agent: Record<string, any>) => ({
      agents_id: agent.id,
      agents_info: agent.label
    }));
  let delArr: Record<string, any> = {};
  treeOutAgent.value.forEach((groupNode: Record<string, any>) => {
    const delChildren = groupNode.children
      .filter((agent: Record<string, any>) => agent.class === "del" || agent.class === "change")
      .map((agent: Record<string, any>) => ({
        agents_id: agent.id,
        agents_info: agent.label
      }));
    if (delChildren.length > 0) delArr[groupNode.id] = delChildren;
  });

  let unuse_params_arr = [],
    paramsArr = [];
  if (addArr.length > 0) {
    paramsArr.push({
      group_id: route.params.id,
      agents_list: addArr.map((agent: Record<string, any>) => agent.agents_id).join(",")
    });

    const groupItem = groupList.value.find(group => group.name === route.params.id);
    unuse_params_arr.push({
      移入工作组: `${groupItem?.show_name ?? "-"} ( 位置: ${groupItem?.loc_show_name ?? "-"}, 组织: ${
        groupItem?.org_show_name ?? "-"
      }, 业务: ${groupItem?.business_show_name ?? "-"} )`,
      移入负载: addArr.map((agent: Record<string, any>) => agent.agents_info).join("、")
    });
  }
  Object.keys(delArr).forEach(async group_id => {
    paramsArr.push({ group_id, agents_list: delArr[group_id].map((agent: Record<string, any>) => agent.agents_id).join(",") });

    const groupItem = groupList.value.find(group => group.name === group_id);
    unuse_params_arr.push({
      移入工作组: `${groupItem?.show_name ?? "-"} ( 位置: ${groupItem?.loc_show_name ?? "-"}, 组织: ${
        groupItem?.org_show_name ?? "-"
      }, 业务: ${groupItem?.business_show_name ?? "-"} )`,
      移入负载: delArr[group_id].map((agent: Record<string, any>) => agent.agents_info).join("、")
    });
  });

  orderProps.value = {
    task_type: "operate",
    log_object: "group",
    log_action: "group_agent",
    params: {
      paramsArr
    },
    unuse_params: JSON.stringify(unuse_params_arr)
  };
  orderDialog.value?.judgeSwitch();
};

const orderDialogCallback = () => {
  orderProps.value = {
    task_type: "operate",
    log_object: "group",
    log_action: "group_agent",
    params: {},
    unuse_params: ""
  };
  toPrev();
};

const toPrev = () => {
  router.push(`/assetManagement/group/agents/${route.params.id}`);
};
</script>

<style scoped lang="scss">
.title {
  height: 30px;
  border-bottom: 1px solid #dcdfe6;
}
.transfer-warp {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 540px;
  .transfer-contain {
    flex-grow: 1;
    width: 200px;
    height: 100%;
  }
  .transfer-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 40px;
    padding: 0 15px;
    font-size: 16px;
    color: #303133;
    background: #f5f7fa;
    border: 1px solid #ebeef5;
    border-radius: 4px 4px 0 0;
    span {
      font-size: 12px;
      font-weight: 400;
      color: #909399;
    }
  }
  .transfer {
    height: 470px;
    padding: 15px;
    overflow: auto;
    border: 1px solid #ebeef5;
    border-top: none;
    border-radius: 0 0 4px 4px;
    .label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .add {
      background-color: #c6ffc6;
    }
    .del {
      background-color: #ffe7e7;
    }
    .change {
      background-color: #fff28f;
    }
  }
}
</style>
<style lang="scss">
.agentsManage .transfer-in {
  .el-tree-node__expand-icon.is-leaf {
    display: none;
  }
}
</style>
