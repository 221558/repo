<template>
  <el-steps :active="generatorState.currentStep" align-center process-status="wait">
    <el-step v-for="(step, index) in stepList" :key="`steps_${index}`" :title="step" />
  </el-steps>
</template>

<script setup lang="ts" name="steps">
import { reactive } from "vue";
import { generatorState } from "../state";

const stepList = reactive<string[]>(["选择工作组", "配置策略规则", "预览策略规则", "存放策略规则"]);
</script>
