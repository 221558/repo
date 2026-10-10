<template>
  <div>
    <el-dialog
      :model-value="dialogVisible"
      :title="props.dialogType === 'add' ? '新增规则' : '编辑规则'"
      style="width: 550px"
      :close-on-press-escape="false"
      :close-on-click-modal="false"
      @closed="toClose"
    >
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="范围:" prop="pktrule_area">
          <el-select v-model="formData.pktrule_area" placeholder="选择范围" style="width: 100%" @change="changeInit">
            <el-option
              v-for="(item, index) in policyManageState.scopeOptions"
              :key="`scopeOptions_${index}`"
              :label="item.label"
              :value="item.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="流量方向:" prop="pktrule_direction">
          <el-select
            v-model="formData.pktrule_direction"
            placeholder="选择流量方向"
            style="width: 100%"
            @change="change_pktrule_direction"
          >
            <el-option
              v-for="(item, index) in policyManageState.directionOptions"
              :key="`directionOptions_${index}`"
              :label="item.label"
              :value="item.id"
            ></el-option>
          </el-select>
        </el-form-item>

        <div v-if="formData['pktrule_area'] && formData['pktrule_direction']">
          <el-form-item label="服务者类型:" prop="serto_type">
            <!-- 入方向流量，服务者类型只能为组件，不可修改 -->
            <el-select
              v-model="formData.serto_type"
              placeholder="选择服务者类型"
              style="width: 100%"
              :disabled="formData['pktrule_direction'] === 'in'"
              @change="(val: string) => change_type(val, 'provider')"
            >
              <el-option
                v-for="(item, index) in policyManageState.typeOptions"
                :key="`providerTypeOptions_${index}`"
                :label="item.label"
                :value="item.id"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item
            label="服务者范围:"
            prop="provider_area"
            v-if="
              formData['pktrule_area'] === 'out' && formData['pktrule_direction'] === 'out' && formData['serto_type'] === 'tag'
            "
          >
            <!-- 组外，出方向流量，组件类型服务者，出现服务者范围 -->
            <el-select
              v-model="formData.provider_area"
              multiple
              filterable
              placeholder="选择服务者范围"
              value-key="id"
              style="width: 100%"
              @change="(val: Record<string, any>[]) => onChangeArea(val, 'provider')"
              @visible-change="
                () => {
                  addKey = '';
                  formLabelRef?.resetFields();
                }
              "
            >
              <el-option-group
                v-for="(options, index) in areaOptions"
                :key="`providerAreaGroupOptions_${index}`"
                :label="options.label"
              >
                <el-option
                  v-for="(item, i) in policyManageState[options.optionsField]"
                  :key="`providerAreaOptions_${i}`"
                  :label="item.label"
                  :value="item"
                />
              </el-option-group>
              <template #footer>
                <el-button
                  v-if="addKey !== 'provider_area'"
                  text
                  bg
                  size="small"
                  :disabled="!isRoutePermission('/assetManagement/label')"
                  @click="
                    () => {
                      addKey = 'provider_area';
                    }
                  "
                >
                  新增
                </el-button>
                <template v-else>
                  <el-form ref="formLabelRef" :model="formAddLabel" :rules="rulesLabel" label-width="80px">
                    <el-form-item label="标签类型:" class="el-form-item--small" prop="label_type">
                      <el-radio-group v-model="formAddLabel.label_type" size="small">
                        <el-radio label="loc">位置</el-radio>
                        <el-radio label="org">组织</el-radio>
                        <el-radio label="business">业务</el-radio>
                      </el-radio-group>
                    </el-form-item>
                    <el-form-item label="显示名称:" class="el-form-item--small" prop="show_name">
                      <el-input v-model="formAddLabel.show_name" size="small" />
                    </el-form-item>
                  </el-form>

                  <el-button type="primary" size="small" @click="saveLabel">保存</el-button>
                  <el-button
                    size="small"
                    @click="
                      () => {
                        addKey = '';
                        formLabelRef?.resetFields();
                      }
                    "
                  >
                    取消
                  </el-button>
                </template>
              </template>
            </el-select>
          </el-form-item>
          <el-form-item label="服务者:" prop="provider">
            <!-- 服务者类型为组件时选择组件列表，为地址对象时选择地址对象列表 -->
            <!-- 入方向流量 服务者类型只能为组件，服务者选择组件列表 -->
            <el-select
              v-model="formData.provider"
              placeholder="选择服务者"
              style="width: 100%"
              v-if="formData['serto_type'] === 'tag'"
            >
              <el-option
                v-for="(item, index) in componentTagProvider"
                :key="`componentTagProvider_${index}`"
                :label="item.label"
                :value="item.id"
              ></el-option>
            </el-select>
            <el-select
              v-model="formData.provider"
              placeholder="选择服务者"
              style="width: 100%"
              v-if="formData['serto_type'] === 'address'"
              :placement="addKey !== 'provider' ? 'bottom-start' : 'right'"
              @visible-change="
                () => {
                  addKey = '';
                  formAddressRef?.resetFields();
                }
              "
            >
              <el-option
                v-for="(item, index) in policyManageState.addressOptions"
                :key="`addressOptionsProvider_${index}`"
                :label="item.label"
                :value="item.id"
              />
              <template #footer>
                <el-button
                  v-if="addKey !== 'provider'"
                  text
                  bg
                  size="small"
                  :disabled="!isRoutePermission('/securityPolicy/address')"
                  @click="
                    () => {
                      addKey = 'provider';
                    }
                  "
                >
                  新增
                </el-button>
                <template v-else>
                  <el-form ref="formAddressRef" :model="formAddAddress" :rules="rulesAddress" label-width="80px">
                    <el-form-item label="显示名称:" class="el-form-item--small" prop="show_name">
                      <el-input v-model="formAddAddress.show_name" size="small" />
                    </el-form-item>
                    <el-form-item label="IP:" class="el-form-item--small" prop="address">
                      <el-input
                        v-model="formAddAddress.address"
                        type="textarea"
                        :placeholder="`示例如下：\nIP地址：192.168.1.1\nIP网段：192.168.1.0/24\nIP范围：192.168.1.1～192.168.1.10`"
                        :rows="4"
                        size="small"
                      />
                    </el-form-item>
                    <el-form-item label="域名:" class="el-form-item--small" prop="domain">
                      <el-input
                        v-model="formAddAddress.domain"
                        type="textarea"
                        placeholder="输入域名，以逗号分割"
                        :rows="4"
                        size="small"
                      />
                    </el-form-item>
                    <el-form-item label="描述:" class="el-form-item--small" prop="description">
                      <el-input
                        v-model="formAddAddress.description"
                        type="textarea"
                        placeholder="输入描述"
                        :rows="4"
                        size="small"
                      />
                    </el-form-item>
                  </el-form>

                  <el-button type="primary" size="small" @click="saveAddress">保存</el-button>
                  <el-button
                    size="small"
                    @click="
                      () => {
                        addKey = '';
                        formAddressRef?.resetFields();
                      }
                    "
                  >
                    取消
                  </el-button>
                </template>
              </template>
            </el-select>
          </el-form-item>
          <el-form-item label="服务:" prop="pktrule_service">
            <el-select
              v-model="formData.pktrule_service"
              placeholder="选择服务"
              style="width: 100%"
              :placement="addKey !== 'pktrule_service' ? 'bottom-start' : 'right'"
              @visible-change="
                () => {
                  addKey = '';
                  formServiceRef?.resetFields();
                }
              "
            >
              <el-option
                v-for="(item, index) in policyManageState.serviceOptions"
                :key="`serviceOptions_${index}`"
                :label="item.label"
                :value="item.id"
              />
              <template #footer>
                <el-button
                  v-if="addKey !== 'pktrule_service'"
                  text
                  bg
                  size="small"
                  :disabled="!isRoutePermission('/securityPolicy/service')"
                  @click="
                    () => {
                      addKey = 'pktrule_service';
                    }
                  "
                >
                  新增
                </el-button>
                <template v-else>
                  <el-form ref="formServiceRef" :model="formAddService" :rules="rulesService" label-width="80px">
                    <el-form-item label="显示名称:" class="el-form-item--small" prop="show_name">
                      <el-input v-model="formAddService.show_name" size="small" />
                    </el-form-item>
                    <el-form-item label="协议:" class="el-form-item--small" prop="protocol">
                      <el-radio-group v-model="formAddService.protocol" @change="changeProtocal" size="small">
                        <el-radio label="any">不限</el-radio>
                        <el-radio label="tcp">tcp</el-radio>
                        <el-radio label="udp">udp</el-radio>
                      </el-radio-group>
                    </el-form-item>
                    <el-form-item label="端口:" class="el-form-item--small" prop="port">
                      <el-input
                        v-model="formAddService.port"
                        placeholder="端口不限请设置为“any”"
                        :disabled="disablePort"
                        size="small"
                      />
                    </el-form-item>
                    <el-form-item label="描述:" class="el-form-item--small" prop="description">
                      <el-input
                        v-model="formAddService.description"
                        type="textarea"
                        placeholder="输入描述"
                        :rows="4"
                        size="small"
                      />
                    </el-form-item>
                  </el-form>

                  <el-button type="primary" size="small" @click="saveService">保存</el-button>
                  <el-button
                    size="small"
                    @click="
                      () => {
                        addKey = '';
                        formServiceRef?.resetFields();
                      }
                    "
                  >
                    取消
                  </el-button>
                </template>
              </template>
            </el-select>
          </el-form-item>
          <el-form-item label="访问者类型:" prop="serfrom_type">
            <!-- 出方向流量，访问者类型只能为组件，不可修改 -->
            <el-select
              v-model="formData.serfrom_type"
              placeholder="选择访问者类型"
              style="width: 100%"
              :disabled="formData['pktrule_direction'] === 'out'"
              @change="(val: string) => change_type(val, 'visitors')"
            >
              <el-option
                v-for="(item, index) in policyManageState.typeOptions"
                :key="`visitorsTypeOptions_${index}`"
                :label="item.label"
                :value="item.id"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item
            label="访问者范围:"
            prop="visitors_area"
            v-if="
              formData['pktrule_area'] === 'out' && formData['pktrule_direction'] === 'in' && formData['serfrom_type'] === 'tag'
            "
          >
            <!-- 组外，入方向流量，组件类型访问者，出现访问者范围 -->
            <el-select
              v-model="formData.visitors_area"
              multiple
              filterable
              placeholder="选择访问者范围"
              value-key="id"
              style="width: 100%"
              @change="(val: Record<string, any>[]) => onChangeArea(val, 'visitors')"
              :placement="addKey !== 'visitors_area' ? 'bottom-start' : 'right'"
              @visible-change="
                () => {
                  addKey = '';
                  formLabelRef?.resetFields();
                }
              "
            >
              <el-option-group
                v-for="(options, index) in areaOptions"
                :key="`visitorsAreaGroupOptions_${index}`"
                :label="options.label"
              >
                <el-option
                  v-for="(item, i) in policyManageState[options.optionsField]"
                  :key="`visitorsAreaOptions_${i}`"
                  :label="item.label"
                  :value="item"
                />
              </el-option-group>
              <template #footer>
                <el-button
                  v-if="addKey !== 'visitors_area'"
                  text
                  bg
                  size="small"
                  :disabled="!isRoutePermission('/assetManagement/label')"
                  @click="
                    () => {
                      addKey = 'visitors_area';
                    }
                  "
                >
                  新增
                </el-button>
                <template v-else>
                  <el-form ref="formLabelRef" :model="formAddLabel" :rules="rulesLabel" label-width="80px">
                    <el-form-item label="标签类型:" class="el-form-item--small" prop="label_type">
                      <el-radio-group v-model="formAddLabel.label_type" size="small">
                        <el-radio label="loc">位置</el-radio>
                        <el-radio label="org">组织</el-radio>
                        <el-radio label="business">业务</el-radio>
                      </el-radio-group>
                    </el-form-item>
                    <el-form-item label="显示名称:" class="el-form-item--small" prop="show_name">
                      <el-input v-model="formAddLabel.show_name" size="small" />
                    </el-form-item>
                  </el-form>

                  <el-button type="primary" size="small" @click="saveLabel">保存</el-button>
                  <el-button
                    size="small"
                    @click="
                      () => {
                        addKey = '';
                        formLabelRef?.resetFields();
                      }
                    "
                  >
                    取消
                  </el-button>
                </template>
              </template>
            </el-select>
          </el-form-item>
          <el-form-item label="访问者:" prop="visitors">
            <!-- 访问者类型为组件时选择组件列表，为地址对象时选择地址对象列表 -->
            <!-- 出方向流量 访问者类型只能为组件，访问者选择组件列表 -->
            <el-select
              v-model="formData.visitors"
              placeholder="选择访问者"
              style="width: 100%"
              v-if="formData['serfrom_type'] === 'tag'"
            >
              <el-option
                v-for="(item, index) in componentTagVisitors"
                :key="`componentTagVisitors_${index}`"
                :label="item.label"
                :value="item.id"
              ></el-option>
            </el-select>
            <el-select
              v-model="formData.visitors"
              placeholder="选择访问者"
              style="width: 100%"
              v-if="formData['serfrom_type'] === 'address'"
              :placement="addKey !== 'visitors' ? 'bottom-start' : 'right'"
              @visible-change="
                () => {
                  addKey = '';
                  formAddressRef?.resetFields();
                }
              "
            >
              <el-option
                v-for="(item, index) in policyManageState.addressOptions"
                :key="`addressOptionsVisitors_${index}`"
                :label="item.label"
                :value="item.id"
              />
              <template #footer>
                <el-button
                  v-if="addKey !== 'visitors'"
                  text
                  bg
                  size="small"
                  :disabled="!isRoutePermission('/securityPolicy/address')"
                  @click="
                    () => {
                      addKey = 'visitors';
                    }
                  "
                >
                  新增
                </el-button>
                <template v-else>
                  <el-form ref="formAddressRef" :model="formAddAddress" :rules="rulesAddress" label-width="80px">
                    <el-form-item label="显示名称:" class="el-form-item--small" prop="show_name">
                      <el-input v-model="formAddAddress.show_name" size="small" />
                    </el-form-item>
                    <el-form-item label="IP:" class="el-form-item--small" prop="address">
                      <el-input
                        v-model="formAddAddress.address"
                        type="textarea"
                        :placeholder="`示例如下：\nIP地址：192.168.1.1\nIP网段：192.168.1.0/24\nIP范围：192.168.1.1～192.168.1.10`"
                        :rows="4"
                        size="small"
                      />
                    </el-form-item>
                    <el-form-item label="域名:" class="el-form-item--small" prop="domain">
                      <el-input
                        v-model="formAddAddress.domain"
                        type="textarea"
                        placeholder="输入域名，以逗号分割"
                        :rows="4"
                        size="small"
                      />
                    </el-form-item>
                    <el-form-item label="描述:" class="el-form-item--small" prop="description">
                      <el-input
                        v-model="formAddAddress.description"
                        type="textarea"
                        placeholder="输入描述"
                        :rows="4"
                        size="small"
                      />
                    </el-form-item>
                  </el-form>

                  <el-button type="primary" size="small" @click="saveAddress">保存</el-button>
                  <el-button
                    size="small"
                    @click="
                      () => {
                        addKey = '';
                        formAddressRef?.resetFields();
                      }
                    "
                  >
                    取消
                  </el-button>
                </template>
              </template>
            </el-select>
          </el-form-item>
        </div>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="() => toClose(false)">取消</el-button>
          <el-button type="primary" @click="onSubmit"> 确定 </el-button>
        </span>
      </template>
    </el-dialog>
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

<script lang="ts" setup name="ruleDialog">
import { reactive, ref, watch, computed } from "vue";
import { ElMessage } from "element-plus";
import { policyManageState } from "./state";
import { localGet, isRoutePermission } from "@/utils";
import { getTagList } from "@/api/modules/assets";
import { addLabel } from "@/api/modules/assetManagement";
import { addService, getServiceList, addAddress, getAddressList } from "@/api/modules/security";
import OrderDialog from "@/components/OrderDialog/index.vue";
import { OrderDialogProps } from "@/components/OrderDialog/interface";
import { checkChineseLettertNumber, checkPort } from "@/utils/eleValidate";

interface propsType {
  visible?: boolean;
  dialogType?: string;
  selectedRule?: Record<string, any>;
}
const props = withDefaults(defineProps<propsType>(), {
  visible: false,
  dialogType: "add"
});

let dialogVisible = ref(false);
const selectedPolicy = localGet("policyManage-edit");
const orderDialog = ref();
let orderProps = ref<OrderDialogProps>({
  task_type: "operate",
  log_object: "rule",
  log_action: "",
  params: {},
  unuse_params: ""
});
const formRef = ref();
let formData = ref<Record<string, any>>({
  pktrule_area: "", // 范围
  pktrule_direction: "", // 流量方向
  serto_type: "tag", // 服务者类型
  provider: "", // 服务者组件标签
  pktrule_service: "", // 服务
  serfrom_type: "tag", // 访问者类型
  visitors: "", // 访问者组件标签
  provider_area: [
    { id: "no_loc", label: "不限位置", type: "loc" },
    { id: "no_org", label: "不限组织", type: "org" },
    { id: "no_business", label: "不限业务", type: "business" }
  ], // 服务者范围，默认不限位置、不限组织、不限业务
  visitors_area: [
    { id: "no_loc", label: "不限位置", type: "loc" },
    { id: "no_org", label: "不限组织", type: "org" },
    { id: "no_business", label: "不限业务", type: "business" }
  ] // 访问者范围，默认不限位置、不限组织、不限业务
});
const rules = reactive<Record<string, any>>({
  pktrule_area: [{ required: true, message: "请选择范围", trigger: "change" }],
  pktrule_direction: [{ required: true, message: "请选择流量方向", trigger: "change" }],
  serto_type: [{ required: true, message: "请选择服务者类型", trigger: "change" }],
  provider_area: [{ required: true, message: "请选择服务者范围", trigger: "change" }],
  provider: [{ required: true, message: "请选择服务者", trigger: "change" }],
  pktrule_service: [{ required: true, message: "请选择服务", trigger: "change" }],
  serfrom_type: [{ required: true, message: "请选择访问者类型", trigger: "change" }],
  visitors_area: [{ required: true, message: "请选择访问者范围", trigger: "change" }],
  visitors: [{ required: true, message: "请选择访问者", trigger: "change" }]
});

let areaOptions = reactive<Record<string, any>[]>([
  {
    label: "位置",
    key: "loc",
    optionsField: "tagList1"
  },
  {
    label: "组织",
    key: "org",
    optionsField: "tagList2"
  },
  {
    label: "业务",
    key: "business",
    optionsField: "tagList3"
  }
]);

let componentTagProvider = reactive<Record<string, any>[]>([]); // 服务者组件标签列表
let componentTagVisitors = reactive<Record<string, any>[]>([]); // 访问者组件标签列表

const addKey = ref<string>(""); // 下拉框新增标签的key
const formServiceRef = ref();
const formAddService = ref<Record<string, any>>({
  show_name: "",
  protocol: "any",
  port: "any",
  description: ""
});
const rulesService = reactive<Record<string, any>>({
  show_name: [{ required: true, message: "请输入显示名称", trigger: "blur" }],
  protocol: [{ required: true, message: "请选择服务", trigger: "change" }],
  port: [
    { required: true, message: "请输入端口", trigger: "blur" },
    { validator: (rule: any, value: any, callback: any) => checkPort(rule, value, callback, true), trigger: "blur" }
  ],
  description: [{ required: true, message: "请输入描述", trigger: "blur" }]
});
const changeProtocal = (val: string | number | boolean) => {
  if (val === "any") {
    formAddService.value.port = "any";
  } else {
    formAddService.value.port = "";
  }
};
const disablePort = computed(() => formAddService.value.port === "any");
const saveService = async () => {
  formServiceRef.value.validate(async (valid: any) => {
    if (valid) {
      let res: any = "";
      let { show_name, description, protocol, port } = formAddService.value;
      let addParams = {
        showname: show_name,
        description,
        service_object_service: `${protocol}/${port}`
      };
      try {
        res = await addService(addParams);
      } catch (error) {
        console.log(`新增服务对象错误: ${error}`);
      }
      if (res.message.includes("failed")) {
        ElMessage({
          message: "服务对象保存失败: 显示名称不可重复",
          type: "error"
        });
      } else {
        ElMessage({
          message: "保存成功",
          type: "success"
        });
        formServiceRef?.value.resetFields();
        const data: any = await getServiceList();
        policyManageState.serviceOptions = ((data || {}).data || {}).affected_items.map((k: Record<string, any>) => ({
          id: k.id.toString(),
          label: k.show_name
        }));
      }
    } else {
      return false;
    }
  });
};

const formAddressRef = ref();
const formAddAddress = ref<Record<string, any>>({
  show_name: "",
  address: "",
  description: "",
  domain: ""
});
const checkIpAndDomain = (rule: any, value: any, callback: any) => {
  if (formAddAddress.value.address || formAddAddress.value.domain) {
    callback();
  } else {
    callback(new Error("IP或域名必填一项!"));
  }
};
const rulesAddress = reactive<Record<string, any>>({
  show_name: [{ required: true, message: "请输入显示名称", trigger: "blur" }],
  address: [{ validator: checkIpAndDomain, trigger: "blur" }],
  domain: [{ validator: checkIpAndDomain, trigger: "blur" }],
  description: [{ required: true, message: "请输入描述", trigger: "blur" }]
});
const saveAddress = () => {
  formAddressRef.value.validate(async (valid: any) => {
    if (valid) {
      let res: any = "";
      let { show_name, address, description, domain } = formAddAddress.value;
      let addParams = {
        showname: show_name,
        address_list: address,
        description,
        domain
      };
      try {
        res = await addAddress(addParams);
      } catch (error) {
        console.log(`新增地址对象错误: ${error}`);
      }
      if (res.message.includes("conflict ip")) {
        const ips = res.message.split("conflict ip ");
        ElMessage({
          message: `地址对象保存失败: IP${ips.length > 1 ? ips[1] : ""}已进入纳管范围`,
          type: "error"
        });
      } else if (res.message.includes("invalid address")) {
        ElMessage({
          message: "地址对象保存失败: IP配置无效",
          type: "error"
        });
      } else if (res.message.includes("invalid domain")) {
        ElMessage({
          message: "地址对象保存失败: 域名配置无效",
          type: "error"
        });
      } else if (res.message.includes("address_obj.show_name")) {
        ElMessage({
          message: "地址对象保存失败: 显示名称不可重复",
          type: "error"
        });
      } else if (res.message.includes("params_error")) {
        ElMessage({
          message: "地址对象保存失败: 参数错误",
          type: "error"
        });
      } else {
        ElMessage({
          message: "保存成功",
          type: "success"
        });
        formAddressRef?.value.resetFields();
        const data: any = await getAddressList();
        policyManageState.addressOptions = ((data || {}).data || {}).affected_items.map((k: Record<string, any>) => ({
          id: k.id,
          label: k.show_name
        }));
      }
    } else {
      return false;
    }
  });
};

const formLabelRef = ref();
const formAddLabel = ref<Record<string, any>>({
  label_type: "",
  show_name: ""
});
const rulesLabel = reactive<Record<string, any>>({
  label_type: [{ required: true, message: "请选择标签类型", trigger: "change" }],
  show_name: [
    { required: true, message: "请输入显示名称", trigger: "blur" },
    { validator: checkChineseLettertNumber, trigger: "blur" }
  ]
});
const saveLabel = () => {
  formLabelRef.value.validate(async (valid: any) => {
    if (valid) {
      let res: any = "";
      let { show_name, label_type } = formAddLabel.value;
      let addParams = {
        showname_list: show_name,
        label_type
      };
      try {
        res = await addLabel(addParams);
      } catch (error) {
        console.log(`新增标签错误: ${error}`);
      }
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

        formLabelRef?.value.resetFields();
        const editItem = areaOptions.find((item: Record<string, any>) => item.key === label_type);
        const tagItems = await getTagList({ label_type });
        let tagList = ((tagItems || {}).data || {}).affected_items.map(k => ({
          id: k.id,
          label: k.show_name,
          type: label_type
        }));
        tagList.unshift({
          id: `no_${label_type}`,
          label: `不限${editItem?.label}`,
          type: label_type
        });
        policyManageState[editItem?.optionsField] = tagList;
      }
    } else {
      return false;
    }
  });
};

watch(
  () => props.visible,
  async (val: boolean) => {
    if (val && props.dialogType === "detail") {
      let formParams = {
        id: props.selectedRule?.id,
        pktrule_area: props.selectedRule?.area,
        pktrule_direction: props.selectedRule?.direction,
        provider: props.selectedRule?.serviceto ?? "",
        pktrule_service: props.selectedRule?.service,
        visitors: props.selectedRule?.servicefrom ?? "",
        serto_type: props.selectedRule?.to_type,
        serfrom_type: props.selectedRule?.from_type,
        provider_area: [
          { id: "no_loc", label: "不限位置", type: "loc" },
          { id: "no_org", label: "不限组织", type: "org" },
          { id: "no_business", label: "不限业务", type: "business" }
        ],
        visitors_area: [
          { id: "no_loc", label: "不限位置", type: "loc" },
          { id: "no_org", label: "不限组织", type: "org" },
          { id: "no_business", label: "不限业务", type: "business" }
        ]
      };
      if (formParams.pktrule_area === "out" && formParams.pktrule_direction === "out") {
        if (props.selectedRule?.loc != 0)
          formParams.provider_area[0] = policyManageState.tagList1.find(
            (k: Record<string, any>) => k.id == props.selectedRule?.loc
          );
        if (props.selectedRule?.org != 0)
          formParams.provider_area[1] = policyManageState.tagList2.find(
            (k: Record<string, any>) => k.id == props.selectedRule?.org
          );
        if (props.selectedRule?.business != 0)
          formParams.provider_area[2] = policyManageState.tagList3.find(
            (k: Record<string, any>) => k.id == props.selectedRule?.business
          );
      } else if (formParams.pktrule_area === "out" && formParams.pktrule_direction === "in") {
        if (props.selectedRule?.loc != 0)
          formParams.visitors_area[0] = policyManageState.tagList1.find(
            (k: Record<string, any>) => k.id == props.selectedRule?.loc
          );
        if (props.selectedRule?.org != 0)
          formParams.visitors_area[1] = policyManageState.tagList2.find(
            (k: Record<string, any>) => k.id == props.selectedRule?.org
          );
        if (props.selectedRule?.business != 0)
          formParams.visitors_area[2] = policyManageState.tagList3.find(
            (k: Record<string, any>) => k.id == props.selectedRule?.business
          );
      }
      formData.value = formParams;
      await getTagProvider();
      await getTagVisitors();
    }
    dialogVisible.value = val;
  }
);

const change_pktrule_direction = (val: string) => {
  if (val === "in") {
    // 入方向服务者类型只能为tab不可修改
    formData.value.serto_type = "tag";
  } else {
    // 出方向访问者类型只能为tab不可修改
    formData.value.serfrom_type = "tag";
  }
  changeInit();
};

const change_type = (val: string, type: string) => {
  formData.value[type] = "";
};

const changeInit = () => {
  formData.value.provider_area = [
    { id: "no_loc", label: "不限位置", type: "loc" },
    { id: "no_org", label: "不限组织", type: "org" },
    { id: "no_business", label: "不限业务", type: "business" }
  ];
  formData.value.visitors_area = [
    { id: "no_loc", label: "不限位置", type: "loc" },
    { id: "no_org", label: "不限组织", type: "org" },
    { id: "no_business", label: "不限业务", type: "business" }
  ];
  formData.value.provider = "";
  formData.value.visitors = "";
  getTagProvider(); // 根据范围查询服务者组件列表
  getTagVisitors(); // 根据范围查询访问者组件列表
};

const onChangeArea = (val: Record<string, any>[], type: string) => {
  const keyArr = [
    { id: "no_loc", label: "不限位置", type: "loc", index: 0 },
    { id: "no_org", label: "不限组织", type: "org", index: 1 },
    { id: "no_business", label: "不限业务", type: "business", index: 2 }
  ];
  if (val.length < 3) {
    // 删除标签
    for (let i = 0, length = keyArr.length; i < length; i++) {
      let item = keyArr[i];
      if (!val.find(select => select.type === item.type)) {
        formData.value[`${type}_area`].splice(item.index, 0, {
          id: item.id,
          label: item.label,
          type: item.type
        });
        break;
      }
    }
  } else {
    // 选择标签
    const addItem = val[3];
    for (let i = 0, length = keyArr.length; i < length; i++) {
      let item = keyArr[i];
      if (addItem.type === item.type) {
        formData.value[`${type}_area`].splice(item.index, 1, addItem);
        formData.value[`${type}_area`].splice(3);
        break;
      }
    }
  }
  formData.value[type] = "";
  if (type === "provider") {
    getTagProvider();
  } else {
    getTagVisitors();
  }
};

const getTagProvider = async () => {
  try {
    let params = {
      label_type: "component",
      loc_id: "0",
      org_id: "0",
      business_id: "0"
    };
    if (
      formData.value.pktrule_area === "in" ||
      (formData.value.pktrule_area === "out" && formData.value.pktrule_direction === "in")
    ) {
      params.loc_id = selectedPolicy.loc;
      params.org_id = selectedPolicy.org;
      params.business_id = selectedPolicy.bus;
    } else if (formData.value.pktrule_area === "out" && formData.value.pktrule_direction === "out") {
      params.loc_id = formData.value.provider_area[0].id === "no_loc" ? "0" : formData.value.provider_area[0].id;
      params.org_id = formData.value.provider_area[1].id === "no_org" ? "0" : formData.value.provider_area[1].id;
      params.business_id = formData.value.provider_area[2].id === "no_business" ? "0" : formData.value.provider_area[2].id;
    }
    const tagItems = await getTagList(params, false);
    let tagList = ((tagItems || {}).data || {}).affected_items.map(k => ({
      id: String(k.id),
      label: k.show_name
    }));
    const selected = tagList.find(item => formData.value.provider === item.id);
    if (props.dialogType === "detail" && formData.value.provider && !selected)
      tagList.push(policyManageState.tagList4.find((k: Record<string, any>) => k.id === formData.value.provider));
    componentTagProvider = tagList;
  } catch (error) {
    console.log(`服务者标签列表错误: ${error}`);
  }
};

const getTagVisitors = async () => {
  try {
    let params = {
      label_type: "component",
      loc_id: "0",
      org_id: "0",
      business_id: "0"
    };
    if (
      formData.value.pktrule_area === "in" ||
      (formData.value.pktrule_area === "out" && formData.value.pktrule_direction === "out")
    ) {
      params.loc_id = selectedPolicy.loc;
      params.org_id = selectedPolicy.org;
      params.business_id = selectedPolicy.bus;
    } else if (formData.value.pktrule_area === "out" && formData.value.pktrule_direction === "in") {
      params.loc_id = formData.value.visitors_area[0].id === "no_loc" ? "0" : formData.value.visitors_area[0].id;
      params.org_id = formData.value.visitors_area[1].id === "no_org" ? "0" : formData.value.visitors_area[1].id;
      params.business_id = formData.value.visitors_area[2].id === "no_business" ? "0" : formData.value.visitors_area[2].id;
    }
    const tagItems = await getTagList(params, false);
    let tagList = ((tagItems || {}).data || {}).affected_items.map(k => ({
      id: String(k.id),
      label: k.show_name
    }));
    const selected = tagList.find(item => formData.value.visitors === item.id);
    if (props.dialogType === "detail" && formData.value.visitors && !selected)
      tagList.push(policyManageState.tagList4.find((k: Record<string, any>) => k.id === formData.value.visitors));
    componentTagVisitors = tagList;
  } catch (error) {
    console.log(`访问者标签列表错误: ${error}`);
  }
};

let $emit = defineEmits(["closedDialog"]);
const toClose = (isGetList = false) => {
  $emit("closedDialog", isGetList);
  formData.value = {
    pktrule_area: "", // 范围
    pktrule_direction: "", // 流量方向
    serto_type: "tag", // 服务者类型
    provider: "", // 服务者组件标签
    pktrule_service: "", // 服务
    serfrom_type: "tag", // 访问者类型
    visitors: "", // 访问者组件标签
    provider_area: [
      { id: "no_loc", label: "不限位置", type: "loc" },
      { id: "no_org", label: "不限组织", type: "org" },
      { id: "no_business", label: "不限业务", type: "business" }
    ], // 服务者范围，默认不限位置、不限组织、不限业务
    visitors_area: [
      { id: "no_loc", label: "不限位置", type: "loc" },
      { id: "no_org", label: "不限组织", type: "org" },
      { id: "no_business", label: "不限业务", type: "business" }
    ] // 访问者范围，默认不限位置、不限组织、不限业务
  };
  formRef.value.clearValidate();
};

const onSubmit = () => {
  formRef.value.validate(async (valid: any) => {
    if (valid) {
      saveRule();
    } else {
      return false;
    }
  });
};

const saveRule = async () => {
  try {
    let loc_id = "0",
      org_id = "0",
      business_id = "0";
    if (formData.value.pktrule_area === "in") {
      loc_id = selectedPolicy.loc;
      org_id = selectedPolicy.org;
      business_id = selectedPolicy.bus;
    } else {
      if (formData.value.pktrule_direction === "in") {
        loc_id = formData.value.visitors_area[0].id === "no_loc" ? "0" : formData.value.visitors_area[0].id;
        org_id = formData.value.visitors_area[1].id === "no_org" ? "0" : formData.value.visitors_area[1].id;
        business_id = formData.value.visitors_area[2].id === "no_business" ? "0" : formData.value.visitors_area[2].id;
      } else {
        loc_id = formData.value.provider_area[0].id === "no_loc" ? "0" : formData.value.provider_area[0].id;
        org_id = formData.value.provider_area[1].id === "no_org" ? "0" : formData.value.provider_area[1].id;
        business_id = formData.value.provider_area[2].id === "no_business" ? "0" : formData.value.provider_area[2].id;
      }
    }

    let params: Record<string, any> = {
      pktpolicy_name: selectedPolicy.name,
      pktrule_area: formData.value.pktrule_area,
      pktrule_direction: formData.value.pktrule_direction,
      loc_id,
      org_id,
      business_id,
      serto_type: formData.value.serto_type,
      pktrule_serto: formData.value.provider,
      pktrule_service: formData.value.pktrule_service,
      serfrom_type: formData.value.serfrom_type,
      pktrule_serfrom: formData.value.visitors
    };
    if (props.dialogType === "add") {
      const unuse_params_item = {
        所属策略: selectedPolicy.name
      };
      orderProps.value = {
        task_type: "operate",
        log_object: "rule",
        log_action: "add",
        params,
        unuse_params: JSON.stringify([unuse_params_item])
      };
    } else {
      params.pktrule_num = formData.value.id;

      const unuse_params_item = {
        所属策略: selectedPolicy.name,
        范围: props.selectedRule?.area_label,
        流量方向: props.selectedRule?.direction_label,
        服务者类型: props.selectedRule?.to_type_label,
        服务者: props.selectedRule?.serviceto_label ?? "",
        服务: props.selectedRule?.service_label,
        访问者类型: props.selectedRule?.from_type_label,
        访问者: props.selectedRule?.servicefrom_label ?? "",
        规则ID: props.selectedRule?.id
      };
      orderProps.value = {
        task_type: "operate",
        log_object: "rule",
        log_action: "update",
        params,
        unuse_params: JSON.stringify([unuse_params_item])
      };
    }
    toClose(false);
    orderDialog.value?.judgeSwitch();
  } catch (error) {
    console.log(`保存规则错误: ${error}`);
  }
};

const orderDialogCallback = () => {
  orderProps.value = {
    task_type: "operate",
    log_object: "rule",
    log_action: "",
    params: {},
    unuse_params: ""
  };
  toClose(true);
};
</script>
