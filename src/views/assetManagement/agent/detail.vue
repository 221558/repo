<template>
  <div class="card detail-warp">
    <div class="title">
      <el-button link type="info" @click="toPrev">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="pl10">{{ `详情` }}</span>
    </div>
    <el-tabs tab-position="left" class="tabs-warp" v-model="activeName">
      <div v-if="(agentData.os || {}).name !== 'POD'" class="tabs-contain">
        <el-tab-pane label="基本信息" name="base"><Base :agent-data="agentData" /></el-tab-pane>
        <el-tab-pane label="网络接口" name="netiface">
          <Netiface v-if="activeName === 'netiface'" />
        </el-tab-pane>
        <el-tab-pane label="端口" name="port">
          <Port v-if="activeName === 'port'" />
        </el-tab-pane>
        <el-tab-pane label="网络设置" name="netaddr">
          <Netaddr v-if="activeName === 'netaddr'" />
        </el-tab-pane>
        <el-tab-pane label="策略规则" name="rule">
          <Rule v-if="activeName === 'rule'" />
        </el-tab-pane>
      </div>
      <div v-if="(agentData.os || {}).name === 'POD'" class="tabs-contain">
        <el-tab-pane label="基本信息" name="base"><BasePOD :agent-data="agentData" /></el-tab-pane>
        <el-tab-pane label="策略规则" name="rule">
          <Rule v-if="activeName === 'rule'" />
        </el-tab-pane>
      </div>
    </el-tabs>
  </div>
</template>

<script setup lang="ts" name="agentDetail">
import { ref, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { localGet, localRemove } from "@/utils";
import Base from "./base.vue";
import BasePOD from "./basePOD.vue";
import Netiface from "./netiface.vue";
import Port from "./port.vue";
import Netaddr from "./netaddr.vue";
import Rule from "./rule.vue";

const router = useRouter();
const route = useRoute();
const agentData = localGet("agent-detail");
const activeName = ref("base");

const toPrev = () => {
  router.push({
    path: `/assetManagement/agent`,
    query: {
      tab: route.query.tab
    }
  });
};

onUnmounted(() => {
  localRemove("agent-detail");
});
</script>

<style scoped lang="scss">
.detail-warp {
  display: flex;
  flex-direction: column;
  height: 100%;
  .title {
    height: 30px;
    border-bottom: 1px solid #dcdfe6;
  }
  .tabs-warp {
    flex-grow: 1;
  }
  .tabs-contain {
    height: 100%;
  }
}
</style>

<style lang="scss">
.detail-warp {
  .el-tabs__content,
  .el-tab-pane {
    height: 100%;
  }
  .detail-base-warp {
    height: calc(100% - 20px);
    padding: 10px 10px 10px 0;
    overflow-y: auto;
    .base-contain {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-start;
      font-size: 14px;
    }
  }
  .query-form {
    width: 40%;
  }
}
</style>
