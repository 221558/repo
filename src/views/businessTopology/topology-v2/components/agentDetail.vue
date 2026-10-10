<template>
  <div class="detail-warp" v-loading="isLoading">
    <div class="detail-contain">
      <div class="detail-title">
        <p class="mb12">工作负载</p>
        <el-link type="primary" @click="toClose">关闭</el-link>
      </div>
      <div class="detail pt12">
        <el-row align="middle">
          <el-col :span="12">
            <img src="@/assets/topology-img/agent-icon.png" width="80" alt="负载" class="legend-img" />
          </el-col>
          <el-col :span="12">
            <p class="agent-title">{{ state.agentData.name }}</p>
            <p class="agent-status">{{ `${statusText[state.agentData.status] ?? "-"} ${state.agentData.ip ?? "-"}` }}</p>
          </el-col>
        </el-row>
        <p>服务 ({{ state.serviceData.length }})</p>
        <el-table :data="state.serviceData" max-height="200" scrollbar-always-on>
          <el-table-column v-for="(column, index) in columns" :key="`service_${index}`" :prop="column.field" :label="column.name">
            <template #default="scope">
              <component :is="column.render" v-bind="scope.row" v-if="column.render" />
              <span v-else>{{ scope.row[column.field] ?? "-" }}</span>
            </template>
          </el-table-column>
        </el-table>
        <el-row align="middle" justify="space-between">
          <el-col v-for="(usage, index) in usageList" :key="`usage_${index}`" :span="usage.span" class="mt15">
            <div class="detail-tag">
              <el-icon color="#0087FF" size="32" class="mr20">
                <component :is="usage.icon" />
              </el-icon>
              <div>
                <p>{{ usage.title }}</p>
                <p class="usage-detail">{{ state.agentData[usage.field] }}</p>
              </div>
            </div>
          </el-col>
        </el-row>
        <el-form ref="formRef" :model="formData" :rules="rules" label-width="90px" hide-required-asterisk class="mt10">
          <el-form-item label="工作环境:">
            <span>
              <el-tag class="ml8">{{ state.agentData.tagList?.loc }}</el-tag>
              <el-tag class="ml8" type="success">{{ state.agentData.tagList?.org }}</el-tag>
              <el-tag class="ml8" type="warning">{{ state.agentData.tagList?.business }}</el-tag>
            </span>
          </el-form-item>

          <el-form-item
            v-for="(editItem, editIndex) in editeArr"
            :key="`form_item_${editIndex}`"
            :label="`${editItem.label}:`"
            :prop="editItem.key"
          >
            <div v-if="editKey === editItem.key" class="flx-justify-between" style="width: 100%">
              <el-select v-model="formData[editItem.key]" :placeholder="`选择${editItem.placeholder}`" style="width: 200px">
                <el-option
                  v-for="(item, index) in topologyState[editItem.optionsKey]"
                  :key="`${editItem.optionsKey}_${index}`"
                  :label="item.label"
                  :value="item.id"
                />
                <template #footer v-if="editItem.key !== 'policy_status'">
                  <el-button
                    v-if="addKey !== editItem.key"
                    text
                    bg
                    size="small"
                    :disabled="!isRoutePermission('/assetManagement/label')"
                    @click="
                      () => {
                        addKey = editItem.key;
                      }
                    "
                  >
                    新增
                  </el-button>
                  <template v-else>
                    <el-form ref="formAddRef" :model="formAddData" :rules="rulesAdd">
                      <el-form-item label="显示名称:" class="el-form-item--small" prop="addValue">
                        <el-input v-model="formAddData.addValue" size="small" />
                      </el-form-item>
                    </el-form>

                    <el-button type="primary" size="small" @click="saveLabel">保存</el-button>
                    <el-button
                      size="small"
                      @click="
                        () => {
                          addKey = '';
                          formAddData.addValue = '';
                        }
                      "
                    >
                      取消
                    </el-button>
                  </template>
                </template>
              </el-select>
              <div>
                <el-button icon="Close" size="small" class="pl5 pr5" @click="initData" />
                <el-button icon="Check" size="small" class="pl5 pr5" @click="saveData" />
              </div>
            </div>
            <div v-else class="flx-justify-between" style="width: 100%">
              <component :is="editItem.showRender" v-if="editItem.showRender" />
              <span v-else>{{ topologyState.selectedDetail[editItem.key] ?? "-" }}</span>
              <el-button
                type="primary"
                icon="Edit"
                size="small"
                class="pl5 pr5"
                v-if="topologyState.selectedDetail.name !== 'default'"
                :disabled="!isRoutePermission('/assetManagement/agent')"
                @click="
                  () => {
                    formRef.clearValidate();
                    addKey = '';
                    formAddData.addValue = '';
                    editKey = editItem.key;
                  }
                "
              />
            </div>
          </el-form-item>

          <el-form-item label="跳转:">
            <el-button type="primary" link :disabled="!isRoutePermission('/assetManagement/agent/detail')" @click="toDetail">
              工作负载详情
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
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

<script setup lang="ts" name="agentDetail">
import { ref, reactive, onMounted, watch, nextTick } from "vue";
import mittBus from "@/utils/mittBus";
import { localSet, isRoutePermission } from "@/utils";
import { useRouter } from "vue-router";
import OrderDialog from "@/components/OrderDialog/index.vue";
import { OrderDialogProps } from "@/components/OrderDialog/interface";
import { addLabel } from "@/api/modules/assetManagement";
import { ElMessage } from "element-plus";
import { topologyState } from "../state";
import { getAgentTag, getAgentService } from "@/api/modules/topology";
import { getUsage, getTagList } from "@/api/modules/assets";
import { getAgentList } from "@/api/modules/assets";
import { checkChineseLettertNumber } from "@/utils/eleValidate";

const router = useRouter();
const state = reactive<Record<string, any>>({
  agentData: {},
  serviceData: []
});

const statusText = ref<Record<string, any>>({
  active: "已连接",
  disconnected: "未连接",
  never_connected: "从未连接",
  pending: "挂起"
});

const columns = ref<Record<string, any>[]>([
  {
    name: "地址",
    render: (item: Record<string, any>) => `${item["local.ip"] ?? "未知"}`
  },
  {
    name: "协议/端口",
    render: (item: Record<string, any>) => `${item.protocol ?? "未知"}/${item["local.port"] ?? "未知"}`
  }
]);

const usageList = ref<Record<string, any>[]>([
  { title: "CPU", field: "cpu", icon: "Briefcase", span: 6 },
  { title: "内存", field: "mem", icon: "Platform", span: 6 },
  { title: "硬盘", field: "disk", icon: "WalletFilled", span: 6 },
  { title: "网络", field: "net", icon: "Promotion", span: 24 }
]);

const isLoading = ref<boolean>(false);

const formRef = ref();
const formData = ref<Record<string, any>>({
  tag: "",
  policy_status: ""
});
const editKey = ref<string>(""); // 编辑属性的key
const addKey = ref<string>(""); // 下拉框新增标签的key
const formAddRef = ref();
const formAddData = ref<Record<string, any>>({
  addValue: ""
});
const rulesAdd = reactive<Record<string, any>>({
  addValue: [
    { required: true, message: "请输入显示名称", trigger: "blur" },
    { validator: checkChineseLettertNumber, trigger: "blur" }
  ]
});

const editeArr = reactive<Record<string, any>[]>([
  {
    key: "tag",
    label: "组件",
    showRender: () => state.agentData.tagList?.component,
    placeholder: "组件标签",
    optionsKey: "tagList4"
  },
  {
    key: "policy_status",
    label: "策略状态",
    showRender: () => topologyState.policyStatusTransform(topologyState.selectedDetail.policy_status),
    placeholder: "策略状态",
    optionsKey: "policyStatusOptions"
  }
]);

const orderDialog = ref();
let orderProps = ref<OrderDialogProps>({
  task_type: "operate",
  log_object: "agent_info",
  log_action: "",
  params: {},
  unuse_params: ""
});

const initData = () => {
  formRef.value.clearValidate();
  editKey.value = "";
  formData.value = {
    tag: topologyState.selectedDetail.tag,
    policy_status: topologyState.selectedDetail.policy_status
  };
};

watch(() => topologyState.selectedDetail, initData);

const saveData = async () => {
  formRef.value.validate(async (valid: any) => {
    if (valid && formData.value[editKey.value] !== topologyState.selectedDetail[editKey.value]) {
      let params: Record<string, string> = {
        agents_list: state.agentData.id
      };
      if (editKey.value === "tag") {
        params.agent_tag = formData.value.tag;
      } else {
        params.policy_status = formData.value.policy_status;
      }
      const unuse_params_item = {
        主机ID: state.agentData.id,
        主机IP: state.agentData.ip,
        主机名: state.agentData.name,
        工作组: state.agentData.group_show
      };
      orderProps.value = {
        task_type: "operate",
        log_object: "agent_info",
        log_action: editKey.value === "tag" ? "agent_tag" : "agent_policy",
        params,
        unuse_params: JSON.stringify([unuse_params_item])
      };
      orderDialog.value?.judgeSwitch();
    } else if (valid) {
      initData();
    } else {
      return false;
    }
  });
};

const saveLabel = async () => {
  formAddRef.value[0].validate(async (valid: any) => {
    if (valid) {
      let addParams = {
        showname_list: formAddData.value.addValue,
        label_type: "component"
      };
      try {
        const res: any = await addLabel(addParams);
        if (res.message.includes("failed")) {
          ElMessage({
            message: "标签保存失败: 显示名称不可重复",
            type: "error"
          });
        } else {
          ElMessage({
            message: "保存成功",
            type: "success"
          });
          formAddData.value.addValue = "";
          const res = await getTagList({ label_type: "component" });
          const tagList4 = ((res || {}).data || {}).affected_items.map((k: Record<string, any>) => ({
            id: String(k.id),
            label: k.show_name
          }));
          topologyState.tagList4 = tagList4;
        }
      } catch (error) {
        console.log(`新增标签错误: ${error}`);
      }
    } else {
      return false;
    }
  });
};

const orderDialogCallback = async (enable: boolean) => {
  orderProps.value = {
    task_type: "operate",
    log_object: "agent_info",
    log_action: "",
    params: {},
    unuse_params: ""
  };
  if (!enable) {
    topologyState.isLoading = true;
    const rawAgents = await getAgentList({ q: `ip=${topologyState.selectedDetail.ip}` });
    const selectedAgent = ((rawAgents || {}).data || {} || {}).affected_items[0];
    if (selectedAgent) {
      topologyState.selectedDetail = selectedAgent;
    }

    topologyState.agentList = [];
    topologyState.nodesIn = [
      {
        id: `address`,
        type: "image",
        label: "地址表",
        size: 30,
        style: {
          cursor: "default",
          img: `/topology-img/address.png`
        }
      },
      {
        id: `groupListNode`,
        label: "",
        group: topologyState.selectGroupIn ? topologyState.selectGroupIn.show_name : "其他工作组",
        anchorPoints: [
          // 连线接入点
          [0.5, 0],
          [1, 0.5],
          [0.5, 1],
          [0, 0.5]
        ]
      },
      {
        id: `internet`,
        type: "image",
        label: "外网",
        size: 30,
        style: {
          cursor: "default",
          img: `/topology-img/internet.png`
        }
      }
    ];
    const getNodes = topologyState.combosIn.map((combo: Record<string, any>) => topologyState.getNodesIn(combo.id));
    Promise.all([...getNodes])
      .then(() => {
        topologyState.isLoading = false;
        nextTick(() => {
          mittBus.emit("buildChartIn");
        });
      })
      .catch(error => {
        console.log(error);
      });
  }
  initData();
};

const rules = reactive<Record<string, any>>({
  tag: [{ required: true, message: "请选择组件标签", trigger: "change" }],
  policy_status: [{ required: true, message: "请选择策略状态", trigger: "change" }]
});

const toClose = () => {
  topologyState.selectedDetail = {};
  topologyState.modalType = "";
};

const toDetail = () => {
  localSet("agent-detail", { ...topologyState.selectedDetail, tag_show: state.agentData.tagList?.component });
  router.push({
    path: `/assetManagement/agent/detail`
  });
};

const getAgentData = async () => {
  let usageData: Record<string, string> = {};
  let tagList: Record<string, string> = {
    loc: "无",
    org: "无",
    business: "无",
    component: "无"
  };

  try {
    const usageItems = await getUsage({ id: topologyState.selectedDetail.id, node_name: topologyState.selectedDetail.node_name });
    usageData = (usageItems || {}).data || {};
  } catch (error) {
    console.log(error);
  }

  try {
    const tagItems = await getAgentTag(topologyState.selectedDetail.id);
    ((tagItems || {}).data || {}).affected_items?.forEach(k => {
      tagList[k.type] = k.show_name;
    });
  } catch (error) {
    console.log(error);
  }

  const group_show =
    topologyState.groupList.find((group: Record<string, any>) => group.name === topologyState.selectedDetail.group[0])
      ?.show_name ?? "无";

  state.agentData = {
    cpu: usageData.cpu,
    disk: usageData.disk,
    mem: usageData.mem,
    net: usageData.net,
    netbor: usageData.netbor,
    tagList,
    group_show,
    ...topologyState.selectedDetail
  };
};

const getServiceData = async () => {
  try {
    const rawItems = await getAgentService(topologyState.selectedDetail.id);
    state.serviceData = ((rawItems || {}).data || {}).affected_items.map((item: Record<string, any>) => ({
      "local.ip": item.local?.ip,
      protocol: item.protocol,
      "local.port": item.local?.port
    }));
  } catch (error) {
    console.log(error);
  }
};

watch(
  () => [topologyState.selectedDetail, topologyState.modalType],
  async () => {
    if (topologyState.modalType === "agent") {
      sarchData();
    }
  }
);

onMounted(() => {
  initData();
  sarchData();
});

const sarchData = async () => {
  isLoading.value = true;
  await getAgentData();
  await getServiceData();
  isLoading.value = false;
};
</script>
