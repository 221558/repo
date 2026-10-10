<template>
  <itemHeader title="正常访问关系TOP10" />
  <el-carousel class="list" arrow="never">
    <el-carousel-item v-if="list1.length > 0">
      <div class="title">
        <span>来源IP</span>
        <span>目的IP</span>
        <span>服务</span>
        <span>流量数</span>
      </div>
      <div v-for="(item, index) in list1" :key="index" class="content">
        <span :title="item.srcip">{{ item.srcip }}</span>
        <span :title="item.destip">{{ item.destip }}</span>
        <span :title="item.service">{{ item.service }}</span>
        <span :title="item.count">{{ item.count }}</span>
      </div>
    </el-carousel-item>
    <el-carousel-item v-if="list2.length > 0">
      <div class="title">
        <span>来源IP</span>
        <span>目的IP</span>
        <span>服务</span>
        <span>流量数</span>
      </div>
      <div v-for="(item, index) in list2" :key="index" class="content">
        <span :title="item.srcip">{{ item.srcip }}</span>
        <span :title="item.destip">{{ item.destip }}</span>
        <span :title="item.service">{{ item.service }}</span>
        <span :title="item.count">{{ item.count }}</span>
      </div>
    </el-carousel-item>
  </el-carousel>
</template>

<script setup lang="ts" name="chart4">
import itemHeader from "./itemHeader.vue";
import { ref, onMounted } from "vue";
import { getChart9 } from "@/api/modules/screen";

let list1 = ref<Record<string, any>[]>([]);
let list2 = ref<Record<string, any>[]>([]);

onMounted(() => {
  getData();
});

const getData = async () => {
  let option1: Record<string, any>[] = [];
  let option2: Record<string, any>[] = [];
  try {
    const res: Record<string, any> = await getChart9();
    const affected_items = ((res || {}).data || {}).affected_items ?? [];

    option1 = affected_items.slice(0, 5);
    option2 = affected_items.slice(5, 10);
  } catch (error) {
    console.log(`chart9查询错误: ${error}`);
  }
  list1.value = option1;
  list2.value = option2;
};
</script>
<style scoped lang="scss">
.list {
  height: calc(100% - 75em);
  padding: 0 25em;
  margin: 15em auto 0;
  .title {
    display: flex;
    place-items: center center;
    height: 34em;
    font-weight: normal;
    line-height: 34em;
    background-color: rgb(33 129 194 / 20%);

    // border-top: 1px solid #223e60;
    // border-left: 1px solid #223e60;
    span {
      display: inline-block;
      flex-shrink: 0;
      font-size: 14em;
      color: #81c8f9;

      // border-right: 1px solid #223e60;
      // border-bottom: 1px solid #223e60;
    }
  }
  .content {
    display: flex;
    place-items: center center;
    height: 36em;
    line-height: 36em;
    border-left: 1px solid #223e60;
    span {
      display: inline-block;
      flex-shrink: 0;
      font-size: 14em;
      border-right: 1px solid #223e60;
      border-bottom: 1px solid #223e60;
    }
  }
  span {
    width: 25%;
    overflow: hidden;
    color: #ffffff;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
.seamless {
  width: 100%;
  height: calc(100% - 34em);
  overflow: hidden;
}
</style>
