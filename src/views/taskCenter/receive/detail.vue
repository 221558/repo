<template>
  <div class="card add-form">
    <div class="title mb10">
      <el-button link type="info" @click="toPrev">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="pl10">
        {{ `${taskData.status === "treated" || taskData.status === "close" ? "任务详情" : "任务处理"}` }}
      </span>
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
    </el-form>
    <div class="mb15">
      <span class="title pr15">任务记录</span>
      <span class="label_desc">任务处理记录</span>
    </div>
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
    <div v-if="taskData.status === 'unreceived' || taskData.status === 'treating'">
      <hr class="spread" />
      <div class="mb15">
        <span class="title pr15">任务处理</span>
      </div>
      <div v-if="taskData.status === 'unreceived' && taskData.treater === currentUserName">
        <el-button type="primary" @click="toAccept">接收</el-button>
        <el-button @click="openDrawer('transmit')">流转</el-button>
      </div>
      <div v-if="taskData.status === 'treating'">
        <el-button type="primary" @click="openDrawer('pass')">确认</el-button>
        <el-button @click="openDrawer('fail')">驳回</el-button>
      </div>
    </div>

    <el-dialog
      v-model="dialogVisible"
      title="处理详情"
      width="500px"
      draggable
      @close="toClose"
      :close-on-press-escape="false"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" label-width="100px" v-loading="isLoading" :rules="rules">
        <el-form-item label="处理人:" prop="treater_arr" v-if="dialogType === 'transmit' && taskData.type === 'alert'">
          <el-cascader
            v-model="formData.treater_arr"
            placeholder="请选择处理人"
            :props="objectProps"
            style="width: 300px"
          ></el-cascader>
        </el-form-item>
        <el-form-item label="处理人:" prop="treater" v-if="dialogType === 'transmit' && taskData.type !== 'alert'">
          <el-select v-model="formData.treater" placeholder="请选择处理人" filterable clearable style="width: 300px">
            <el-option
              v-for="(item, index) in adminOptions"
              :key="`adminOptions_${index}`"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="处理意见:" prop="treat_info" v-else>
          <el-input v-model="formData.treat_info" type="textarea" placeholder="请输入处理意见" :rows="4" style="width: 300px" />
        </el-form-item>
        <el-form-item label="附件:">
          <el-upload action="" :auto-upload="false" :limit="1" :on-change="uploadChange">
            <template #trigger>
              <el-button plain type="primary">附件上传</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip mt0">只可上传一个文件，文件大小不可超过240M</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="toClose">取消</el-button>
          <el-button type="primary" @click="toSaveOper">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="receiveDetail">
import { ref, reactive, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getWorkOrderDetail, operWorkOrder, downloadAnnex, uploadAnnex } from "@/api/modules/taskCenter";
import { getUserList } from "@/api/modules/system";
import { ElMessage } from "element-plus";
import type { CascaderProps, CascaderOption } from "element-plus";
import { formatDate, filterQueryForm } from "@/utils";
import { useUserStore } from "@/stores/modules/user";
import { useHandleData } from "@/hooks/useHandleData";
import {
  taskTypeOptions,
  logObjectOptions,
  logActionOptions,
  taskLevelOptions,
  taskStatusOptions,
  taskActionOptions,
  taskParamsTransform,
  adminOptions,
  taskApiTransform
} from "@/config/mappingDict";

const currentUserName = useUserStore().userInfo.name;
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

const formRef = ref();
const dialogVisible = ref(false);
const isLoading = ref(false);
const dialogType = ref("");
const formData = ref<Record<string, any>>({
  treater_arr: [],
  treater: "",
  treat_info: ""
});
const fileData = ref<Record<string, any>>({});
const checkTreater = (rule: any, value: any, callback: any) => {
  if (value.length === 0) {
    callback(new Error("请选择处理人"));
  } else {
    callback();
  }
};
const rules = reactive<Record<string, any>>({
  treater_arr: [
    { required: true, message: "请选择处理人", trigger: "change" },
    { validator: checkTreater, trigger: "change" }
  ],
  treater: [{ required: true, message: "请选择处理人", trigger: "change" }]
});
const loginUserOptions = ref<Record<string, any>[]>([]);
const objectProps: CascaderProps = {
  lazy: true,
  lazyLoad: async (node, resolve) => {
    const { level } = node;
    let nextNodes: CascaderOption[] = [];
    if (level === 0) {
      nextNodes = [
        {
          value: "system",
          label: "系统管理员",
          leaf: false
        },
        {
          value: "admin",
          label: "超级管理员",
          leaf: false
        }
      ];
    } else if (level === 1 && node.value === "system") {
      nextNodes = loginUserOptions.value.filter((user: Record<string, any>) => user.user_tag === "system");
    } else if (level === 1 && node.value === "admin") {
      nextNodes = adminOptions.map((user: Record<string, any>) => {
        user.leaf = true;
        return user;
      });
    }
    resolve(nextNodes);
  }
};

const toClose = () => {
  formRef.value.clearValidate();
  dialogVisible.value = false;
  dialogType.value = "";
  formData.value = {
    treater_arr: [],
    treater: "",
    treat_info: ""
  };
};
const openDrawer = (type: string) => {
  dialogType.value = type;
  dialogVisible.value = true;
};

const toSaveOper = () => {
  formRef.value.validate(async (valid: any) => {
    if (valid) {
      isLoading.value = true;
      try {
        const params = filterQueryForm({
          task_id: taskData.value.id,
          task_action: dialogType.value,
          treater: taskData.value.type === "alert" ? formData.value.treater_arr[1] : formData.value.treater,
          treat_info: formData.value.treat_info,
          annex: fileData.value.name ?? ""
        });

        let apiMsg = "";

        if (dialogType.value === "pass") {
          // 通过审批，先执行操作
          const apiParams: Record<string, any> = JSON.parse(taskData.value.params);
          const apiTransform = taskApiTransform(taskData.value.type, taskData.value.object, taskData.value.action, apiParams);
          let result = true;
          try {
            if (apiTransform.apis.length > 0) {
              let isSuccess = true;
              for (let i = 0, length = apiTransform.apis.length; i < length; i++) {
                try {
                  await apiTransform.apis[i].api(Object.assign(apiParams.paramsArr[i], { op_user: apiParams.op_user }));
                } catch (error) {
                  isSuccess = false;
                  console.log(`${apiTransform.apis[i].desc}错误: ${error}`);
                }
              }
              if (isSuccess) {
                apiMsg = apiTransform.successMsg || "审批操作执行成功";
              } else {
                result = false;
                apiMsg = apiTransform.failedMsg || "审批操作执行失败";
              }
            } else if (apiTransform.api) {
              const res = await apiTransform.api(apiParams);
              if (res.message.includes("failed")) {
                result = false;
                apiMsg = apiTransform.failedMsg || "审批操作执行失败";
              } else {
                apiMsg = apiTransform.successMsg || "审批操作执行成功";
              }
            }
          } catch (error) {
            result = false;
          }
          params.result = result;
        }

        const res: Record<string, any> = await operWorkOrder(params);

        if (fileData.value.name) {
          const reader = new FileReader();
          reader.readAsDataURL(fileData.value.raw); // 读取为dataurl(base64)

          reader.onload = async () => {
            const fileSliceArr = fileSlice(reader.result);

            for (let i = 0, length = fileSliceArr.length; i < length; i++) {
              const data = fileSliceArr[i];
              const sharding_count = i + 1;
              await uploadAnnex(data, {
                uploadfilename: fileData.value.name,
                history_id: res.history_id,
                sharding_count
              });
            }

            ElMessage({
              message: `任务处理成功${apiMsg ? `，${apiMsg}` : ""}`,
              type: "success"
            });
            getDetail();
            toClose();
            isLoading.value = false;
          };
        } else {
          ElMessage({
            message: `任务处理成功${apiMsg ? `，${apiMsg}` : ""}`,
            type: "success"
          });
          getDetail();
          toClose();
          isLoading.value = false;
        }
      } catch (error) {
        console.log(`处理错误: ${error}`);
      }
    } else {
      return false;
    }
  });
};

const uploadChange = (file: Record<string, any>) => {
  if (file.size >= 1024 * 1024 * 240) {
    ElMessage({
      type: "error",
      message: "文件大小不可超过240M"
    });
  } else {
    fileData.value = file;
  }
};

const fileSlice = (file: string | ArrayBuffer | null, piece: number = 1024 * 1023) => {
  let chunks = [];
  if (typeof file == "string") {
    let totalSize = file?.length; // 文件总大小
    let start = 0; // 每次上传的开始字节
    let end = start + piece; // 每次上传的结尾字节
    while (start < totalSize) {
      // 根据长度截取每次需要上传的数据
      // File对象继承自Blob对象，因此包含slice方法
      let item = file.slice(start, end);
      chunks.push(item);

      start = end;
      end = start + piece;
    }
  }

  return chunks;
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
  router.push(`/taskCenter/receive`);
};

const toAccept = async () => {
  try {
    await useHandleData(
      operWorkOrder,
      {
        task_id: taskData.value.id,
        task_action: "accept"
      },
      `接收该任务`
    );
    getDetail();
  } catch (error) {
    console.log(`接收任务: ${error}`);
  }
};

const getDetail = async () => {
  try {
    const tagItems = await getWorkOrderDetail({ task_id: route.query.task_id });
    taskData.value = ((tagItems || {}).data || {}).affected_items[0] ?? {};
    unuse_params.value = taskData.value.unuse_params === "None" ? [] : JSON.parse(taskData.value.unuse_params);
    params.value = await taskParamsTransform(JSON.parse(taskData.value.params));
    task_history.value = taskData.value.task_history;
  } catch (error) {
    console.log(`工单详情错误: ${error}`);
  }
};

const getLoginUserOptions = async () => {
  try {
    const data: any = await getUserList();
    loginUserOptions.value = ((data || {}).data || {}).affected_items.map((k: Record<string, any>) => ({
      label: k.username,
      value: k.username,
      user_tag: k.user_tag,
      leaf: true
    }));
  } catch (error) {
    console.log(`查询用户列表错误: ${error}`);
  }
};

onMounted(() => {
  getDetail();
  getLoginUserOptions();
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
