<template>
  <div class="card add-form">
    <div class="title mb10">
      <el-button link type="info" @click="toPrev">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="pl10">{{ `${subFlag === 0 ? "新增" : "编辑"}联系人` }}</span>
    </div>
    <el-form ref="formRef" class="form_wrap" :model="formData" :rules="rules" label-width="140px">
      <el-form-item label="联系人:" prop="liaison_name">
        <el-input v-model="formData.liaison_name" placeholder="输入联系人" />
      </el-form-item>
      <el-form-item label="邮箱地址:" prop="email_address">
        <el-input v-model="formData.email_address" placeholder="输入邮箱地址" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit"> 保存 </el-button>
        <el-button plain @click="clear"> 清空 </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts" name="basicForm">
import { onMounted, ref, reactive, onUnmounted } from "vue";
import { ArrowLeft } from "@element-plus/icons-vue";
import { useRoute, useRouter } from "vue-router";
import { addContact, editContact } from "@/api/modules/contactManagement";
import { ElMessage } from "element-plus";
import { localGet, localRemove } from "@/utils";
import { checkEmail } from "@/utils/eleValidate";

const formRef = ref();
const router = useRouter();
let formData = ref<Record<string, any>>({
  liaison_name: "",
  email_address: ""
});

let subFlag = ref(0); // 0=新增，1=编辑

onMounted(() => {
  const route = useRoute();
  if (route.params.id) {
    subFlag.value = 1;
    const selectedItem = localGet("contactManagement-edit");
    formData.value = {
      liaison_name: selectedItem.name,
      email_address: selectedItem.email,
      id: selectedItem.id
    };
  }
});

const rules = reactive<Record<string, any>>({
  liaison_name: [{ required: true, message: "请输入联系人", trigger: "blur" }],
  email_address: [
    { required: true, message: "请输入邮箱地址", trigger: "blur" },
    { validator: checkEmail, trigger: "blur" }
  ]
});

const toPrev = () => {
  router.push(`/contactManagement`);
};

const onSubmit = async () => {
  formRef.value.validate(async (valid: any) => {
    if (valid) {
      let res: any = "";
      if (subFlag.value === 0) {
        let { liaison_name, email_address } = formData.value;
        let addParams = {
          liaison_name,
          email_address
        };
        try {
          res = await addContact(addParams);
        } catch (error) {
          console.log(`新增联系人错误: ${error}`);
        }
      } else {
        try {
          let { id, liaison_name, email_address } = formData.value;
          let editParams = {
            liaison_id: id,
            liaison_name,
            email_address
          };
          res = await editContact(editParams);
        } catch (error) {
          console.log(`修改联系人错误: ${error}`);
        }
      }
      if (res.message.includes("repeat name")) {
        ElMessage({
          message: "联系人保存失败: 联系人不可重复",
          type: "error"
        });
      } else if (res.message.includes("invalid email")) {
        ElMessage({
          message: "联系人保存失败: 邮箱失效",
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
    const selectedItem = localGet("contactManagement-edit");
    formData.value.id = selectedItem.id;
  }
};

onUnmounted(() => {
  localRemove("contactManagement-edit");
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
