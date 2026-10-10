<template>
  <div class="detail-tag">
    <span>工作组：</span>
    <el-select v-model="generatorState.selectedGroup" value-key="id" placeholder="请选择生成策略的工作组">
      <el-option
        v-for="item in generatorState.groupsOptions"
        :key="`groupOptions_${item.id}`"
        :label="item.label"
        :value="item"
        class="group-options"
      >
        <span>{{ item.label }}</span>
        <span>
          <el-tag class="ml8">{{ item.loc_show_name ?? "无标签" }}</el-tag>
          <el-tag class="ml8" type="success">{{ item.org_show_name ?? "无标签" }}</el-tag>
          <el-tag class="ml8" type="warning">{{ item.business_show_name ?? "无标签" }}</el-tag>
        </span>
      </el-option>
    </el-select>
  </div>
  <div v-if="generatorState.selectedGroup.id">
    <div class="detail-tag mt20">
      <span>{{ generatorState.selectedGroup.label }}：</span>
      <el-tag class="ml8">{{ generatorState.selectedGroup.loc_show_name }}</el-tag>
      <el-tag class="ml8" type="success">{{ generatorState.selectedGroup.org_show_name }}</el-tag>
      <el-tag class="ml8" type="warning">{{ generatorState.selectedGroup.business_show_name }}</el-tag>
      <div :style="{ flexGrow: 1 }" />
      <span>工作负载：{{ generatorState.selectedGroup.count }}</span>
    </div>
    <div v-for="(item, index) in state.coverList" :key="`rate_${index}`" class="card mt10" v-loading="state.loading">
      <p class="rate-title">{{ item.title }}：{{ state.coverRes[item.coverRateField] }}%</p>
      <el-progress :percentage="state.coverRes[item.coverRateField]" :show-text="false" color="#017D73" :stroke-width="10" />
      <div class="rate-count mt5">
        <span class="in-rate">{{ state.coverRes[item.matchField] }}</span>
        <span>{{ state.coverRes[item.unmatchField] }}</span>
      </div>
      <div class="rate-count mt5">
        <span>匹配策略的连接关系</span>
        <span>未匹配策略的连接关系</span>
      </div>
      <div class="rate-footer mt5">
        <el-button type="primary" @click="toStep2(item.type)">开始配置</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="step1">
import { reactive, onMounted, watch } from "vue";
import { generatorState } from "../state";
import { step1GetCoverage } from "@/api/modules/policyGenerator";
import { getTagList } from "@/api/modules/assets";

const state = reactive<Record<string, any>>({
  coverList: [
    {
      type: "in",
      title: "范围内策略覆盖率",
      coverRateField: "inRate",
      matchField: "inMatch",
      unmatchField: "inUnMatch"
    },
    {
      type: "out",
      title: "范围外策略覆盖率",
      coverRateField: "outRate",
      matchField: "outMatch",
      unmatchField: "outUnMatch"
    }
  ],
  coverRes: {
    inRate: 0,
    inMatch: "0",
    inUnMatch: "0",
    outRate: 0,
    outMatch: "0",
    outUnMatch: "0"
  },
  loading: false
});

onMounted(() => {
  if (generatorState.selectedGroup.id) {
    toGetCoverage(generatorState.selectedGroup);
  }
});

watch(
  () => generatorState.selectedGroup,
  () => {
    if (generatorState.selectedGroup.id) {
      toGetCoverage(generatorState.selectedGroup);
    }
  }
);

const toGetCoverage = async (item: Record<string, any>) => {
  state.loading = true;
  try {
    const resItems = await step1GetCoverage(item.id);
    const res = ((resItems || {}).data || {}).affected_items[0];
    state.coverRes = {
      inRate: res.coverage_in,
      inMatch: res.cover_in_num,
      inUnMatch: res.uncover_in_num,
      outRate: res.coverage_out,
      outMatch: res.cover_out_num,
      outUnMatch: res.uncover_out_num
    };
  } catch (error) {
    console.log(`覆盖率查询错误: ${error}`);
  }
  state.loading = false;
};

const getTagProvider = async () => {
  try {
    const tagItems = await getTagList({ label_type: "component", pktrule_scope: generatorState.selectedGroup.id });
    const tagList = ((tagItems || {}).data || {}).affected_items.map(k => ({
      value: k.id,
      label: k.show_name
    }));
    tagList.unshift({
      value: "any",
      label: "不限"
    });
    generatorState.providerOptions = tagList;
  } catch (error) {
    console.log(`服务者组件标签列表错误: ${error}`);
  }
};

const toStep2 = async (type: string) => {
  generatorState.areaType = type;
  await getTagProvider();
  generatorState.currentStep = 2;
};
</script>

<style scoped lang="scss">
.rate-footer {
  display: flex;
  flex-direction: row-reverse;
}
.group-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
