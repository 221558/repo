<template>
  <div class="title">
    <img :src="itemTitle" />
    <div class="label">{{ title }}</div>
  </div>
</template>

<script setup lang="ts" name="itemHeader">
import itemTitle from "@/assets/images/screen/item-title.png";
defineProps({
  title: {
    type: String,
    default: ""
  }
});
</script>

<style scoped lang="scss">
.title {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  height: 60em;
  .label {
    font-size: 24em;
    color: #4fb0d3;
  }
  img {
    width: 26em;
    height: 18em;
    margin: 0 25em;
  }
}
</style>
