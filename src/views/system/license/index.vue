<template>
  <div class="card license-container">
    <div class="license-label pb10">
      <span class="title pr15">密钥授权</span>
      <span class="label_desc">复制激活码生成授权密钥，导入密钥进行授权</span>
    </div>
    <el-form label-width="100px">
      <el-form-item label="激活码:">
        <span>{{ state.code }}</span>
        <el-tooltip class="box-item" effect="dark" content="复制激活码" placement="left">
          <el-button class="ml10" type="primary" :icon="CopyDocument" link v-copy="state.code"> </el-button>
        </el-tooltip>
      </el-form-item>
      <el-form-item label="授权密钥:">
        <el-input v-model="secretKey" class="password-warp" />
        <el-button class="ml10" plain type="primary" @click="exportSecret"> 导入</el-button>
      </el-form-item>
    </el-form>
    <hr class="spread" />
    <div>
      <el-row class="mb10">
        <el-col :span="12" class="title">授权列表（{{ state.list.length }}）</el-col>
        <el-col :span="12" style="text-align: right">
          <el-button plain type="primary" @click="getLicenseList"> 刷新</el-button>
        </el-col>
      </el-row>
      <PageTable :columns="columns" :data="state.list" :is-search="false" :is-edit="false" :is-del="false"> </PageTable>
    </div>
  </div>
</template>

<script setup lang="ts" name="licenseObject">
import { onMounted, reactive, ref } from "vue";
import { CopyDocument } from "@element-plus/icons-vue";
import { ColumnProps } from "@/components/PageTable/interface";
import PageTable from "@/components/PageTable/index.vue";
import { formatDate } from "@/utils";
import { restartClusterOrManager } from "@/utils/manager";
import { exportSecretKey, getCode, toLicenseList } from "@/api/modules/system";
import { ElMessage } from "element-plus";

const secretKey = ref("");
const state = reactive<Record<string, any>>({
  list: [],
  code: ""
});
onMounted(async () => {
  getActiveCode();
  getLicenseList();
});
const getLicenseList = async () => {
  try {
    const data: any = await toLicenseList();
    state.list = ((data || {}).data || {}).affected_items;
  } catch (error) {
    console.log(`查询授权列表失败: ${error}`);
  }
};
const getActiveCode = async () => {
  const res: any = await getCode();
  if (res.message) {
    state.code = res.message;
  }
};

const exportSecret = async () => {
  try {
    if (!secretKey.value) {
      ElMessage({
        message: "请输入授权密钥！",
        type: "error"
      });
      return false;
    }
    const res: any = await exportSecretKey({ active_code: state.code, auth_code: secretKey.value });
    if (res.message.includes("failed")) {
      ElMessage({
        message: "导入失败",
        type: "error"
      });
    } else {
      secretKey.value = "";
      ElMessage({
        message: "授权密钥导入成功，将自动重启管理器，请稍等",
        type: "success"
      });
      await restartClusterOrManager();
    }
  } catch (error) {
    console.log(`导入密钥失败: ${error}`);
  }
};
const columns = reactive<ColumnProps[]>([
  {
    field: "authnum",
    name: "数量"
  },
  {
    field: "authtime",
    name: "到期时间",
    render: (item: Record<string, any>) => formatDate(new Date(item.authtime))
  },
  {
    field: "deploynum",
    name: "部署数量"
  }
]);
</script>
<style scoped lang="scss">
.license-container {
  .license-label span {
    line-height: 32px;
  }
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
  .password-warp {
    flex-grow: 1;
  }
}
</style>
<style lang="scss">
.license-container {
  .el-form-item__content {
    flex-wrap: nowrap;
  }
}
</style>
