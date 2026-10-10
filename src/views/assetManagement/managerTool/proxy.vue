<template>
  <div class="card">
    <div class="title mb10">
      <el-button link type="info" @click="toPrev">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="pl10">部署新代理</span>
    </div>
    <el-steps direction="vertical" :active="6" :space="30">
      <el-step>
        <template #title>
          <div class="step-title">选择操作系统</div>
        </template>
        <template #description>
          <el-radio-group v-model="os" class="mt10 mb10" @change="changeOs">
            <el-radio-button :label="1">
              Red Hat / CentOS / 中标麒麟 / BC-Linux / SUSE / Debian / Ubuntu / 银河麒麟
            </el-radio-button>
            <!-- <el-radio-button :label="2">Debian / Ubuntu / 银河麒麟</el-radio-button> -->
            <el-radio-button :label="3">Windows</el-radio-button>
            <el-radio-button :label="4">K8S集群</el-radio-button>
          </el-radio-group>
        </template>
      </el-step>
      <template v-if="os !== 4">
        <el-step>
          <template #title>
            <div class="step-title">为代理分组</div>
          </template>
          <template #description>
            <div class="step-label">选择一个现有主机分组。</div>
            <el-select class="mb18" v-model="group" placeholder="选择组" filterable style="width: 300px" clearable>
              <el-option
                v-for="item in state.groupList"
                :key="item.name"
                :label="item.show_name"
                :value="item.name"
                class="group-options"
              >
                <span>{{ item.show_name }}</span>
                <span>
                  <el-tag class="ml8">{{ item.loc_show_name ?? "无标签" }}</el-tag>
                  <el-tag class="ml8" type="success">{{ item.org_show_name ?? "无标签" }}</el-tag>
                  <el-tag class="ml8" type="warning">{{ item.business_show_name ?? "无标签" }}</el-tag>
                </span>
              </el-option>
            </el-select>
          </template>
        </el-step>
      </template>
      <template v-if="os === 4">
        <el-step>
          <template #title>
            <div class="step-title">输入镜像名称</div>
          </template>
          <template #description>
            <div class="step-label">输入K8S集群镜像名称。</div>
            <el-input class="mb18" v-model="k8sName" placeholder="镜像名称" style="width: 300px" />
          </template>
        </el-step>
        <el-step>
          <template #title>
            <div class="step-title">输入Pod CIDR（选填）</div>
          </template>
          <template #description>
            <div class="step-label">输入Kubernetes集群Pod CIDR范围。CIDR范围是一个IP地址块，用于分配给集群中的Pod。</div>
            <el-form ref="formRef" :model="CIDR" :rules="rules">
              <el-form-item prop="podCIDR">
                <el-input v-model="CIDR.podCIDR" placeholder="Pod CIDR" style="width: 300px" />
              </el-form-item>
            </el-form>
          </template>
        </el-step>
        <el-step>
          <template #title>
            <div class="step-title">输入Service CIDR（选填）</div>
          </template>
          <template #description>
            <div class="step-label">
              输入Kubernetes集群Service CIDR范围。创建Service时，Kubernetes会从此CIDR范围内选择IP分配给该Service。
            </div>
            <el-form ref="formRef" :model="CIDR" :rules="rules">
              <el-form-item prop="serviceCIDR">
                <el-input v-model="CIDR.serviceCIDR" placeholder="Service CIDR" style="width: 300px" />
              </el-form-item>
            </el-form>
          </template>
        </el-step>
      </template>
      <el-step :key="os">
        <template #title>
          <div class="step-title">安装并注册代理</div>
        </template>
        <template #description>
          <div class="tips">
            <template v-if="(os && os !== 4) || (os === 4 && k8sName)">
              <div class="pb10">您可以使用此命令在一个或多个主机上安装和注册代理。</div>
              <div class="cli">
                <code v-html="code" />
              </div>
            </template>
            <el-alert
              class="mt15"
              v-if="os === 3"
              :closable="false"
              title="您将需要管理员权限才能执行此安装。"
              type="info"
              show-icon
            />
            <el-alert v-if="os === 4 && !k8sName" :closable="false" title="请输入镜像名称。" type="warning" show-icon />
            <el-button
              class="mt10"
              type="primary"
              :icon="CopyDocument"
              v-copy="code"
              v-if="(os && os !== 4) || (os === 4 && k8sName)"
            >
              复制命令
            </el-button>

            <el-alert v-if="!os" :closable="false" title="请选择操作系统。" type="warning" show-icon />
          </div>
        </template>
      </el-step>
    </el-steps>
  </div>
</template>

<script setup lang="ts" name="managerToolProxy">
import { ArrowLeft, CopyDocument } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import { ref, watch, reactive, onMounted } from "vue";
import { getGroupList } from "@/api/modules/assets";

const router = useRouter();
const os = ref();
const group = ref("");
const k8sName = ref("");
const CIDR = reactive<Record<string, any>>({
  podCIDR: "",
  serviceCIDR: ""
});
const ip = ref(document.location.hostname);

const toPrev = () => {
  router.push(`/assetManagement/managerTool`);
};
const state = reactive<Record<string, any>>({
  groupList: []
});
const getInitList = async () => {
  try {
    const data = await getGroupList({ limit: 0 });
    state.groupList = ((data || {}).data || {}).affected_items;
  } catch (error) {
    console.log(`查询主机分组错误: ${error}`);
  }
};
const checkCIDR = (rule: any, value: any, callback: any) => {
  const reg =
    /^((?:(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\/([1-9]|[1-2]\d|3[0-1]))$/g;
  if (!value || reg.test(value)) {
    callback();
  } else {
    callback(new Error("CIDR格式不正确"));
  }
};
const rules = reactive<Record<string, any>>({
  podCIDR: [{ validator: checkCIDR, trigger: "blur" }],
  serviceCIDR: [{ validator: checkCIDR, trigger: "blur" }]
});

onMounted(() => {
  getInitList();
});

const changeOs = () => {
  group.value = "";
  k8sName.value = "";
  CIDR.podCIDR = "";
  CIDR.serviceCIDR = "";
};

let code = ref("");
watch([os, group, k8sName, CIDR], () => {
  if (os.value === 3) {
    code.value = `Invoke-WebRequest -Uri http://${ip.value}/download/tools.cmd -OutFile tools.cmd; .\\tools.cmd ${
      ip.value
    }; Invoke-WebRequest -Uri http://${
      ip.value
    }/download/agent-security-4.1.5-1.msi -OutFile agent-security.msi; ./agent-security.msi /q MANAGER_ADDRESS='${
      ip.value
    }' REGISTRATION_SERVER='${ip.value}'${group.value ? ` AGENT_GROUP='${group.value}'` : ""}`;
  }
  if (os.value === 1 || os.value === 2) {
    code.value = `curl -so install.sh http://${ip.value}/download/install.sh && sudo chmod 755 install.sh && sudo bash install.sh ${ip.value} ${group.value}`;
  }
  if (os.value === 4) {
    code.value = `curl -so daemonset-install.sh http://${
      ip.value
    }/download/daemonset-install.sh && sudo chmod 755 daemonset-install.sh && bash daemonset-install.sh ${ip.value} ${
      k8sName.value
    }${CIDR.podCIDR ? ` ${CIDR.podCIDR}` : ""}${CIDR.serviceCIDR ? ` ${CIDR.serviceCIDR}` : ""}`;
  }
});
</script>
<style scoped lang="scss">
.title {
  height: 30px;
  border-bottom: 1px solid #dcdfe6;
}
.step-title {
  color: #1a1c21;
}
.step-label {
  padding: 15px 0;
  font-size: 14px;
  color: #1a1c21;
}
.tips {
  padding: 20px 0;
  font-size: 14px;
  color: #1a1c21;
}
.cli {
  display: flex;
  height: auto;
  padding: 20px;
  text-align: left;
  letter-spacing: normal;
  background: #f5f7fa;
  .red-code {
    color: #b34f3b;
  }
  .green-code {
    color: #3b7d6a;
  }
}
.group-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
