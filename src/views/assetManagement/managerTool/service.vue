<template>
  <div class="card arrange-container">
    <div class="title mb10">
      <el-button link type="info" @click="toPrev">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="pl10">部署任务</span>
      <div class="mt30">任务名称：<el-input v-model="taskName" style="width: 500px" /></div>
      <el-row class="pt20 pb10">
        <el-col :span="12">
          <span>部署服务器列表</span>
        </el-col>
        <el-col :span="12" class="btn-wrap">
          <el-button type="primary" plain @click="exportService">下载批量模板</el-button>
          <el-upload
            class="upload-btn"
            ref="uploadRef"
            action=""
            :auto-upload="false"
            :show-file-list="false"
            accept=".csv"
            :on-change="uploadChange"
          >
            <template #trigger>
              <el-button plain type="primary"> 批量上传 </el-button>
            </template>
          </el-upload>
          <el-button type="primary" plain @click="add">新增服务器</el-button>
        </el-col>
      </el-row>
      <PageTable :columns="columns" :data="state.serviceList" :is-search="false" :is-edit="false" :is-del="false"> </PageTable>
      <el-alert
        class="mt15"
        title="服务器列表中有重复IP数据时，在保存任务后，后台会对服务器列表进行自动IP去重，保留第一条数据"
        type="info"
        show-icon
      />
      <el-button type="primary" @click="onSubmit" class="mt10">保存</el-button>
    </div>
    <service-dialog
      :visible="state.serviceDialogVisible"
      :list="state.serviceList"
      @closed-dialog="closedSeiviceDialog"
      @submit-dialog="toSaveDialog"
    ></service-dialog>
  </div>
</template>

<script setup lang="ts" name="managerToolService">
import { ArrowLeft } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import { reactive, ref } from "vue";
import { ColumnProps } from "@/components/PageTable/interface";
import PageTable from "@/components/PageTable/index.vue";
import { ElMessage } from "element-plus";
import { addtask } from "@/api/modules/assetManagement";
import serviceDialog from "./serviceDialog.vue";
import { Parser } from "@json2csv/plainjs";
import FileSaver from "file-saver";
import Papa from "papaparse";

const router = useRouter();
const toPrev = () => {
  router.push(`/assetManagement/managerTool/arrange`);
  taskName.value = "";
  state.serviceList = [];
};
const taskName = ref("");
const state = reactive<Record<string, any>>({
  serviceList: [],
  serviceDialogVisible: false
});

const add = () => {
  state.serviceDialogVisible = true;
};
const uploadChange = (file: Record<string, any>) => {
  if (file.raw.type == "text/csv" || file.raw.type == "application/vnd.ms-excel") {
    importcsv(file.raw);
  }
};
const importcsv = (obj: any) => {
  Papa.parse(obj, {
    complete(results: Record<string, any>) {
      let data: Record<string, any>[] = [];
      for (let i = 1; i < results.data.length; i++) {
        let item: Record<string, any> = {};
        item.ip = results.data[i][0];
        item.user = results.data[i][1];
        item.pwd = results.data[i][2];
        if (item.ip && item.user && item.pwd) {
          data.push(item);
        }
      }
      state.serviceList = state.serviceList.concat(data);
    }
  });
};

const exportService = () => {
  let opts = {
    fields: columns.map((item: any) => ({
      label: item.name,
      value: item.field
    }))
  };
  const json2csvParser = new Parser(opts);
  const csv = json2csvParser.parse([]);
  let blob = new Blob(["\uFEFF" + csv], {
    type: "text/plain;charset=utf-8;"
  });
  FileSaver.saveAs(blob, "填写模板.csv");
};
const toSaveDialog = ({ service }: Record<string, any>) => {
  if (service.ip) {
    state.serviceList = state.serviceList.concat([
      {
        ...service
      }
    ]);
  }
  state.serviceDialogVisible = false;
};
const closedSeiviceDialog = () => {
  state.serviceDialogVisible = false;
};
const onSubmit = async () => {
  if (state.serviceList.length === 0) {
    ElMessage({
      message: "请输入服务器信息",
      type: "error"
    });
    return;
  }
  if (!taskName.value) {
    ElMessage({
      message: "请输入任务名称",
      type: "error"
    });
    return;
  }
  let reg = /\s/;
  if (reg.test(taskName.value)) {
    ElMessage({
      message: "任务名称不能包含空格！",
      type: "error"
    });
    return;
  }
  try {
    let login_info = state.serviceList.map((item: Record<string, any>) => ({
      user: item.user,
      ip: item.ip,
      pwd: item.pwd,
      accountDes: ""
    }));
    const addRes: any = await addtask({
      login_info,
      login_alias: taskName.value
    });
    if (addRes.message.includes("failed")) {
      ElMessage({
        message: "保存失败",
        type: "error"
      });
    } else {
      ElMessage({
        message: "保存成功",
        type: "success"
      });
      toPrev();
    }
  } catch (error) {
    console.log(`保存部署任务失败: ${error}`);
  }
};
const columns = reactive<ColumnProps[]>([
  {
    field: "ip",
    name: "服务器IP"
  },
  {
    field: "user",
    name: "用户名称"
  },
  {
    field: "pwd",
    name: "用户密码",
    render: (item: Record<string, any>) => {
      if (!item.pwd) {
        return item.pwd;
      } else {
        return item.pwd.replace(/./g, "*");
      }
    }
  }
]);
</script>
<style scoped lang="scss">
.arrange-container {
  height: 100%;
}
.title {
  height: 30px;
  border-bottom: 1px solid #dcdfe6;
}
.btn-wrap {
  display: flex;
  justify-content: flex-end;
  .upload-btn {
    margin: 0 10px;
  }
}
</style>
