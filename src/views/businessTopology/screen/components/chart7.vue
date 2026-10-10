<template>
  <itemHeader title="安全管理告警" />
  <div class="list">
    <Vue3SeamlessScroll class="seamless" :list="list" :hover="true" :step="0.4" :wheel="true">
      <div v-for="(item, index) in list" :key="index" class="content">
        <span class="time">{{ item.time }}</span>
        <span>{{ item.content }}</span>
      </div>
    </Vue3SeamlessScroll>
  </div>
</template>

<script setup lang="ts" name="chart7">
import itemHeader from "./itemHeader.vue";
import { reactive } from "vue";
import { Vue3SeamlessScroll } from "vue3-seamless-scroll";
let list = reactive<Record<string, any>[]>([
  { time: "2024-03-06 10:51:05", content: "异常登录" },
  { time: "2024-03-06 11:06:07", content: "流量多次异常" },
  { time: "2024-03-06 11:14:32", content: "异常登录" },
  { time: "2024-03-06 12:36:42", content: "异常登录" },
  { time: "2024-03-06 14:31:27", content: "服务异常关闭" }
]);
</script>
<style scoped lang="scss">
.list {
  height: calc(100% - 60em);
  .content {
    display: flex;
    place-items: center center;
    width: 100%;
    height: 40px;
    padding: 0 10px;
    margin-bottom: 10px;
    line-height: 40px;
    background-color: #0b3057;
    border-left: 3px solid #28cfff;
    .time {
      padding-right: 10px;
    }
  }
  span {
    font-size: 14em;
    color: #ffffff;
  }
}
.seamless {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
