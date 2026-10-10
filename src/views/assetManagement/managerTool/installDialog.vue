<template>
  <el-dialog
    :model-value="visible"
    title="选择安装信息"
    style="width: 30%"
    @closed="closedDialog"
    :close-on-press-escape="false"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <el-form-item label="安装版本:" prop="version">
        <el-select v-model="formData.version" placeholder="选择安装版本" style="width: 100%">
          <el-option v-for="(item, index) in versionList" :key="index" :label="item" :value="item"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="安装分组:" prop="group_name">
        <el-select v-model="formData.group_name" placeholder="选择安装分组" style="width: 100%">
          <el-option v-for="item in groupList" :key="item.name" :label="item.show_name" :value="item.name" class="group-options">
            <span>{{ item.show_name }}</span>
            <span>
              <el-tag class="ml8">{{ item.loc_show_name ?? "无标签" }}</el-tag>
              <el-tag class="ml8" type="success">{{ item.org_show_name ?? "无标签" }}</el-tag>
              <el-tag class="ml8" type="warning">{{ item.business_show_name ?? "无标签" }}</el-tag>
            </span>
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button type="primary" @click="onSubmit"> 确定 </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup name="managerToolInstallDialog">
import { reactive, ref, watch } from "vue";
interface ListType {
  groupList?: any[];
  versionList?: any[];
  visible?: boolean;
  selected?: Record<string, any>;
}
const formRef = ref();
const props = withDefaults(defineProps<ListType>(), {
  visible: false,
  groupList: () => [],
  versionList: () => [],
  selected: () => ({})
});
let formData = reactive<Record<string, any>>({
  version: "",
  group_name: ""
});
watch(
  () => props.visible,
  () => {
    if (props.visible && props.selected.group) {
      formData.group_name = props.selected.group;
    } else if (!props.visible) {
      formData.group_name = "";
    }
  }
);
const rules = reactive<Record<string, any>>({
  version: [{ required: true, message: "请选择安装版本", trigger: "change" }],
  group_name: [{ required: true, message: "请选择安装分组", trigger: "change" }]
});
let $emit = defineEmits(["closedDialog", "submitDialog"]);
const closedDialog = () => {
  $emit("closedDialog");
  formRef.value.resetFields();
};

const onSubmit = () => {
  formRef.value.validate(async (valid: any) => {
    if (valid) {
      $emit("submitDialog", {
        install: { ...formData }
      });
      formRef.value.resetFields();
    } else {
      return false;
    }
  });
};
</script>
<style scoped lang="scss">
.group-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
<style scoped>
.el-button--text {
  margin-right: 15px;
}
.dialog-footer button:first-child {
  margin-right: 10px;
}
</style>
