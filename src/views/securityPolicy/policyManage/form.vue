<template>
  <div class="card add-form">
    <div class="title mb10">
      <el-button link type="info" @click="toPrev">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="pl10">{{ `${subFlag === 0 ? "新增" : "编辑"}策略` }}</span>
    </div>
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="140px">
      <el-form-item label="策略名称:" prop="pktpolicy_name">
        <el-input v-model="formData.pktpolicy_name" placeholder="输入策略名称" :disabled="subFlag === 1" />
        <span class="label_desc">指定唯一的名称。一旦创建成功，就不能编辑该名称</span>
      </el-form-item>
      <el-form-item label="策略类型:" prop="pktpolicy_type">
        <el-select v-model="formData.pktpolicy_type" placeholder="选择策略类型" style="width: 300px" :disabled="subFlag === 1">
          <el-option
            v-for="(option, index) in policyManageState.policyOptions"
            :key="`policyOptions_${index}`"
            :label="option.label"
            :value="option.id"
          />
        </el-select>
        <span class="label_desc">黑名单策略中配置的规则均为不合规访问。策略生效优先级先黑后白。创建策略后不可修改策略类型。</span>
      </el-form-item>
      <el-form-item
        v-for="(editItem, editIndex) in editeArr"
        :key="`form_item_${editIndex}`"
        :label="`${editItem.label}:`"
        :prop="editItem.key"
      >
        <el-select
          v-model="formData[editItem.key]"
          :placeholder="`选择${editItem.placeholder}`"
          style="width: 300px"
          @visible-change="
            () => {
              addKey = '';
              formAddData.addValue = '';
            }
          "
        >
          <el-option
            v-for="(item, index) in policyManageState[editItem.optionsKey]"
            :key="`${editItem.optionsKey}_${index}`"
            :label="item.label"
            :value="item.id"
          />
          <template #footer>
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
      </el-form-item>
      <!-- <el-form-item label="位置:" prop="pktpolicy_loc">
        <el-select v-model="formData.pktpolicy_loc" placeholder="选择位置标签" style="width: 300px">
          <el-option
            v-for="(option, index) in policyManageState.tagList1"
            :key="`tagList1_${index}`"
            :label="option.label"
            :value="option.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="组织:" prop="pktpolicy_org">
        <el-select v-model="formData.pktpolicy_org" placeholder="选择组织标签" style="width: 300px">
          <el-option
            v-for="(option, index) in policyManageState.tagList2"
            :key="`tagList2_${index}`"
            :label="option.label"
            :value="option.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="业务:" prop="pktpolicy_bus">
        <el-select v-model="formData.pktpolicy_bus" placeholder="选择业务标签" style="width: 300px">
          <el-option
            v-for="(option, index) in policyManageState.tagList3"
            :key="`tagList3_${index}`"
            :label="option.label"
            :value="option.id"
          />
        </el-select>
      </el-form-item> -->
      <el-form-item label="描述:" prop="pktpolicy_info">
        <el-input v-model="formData.pktpolicy_info" type="textarea" placeholder="输入描述" :rows="4" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit"> 保存 </el-button>
        <el-button plain @click="clear"> 清空 </el-button>
      </el-form-item>
    </el-form>
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

<script setup lang="ts" name="basicForm">
import { ArrowLeft } from "@element-plus/icons-vue";
import { onMounted, ref, reactive, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { addLabel } from "@/api/modules/assetManagement";
import { getTagList } from "@/api/modules/assets";
import { ElMessage } from "element-plus";
import { addPolicy } from "@/api/modules/policyManage";
import { localGet, localRemove, isRoutePermission } from "@/utils";
import { policyManageState } from "./state";
import OrderDialog from "@/components/OrderDialog/index.vue";
import { OrderDialogProps } from "@/components/OrderDialog/interface";
import { checkChineseLettertNumber } from "@/utils/eleValidate";

const formRef = ref();
const router = useRouter();
const route = useRoute();
let formData = ref<Record<string, any>>({
  pktpolicy_name: "",
  pktpolicy_type: "",
  pktpolicy_loc: "",
  pktpolicy_org: "",
  pktpolicy_bus: "",
  domain: ""
});
const rules = reactive<Record<string, any>>({
  pktpolicy_name: [{ required: true, message: "请输入策略名称", trigger: "blur" }],
  pktpolicy_type: [{ required: true, message: "请选择策略类型", trigger: "change" }],
  pktpolicy_loc: [{ required: true, message: "请选择位置标签", trigger: "change" }],
  pktpolicy_org: [{ required: true, message: "请选择组织标签", trigger: "change" }],
  pktpolicy_bus: [{ required: true, message: "请选择业务标签", trigger: "change" }],
  pktpolicy_info: [{ required: true, message: "请输入描述", trigger: "blur" }]
});
const editeArr = reactive<Record<string, any>[]>([
  {
    key: "pktpolicy_loc",
    label: "位置",
    placeholder: "位置标签",
    optionsKey: "tagList1"
  },
  {
    key: "pktpolicy_org",
    label: "组织",
    placeholder: "组织标签",
    optionsKey: "tagList2"
  },
  {
    key: "pktpolicy_bus",
    label: "业务",
    placeholder: "业务标签",
    optionsKey: "tagList3"
  }
]);
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
const subFlag = ref(0); // 0为添加 1为修改
const orderDialog = ref();
let orderProps = ref<OrderDialogProps>({
  task_type: "operate",
  log_object: "policy",
  log_action: "update",
  params: {},
  unuse_params: ""
});

const saveLabel = async () => {
  formAddRef.value[0].validate(async (valid: any) => {
    if (valid) {
      let label_type = "";
      switch (addKey.value) {
        case "pktpolicy_loc":
          label_type = "loc";
          break;
        case "pktpolicy_org":
          label_type = "org";
          break;
        case "pktpolicy_bus":
          label_type = "business";
          break;
      }
      let addParams = {
        showname_list: formAddData.value.addValue,
        label_type
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

          const tagItems = await getTagList({ label_type });
          let tagList = ((tagItems || {}).data || {}).affected_items.map(k => ({
            id: k.id,
            label: k.show_name,
            type: label_type
          }));
          const editItem = editeArr.find((item: Record<string, any>) => item.key === addKey.value);
          tagList.unshift({
            id: `no_${label_type}`,
            label: `不限${editItem?.label}`,
            type: label_type
          });
          policyManageState[editItem?.optionsKey] = tagList;
        }
      } catch (error) {
        console.log(`新增标签错误: ${error}`);
      }
    } else {
      return false;
    }
  });
};

const onSubmit = () => {
  formRef.value.validate(async (valid: any) => {
    if (valid) {
      let res: any;
      let { pktpolicy_name, pktpolicy_type, pktpolicy_info, pktpolicy_loc, pktpolicy_org, pktpolicy_bus } = formData.value;
      let params = {
        pktpolicy_name,
        pktpolicy_type,
        pktpolicy_loc: pktpolicy_loc === "no_loc" ? 0 : pktpolicy_loc,
        pktpolicy_org: pktpolicy_org === "no_org" ? 0 : pktpolicy_org,
        pktpolicy_bus: pktpolicy_bus === "no_business" ? 0 : pktpolicy_bus,
        pktpolicy_info
      };
      if (subFlag.value === 0) {
        try {
          res = await addPolicy(params);
        } catch (error) {
          console.log(`新增策略错误: ${error}`);
        }
        if (res.message.includes("failed")) {
          ElMessage({
            message: "策略保存失败: 该策略名称已存在",
            type: "error"
          });
        } else {
          ElMessage({
            message: "保存成功",
            type: "success"
          });
          toPrev();
        }
      } else {
        const selectedItem = localGet("policyManage-edit");
        const unuse_params_item = {
          策略名: selectedItem.name,
          策略类型: selectedItem.type_label,
          位置: selectedItem.logc_label,
          组织: selectedItem.org_label,
          业务: selectedItem.bus_label,
          描述: selectedItem.info
        };
        orderProps.value = {
          task_type: "operate",
          log_object: "policy",
          log_action: "update",
          params,
          unuse_params: JSON.stringify([unuse_params_item])
        };
        orderDialog.value?.judgeSwitch();
      }
    } else {
      return false;
    }
  });
};
const orderDialogCallback = () => {
  orderProps.value = {
    task_type: "operate",
    log_object: "policy",
    log_action: "update",
    params: {},
    unuse_params: ""
  };
  toPrev();
};
const clear = () => {
  formRef.value.resetFields();
  if (subFlag.value === 1) {
    const selectedItem = localGet("policyManage-edit");
    formData.value.pktpolicy_name = selectedItem.name;
    formData.value.pktpolicy_type = selectedItem.type;
  }
};
const toPrev = () => {
  router.push(`/securityPolicy/policyManage`);
};
onMounted(async () => {
  subFlag.value = route.params.id ? 1 : 0;
  if (subFlag.value) {
    // 编辑页面
    const selectedItem = localGet("policyManage-edit");
    formData.value = {
      pktpolicy_name: selectedItem.name,
      pktpolicy_type: selectedItem.type,
      pktpolicy_loc: selectedItem.loc == "0" ? "no_loc" : selectedItem.loc,
      pktpolicy_org: selectedItem.org == "0" ? "no_org" : selectedItem.org,
      pktpolicy_bus: selectedItem.bus == "0" ? "no_business" : selectedItem.bus,
      pktpolicy_info: selectedItem.info
    };
  }
});

onUnmounted(() => {
  localRemove("policyManage-edit");
});
</script>

<style scoped lang="scss">
.add-form {
  .title {
    height: 30px;
    border-bottom: 1px solid #dcdfe6;
  }
  .el-input,
  .el-textarea {
    width: 300px !important;
  }
  .label_desc {
    padding-left: 5px;
    font-size: 12px;
    color: #9ea7b4;
  }
}
</style>
