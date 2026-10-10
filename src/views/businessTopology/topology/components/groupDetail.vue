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
        <p>组内代理： {{ topologyState.selectedDetail.count }}</p>
        <div class="detail-tag mt10">
          <span>位置：</span>
          <el-tag class="ml8">{{ topologyState.selectedDetail.loc_show_name }}</el-tag>
        </div>
        <div class="detail-tag mt10">
          <span>组织：</span>
          <el-tag class="ml8" type="success">{{ topologyState.selectedDetail.org_show_name }}</el-tag>
        </div>
        <div class="detail-tag mt10">
          <span>业务：</span>
          <el-tag class="ml8" type="warning">{{ topologyState.selectedDetail.business_show_name }}</el-tag>
        </div>
        <div class="descript-warp mt10">
          <span>描述：</span>
          <p>{{ topologyState.selectedDetail.description ?? "-" }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="groupDetail">
import { topologyState } from "../state";

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
