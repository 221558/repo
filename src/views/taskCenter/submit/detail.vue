<template>
  <div class="card add-form">
    <div class="title mb10">
      <el-button link type="info" @click="toPrev">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="pl10">任务详情</span>
    </div>
    <el-form label-width="120">
      <div class="mb15">
        <span class="title pr15">基本信息</span>
        <span class="label_desc">任务基本信息</span>
      </div>
      <el-row>
        <el-col :span="6">
          <el-form-item label="任务号:">
            <span>{{ taskData.id ?? "-" }}</span>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="任务类型:">
            <span>{{ taskTypeTransform(taskData.type) }}</span>
          </el-form-item>
        </el-col>
        <el-col :span="6" v-if="taskData.type === 'operate'">
          <el-form-item label="对象:">
            <span>{{ logObjectTransform(taskData.object) }}</span>
          </el-form-item>
        </el-col>
        <el-col :span="6" v-if="taskData.type === 'operate'">
          <el-form-item label="动作:">
            <span>{{ actionTransform(taskData.action) }}</span>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="优先级:">
            <span>{{ taskLevelTransform(taskData.level) }}</span>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="任务状态:">
            <span>{{ taskStatusTransform(taskData.status) }}</span>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="创建时间:">
            <span>{{ formatDate(new Date(taskData.time * 1000)) }}</span>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="创建人:">
            <span>{{ taskData.creater ?? "-" }}</span>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="当前处理人:">
            <span>{{ taskData.treater ?? "-" }}</span>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="说明:" width="100%">
        <span>{{ taskData.description?.replace("None", "") || "-" }}</span>
      </el-form-item>
      <hr class="spread" />
      <div class="mb15">
        <span class="title pr15">操作对象</span>
        <span class="label_desc">操作对象信息</span>
      </div>
      <div v-for="(unuse_item, index) in unuse_params" :key="`unuse_params_${index}`">
        <el-row>
          <el-col :span="6" v-for="(key, i) in Object.keys(unuse_item)" :key="`unuse_item_${i}`">
            <el-form-item :label="`${key}:`">
              <span>{{ unuse_item[key] ?? "-" }}</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider border-style="dotted" class="mt10 mb10 ml20 mr20" v-if="index !== unuse_params.length - 1" />
      </div>
      <hr class="spread" />
      <div class="mb15">
        <span class="title pr15">操作参数</span>
        <span class="label_desc">操作参数信息</span>
      </div>
      <el-row>
        <el-col :span="6" v-for="(item, index) in params" :key="`params_${index}`">
          <el-form-item :label="`${item.label}:`">
            <span>{{ item.value ?? "-" }}</span>
          </el-form-item>
        </el-col>
      </el-row>
      <hr class="spread" />
      <div class="mb15">
        <span class="title pr15">任务记录</span>
        <span class="label_desc">任务处理记录</span>
      </div>
    </el-form>
    <el-timeline>
      <el-timeline-item
        v-for="(item, index) in task_history"
        :key="index"
        :timestamp="formatDate(new Date(item.time * 1000))"
        placement="top"
      >
        <div v-if="item.treater" class="timeline_warp mb5">
          <p class="timeline_label mr12">处理人:</p>
          <p>{{ item.treater }}</p>
        </div>
        <div v-if="item.action" class="timeline_warp mb5">
          <p class="timeline_label mr12">处理动作:</p>
          <p>{{ taskActionTransform(item.action) }}</p>
        </div>
        <div v-if="item.treat_info && item.treat_info !== 'None'" class="timeline_warp mb5">
          <p class="timeline_label mr12">处理信息:</p>
          <p>{{ item.treat_info }}</p>
        </div>
        <div v-if="item.result" class="timeline_warp mb5">
          <p class="timeline_label mr12">处理结果:</p>
          <p>{{ item.result === "true" ? "操作执行成功" : "操作执行失败" }}</p>
        </div>
        <div v-if="item.annex" class="timeline_warp mb5">
          <p class="timeline_label mr12">附件:</p>
          <el-link type="primary" @click="toDownload(item.id, item.annex)">{{ item.annex }}</el-link>
        </div>
      </el-timeline-item>
    </el-timeline>
    <div v-if="taskData.status === 'unreceived' || taskData.status === 'treated'">
      <hr class="spread" />
      <div class="mb15">
        <span class="title pr15">任务处理</span>
      </div>
      <el-button @click="toOperOrder">关闭</el-button>
    </div>
  </div>
</template>

<script setup lang="ts" name="submitDetail">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getWorkOrderDetail, operWorkOrder, downloadAnnex } from "@/api/modules/taskCenter";
import { formatDate } from "@/utils";
import { useHandleData } from "@/hooks/useHandleData";
import {
  taskTypeOptions,
  logObjectOptions,
  logActionOptions,
  taskLevelOptions,
  taskStatusOptions,
  taskActionOptions,
  taskParamsTransform
} from "@/config/mappingDict";

const router = useRouter();
const route = useRoute();
const taskData = ref<Record<string, any>>({});
const unuse_params = ref<Record<string, string>[]>([]);
const params = ref<Record<string, string>[]>([]);
const task_history = ref<Record<string, any>[]>([]);

const taskTypeTransform = (value: string) => {
  return taskTypeOptions.find((option: Record<string, string>) => option.value === value)?.label ?? "-";
};
const logObjectTransform = (value: string) => {
  let options = JSON.parse(JSON.stringify(logObjectOptions));
  options.push({ label: "策略生成器", value: "auto_policy" });
  options.push({ label: "异常流量匹配策略", value: "auto_rule" });
  return options.find((option: Record<string, string>) => option.value === value)?.label ?? "-";
};
const actionTransform = (value: string) => {
  return logActionOptions.find((option: Record<string, string>) => option.value === value)?.label ?? "-";
};
const taskLevelTransform = (value: string) => {
  return taskLevelOptions.find((option: Record<string, string>) => option.value === value)?.label ?? "-";
};
const taskStatusTransform = (value: string) => {
  return taskStatusOptions.find((option: Record<string, string>) => option.value === value)?.label ?? "-";
};
const taskActionTransform = (value: string) => {
  return taskActionOptions.find((option: Record<string, string>) => option.value === value)?.label ?? "-";
};

const toDownload = async (history_id: number, uploadfilename: string) => {
  let sharding_count = 1;
  let fileData = "";
  while (true) {
    const params = {
      uploadfilename,
      history_id,
      sharding_count
    };
    const res: any = await downloadAnnex(params);
    fileData = `${fileData}${res.data || ""}`;
    if (res.end == 1 || res.message.includes("not exis")) {
      break;
    } else {
      sharding_count++;
    }
  }

  if (fileData) {
    // 如果浏览器支持msSaveOrOpenBlob方法（也就是使用IE浏览器的时候），那么调用该方法去下载
    if (window.navigator.msSaveOrOpenBlob) {
      let bstr = atob(fileData.split(",")[1]);
      let n = bstr.length;
      let u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      let blob = new Blob([u8arr]);
      window.navigator.msSaveOrOpenBlob(blob, uploadfilename);
    } else {
      // 这里就按照chrome等新版浏览器来处理
      let a = document.createElement("a");
      a.href = fileData;
      a.setAttribute("download", uploadfilename);
      a.click();
    }
  }
};

const toPrev = () => {
  router.push(`/taskCenter/submit`);
};

const toOperOrder = async () => {
  try {
    await useHandleData(
      operWorkOrder,
      {
        task_id: taskData.value.id,
        task_action: "close"
      },
      `关闭该任务`
    );
    getDetail();
  } catch (error) {
    console.log(`关闭任务: ${error}`);
  }
};

const getDetail = async () => {
  try {
    const tagItems = await getWorkOrderDetail({ task_id: route.query.task_id });
    taskData.value = ((tagItems || {}).data || {}).affected_items[0] ?? {};
    unuse_params.value = JSON.parse(taskData.value.unuse_params);
    params.value = await taskParamsTransform(JSON.parse(taskData.value.params));
    task_history.value = taskData.value.task_history;
  } catch (error) {
    console.log(`工单详情错误: ${error}`);
  }
};

onMounted(() => {
  getDetail();
});
</script>

<style scoped lang="scss">
.add-form {
  > .title {
    height: 30px;
    border-bottom: 1px solid #dcdfe6;
  }
  .spread {
    height: 1px;
    margin: 2px 0 20px;
    border: none;
    border-top: 1px solid #e0e3e7;
  }
  .label_desc {
    padding-left: 5px;
    font-size: 12px;
    color: #9ea7b4;
  }
  .timeline_warp {
    display: flex;
    p {
      line-height: 20px;
    }
    .timeline_label {
      flex-shrink: 0;
      width: 80px;
      text-align: right;
    }
  }
}
</style>
