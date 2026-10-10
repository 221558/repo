<template>
  <div class="card add-form alarm-policy-warp">
    <div class="title mb10">
      <el-button link type="info" @click="toPrev">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="pl10">{{ `${subFlag === 0 ? "新增" : "编辑"}告警策略` }}</span>
    </div>
    <el-form ref="formRef" class="form_wrap" :model="formData" :rules="rules" label-width="140px">
      <el-form-item label="规则名称:" prop="alert_policy_name">
        <el-input v-model="formData.alert_policy_name" :disabled="subFlag === 1" placeholder="请输入规则名称" />
        <span class="label_desc">指定唯一的名称。一旦创建成功，就不能编辑该名称。名称不可输入中文、特殊字符、空格</span>
      </el-form-item>
      <el-form-item label="告警类型:" prop="alert_type">
        <el-radio-group
          v-model="formData.alert_type"
          @change="(val: string | number | boolean) => handleChangeAlertType(val)"
          :disabled="subFlag === 1"
        >
          <el-radio label="drop_packets">异常访问</el-radio>
          <el-radio label="system">系统日志</el-radio>
          <el-radio label="operation">操作日志</el-radio>
        </el-radio-group>
      </el-form-item>

      <div v-if="formData.alert_type === 'drop_packets'">
        <el-form-item label="告警对象:" prop="object_type">
          <el-cascader
            v-model="formData.object_type"
            placeholder="请选择告警对象"
            :options="objectInitOptions"
            :props="objectProps"
            :class="{
              w300: formData.object_type.length !== 1 || formData.object_type[0] !== 'ips',
              w80: formData.object_type.length === 1 && formData.object_type[0] === 'ips'
            }"
            @change="handleChangeObjectType"
          >
            <template #default="{ node, data }">
              <div v-if="node.level === 2 && data.leaf === false" class="flx-justify-between">
                <span>{{ data.show_name }}</span>
                <span>
                  <el-tag class="ml8">{{ data.loc_show_name }}</el-tag>
                  <el-tag class="ml8" type="success">
                    {{ data.org_show_name }}
                  </el-tag>
                  <el-tag class="ml8" type="warning">
                    {{ data.business_show_name }}
                  </el-tag>
                </span>
              </div>
              <span v-else>{{ data.label }}</span>
            </template>
          </el-cascader>
          <el-input
            v-model="formData.ip"
            placeholder="请输入IP"
            class="w220"
            v-show="formData.object_type.length === 1 && formData.object_type[0] === 'ips'"
          />
        </el-form-item>
        <el-form-item label="方向:" prop="direction">
          <el-checkbox-group v-model="formData.direction" @change="() => handleChangeDirection()">
            <el-checkbox label="in">入方向</el-checkbox>
            <el-checkbox label="out">出方向</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="目标端口:" prop="alert_service" v-if="formData.direction.indexOf('in') !== -1">
          <el-input v-model="formData.alert_service" placeholder="请输入协议类型和端口号" />
          <span class="label_desc">协议支持 tcp 和 udp。输入格式为 协议类型/端口号。示例：tcp/22</span>
        </el-form-item>
        <el-form-item label="触发频率:" prop="alert_frequency">
          <el-input-number v-model="formData.alert_frequency" :min="1" :step="1" />
          <span class="label_desc">连接次数/min</span>
        </el-form-item>
      </div>

      <div v-if="formData.alert_type === 'system'">
        <el-form-item label="系统模块:" prop="log_module">
          <el-select v-model="formData.log_module" placeholder="请选择系统模块" clearable style="width: 300px">
            <el-option
              v-for="(item, index) in logModuleOptions"
              :key="`logModuleOptions_${index}`"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="系统事件:" prop="log_event">
          <el-select v-model="formData.log_event" placeholder="请选择系统事件" filterable clearable style="width: 300px">
            <el-option
              v-for="(item, index) in logEventOptions"
              :key="`logEventOptions_${index}`"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日志级别:" prop="level">
          <el-select v-model="formData.level" placeholder="请选择日志级别" clearable style="width: 300px">
            <el-option label="错误" value="error" />
            <el-option label="信息" value="info" />
            <el-option label="告警" value="warning" />
          </el-select>
        </el-form-item>
      </div>

      <div v-if="formData.alert_type === 'operation'">
        <el-form-item label="用户:" prop="login_user">
          <el-select v-model="formData.login_user" placeholder="请选择用户" filterable clearable style="width: 300px">
            <el-option
              v-for="(item, index) in loginUserOptions"
              :key="`loginUserOptions_${index}`"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作对象:" prop="log_object">
          <el-select
            v-model="formData.log_object"
            placeholder="请选择操作对象"
            filterable
            clearable
            style="width: 300px"
            @change="handleChangeObject"
          >
            <el-option
              v-for="(item, index) in logObjectOptions"
              :key="`loginObjectOptions_${index}`"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="动作:" prop="log_action">
          <el-select
            v-model="formData.log_action"
            placeholder="请选择动作"
            filterable
            clearable
            style="width: 300px"
            @change="handleChangeAction"
          >
            <el-option
              v-for="(item, index) in logActionOptions"
              :key="`logActionOptions_${index}`"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="执行状态:" prop="result">
          <el-radio-group v-model="formData.result">
            <el-radio label="failed">失败</el-radio>
            <el-radio label="success">成功</el-radio>
          </el-radio-group>
        </el-form-item>
      </div>

      <el-form-item label="告警级别:" prop="alert_level">
        <el-radio-group v-model="formData.alert_level">
          <el-radio label="high">高</el-radio>
          <el-radio label="normal">中</el-radio>
          <el-radio label="low">低</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="通知方式:" prop="alert_notify">
        <el-radio-group v-model="formData.alert_notify">
          <el-radio label="system">系统通知</el-radio>
          <el-radio label="email">邮件通知</el-radio>
          <!-- <el-radio label="text">短信</el-radio> -->
        </el-radio-group>
      </el-form-item>

      <div v-if="formData.alert_notify === 'email'">
        <el-form-item label="通知对象:" prop="notify_obj">
          <el-radio-group v-model="formData.notify_obj" @change="handleChangeNotify">
            <el-radio label="contact">联系人</el-radio>
            <el-radio label="email">邮箱</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="联系人:" prop="contact" v-if="formData.notify_obj === 'contact'">
          <el-select v-model="formData.contact" placeholder="请选择联系人" filterable clearable style="width: 300px">
            <el-option
              v-for="(item, index) in contactOptions"
              :key="`contactOptions_${index}`"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="邮箱:" prop="email" v-else>
          <el-input v-model="formData.email" placeholder="请输入邮箱地址" />
        </el-form-item>
        <el-form-item label="重试次数:" prop="retry_times">
          <el-input-number v-model="formData.retry_times" :min="1" :step="1" />
          <span class="label_desc">邮件发送失败时的重试次数</span>
        </el-form-item>
      </div>

      <el-form-item label="是否启用:" prop="enable">
        <el-switch v-model="formData.enable" />
      </el-form-item>
      <el-form-item label="说明:" prop="description">
        <el-input v-model="formData.description" type="textarea" placeholder="请输入规则说明" :rows="4" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit"> 保存 </el-button>
        <el-button plain @click="clear"> 清空 </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts" name="alarmPolicyForm">
import { ref, reactive, onMounted, onUnmounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { localGet, localRemove } from "@/utils";
import { ElMessage } from "element-plus";
import type { CascaderProps, CascaderOption, CascaderNodeValue } from "element-plus";
import { addAlarmPolicy, editAlarmPolicy } from "@/api/modules/alarmCenter";
import { getGroupList, getTagList } from "@/api/modules/assets";
import { getAddressList } from "@/api/modules/security";
import { getUserList } from "@/api/modules/system";
import {
  logActionOptions as logActionAll,
  logObjectOptions as logObjectAll,
  logActionMap,
  logObjectMap,
  logEventOptions,
  logModuleOptions,
  adminOptions
} from "@/config/mappingDict";
import { getContact } from "@/api/modules/contactManagement";
import { checkLettertNumber, checkNumber, checkEmail } from "@/utils/eleValidate";

const router = useRouter();
const formRef = ref();
let subFlag = ref(0); // 0=新增，1=编辑
let formData = ref<Record<string, any>>({
  alert_policy_name: "",
  alert_type: "drop_packets",

  object_type: [],
  ip: "",
  direction: ["in"],
  alert_service: "",
  alert_frequency: 1,

  log_module: "",
  log_event: "",
  level: "",

  login_user: "",
  log_object: "",
  log_action: "",
  result: "failed",

  alert_level: "high",
  alert_notify: "system",

  notify_obj: "contact",
  contact: "",
  email: "",
  retry_times: 1,

  enable: true,
  description: ""
});
const objectInitOptions = ref<Record<string, any>[]>([]);
const loginUserOptions = ref<Record<string, any>[]>([]);
const contactOptions = ref<Record<string, any>[]>([]);
const objectProps: CascaderProps = {
  lazy: true,
  lazyLoad: async (node, resolve) => {
    const { level } = node;
    let nextNodes: CascaderOption[] = [];
    if (level === 0) {
      nextNodes = [
        {
          value: "agent",
          label: "工作负载",
          leaf: false
        },
        {
          value: "address",
          label: "地址对象",
          leaf: false
        },
        {
          value: "ips",
          label: "IP",
          leaf: true
        }
      ];
    } else if (level === 1 && node.value === "agent") {
      nextNodes = await getGroupOptions();
    } else if (level === 1 && node.value === "address") {
      nextNodes = await getAddressOptions();
    } else if (level === 2) {
      nextNodes = await getTagOptions(node.value);
    }
    resolve(nextNodes);
  }
};
const logObjectOptions = computed(() => {
  if (!formData.value.log_object && formData.value.log_action) {
    return logActionMap[formData.value.log_action];
  } else {
    return logObjectAll;
  }
});
const logActionOptions = computed(() => {
  if (formData.value.log_object && !formData.value.log_action) {
    return logObjectMap[formData.value.log_object];
  } else {
    return logActionAll;
  }
});

const logObject = ref<string>("");
const logAction = ref<string>("");
const handleChangeObject = (val: string) => {
  if (logObject.value && logAction.value && val) {
    logAction.value = "";
    formData.value.log_action = "";
  }
  logObject.value = val;
};
const handleChangeAction = (val: string) => {
  if (logObject.value && logAction.value && val) {
    logObject.value = "";
    formData.value.log_object = "";
  }
  logAction.value = val;
};
const handleChangeNotify = () => {
  formData.value.contact = "";
  formData.value.email = "";
  formData.value.retry_times = 1;
};

const checkObjectType = (rule: any, value: any, callback: any) => {
  const reg = /^((2((5[0-5])|([0-4]\d)))|([0-1]?\d{1,2}))(\.((2((5[0-5])|([0-4]\d)))|([0-1]?\d{1,2}))){3}$/;
  if (value.length === 0) {
    callback(new Error("请选择告警对象"));
  } else if (value.length === 1 && value[0] === "ips" && !formData.value.ip) {
    callback(new Error("请输入IP"));
  } else if (value.length === 1 && value[0] === "ips" && !reg.test(formData.value.ip)) {
    callback(new Error("IP格式不合法"));
  } else {
    callback();
  }
};
const checkService = (rule: any, value: any, callback: any) => {
  const itemArr = value.split("/");
  const protocol = itemArr[0];
  const port = itemArr[1] ?? "";
  const reg = /^([1-9]\d{0,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$/;
  let isTrue = true;
  if (itemArr.length !== 2) {
    isTrue = false;
  }
  if (protocol !== "tcp" && protocol !== "udp") {
    isTrue = false;
  }
  if (!reg.test(port)) {
    isTrue = false;
  }

  if (isTrue) {
    callback();
  } else {
    callback(new Error("目标端口格式不规范"));
  }
};
const checkSystem = (rule: any, value: any, callback: any) => {
  if (formData.value.log_module || formData.value.log_event || formData.value.level) {
    callback();
  } else {
    callback(new Error("系统模块、系统事件或日志级别必填一项!"));
  }
};
const checkOper = (rule: any, value: any, callback: any) => {
  if (formData.value.login_user || formData.value.log_object || formData.value.log_action) {
    callback();
  } else {
    callback(new Error("用户、操作对象或动作必填一项!"));
  }
};
const rules = reactive<Record<string, any>>({
  alert_policy_name: [
    { required: true, message: "请输入规则名称", trigger: "blur" },
    { validator: checkLettertNumber, trigger: "blur" }
  ],
  alert_type: [{ required: true, message: "请选择告警类型", trigger: "change" }],
  object_type: [
    { required: true, message: "请选择告警对象", trigger: "change" },
    { validator: checkObjectType, trigger: "change" }
  ],
  direction: [{ required: true, message: "请选择方向", trigger: "change" }],
  alert_service: [
    { required: true, message: "请输入目标端口", trigger: "blur" },
    { validator: checkService, trigger: "blur" }
  ],
  alert_frequency: [
    { required: true, message: "请输入触发频率", trigger: "blur" },
    { validator: checkNumber, trigger: "blur" }
  ],
  log_module: [{ validator: checkSystem, trigger: "change" }],
  log_event: [{ validator: checkSystem, trigger: "change" }],
  level: [{ validator: checkSystem, trigger: "change" }],
  login_user: [{ validator: checkOper, trigger: "change" }],
  log_object: [{ validator: checkOper, trigger: "change" }],
  log_action: [{ validator: checkOper, trigger: "change" }],
  alert_level: [{ required: true, message: "请选择告警级别", trigger: "change" }],
  alert_notify: [{ required: true, message: "请选择通知方式", trigger: "change" }],
  notify_obj: [{ required: true, message: "请选择通知对象", trigger: "change" }],
  contact: [{ required: true, message: "请选择联系人", trigger: "change" }],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { validator: checkEmail, trigger: "blur" }
  ],
  retry_times: [{ required: true, message: "请输入重试次数", trigger: "blur" }],
  enable: [{ required: true, message: "请选择是否启用", trigger: "change" }]
});

onMounted(async () => {
  const route = useRoute();
  getLoginUserOptions();
  getContactOptions();
  if (route.params.id) {
    subFlag.value = 1;
    const reg = /^([a-zA-Z]|[0-9])(\w|\-)+@[a-zA-Z0-9]+\.([a-zA-Z]{2,4})$/; // 邮箱正则
    const selectedItem = localGet("alarm-policy-edit");
    const dataInit = ref<Record<string, any>>({
      alert_policy_id: selectedItem.id,
      alert_policy_name: selectedItem.name,
      alert_type: selectedItem.type,

      object_type: [],
      ip: "",
      direction: ["in"],
      alert_service: "",
      alert_frequency: 1,

      log_module: "",
      log_event: "",
      level: "",

      login_user: "",
      log_object: "",
      log_action: "",
      result: "failed",

      alert_level: selectedItem.level,
      alert_notify: selectedItem.notify,

      notify_obj: reg.test(selectedItem.liaison) ? "email" : "contact",
      contact: reg.test(selectedItem.liaison) ? "" : selectedItem.liaison,
      email: reg.test(selectedItem.liaison) ? selectedItem.liaison : "",
      retry_times: selectedItem.retry_times,

      enable: selectedItem.state === "enable",
      description: selectedItem.description === "None" ? "" : selectedItem.description
    });
    let data: Record<string, any> = {};

    if (selectedItem.type === "drop_packets") {
      data = {
        object_type: [],
        ip: "",
        direction: [],
        alert_service: selectedItem.service.replace("None", ""),
        alert_frequency: selectedItem.frequency
      };

      if (selectedItem.direction === "all") {
        data.direction = ["in", "out"];
      } else {
        data.direction = [selectedItem.direction];
      }
      let object_type: string[] = [];
      if (selectedItem.obj_type === "agent") {
        object_type = ["agent", selectedItem.obj.split("/")[0], selectedItem.obj.split("/")[1]];

        const groupOptions = await getGroupOptions();
        const groupIndex = groupOptions.findIndex((item: Record<string, any>) => item.value === selectedItem.obj.split("/")[0]);
        const tagOptions = await getTagOptions(selectedItem.obj.split("/")[0]);

        let initOptions: Record<string, any>[] = [
          {
            value: "agent",
            label: "工作负载",
            leaf: false,
            children: groupOptions
          },
          {
            value: "address",
            label: "地址对象",
            leaf: false
          },
          {
            value: "ips",
            label: "IP",
            leaf: true
          }
        ];
        initOptions[0].children[groupIndex].children = tagOptions;
        objectInitOptions.value = initOptions;
      } else if (selectedItem.obj_type === "address") {
        object_type = ["address", selectedItem.obj];

        const addressOptions = await getAddressOptions();
        let initOptions: Record<string, any>[] = [
          {
            value: "agent",
            label: "工作负载",
            leaf: false
          },
          {
            value: "address",
            label: "地址对象",
            leaf: false,
            children: addressOptions
          },
          {
            value: "ips",
            label: "IP",
            leaf: true
          }
        ];
        objectInitOptions.value = initOptions;
      } else {
        object_type = ["ips"];
        data.ip = selectedItem.obj;

        let initOptions: Record<string, any>[] = [
          {
            value: "agent",
            label: "工作负载",
            leaf: false
          },
          {
            value: "address",
            label: "地址对象",
            leaf: false
          },
          {
            value: "ips",
            label: "IP",
            leaf: true
          }
        ];
        objectInitOptions.value = initOptions;
      }
      data.object_type = object_type;
    } else if (selectedItem.type === "system") {
      data = {
        log_module: selectedItem.sys_module.replace("None", ""),
        log_event: selectedItem.sys_event.replace("None", ""),
        level: selectedItem.sys_level.replace("None", "")
      };
    } else if (selectedItem.type === "operation") {
      data = {
        login_user: selectedItem.op_user.replace("None", ""),
        log_object: selectedItem.op_obj.replace("None", ""),
        log_action: selectedItem.op_action.replace("None", ""),
        result: selectedItem.op_state
      };
    }
    formData.value = Object.assign(dataInit.value, data);
  }
});

const getLoginUserOptions = async () => {
  try {
    const data: any = await getUserList();
    const userList = ((data || {}).data || {}).affected_items.map((k: Record<string, any>) => ({
      label: k.username,
      value: k.username
    }));
    loginUserOptions.value = adminOptions.concat(userList);
  } catch (error) {
    console.log(`查询用户列表错误: ${error}`);
  }
};

const getContactOptions = async () => {
  try {
    const data: any = await getContact({});
    const userList = ((data || {}).data || {}).affected_items.map((k: Record<string, any>) => ({
      label: k.name,
      value: String(k.id)
    }));
    contactOptions.value = userList;
  } catch (error) {
    console.log(`查询联系人列表错误: ${error}`);
  }
};

const getGroupOptions = async () => {
  let resList: CascaderOption[] = [];
  try {
    const groups = await getGroupList({ limit: 0 });
    resList = ((groups || {}).data || {}).affected_items.map(k => {
      let item = {
        value: k.name,
        label: k.show_name ?? k.name,
        show_name: k.show_name,
        loc_show_name: k.loc_show_name ?? "无标签",
        org_show_name: k.org_show_name ?? "无标签",
        business_show_name: k.business_show_name ?? "无标签",
        leaf: false
      };
      return item;
    });
  } catch (error) {
    console.log(`分组列表错误: ${error}`);
  }
  return resList;
};
const getAddressOptions = async () => {
  let resList: CascaderOption[] = [];
  try {
    const data: any = await getAddressList();
    resList = ((data || {}).data || {}).affected_items.map((k: Record<string, any>) => ({
      value: String(k.id),
      label: k.show_name,
      leaf: true
    }));
  } catch (error) {
    console.log(`地址对象列表错误: ${error}`);
  }
  return resList;
};
const getTagOptions = async (selectedGroup: CascaderNodeValue) => {
  let resList: CascaderOption[] = [];
  try {
    const tagItems = await getTagList({ label_type: "component", pktrule_scope: selectedGroup });
    resList = ((tagItems || {}).data || {}).affected_items.map(k => ({
      value: String(k.id),
      label: k.show_name,
      leaf: true
    }));
  } catch (error) {
    console.log(`组件标签列表错误: ${error}`);
  }
  return resList;
};
const handleChangeObjectType = () => {
  formData.value.ip = "";
};
const handleChangeAlertType = (val: string | number | boolean) => {
  formRef.value.clearValidate();

  formData.value = Object.assign(
    {
      alert_policy_name: "",
      alert_type: "drop_packets",

      object_type: [],
      ip: "",
      direction: ["in"],
      alert_service: "",
      alert_frequency: 1,

      log_module: "",
      log_event: "",
      level: "",

      login_user: "",
      log_object: "",
      log_action: "",
      result: "failed",

      alert_level: "high",
      alert_notify: "system",

      notify_obj: "contact",
      contact: "",
      email: "",
      retry_times: 1,

      enable: true,
      description: ""
    },
    {
      alert_policy_name: formData.value.alert_policy_name,
      alert_type: val
    }
  );
};
const handleChangeDirection = () => {
  formData.value.alert_service = "";
};

const toPrev = () => {
  router.push(`/alarmCenter/alarmPolicy`);
};

const onSubmit = async () => {
  formRef.value.validate(async (valid: any) => {
    if (valid) {
      let params: Record<string, any> = {
        alert_type: formData.value.alert_type,
        alert_level: formData.value.alert_level,
        alert_notify: formData.value.alert_notify,
        alert_policy_state: formData.value.enable ? "enable" : "disable",
        description: formData.value.description
      };
      if (formData.value.alert_type === "drop_packets") {
        params = Object.assign(params, {
          alert_obj_type: formData.value.object_type[0],
          alert_obj: "",
          direction: formData.value.direction.length === 2 ? "all" : formData.value.direction[0],
          alert_service: formData.value.alert_service,
          alert_frequency: formData.value.alert_frequency
        });
        if (params.alert_obj_type === "agent") {
          params.alert_obj = `${formData.value.object_type[1]}/${formData.value.object_type[2]}`;
        } else if (params.alert_obj_type === "address") {
          params.alert_obj = formData.value.object_type[1];
        } else {
          params.alert_obj = formData.value.ip;
        }
      } else if (formData.value.alert_type === "system") {
        params = Object.assign(params, {
          log_module: formData.value.log_module,
          log_event: formData.value.log_event,
          level: formData.value.level
        });
      } else {
        params = Object.assign(params, {
          login_user: formData.value.login_user,
          log_object: formData.value.log_object,
          log_action: formData.value.log_action,
          result: formData.value.result
        });
      }

      if (formData.value.alert_notify === "email") {
        params = Object.assign(params, {
          retry_times: formData.value.retry_times,
          liaison: formData.value.notify_obj === "contact" ? formData.value.contact : formData.value.email
        });
      }

      let res: any;

      if (subFlag.value === 0) {
        try {
          params.alert_policy_name = formData.value.alert_policy_name;
          res = await addAlarmPolicy(params);
        } catch (error) {
          console.log(`新增告警策略错误: ${error}`);
        }
      } else {
        try {
          params.alert_policy_id = formData.value.alert_policy_id;
          res = await editAlarmPolicy(params);
        } catch (error) {
          console.log(`修改告警策略错误: ${error}`);
        }
      }

      if (res.message.includes("alert_policy.name")) {
        ElMessage({
          message: "策略保存失败: 规则名称不可重复",
          type: "error"
        });
      } else if (res.message.includes("smtp server")) {
        ElMessage({
          message: "策略保存失败: 使用邮箱通知前请先配置邮箱服务器",
          type: "error"
        });
      } else if (res.message.includes("liaison is invalid")) {
        // 邮箱格式错误或联系人ID不存在
        ElMessage({
          message: "策略保存失败: 邮箱通知联系人无效",
          type: "error"
        });
      } else if (res.message.includes("failed")) {
        ElMessage({
          message: "保存失败",
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
      return false;
    }
  });
};

const clear = () => {
  formRef.value.resetFields();

  let init = {};
  if (subFlag.value === 1) {
    const selectedItem = localGet("alarm-policy-edit");
    init = {
      alert_policy_id: selectedItem.id,
      alert_policy_name: selectedItem.name,
      alert_type: selectedItem.type
    };
  }
  formData.value = Object.assign(
    {
      alert_policy_name: "",
      alert_type: "drop_packets",

      object_type: [],
      ip: "",
      direction: ["in"],
      alert_service: "",
      alert_frequency: 1,

      log_module: "",
      log_event: "",
      level: "",

      login_user: "",
      log_object: "",
      log_action: "",
      result: "failed",

      alert_level: "high",
      alert_notify: "system",

      notify_obj: "contact",
      contact: "",
      email: "",
      retry_times: 1,

      enable: true,
      description: ""
    },
    init
  );
};

onUnmounted(() => {
  localRemove("alarm-policy-edit");
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
    padding-left: 20px;
    font-size: 12px;
    color: #9ea7b4;
  }
  .w300 {
    width: 300px;
  }
}
</style>

<style lang="scss">
.alarm-policy-warp {
  .w300 {
    width: 300px;
  }
  .w80 {
    width: 80px;
  }
  .el-input.w220 {
    width: 220px !important;
  }
}
</style>
