<template>
  <div class="card">
    <div>
      <el-tag effect="dark" size="large" class="tool">
        <SvgIcon name="managertool" :icon-style="{ width: '40px', height: '40px' }" />
      </el-tag>
      <span class="pl30">安装工具</span>
    </div>
    <el-row class="mt40" :gutter="40">
      <el-col :span="12">
        <el-button type="primary" link @click="toProxy">代理下载</el-button>
        <div class="pt15">
          <div class="title pb10">方式一 安装包直接安装</div>
          网管员直接共享下载链接或安装包所在目录，提供安装包给公司内员工。员工对安装包进行下载拷贝安装
        </div>
      </el-col>
      <el-col :span="12">
        <el-button type="primary" link @click="toArrange">批量部署</el-button>
        <div class="pt15">
          <div class="title pb10">方式二 部署工具安装</div>
          域控制用户或者已知密码的主机，可使用部署工具远程安装。批量安装仅支持Linux操作系统。
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts" name="managerToolObject">
import SvgIcon from "@/components/SvgIcon/index.vue";
import { useRouter } from "vue-router";
const router = useRouter();
const toProxy = () => {
  router.push(`/assetManagement/managerTool/proxy`);
};
const toArrange = () => {
  router.push(`/assetManagement/managerTool/arrange`);
};
</script>
<style scoped lang="scss">
.tool {
  width: 56px;
  height: 56px;
}
.title {
  font-weight: bold;
}
</style>
