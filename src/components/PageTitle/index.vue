<template>
  <div class="page-title-warp">
    <h3>{{ props.title }}</h3>
    <el-tooltip effect="dark" :content="props.description" placement="right" v-if="props.description">
      <el-button :icon="InfoFilled" type="primary" text circle />
    </el-tooltip>
    <slot></slot>
  </div>
</template>

<script setup lang="ts" name="PageTitle">
import { InfoFilled } from "@element-plus/icons-vue";

type Props = {
  title?: string;
  description?: string;
};

const props = withDefaults(defineProps<Props>(), {
  title: "",
  description: ""
});
</script>

<style scoped lang="scss">
.page-title-warp {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 12px;
  border-bottom: 1px solid #eeeff1;
  h3 {
    margin: 15px 0;
  }
}
</style>
