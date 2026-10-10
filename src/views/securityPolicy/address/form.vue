<template>
  <div class="card add-form">
    <div class="title mb10">
      <el-button link type="info" @click="toPrev">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="pl10">{{ `${subFlag === 0 ? "新增" : "编辑"}地址对象` }}</span>
    </div>
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="140px">
      <el-form-item label="显示名称:" prop="show_name">
        <el-input v-model="formData.show_name" placeholder="输入显示名称" />
      </el-form-item>
      <el-form-item label="IP:" prop="address">
        <el-input
          v-model="formData.address"
          type="textarea"
          :placeholder="`示例如下：\nIP地址：192.168.1.1\nIP网段：192.168.1.0/24\nIP范围：192.168.1.1～192.168.1.10`"
          :rows="4"
        />
      </el-form-item>
      <el-form-item label="域名:" prop="domain">
        <el-input v-model="formData.domain" type="textarea" placeholder="输入域名，以逗号分割" :rows="4" />
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
import { ArrowLeft } from "@element-plus/icons-vue";
import { onMounted, ref, reactive, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { addAddress, editAddress } from "@/api/modules/security";
import { localGet, localRemove } from "@/utils";
const formRef = ref();
const router = useRouter();
const route = useRoute();
const checkIpAndDomain = (rule: any, value: any, callback: any) => {
  if (formData.value.address || formData.value.domain) {
    callback();
  } else {
    callback(new Error("IP或域名必填一项!"));
  }
};
let formData = ref<Record<string, any>>({
  show_name: "",
  address: "",
  description: "",
  domain: ""
});
const rules = reactive<Record<string, any>>({
  show_name: [{ required: true, message: "请输入显示名称", trigger: "blur" }],
  address: [{ validator: checkIpAndDomain, trigger: "blur" }],
  domain: [{ validator: checkIpAndDomain, trigger: "blur" }],
  description: [{ required: true, message: "请输入描述", trigger: "blur" }]
});
const subFlag = ref(0); // 0为添加 1为修改

const onSubmit = () => {
  formRef.value.validate(async (valid: any) => {
    if (valid) {
      let res: any = "";
      if (subFlag.value === 0) {
        let { show_name, address, description, domain } = formData.value;
        let addParams = {
          showname: show_name,
          address_list: address,
          description,
          domain
        };
        try {
          res = await addAddress(addParams);
        } catch (error) {
          console.log(`新增地址对象错误: ${error}`);
        }
      } else {
        try {
          let { id, show_name, address, description, domain } = formData.value;
          let editParams = {
            showname: show_name,
            address_list: address,
            description,
            domain,
            address_object_id: id
          };
          res = await editAddress(editParams);
        } catch (error) {
          console.log(`修改地址对象错误: ${error}`);
        }
      }
      if (res.message.includes("conflict ip")) {
        const ips = res.message.split("conflict ip ");
        ElMessage({
          message: `地址对象保存失败: IP${ips.length > 1 ? ips[1] : ""}已进入纳管范围`,
          type: "error"
        });
      } else if (res.message.includes("invalid address")) {
        ElMessage({
          message: "地址对象保存失败: IP配置无效",
          type: "error"
        });
      } else if (res.message.includes("invalid domain")) {
        ElMessage({
          message: "地址对象保存失败: 域名配置无效",
          type: "error"
        });
      } else if (res.message.includes("address_obj.show_name")) {
        ElMessage({
          message: "地址对象保存失败: 显示名称不可重复",
          type: "error"
        });
      } else if (res.message.includes("params_error")) {
        ElMessage({
          message: "地址对象保存失败: 参数错误",
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
    const selectedItem = localGet("addressObject-edit");
    formData.value.id = selectedItem.id;
  }
};
const toPrev = () => {
  router.push(`/securityPolicy/address`);
};
onMounted(async () => {
  subFlag.value = route.params.id ? 1 : 0;
  if (subFlag.value) {
    // 编辑页面
    const selectedItem = localGet("addressObject-edit");
    formData.value = {
      ...selectedItem,
      address: selectedItem.address !== "empty" ? selectedItem.address : "",
      domain: selectedItem.domain !== "empty" ? selectedItem.domain : ""
    };
  }
});

onUnmounted(() => {
  localRemove("addressObject-edit");
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
