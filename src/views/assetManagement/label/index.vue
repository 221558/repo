<template>
  <div class="card">
    <div class="flx-align-center">
      <el-button type="primary" plain @click="exportModel">下载导入模板</el-button>
      <el-upload
        class="ml10 mr10"
        ref="uploadRef"
        action=""
        :auto-upload="false"
        :show-file-list="false"
        accept=".csv"
        :on-change="uploadChange"
      >
        <template #trigger>
          <el-button plain type="primary">批量导入</el-button>
        </template>
      </el-upload>
      <el-button type="primary" plain @click="exportList">导出</el-button>
    </div>
    <el-tabs v-model="labelState.activeName" @tab-click="handleClick">
      <el-tab-pane label="位置" name="loc" />
      <el-tab-pane label="组织" name="org" />
      <el-tab-pane label="业务" name="business" />
      <el-tab-pane label="组件" name="component" />
    </el-tabs>
    <Content v-if="labelState.pageType === 'list'" />
    <Form v-else />
  </div>
</template>

<script setup lang="ts" name="labelIndex">
import { onBeforeMount, nextTick } from "vue";
import { Parser } from "@json2csv/plainjs";
import FileSaver from "file-saver";
import Papa from "papaparse";
import { ElMessage } from "element-plus";
import { formatDate } from "@/utils";
import { useDownloadData } from "@/hooks/useDownloadData";
import { getTagList } from "@/api/modules/assets";
import { addLabel } from "@/api/modules/assetManagement";
import { labelState, createState } from "./state";
import Content from "./content.vue";
import Form from "./form.vue";

onBeforeMount(async () => {
  Object.assign(labelState, createState());
});

const handleClick = () => {
  labelState.pageType = "list";
};

const exportModel = () => {
  let opts = {
    fields: [
      { label: "位置", value: "loc" },
      { label: "组织", value: "org" },
      { label: "业务", value: "business" },
      { label: "组件", value: "component" }
    ]
  };
  const json2csvParser = new Parser(opts);
  const csv = json2csvParser.parse([]);
  let blob = new Blob(["\uFEFF" + csv], {
    type: "text/plain;charset=utf-8;"
  });
  FileSaver.saveAs(blob, "标签导入模板.csv");
};

const uploadChange = (file: Record<string, any>) => {
  if (file.raw.type == "text/csv" || file.raw.type == "application/vnd.ms-excel") {
    importCsv(file.raw);
  }
};
const importCsv = (obj: any) => {
  Papa.parse(obj, {
    encoding: "gb2312",
    complete(results: Record<string, any>) {
      let locData: string[] = [],
        orgData: string[] = [],
        businessData: string[] = [],
        componentData: string[] = [];
      for (let i = 1, length = results.data.length; i < length; i++) {
        results.data[i][0] && locData.push(results.data[i][0]);
        results.data[i][1] && orgData.push(results.data[i][1]);
        results.data[i][2] && businessData.push(results.data[i][2]);
        results.data[i][3] && componentData.push(results.data[i][3]);
      }
      let apiArr = [];
      locData.length > 0 && apiArr.push(addLabel({ label_type: "loc", showname_list: locData.join(",") }));
      orgData.length > 0 && apiArr.push(addLabel({ label_type: "org", showname_list: orgData.join(",") }));
      businessData.length > 0 && apiArr.push(addLabel({ label_type: "business", showname_list: businessData.join(",") }));
      componentData.length > 0 && apiArr.push(addLabel({ label_type: "component", showname_list: componentData.join(",") }));
      Promise.all(apiArr).then((values: Record<string, any>[]) => {
        let isSuccess = true,
          msg = "",
          msgArr = [];
        locData.length > 0 && msgArr.push("位置");
        orgData.length > 0 && msgArr.push("组织");
        businessData.length > 0 && msgArr.push("业务");
        componentData.length > 0 && msgArr.push("组件");
        for (let i = 0, length = values.length; i < length; i++) {
          if (values[i].message.includes("failed")) {
            isSuccess = false;
            msg = `${msg ? `${msg}、` : ""}${msgArr[i]}`;
          }
        }
        if (isSuccess) {
          ElMessage({
            message: "导入成功",
            type: "success"
          });
        } else {
          ElMessage({
            message: `${msg}标签保存失败: 显示名称不可重复`,
            type: "error"
          });
        }
        labelState.pageType = "";
        nextTick(() => (labelState.pageType = "list"));
      });
    }
  });
};
const exportList = () => {
  const sheetList: any = [
    {
      header: { show_name: "显示名称", last_m_time: "修改时间", last_m_user: "修改人" },
      list: [],
      sheetName: "位置标签"
    },
    {
      header: { show_name: "显示名称", last_m_time: "修改时间", last_m_user: "修改人" },
      list: [],
      sheetName: "组织标签"
    },
    {
      header: { show_name: "显示名称", last_m_time: "修改时间", last_m_user: "修改人" },
      list: [],
      sheetName: "业务标签"
    },
    {
      header: { show_name: "显示名称", last_m_time: "修改时间", last_m_user: "修改人" },
      list: [],
      sheetName: "组件标签"
    }
  ];
  Promise.all([getAll("loc"), getAll("org"), getAll("business"), getAll("component")]).then((values: Record<string, any>[]) => {
    sheetList[0].list = values[0];
    sheetList[1].list = values[1];
    sheetList[2].list = values[2];
    sheetList[3].list = values[3];
    useDownloadData(sheetList, "标签文件");
  });
};
const getAll = async (label_type: string) => {
  let exportList: Record<string, any>[] = [];
  try {
    let offset = 0;
    while (true) {
      const params = {
        label_type,
        limit: 100,
        offset
      };
      const data = await getTagList(params);
      const pageList = ((data || {}).data || {}).affected_items.map((item: Record<string, any>) => ({
        ...item,
        last_m_time: formatDate(new Date(item.last_m_time))
      }));
      exportList = exportList.concat([...pageList]);
      if (pageList.length < 100 || offset >= 900) {
        break;
      }
      offset += 100;
    }
  } catch (error) {
    console.log(`导出列表错误: ${error}`);
  }
  return exportList;
};
</script>
