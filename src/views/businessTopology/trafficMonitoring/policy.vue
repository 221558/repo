<template>
  <div class="card traffic-policy-container">
    <div class="title mb10">
      <el-button link type="info" @click="toPrev">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="pl10">流量匹配策略</span>
    </div>
    <div class="steps-warp">
      <div class="btn-warp">
        <el-button v-if="policyState.currentStep > 1" @click="toPre">上一步</el-button>
      </div>
      <Steps />
      <div class="btn-warp" />
    </div>
    <div class="step-warp pt10">
      <Step1 v-if="policyState.currentStep === 1" />
      <Step2 v-if="policyState.currentStep !== 1" />
    </div>
  </div>
</template>

<script setup lang="ts" name="trafficPolicy">
import { onBeforeMount, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { localGet, localRemove } from "@/utils";
import { getTagList } from "@/api/modules/assets";
import { policyState, createState } from "./state";
import Steps from "./components/steps.vue";
import Step1 from "./components/step1.vue";
import Step2 from "./components/step2.vue";

onBeforeMount(async () => {
  const trafficItem = localGet("traffic-detail");
  const flowMatch = localGet("flow-match");
  let ruleList = [],
    stepList = ["预览策略规则"];
  if (flowMatch["in_rule"]) {
    ruleList.push(flowMatch["in_rule"]);
    stepList.push("存放入方向策略规则");
  }
  if (flowMatch["out_rule"]) {
    ruleList.push(flowMatch["out_rule"]);
    stepList.push("存放出方向策略规则");
  }
  Object.assign(policyState, createState(), { trafficItem, flowMatch, ruleList, stepList });
  getInitList();
});

const router = useRouter();

const toPrev = () => {
  router.push(`/businessTopology/trafficMonitoring`);
};

const toPre = () => {
  policyState.currentStep--;
};

const getInitList = async () => {
  Promise.all([
    getTagList({ label_type: "loc" }),
    getTagList({ label_type: "org" }),
    getTagList({ label_type: "business" })
  ]).then((values: Record<string, any>[]) => {
    let tagList1: Record<string, string>[] = [],
      tagList2: Record<string, string>[] = [],
      tagList3: Record<string, string>[] = [];

    tagList1 = ((values[0] || {}).data || {}).affected_items.map((k: Record<string, any>) => ({
      value: k.id,
      label: k.show_name,
      type: "loc"
    }));
    tagList1.unshift({ value: "no_loc", label: "不限位置", type: "loc" });
    policyState.tagList1 = tagList1;

    tagList2 = ((values[1] || {}).data || {}).affected_items.map((k: Record<string, any>) => ({
      value: k.id,
      label: k.show_name,
      type: "org"
    }));
    tagList2.unshift({ value: "no_org", label: "不限组织", type: "org" });
    policyState.tagList2 = tagList2;

    tagList3 = ((values[2] || {}).data || {}).affected_items.map((k: Record<string, any>) => ({
      value: k.id,
      label: k.show_name,
      type: "business"
    }));
    tagList3.unshift({ value: "no_business", label: "不限业务", type: "business" });
    policyState.tagList3 = tagList3;
  });
};

onUnmounted(() => {
  localRemove("traffic-detail");
  localRemove("flow-match");
});
</script>

<style scoped lang="scss">
.traffic-policy-container {
  height: 100%;
  .title {
    height: 30px;
    border-bottom: 1px solid #dcdfe6;
  }
  .steps-warp {
    display: flex;
    align-items: center;
    height: 120px;
    border-bottom: 1px solid #eeeff1;
    .btn-warp {
      width: 70px;
    }
    > div:not(.btn-warp) {
      flex-grow: 1;
    }
  }
  .step-warp {
    max-height: calc(100% - 121px);
  }
}
</style>

<style lang="scss">
.traffic-policy-container {
  .is-finish {
    .el-step__icon {
      background-color: #2d8cf0;
    }
    .el-step__icon-inner {
      color: #ffffff;
    }
  }
  .label_desc {
    padding-left: 5px;
    font-size: 12px;
    line-height: 20px;
    color: #9ea7b4;
  }
  .el-dialog {
    .el-input,
    .el-textarea {
      width: 225px;
    }
  }
}
</style>
