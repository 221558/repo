<template>
  <div>
    <div class="card param-container mb15 pb0">
      <el-form ref="formRef1" :model="form1" label-width="140px" :rules="rules1">
        <div class="mb15">
          <span class="title pr15">登录锁定</span>
          <span class="label_desc">配置登录锁定</span>
        </div>
        <el-form-item label="密码尝试次数:" prop="attempttimes">
          <el-input-number v-model="form1.attempttimes" :min="1" :step="1" />
          <span class="label_desc pl20">次</span>
        </el-form-item>
        <el-form-item label="锁定时间:" prop="lockedtimes">
          <el-input-number v-model="form1.lockedtimes" :min="1" :step="1" />
          <span class="label_desc pl20">分钟</span>
        </el-form-item>
        <hr class="spread" />
        <div class="mb15">
          <span class="title pr15">密码规则</span>
          <span class="label_desc">配置密码规则</span>
        </div>
        <el-form-item label="最小密码长度:" prop="pwdlen">
          <el-input-number v-model="form1.pwdlen" :min="8" :max="64" :step="1" />
          <span class="label_desc pl20">位</span>
        </el-form-item>
        <el-form-item label="密码强度规则:" prop="passwordrules">
          <el-checkbox-group v-model="form1.passwordrules">
            <el-checkbox label="upper">必须包含大写字母</el-checkbox>
            <el-checkbox label="lower">必须包含小写字母</el-checkbox>
            <el-checkbox label="num">必须包含数字字符</el-checkbox>
            <el-checkbox label="spechar">必须包含特殊字符</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <hr class="spread" />
        <div class="mb15">
          <span class="title pr15">登录黑名单</span>
          <span class="label_desc">配置登录IP黑名单，多条以英文逗号分隔</span>
        </div>
        <el-form-item label="登录IP黑名单:" prop="blackloggingip">
          <el-input v-model="form1.blackloggingip" class="input-warp" type="textarea" rows="2" />
        </el-form-item>
        <hr class="spread" />
        <el-form-item label-width="0px">
          <el-button type="primary" @click="onSubmit1"> 保存</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card param-container mb15 pb0">
      <el-form ref="formRef2" :model="form2" label-width="140px" :rules="rules2">
        <div class="mb15">
          <span class="title pr15">日志保留天数</span>
          <span class="label_desc">配置连接分析、阻断日志保留天数</span>
        </div>
        <el-form-item label="保留天数:" prop="logkeepdays">
          <el-input-number v-model="form2.logkeepdays" :min="1" :step="1" :max="30" />
          <span class="label_desc pl20">天</span>
        </el-form-item>
        <hr class="spread" />
        <el-form-item label-width="0px">
          <el-button type="primary" @click="onSubmit2">保存</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card param-container mb15 pb0">
      <el-form :model="form3" label-width="140px">
        <div class="mb15">
          <span class="title pr15">操作审批配置</span>
          <span class="label_desc">配置操作审批流程开关</span>
        </div>
        <el-form-item label="操作审批:" prop="enable">
          <el-switch v-model="form3.enable" @change="handleChangeWorkOrderSwitch" />
        </el-form-item>
      </el-form>
    </div>

    <div class="card param-container mb15 pb0">
      <el-form ref="formRef4" :model="form4" label-width="140px" :rules="rules4">
        <div class="mb15">
          <span class="title pr15">邮箱服务配置</span>
          <span class="label_desc">配置告警邮箱通知的发送邮箱服务器信息</span>
        </div>
        <el-form-item label="SMTP服务器地址:" prop="smtp_server">
          <el-input v-model="form4.smtp_server" class="input-warp" />
        </el-form-item>
        <el-form-item label="SMTP服务器端口:" prop="smtp_port">
          <el-input v-model="form4.smtp_port" class="input-warp" />
        </el-form-item>
        <el-form-item label="发件人邮箱:" prop="email_from">
          <el-input v-model="form4.email_from" class="input-warp" />
        </el-form-item>
        <el-form-item label="SMTP密码:" prop="smtp_password">
          <el-input v-model="form4.smtp_password" type="password" class="input-warp" show-password />
        </el-form-item>
        <hr class="spread" />
        <el-form-item label-width="0px">
          <el-button type="primary" @click="onSubmit4">保存</el-button>
          <el-button @click="toTest">测试连接</el-button>
        </el-form-item>
      </el-form>

      <el-dialog
        v-model="dialogVisibleEmailTest"
        title="测试连接"
        width="400px"
        class="email_test_dialog"
        draggable
        @close="toCloseEmailTest"
        :close-on-press-escape="false"
        :close-on-click-modal="false"
      >
        <el-form ref="formRef4Test" :model="form4Test" label-width="100px" :rules="rules4Test" v-loading="emailTestLoading">
          <el-form-item label="收件人邮箱:" prop="email_to">
            <el-input v-model="form4Test.email_to" />
          </el-form-item>
          <el-form-item label="测试结果:" v-show="form4Test.result">
            <span :class="{ result_green: form4Test.result === '测试连接成功', result_red: form4Test.result === '测试连接失败' }">
              {{ form4Test.result }}
            </span>
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="toCloseEmailTest">关闭</el-button>
            <el-button type="primary" @click="onSubmit4Test">连接</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts" name="paramsObject">
import { onMounted, reactive, ref, nextTick } from "vue";
import {
  getLoginConfig,
  getManagerConfig,
  toWebLoggingConfig,
  toManagerConfig,
  getEmailConfig,
  toEmailConfig,
  toEmailTest
} from "@/api/modules/system";
import { getWorkOrderSwitch, operWorkOrderSwitch } from "@/api/modules/taskCenter";
import { ElMessageBox, ElMessage } from "element-plus";
import { checkIp, checkNumber, checkPort, checkEmail } from "@/utils/eleValidate";
import { filterQueryForm } from "@/utils";

const formRef1 = ref();
const formRef2 = ref();
const formRef4 = ref();
const formRef4Test = ref();
const form1 = reactive<Record<string, any>>({
  attempttimes: 1,
  blackloggingip: "",
  lockedtimes: 1,
  passwordrules: ["upper", "lower", "num"],
  pwdlen: 1
});
const checkPassword = (rule: any, value: any, callback: any) => {
  if (form1.passwordrules.length >= 3) {
    callback();
  } else {
    callback(new Error("密码强度规则请至少选择3项"));
  }
};
const rules1 = reactive<Record<string, any>>({
  attempttimes: [
    { required: true, message: "请输入密码尝试次数", trigger: "blur" },
    { validator: checkNumber, trigger: "blur" }
  ],
  lockedtimes: [
    { required: true, message: "请输入锁定时间", trigger: "blur" },
    { validator: checkNumber, trigger: "blur" }
  ],
  passwordrules: [
    { required: true, type: "array", message: "请勾选密码强度规则", trigger: "change" },
    { validator: checkPassword, trigger: "change" }
  ],
  pwdlen: [
    { required: true, message: "请输入密码最小长度", trigger: "blur" },
    { validator: checkNumber, trigger: "blur" }
  ],
  blackloggingip: [
    { validator: (rule: any, value: any, callback: any) => checkIp(rule, value, callback, false), trigger: "blur" }
  ]
});

const form2 = reactive<Record<string, any>>({
  logkeepdays: 1
});
const rules2 = reactive<Record<string, any>>({
  logkeepdays: [{ required: true, message: "请输入保留天数", trigger: "blur" }]
});

const form3 = reactive<Record<string, any>>({
  enable: false
});

const form4 = reactive<Record<string, any>>({
  smtp_server: "",
  smtp_port: "",
  email_from: "",
  smtp_password: ""
});
const rules4 = reactive<Record<string, any>>({
  smtp_server: [
    { required: true, message: "请输入SMTP服务器地址", trigger: "blur" },
    { validator: (rule: any, value: any, callback: any) => checkIp(rule, value, callback), trigger: "blur" }
  ],
  smtp_port: [
    { required: true, message: "请输入SMTP服务器端口", trigger: "blur" },
    { validator: (rule: any, value: any, callback: any) => checkPort(rule, value, callback), trigger: "blur" }
  ],
  email_from: [
    { required: true, message: "请输入发件人邮箱", trigger: "blur" },
    { validator: checkEmail, trigger: "blur" }
  ],
  smtp_password: [{ required: true, message: "请输入SMTP密码", trigger: "blur" }]
});
const dialogVisibleEmailTest = ref(false);
const emailTestLoading = ref(false);
const form4Test = ref<Record<string, any>>({
  email_to: "",
  result: ""
});
const rules4Test = reactive<Record<string, any>>({
  email_to: [
    { required: true, message: "请输入收件人邮箱", trigger: "blur" },
    { validator: checkEmail, trigger: "blur" }
  ]
});

const toTest = () => {
  formRef4.value.validate(async (valid: any) => {
    if (valid) {
      dialogVisibleEmailTest.value = true;
      nextTick(() => formRef4Test.value.clearValidate());
    } else {
      return false;
    }
  });
};
const toCloseEmailTest = () => {
  dialogVisibleEmailTest.value = false;
  form4Test.value = {
    email_to: "",
    result: ""
  };
};

const onSubmit1 = () => {
  formRef1.value.validate(async (valid: any) => {
    if (valid) {
      try {
        let { attempttimes, blackloggingip, lockedtimes, passwordrules, pwdlen } = form1;
        const res: any = await toWebLoggingConfig({
          attempttimes,
          lockedtimes,
          blackloggingip,
          pwdlen,
          passwordrules: passwordrules.join(",")
        });
        if (res.message.includes("failed")) {
          ElMessage({
            message: "保存失败",
            type: "error"
          });
        } else {
          ElMessage({
            message: "保存成功",
            type: "success"
          });
          webLoggingConfig();
        }
      } catch (error) {
        console.log(`配置登录相关配置失败: ${error}`);
      }
    } else {
      return false;
    }
  });
};
const onSubmit2 = () => {
  formRef2.value.validate(async (valid: any) => {
    if (valid) {
      try {
        let { logkeepdays } = form2;
        const params = {
          policy: {
            phases: {
              hot: {
                min_age: "0ms",
                actions: {
                  rollover: {
                    max_age: "1d"
                  }
                }
              },
              delete: {
                min_age: `${logkeepdays - 1}d`, // 天数-1拼接d
                actions: {
                  delete: {}
                }
              }
            }
          }
        };
        await toManagerConfig(params);
        ElMessage({
          message: "保存成功",
          type: "success"
        });
      } catch (error) {
        console.log(`配置日志相关配置失败: ${error}`);
      }
    } else {
      return false;
    }
  });
};
const handleChangeWorkOrderSwitch = (val: string | number | boolean) => {
  ElMessageBox.confirm(
    `${
      val
        ? "若开启操作审批，系统中进行告警中心、资产管理、安全策略相关操作时需要提交工单，工单审批后才会生效。是否开启操作审批?"
        : "是否关闭操作审批?"
    }`,
    "温馨提示",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
      draggable: true
    }
  )
    .then(async () => {
      await operWorkOrderSwitch({ work_order_switch: val ? "enable" : "disable" });
      ElMessage({
        type: "success",
        message: "保存成功"
      });
    })
    .catch(() => {
      form3.enable = !val;
    });
};
const onSubmit4 = () => {
  formRef4.value.validate(async (valid: any) => {
    if (valid) {
      try {
        const params = filterQueryForm(form4);
        await toEmailConfig(params);
        ElMessage({
          message: "保存成功",
          type: "success"
        });
      } catch (error) {
        console.log(`配置邮箱服务配置失败: ${error}`);
      }
    } else {
      return false;
    }
  });
};
const onSubmit4Test = () => {
  formRef4Test.value.validate(async (valid: any) => {
    if (valid) {
      emailTestLoading.value = true;
      try {
        const params = {
          smtp_server: form4.smtp_server,
          smtp_port: form4.smtp_port,
          email_from: form4.email_from,
          email_to: form4Test.value.email_to,
          smtp_password: form4.smtp_password
        };
        const data: any = await toEmailTest(params);
        if (data.message.includes("success")) {
          form4Test.value.result = "测试连接成功";
        } else {
          form4Test.value.result = "测试连接失败";
        }
      } catch (error) {
        console.log(`邮箱测试失败: ${error}`);
      }
      emailTestLoading.value = false;
    } else {
      return false;
    }
  });
};
const webLoggingConfig = async () => {
  try {
    const data: any = await getLoginConfig();
    let { attempttimes, blackloggingip, lockedtimes, passwordrules, pwdlen } =
      (((data || {}).data || {}).affected_items || [])[0] || {};
    form1.attempttimes = attempttimes - 0;
    form1.blackloggingip = blackloggingip;
    form1.lockedtimes = lockedtimes - 0;
    form1.passwordrules = (passwordrules && passwordrules.split(",")) || [];
    form1.pwdlen = pwdlen - 0;
  } catch (error) {
    console.log(`查询登录相关配置失败: ${error}`);
  }
};
const managerConfig = async () => {
  try {
    const data: any = await getManagerConfig();
    let logkeepdays = (((((data || {})["filebeat"] || {}).policy || {}).phases || {}).delete || {}).min_age;
    form2.logkeepdays = parseInt(logkeepdays) + 1;
  } catch (error) {
    console.log(`查询日志相关配置失败: ${error}`);
  }
};
const workOrderSwitch = async () => {
  try {
    const data: any = await getWorkOrderSwitch();
    form3.enable = data.work_order_switch === "enable" ? true : false;
  } catch (error) {
    console.log(`查询操作审批配置失败: ${error}`);
  }
};
const emailConfig = async () => {
  try {
    const data: any = await getEmailConfig();
    form4.smtp_server = data.smtp_server;
    form4.smtp_port = data.smtp_port;
    form4.email_from = data.from;
  } catch (error) {
    console.log(`查询邮箱服务配置失败: ${error}`);
  }
};

onMounted(async () => {
  webLoggingConfig();
  managerConfig();
  workOrderSwitch();
  emailConfig();
});
</script>
<style scoped lang="scss">
.param-container {
  .spread {
    height: 1px;
    margin: 20px 0;
    border: none;
    border-top: 1px solid #e0e3e7;
  }
  .label_desc {
    padding-left: 5px;
    font-size: 12px;
    color: #9ea7b4;
  }
  .input-warp {
    width: 300px !important;
  }
  .result_green {
    color: #67c23a;
  }
  .result_red {
    color: #f56c6c;
  }
}
</style>
<style lang="scss">
.param-container {
  .el-alert__content {
    width: 100% !important;
  }
  .email_test_dialog {
    height: 280px;
  }
}
</style>
