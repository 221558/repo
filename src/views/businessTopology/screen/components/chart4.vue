<template>
  <itemHeader title="工作负载资源消耗Top10" />
  <div class="tab">
    <itemButton text="CPU" @click="changeTab('cpu')" :class="isActive === 'cpu' ? 'active' : ''" />
    <itemButton text="内存" @click="changeTab('mem')" :class="isActive === 'mem' ? 'active' : ''" />
  </div>
  <el-carousel class="list" arrow="never">
    <el-carousel-item v-if="list1.length > 0">
      <div class="title">
        <span>IP</span>
        <span>工作组</span>
        <span>组件标签</span>
        <span>{{ isActive === "cpu" ? "CPU利用率" : "内存利用率" }}</span>
      </div>
      <div v-for="(item, index) in list1" :key="index" class="content">
        <span :title="item.ip">{{ item.ip }}</span>
        <span :title="item.group">{{ item.group }}</span>
        <span :title="item.tag">{{ item.tag }}</span>
        <span :title="item.rate">{{ item.rate }}</span>
      </div>
    </el-carousel-item>
    <el-carousel-item v-if="list2.length > 0">
      <div class="title">
        <span>IP</span>
        <span>工作组</span>
        <span>组件标签</span>
        <span>{{ isActive === "cpu" ? "CPU利用率" : "内存利用率" }}</span>
      </div>
      <div v-for="(item, index) in list2" :key="index" class="content">
        <span :title="item.ip">{{ item.ip }}</span>
        <span :title="item.group">{{ item.group }}</span>
        <span :title="item.tag">{{ item.tag }}</span>
        <span :title="item.rate">{{ item.rate }}</span>
      </div>
    </el-carousel-item>
  </el-carousel>
</template>

<script setup lang="ts" name="chart4">
import itemHeader from "./itemHeader.vue";
import itemButton from "./itemButton.vue";
import { ref, onMounted } from "vue";
import { getChart4 } from "@/api/modules/screen";

let list1 = ref<Record<string, any>[]>([]);
let list2 = ref<Record<string, any>[]>([]);
const isActive = ref("cpu");

onMounted(() => {
  getData();
});

const getData = async () => {
  let option1: Record<string, any>[] = [];
  let option2: Record<string, any>[] = [];
  try {
    const res: Record<string, any> = await getChart4({ resource_type: isActive.value });
    const detail = (res || {}).data.filter((item: Record<string, any>) => item[isActive.value]);

    detail.slice(0, 5).forEach((item: Record<string, any>) => {
      option1.push({
        ip: item.ip,
        group: item.group,
        tag: item.tag,
        rate: item[isActive.value]
      });
    });
    detail.slice(5, 10).forEach((item: Record<string, any>) => {
      option2.push({
        ip: item.ip,
        group: item.group,
        tag: item.tag,
        rate: item[isActive.value]
      });
    });
  } catch (error) {
    console.log(`chart4查询错误: ${error}`);
  }
  list1.value = option1;
  list2.value = option2;
};

const changeTab = (type: string) => {
  isActive.value = type;
  getData();
};
</script>
<style scoped lang="scss">
.tab {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin: 15em;
  div {
    flex-grow: 1;
    margin: 0 10em;
  }
  .active {
    color: rgb(94 211 249 / 80%);
    background: url("@/assets/images/screen/item-button-bg-2.png") no-repeat 0 0 / 100% 100%;
  }
}
.list {
  height: calc(100% - 130em);
  padding: 0 25em;
  margin: 0 auto;
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
      width: 25%;
      height: 100%;
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
      width: 25%;
      height: 100%;
      font-size: 14em;
      border-right: 1px solid #223e60;
      border-bottom: 1px solid #223e60;
    }
  }
  span {
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
