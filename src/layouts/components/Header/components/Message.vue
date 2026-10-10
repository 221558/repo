<template>
  <div class="message">
    <el-popover placement="bottom" :width="310" trigger="click" :offset="7">
      <template #reference>
        <el-badge :value="state.total" class="item">
          <el-icon :size="20" style="cursor: pointer"><Bell /></el-icon>
        </el-badge>
      </template>
      <div class="message-warp">
        <div class="message-title flx-justify-between">
          <p>未读信息（{{ state.total }}）</p>
          <el-button type="danger" link @click="toRead">全部已读</el-button>
        </div>
        <div class="message-contain" v-if="state.total > 0">
          <div v-for="(item, index) in state.list" :key="`message_${index}`" class="message-item">
            <p><el-badge is-dot class="pt7 mr5" />{{ formatDate(new Date(item.time * 1000)) }}</p>
            <p>{{ `规则【${item.name}】触发告警` }}</p>
          </div>
        </div>
        <div class="message-empty" v-else>
          <img src="@/assets/images/notData.png" alt="notData" />
          <div>暂无数据</div>
        </div>
        <div class="message-footer flx-center">
          <el-button type="danger" link @click="toAll">查看全部信息</el-button>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, onUnmounted } from "vue";
import { Bell } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { formatDate } from "@/utils";
import { useRouter } from "vue-router";
import { getAlarmManage, editAlarmManage } from "@/api/modules/alarmCenter";

const router = useRouter();
let timeId: number;
const state = reactive<Record<string, any>>({
  total: 0,
  list: []
});

onMounted(async () => {
  getMessage();
  timeId = window.setInterval(() => {
    getMessage();
  }, 60 * 1000);
});

onUnmounted(() => {
  window.clearInterval(timeId);
});

const getMessage = async () => {
  let total = 0,
    list: Record<string, any>[] = [];
  try {
    const res = await getAlarmManage(
      {
        limit: 10,
        offset: 0,
        read_flag: 0
      },
      false
    );
    total = ((res || {}).data || {}).total_affected_items;
    list = ((res || {}).data || {}).affected_items;
  } catch (error) {
    console.log(`查询未读告警信息错误: ${error}`);
  }
  state.total = total;
  state.list = list;
};

const toRead = async () => {
  if (state.total === 0) {
    ElMessage({
      message: "当前没有未读信息"
    });
    return;
  }
  try {
    await editAlarmManage({
      alert_list: "0",
      treat_type: "read"
    });
    ElMessage({
      message: "操作已读成功",
      type: "success"
    });
    getMessage();
  } catch (error) {
    console.log(error);
  }
};

const toAll = () => {
  router.push(`/messageCenter`);
};
</script>

<style scoped lang="scss">
.message {
  height: 20px;
}
.message-title {
  padding-bottom: 10px;
  font-weight: bolder;
  color: #1a1c21;
  border-bottom: 1px solid #d3dae6;
}
.message-contain {
  height: 260px;
  overflow-y: auto;
}
.message-item {
  padding: 10px 0;
  p {
    line-height: 24px;
  }
}
.message-item:not(:last-child) {
  border-bottom: 1px dashed #e7ebf1;
}
.message-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 260px;
  line-height: 45px;
}
.message-footer {
  padding-top: 10px;
  border-top: 1px solid #d3dae6;
}
</style>
