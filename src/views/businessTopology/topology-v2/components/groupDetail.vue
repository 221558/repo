<template>
  <div class="detail-warp">
    <div class="detail-contain">
      <div class="detail-title">
        <p class="mb12">工作组</p>
        <el-link type="primary" @click="toClose">关闭</el-link>
      </div>
      <div class="detail pt12">
        <el-row align="middle">
          <el-col :span="12">
            <img src="@/assets/topology-img/agent-icon.png" width="80" alt="负载" class="legend-img" />
          </el-col>
          <el-col :span="12">
            <p class="agent-title">{{ topologyState.selectedDetail.show_name }}</p>
            <p class="agent-status">{{ topologyState.selectedDetail.name }}</p>
          </el-col>
        </el-row>
        <el-form ref="formRef" :model="formData" :rules="rules" label-width="90px" hide-required-asterisk>
          <el-form-item label="组内代理:">
            <span>{{ topologyState.selectedDetail.count }}</span>
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
                  v-for="(item, index) in options[editItem.optionsKey]"
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
                :disabled="!isRoutePermission('/assetManagement/group')"
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

          <el-form-item label="描述:">
            <p class="break-word">{{ topologyState.selectedDetail.description ?? "-" }}</p>
          </el-form-item>
          <el-form-item label="跳转:">
            <el-button
              type="primary"
              link
              v-if="topologyState.selectedDetail.name !== 'default'"
              :disabled="!isRoutePermission('/assetManagement/group/agents/:id')"
              @click="
                () => {
                  router.push({
                    path: `/assetManagement/group/agents/${topologyState.selectedDetail.name}`,
                    query: {
                      mode: topologyState.selectedDetail.mode
                    }
                  });
                }
              "
            >
              组内负载管理
            </el-button>
            <el-button
              type="primary"
              link
              :disabled="!isRoutePermission('/securityPolicy/policyGenerator')"
              @click="
                () => {
                  router.push({
                    path: `/securityPolicy/policyGenerator`,
                    query: {
                      auto: topologyState.selectedDetail.name
                    }
                  });
                }
              "
            >
              策略生成器
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

<script setup lang="ts" name="groupDetail">
import { ref, reactive, computed, nextTick, onMounted, watch } from "vue";
import mittBus from "@/utils/mittBus";
import { useRouter } from "vue-router";
import { isRoutePermission } from "@/utils";
import OrderDialog from "@/components/OrderDialog/index.vue";
import { OrderDialogProps } from "@/components/OrderDialog/interface";
import { addLabel } from "@/api/modules/assetManagement";
import { ElMessage } from "element-plus";
import { checkChineseLettertNumber } from "@/utils/eleValidate";
import { topologyState } from "../state";

const router = useRouter();
const formRef = ref();
const formData = ref<Record<string, any>>({
  name: "",
  show_name: "",
  loc: "",
  org: "",
  business: "",
  policy_status: "",
  description: ""
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
    key: "loc",
    label: "位置",
    showRender: () => topologyState.selectedDetail.loc_show_name,
    placeholder: "位置标签",
    optionsKey: "tagList1"
  },
  {
    key: "org",
    label: "组织",
    showRender: () => topologyState.selectedDetail.org_show_name,
    placeholder: "组织标签",
    optionsKey: "tagList2"
  },
  {
    key: "business",
    label: "业务",
    showRender: () => topologyState.selectedDetail.business_show_name,
    placeholder: "业务标签",
    optionsKey: "tagList3"
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
  log_object: "group",
  log_action: "update",
  params: {},
  unuse_params: ""
});

const options: Record<string, any> = computed(() => ({
  tagList1: topologyState.tagList1.slice(1),
  tagList2: topologyState.tagList2.slice(1),
  tagList3: topologyState.tagList3.slice(1),
  policyStatusOptions: topologyState.policyStatusOptions
}));

onMounted(() => {
  initData();
});

const initData = () => {
  formRef.value.clearValidate();
  editKey.value = "";
  formData.value = {
    name: topologyState.selectedDetail.name,
    show_name: topologyState.selectedDetail.show_name,
    loc: topologyState.selectedDetail.loc,
    org: topologyState.selectedDetail.org,
    business: topologyState.selectedDetail.business,
    policy_status: topologyState.selectedDetail.policy_status,
    description: topologyState.selectedDetail.description
  };
};

watch(() => topologyState.selectedDetail, initData);

const saveData = async () => {
  formRef.value.validate(async (valid: any) => {
    if (valid && formData.value[editKey.value] !== topologyState.selectedDetail[editKey.value]) {
      const params = {
        group_id: formData.value.name,
        showname: formData.value.show_name,
        labels_list: `${formData.value.loc},${formData.value.org},${formData.value.business}`,
        policy_status: formData.value.policy_status,
        description: formData.value.description
      };
      const unuse_params_item = {
        名称: topologyState.selectedDetail.name,
        显示名称: topologyState.selectedDetail.show_name,
        位置: topologyState.selectedDetail.loc_show_name,
        组织: topologyState.selectedDetail.org_show_name,
        业务: topologyState.selectedDetail.business_show_name,
        策略状态: topologyState.policyStatusTransform(topologyState.selectedDetail.policy_status),
        描述: topologyState.selectedDetail.description
      };
      orderProps.value = {
        task_type: "operate",
        log_object: "group",
        log_action: "update",
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
        label_type: addKey.value
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
          topologyState.getGroupLabelOptions();
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
    log_object: "group",
    log_action: "update",
    params: {},
    unuse_params: ""
  };
  if (!enable) {
    topologyState.isLoading = true;
    await topologyState.getInitGroupList();
    const selectedGroup = topologyState.groupList.find((k: Record<string, string>) => k.name === formData.value.name);
    if (selectedGroup) {
      topologyState.selectedDetail = selectedGroup;
    }
    await topologyState.getNodesOut();
    topologyState.isLoading = false;
    nextTick(() => {
      mittBus.emit("buildChartOut");
    });
  }
  initData();
};

const rules = reactive<Record<string, any>>({
  loc: [{ required: true, message: "请选择位置标签", trigger: "change" }],
  org: [{ required: true, message: "请选择组织标签", trigger: "change" }],
  business: [{ required: true, message: "请选择业务标签", trigger: "change" }],
  policy_status: [{ required: true, message: "请选择策略状态", trigger: "change" }]
});

const toClose = () => {
  topologyState.selectedDetail = {};
  topologyState.modalType = "";
};
</script>

<style scoped lang="scss">
.descript-warp {
  display: flex;
  span {
    flex-shrink: 0;
    line-height: 24px;
  }
  p {
    line-height: 24px;
    word-break: break-all;
  }
}
</style>
