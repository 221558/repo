<template>
  <div class="card add-form">
    <div class="title mb10">
      <el-button link type="info" @click="toPrev">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="pl10">{{ `${subFlag === 0 ? "新增" : "编辑"}服务对象` }}</span>
    </div>
    <el-form ref="formRef" class="form_wrap" :model="formData" :rules="rules" label-width="140px">
      <el-form-item label="显示名称:" prop="show_name">
        <el-input v-model="formData.show_name" placeholder="输入显示名称" />
      </el-form-item>
      <el-form-item label="协议:" prop="protocol">
        <el-select v-model="formData.protocol" placeholder="选择协议" style="width: 300px" @change="changeProtocal">
          <el-option label="不限" value="any" />
          <el-option label="tcp" value="tcp" />
          <el-option label="udp" value="udp" />
        </el-select>
      </el-form-item>
      <el-form-item label="端口:" prop="port">
        <el-input v-model="formData.port" placeholder="输入端口" :disabled="disablePort" />
        <span class="label_desc">端口不限请设置为“any”</span>
      </el-form-item>
      <el-form-item label="描述:" prop="description">
        <el-input v-model="formData.description" type="textarea" placeholder="输入描述" :rows="4" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit"> 保存 </el-button>
        <el-button plain @click="clear"> 清空 </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts" name="basicForm">
import { onMounted, ref, reactive, computed, onUnmounted } from "vue";
import { ArrowLeft } from "@element-plus/icons-vue";
import { useRoute, useRouter } from "vue-router";
import { addService, editService } from "@/api/modules/security";
import { ElMessage } from "element-plus";
import { localGet, localRemove } from "@/utils";
import { checkPort } from "@/utils/eleValidate";

const formRef = ref();
const router = useRouter();
let formData = ref<Record<string, any>>({
  show_name: "",
  protocol: "any",
  port: "any",
  description: ""
});

let subFlag = ref(0); // 0=新增，1=编辑

onMounted(() => {
  const route = useRoute();
  if (route.params.id) {
    subFlag.value = 1;
    const selectedItem = localGet("serviceObject-edit");
    formData.value = {
      show_name: selectedItem.show_name,
      protocol: selectedItem.service.split("/")[0],
      port: selectedItem.service.split("/")[1],
      description: selectedItem.description,
      id: selectedItem.id
    };
  }
});

const rules = reactive<Record<string, any>>({
  show_name: [{ required: true, message: "请输入显示名称", trigger: "blur" }],
  protocol: [{ required: true, message: "请选择服务", trigger: "change" }],
  port: [
    { required: true, message: "请输入端口", trigger: "blur" },
    { validator: (rule: any, value: any, callback: any) => checkPort(rule, value, callback, true), trigger: "blur" }
  ],
  description: [{ required: true, message: "请输入描述", trigger: "blur" }]
});

const changeProtocal = (val: string) => {
  if (val === "any") {
    formData.value.port = "any";
  } else {
    formData.value.port = "";
  }
};

const disablePort = computed(() => formData.value.port === "any");

const toPrev = () => {
  router.push(`/securityPolicy/service`);
};

const onSubmit = async () => {
  formRef.value.validate(async (valid: any) => {
    if (valid) {
      let res: any = "";
      if (subFlag.value === 0) {
        let { show_name, description, protocol, port } = formData.value;
        let addParams = {
          showname: show_name,
          description,
          service_object_service: `${protocol}/${port}`
        };
        try {
          res = await addService(addParams);
        } catch (error) {
          console.log(`新增服务对象错误: ${error}`);
        }
      } else {
        try {
          let { id, show_name, description, protocol, port } = formData.value;
          let editParams = {
            showname: show_name,
            description,
            service_object_service: `${protocol}/${port}`,
            service_object_id: id
          };
          res = await editService(editParams);
        } catch (error) {
          console.log(`修改服务对象错误: ${error}`);
        }
      }
      if (res.message.includes("failed")) {
        ElMessage({
          message: "服务对象保存失败: 显示名称不可重复",
          type: "error"
        });
      } else {
        ElMessage({
          message: "保存成功",
          type: "success"
        });
        toPrev();
      }
    } else {
      return false;
    }
  });
};

const clear = () => {
  formRef.value.resetFields();
  if (subFlag.value === 1) {
    const selectedItem = localGet("serviceObject-edit");
    formData.value.id = selectedItem.id;
  }
};

onUnmounted(() => {
  localRemove("serviceObject-edit");
});
</script>

<style scoped lang="scss">
.add-form {
  .title {
    height: 30px;
    border-bottom: 1px solid #dcdfe6;
  }
  .el-input,
  .el-textarea {
    width: 300px !important;
  }
  .label_desc {
    padding-left: 5px;
    font-size: 12px;
    color: #9ea7b4;
  }
}
</style>
