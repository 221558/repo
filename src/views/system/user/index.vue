<template>
  <div class="card user-container">
    <PageTable
      :columns="columns"
      :data="list"
      :on-edit="edit"
      :disabled-edit="disabledBtn"
      :disabled-del="disabledBtn"
      :disabled-del-msg="disabledDelMsg"
      :disabled-edit-msg="disabledEditMsg"
      :on-del="remove"
    >
      <template #btn-warp>
        <el-row class="pb20">
          <el-button type="primary" @click="toAdd">新增用户</el-button>
        </el-row>
      </template>
    </PageTable>
  </div>
</template>

<script setup lang="ts" name="userObject">
import { onMounted, reactive, ref } from "vue";
import { ColumnProps } from "@/components/PageTable/interface";
import PageTable from "@/components/PageTable/index.vue";
import { useHandleData } from "@/hooks/useHandleData";
import { getUserList, removeUser } from "@/api/modules/system";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/modules/user";
import { localSet } from "@/utils";

const router = useRouter();
const userInfo = useUserStore().userInfo;
let list = ref<Record<string, any>[]>([]);
const columns = reactive<ColumnProps[]>([
  {
    field: "username",
    name: "用户名"
  },
  {
    field: "user_tag_show",
    name: "角色"
  }
]);

const getUserData = async () => {
  try {
    const data: any = await getUserList();
    const tagOptions = [
      { value: "adminuser", label: "用户管理员" },
      { value: "audit", label: "审计管理员" },
      { value: "system", label: "系统管理员" }
    ];
    list.value = ((data || {}).data || {}).affected_items.map((k: Record<string, any>) => {
      const tag = tagOptions.find(tag => tag.value === k.user_tag);
      k.user_tag_show = tag?.label ?? "-";
      return k;
    });
  } catch (error) {
    console.log(`查询用户列表错误: ${error}`);
  }
};

onMounted(async () => {
  getUserData();
});

const toAdd = () => {
  router.push(`/system/user/add`);
};

const edit = (data: Record<string, any>) => {
  localSet("userObject-edit", data);
  router.push({
    path: `/system/user/edit/${data.id}`
  });
};
const disabledBtn = (data: Record<string, any>) => {
  return data.id < 100 || data.username === userInfo.name;
};
const disabledDelMsg = (data: Record<string, any>) => {
  if (data.id < 100) {
    return "无法删除内置用户";
  } else if (data.username === userInfo.name) {
    return "无法删除当前用户";
  }
};
const disabledEditMsg = (data: Record<string, any>) => {
  if (data.id < 100) {
    return "无法编辑内置用户";
  } else if (data.username === userInfo.name) {
    return "无法编辑当前用户";
  }
};
const remove = async (data: Record<string, any>) => {
  await useHandleData(removeUser, { id: data.id }, `删除该数据`);
  getUserData();
};
</script>
<style scoped lang="scss">
.user-container {
  .query-form {
    width: 40%;
  }
}
</style>
