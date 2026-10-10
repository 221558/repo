<template>
  <div class="footer flx-center">
    <a href="https://github.com/HalseySpicy" target="_blank">{{ platform.footer_text }}</a>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getPlatform } from "@/api/modules/login";

const platform = ref({
  footer_text: ""
});

onMounted(async () => {
  const res = await getPlatform();
  platform.value = ((res || {}).data || {}).data;
});
</script>

<style scoped lang="scss">
@import "./index.scss";
</style>
