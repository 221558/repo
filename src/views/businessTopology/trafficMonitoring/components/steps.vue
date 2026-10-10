<template>
  <el-steps :active="policyState.currentStep" align-center process-status="wait">
    <el-step v-for="(step, index) in policyState.stepList" :key="`steps_${index}`" :title="step" />
  </el-steps>
</template>

<script setup lang="ts" name="steps">
import { policyState } from "../state";
</script>
