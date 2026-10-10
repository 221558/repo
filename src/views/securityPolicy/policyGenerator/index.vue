<template>
  <div class="card generator-container">
    <div class="steps-warp">
      <div class="btn-warp">
        <el-button v-if="generatorState.currentStep > 1" @click="toPre">上一步</el-button>
      </div>
      <Steps />
      <div class="btn-warp" />
    </div>
    <div class="step-warp pt10">
      <Step1 v-if="generatorState.currentStep === 1" />
      <Step2 v-if="generatorState.currentStep === 2" />
      <Step3 v-if="generatorState.currentStep === 3" />
      <Step4 v-if="generatorState.currentStep === 4" />
    </div>
  </div>
</template>

<script setup lang="ts" name="policyGenerator">
import { onBeforeMount } from "vue";
import { useRoute } from "vue-router";
import { generatorState, createState } from "./state";
import { getGroupList, getTagList } from "@/api/modules/assets";
import Steps from "./components/steps.vue";
import Step1 from "./components/step1.vue";
import Step2 from "./components/step2.vue";
import Step3 from "./components/step3.vue";
import Step4 from "./components/step4.vue";

const route = useRoute();

onBeforeMount(async () => {
  Object.assign(generatorState, createState());
  await getInitList();
  if (route.query.auto) {
    const selectedGroup = generatorState.groupsOptions.find((k: Record<string, any>) => k.id === route.query.auto) ?? {};
    generatorState.selectedGroup = selectedGroup;
  }
});

const getInitList = async () => {
  try {
    const tagItems = await getTagList({ label_type: "loc" });
    let tagList = ((tagItems || {}).data || {}).affected_items.map(k => ({
      value: k.id,
      label: k.show_name,
      type: "loc"
    }));
    tagList.unshift({ value: "no_loc", label: "不限位置", type: "loc" });
    generatorState.tagList1 = tagList;
  } catch (error) {
    console.log(`位置标签列表错误: ${error}`);
  }

  try {
    const tagItems = await getTagList({ label_type: "org" });
    let tagList = ((tagItems || {}).data || {}).affected_items.map(k => ({
      value: k.id,
      label: k.show_name,
      type: "org"
    }));
    tagList.unshift({ value: "no_org", label: "不限组织", type: "org" });
    generatorState.tagList2 = tagList;
  } catch (error) {
    console.log(`组织标签列表错误: ${error}`);
  }

  try {
    const tagItems = await getTagList({ label_type: "business" });
    let tagList = ((tagItems || {}).data || {}).affected_items.map(k => ({
      value: k.id,
      label: k.show_name,
      type: "business"
    }));
    tagList.unshift({ value: "no_business", label: "不限业务", type: "business" });
    generatorState.tagList3 = tagList;
  } catch (error) {
    console.log(`业务标签列表错误: ${error}`);
  }

  try {
    const groups = await getGroupList({ limit: 0 });
    const groupsOptions = ((groups || {}).data || {}).affected_items.map(k => {
      let label = k.show_name ?? k.name;
      return {
        id: k.name,
        label,
        loc_show_name: k.loc_show_name ?? "无标签",
        org_show_name: k.org_show_name ?? "无标签",
        business_show_name: k.business_show_name ?? "无标签",
        loc: k.loc,
        org: k.org,
        business: k.business,
        count: k.count
      };
    });
    generatorState.groupsOptions = groupsOptions;
  } catch (error) {
    console.log(`分组列表错误: ${error}`);
  }
};

const toPre = () => {
  generatorState.currentStep--;
};
</script>

<style scoped lang="scss">
.generator-container {
  height: 100%;
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
.generator-container {
  .is-finish {
    .el-step__icon {
      background-color: #2d8cf0;
    }
    .el-step__icon-inner {
      color: #ffffff;
    }
  }
  .el-input:not(.el-pagination .el-input, .el-dialog .el-input),
  .el-textarea {
    width: 350px;
  }
  .detail-tag {
    display: flex;
    align-items: center;
  }
  .rate-title {
    margin: 0 0 12px;
    font-weight: bolder;
    color: #1a1c21;
  }
  .rate-count {
    display: flex;
    justify-content: space-between;
    .in-rate {
      color: #017d73;
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
