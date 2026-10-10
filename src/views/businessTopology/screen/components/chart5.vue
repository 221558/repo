<template>
  <itemHeader title="流量阻断告警" />
  <div class="list">
    <Vue3SeamlessScroll class="seamless" :list="list" :hover="true" :step="0.4" :is-rem-unit="true" :wheel="true">
      <div v-for="(item, index) in list" :key="index" class="content">
        <el-tooltip effect="dark" :content="item.content" placement="bottom">
          <span>{{ item.content }}</span>
        </el-tooltip>
      </div>
    </Vue3SeamlessScroll>
  </div>
</template>

<script setup lang="ts" name="chart5">
import { onMounted, ref } from "vue";
import itemHeader from "./itemHeader.vue";
import { getChart5 } from "@/api/modules/screen";
import { Vue3SeamlessScroll } from "vue3-seamless-scroll";
let list = ref<Record<string, any>[]>([]);

onMounted(async () => {
  try {
    const res = await getChart5();
    const affected_items = ((res || {}).data || {}).affected_items;
    list.value = affected_items.map((item: Record<string, any>) => ({
      content: `${item.ip}（${item.group}，${item.tag === "empty" ? "无" : item.tag}）产生 ${item.count} 次阻断`
    }));
  } catch (error) {
    console.log(`chart5查询错误: ${error}`);
  }
});
</script>
<style scoped lang="scss">
.list {
  height: calc(100% - 60em);
  .content {
    display: flex;
    place-items: center center;
    height: 40px;
    padding: 0 20em;
    margin: 0 20em 10px;
    line-height: 40px;
    background-color: #0b3057;
    > span {
      display: inline-block;
      flex: 1;
      width: 100%;
      overflow: hidden;
      font-size: 14em;
      text-overflow: ellipsis;
      white-space: nowrap;
      cursor: pointer;
    }
  }
  span {
    color: #ffffff;
  }
}
.seamless {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
