<template>
  <div class="button">
    <span>{{ text }}</span>
  </div>
</template>

<script setup lang="ts" name="itemButton">
defineProps({
  text: {
    type: String,
    default: ""
  }
});
</script>

<style scoped lang="scss">
.button {
  width: auto;
  max-width: 140em;
  height: 40em;
  line-height: 40em;
  color: rgb(255 255 255 / 70%);
  text-align: center;
  cursor: pointer;
  background: url("@/assets/images/screen/item-button-bg-1.png") no-repeat 0 0 / 100% 100%;
  span {
    font-size: 16em;
  }
}
</style>
