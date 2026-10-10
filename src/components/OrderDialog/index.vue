<template>
  <el-dialog
    :model-value="dialogVisible"
    title="审批工单"
    style="width: 550px"
    :show-close="false"
    :append-to-body="true"
    :close-on-press-escape="false"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="formData" v-loading="isLoading" :rules="rules" label-width="100px">
      <el-form-item label="优先级:" prop="task_level">
        <el-select v-model="formData.task_level" placeholder="请选择优先级" filterable clearable style="width: 300px">
          <el-option
            v-for="(item, index) in taskLevelOptions"
            :key="`taskLevelOptions_${index}`"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="处理人:" prop="treater_arr" v-if="props.task_type === 'alert'">
        <el-cascader
          v-model="formData.treater_arr"
          placeholder="请选择处理人"
          :props="objectProps"
          style="width: 300px"
        ></el-cascader>
      </el-form-item>
      <el-form-item label="处理人:" prop="treater" v-else>
        <el-select v-model="formData.treater" placeholder="请选择处理人" filterable clearable style="width: 300px">
          <el-option
            v-for="(item, index) in adminOptions"
            :key="`adminOptions_${index}`"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="说明:" prop="description">
        <el-input v-model="formData.description" type="textarea" placeholder="请输入说明" :rows="4" style="width: 300px" />
      </el-form-item>
      <el-form-item label="附件:">
        <el-upload ref="upload" action="" :auto-upload="false" :limit="1" :on-change="uploadChange" :on-exceed="uploadExceed">
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
        <el-button type="primary" @click="onSubmit">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts" name="OrderDialog">
import { ref, reactive, nextTick } from "vue";
import { ElMessage, genFileId } from "element-plus";
import type { CascaderProps, CascaderOption } from "element-plus";
import { taskLevelOptions, adminOptions, taskApiTransform } from "@/config/mappingDict";
import { filterQueryForm } from "@/utils";
import { getUserList } from "@/api/modules/system";
import { getWorkOrderSwitch, createWorkOrder, uploadAnnex } from "@/api/modules/taskCenter";
import { OrderDialogProps } from "@/components/OrderDialog/interface";
import { useUserStore } from "@/stores/modules/user";

const currentUserName = useUserStore().userInfo.name;
const role = useUserStore().userInfo.role;
const $emit = defineEmits(["callbackFn"]);

const props = withDefaults(defineProps<OrderDialogProps>(), {
  task_type: "",
  alert_id: "",
  log_object: "",
  log_action: "",
  params: () => ({}),
  unuse_params: ""
});

const dialogVisible = ref(false);
const formRef = ref();
const isLoading = ref(false);
let formData = reactive<Record<string, any>>({
  task_level: "",
  treater_arr: [],
  treater: "",
  description: ""
});
const upload = ref();
const fileData = ref<Record<string, any>>({});
const checkTreater = (rule: any, value: any, callback: any) => {
  if (value.length === 0) {
    callback(new Error("请选择处理人"));
  } else {
    callback();
  }
};
const rules = reactive<Record<string, any>>({
  task_level: [{ required: true, message: "请选择优先级", trigger: "change" }],
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

const uploadExceed = (files: Record<string, any>[]) => {
  // 当超出文件个数限制时覆盖
  upload.value!.clearFiles();
  const file = files[0];
  file.uid = genFileId();
  upload.value!.handleStart(file);
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

const toClose = () => {
  dialogVisible.value = false;
  formRef.value.resetFields();
  upload.value!.clearFiles();
  fileData.value = {};
  $emit("callbackFn", true);
};

const onSubmit = () => {
  formRef.value.validate(async (valid: any) => {
    if (valid) {
      isLoading.value = true;
      try {
        const apiParams = Object.assign(props.params, { op_user: currentUserName });
        const params = Object.assign(
          filterQueryForm({
            task_level: formData.task_level,
            treater: props.task_type === "alert" ? formData.treater_arr[1] : formData.treater,
            description: formData.description,
            annex: fileData.value.name ?? ""
          }),
          {
            task_type: props.task_type,
            alert_id: props.alert_id,
            log_object: props.log_object,
            log_action: props.log_action,
            params: JSON.stringify(apiParams),
            unuse_params: props.unuse_params
          }
        );
        const res: Record<string, any> = await createWorkOrder(params);

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
              type: "success",
              message: "工单已提交"
            });
            toClose();
            isLoading.value = false;
          };
        } else {
          ElMessage({
            type: "success",
            message: "工单已提交"
          });
          toClose();
          isLoading.value = false;
        }
      } catch (error) {
        console.log(`保存工单失败: ${error}`);
      }
    } else {
      return false;
    }
  });
};

const judgeSwitch = async () => {
  let enable = false;
  if (role !== "admin") {
    // 超级管理员操作不需要审批
    try {
      const data: any = await getWorkOrderSwitch();
      enable = data.work_order_switch === "enable" ? true : false;
    } catch (error) {
      console.log(`查询操作审批配置失败: ${error}`);
    }
  }

  if (enable) {
    dialogVisible.value = true;
    if (props.task_type === "alert") getLoginUserOptions();
  } else {
    const { task_type, log_object, log_action, params } = props;
    const apiTransform = taskApiTransform(task_type, log_object, log_action, params);

    if (apiTransform.apis.length > 0) {
      let isSuccess = true;
      for (let i = 0, length = apiTransform.apis.length; i < length; i++) {
        const apiParams = Object.assign(params.paramsArr[i], { op_user: currentUserName });
        try {
          await apiTransform.apis[i].api(apiParams);
        } catch (error) {
          isSuccess = false;
          console.log(`${apiTransform.apis[i].desc}错误: ${error}`);
        }
      }
      if (isSuccess) {
        ElMessage({
          type: "success",
          message: apiTransform.successMsg || `操作成功`
        });
      }
    } else if (apiTransform.api) {
      const apiParams = Object.assign(props.params, { op_user: currentUserName });
      const res: any = await apiTransform.api(apiParams);
      if ((res.inuse && res.inuse.length > 0) || res.message.includes("failed")) {
        ElMessage({
          type: "error",
          message: `${res.inuse && res.inuse.length > 0 ? res.inuse.join("、") : ""}${apiTransform.failedMsg || `操作失败`}`
        });
      } else {
        ElMessage({
          type: "success",
          message: apiTransform.successMsg || `操作成功`
        });
      }
    }
    $emit("callbackFn", false);
  }
};

// 暴露给父组件的参数和方法 (外部需要什么，都可以从这里暴露出去)
defineExpose({
  judgeSwitch: () =>
    nextTick(() => {
      judgeSwitch();
    })
});
</script>
