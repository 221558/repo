<template>
  <div class="detail-tag">
    <span>{{ generatorState.selectedGroup.label }}：</span>
    <el-tag class="ml8">{{ generatorState.selectedGroup.loc_show_name }}</el-tag>
    <el-tag class="ml8" type="success">{{ generatorState.selectedGroup.org_show_name }}</el-tag>
    <el-tag class="ml8" type="warning">{{ generatorState.selectedGroup.business_show_name }}</el-tag>
  </div>
  <el-row class="pt20 pb20">
    <el-button type="primary" @click="toAdd">新增规则</el-button>
  </el-row>
  <el-table :data="ruleList" border scrollbar-always-on v-loading="state.isLoading">
    <el-table-column
      v-for="(column, index) in columns"
      :key="`address_${index}`"
      :prop="column.field"
      :label="column.name"
      :width="column.width"
      :show-overflow-tooltip="column.showOverflowTooltip"
    >
      <template #default="scope">
        <component :is="column.render" v-bind="scope.row" v-if="column.render" />
        <span v-else>{{ scope.row[column.field] ?? "-" }}</span>
      </template>
    </el-table-column>
    <el-table-column fixed="right" label="操作" width="120">
      <template #default="scope">
        <el-tooltip effect="dark" :content="`编辑数据`" placement="top">
          <el-button link type="primary" size="small" @click="toEdit(scope.row)">
            <el-icon><Edit /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip effect="dark" :content="`删除数据`" placement="top">
          <el-button link type="primary" size="small" @click="toDel(scope.row)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </el-tooltip>
      </template>
    </el-table-column>
    <!-- 无数据 -->
    <template #empty>
      <div class="table-empty">
        <slot name="empty">
          <img src="@/assets/images/notData.png" alt="notData" />
          <div>暂无数据</div>
        </slot>
      </div>
    </template>
  </el-table>
  <el-pagination
    v-if="state.total !== 0"
    v-model:current-page="state.currentPage"
    v-model:page-size="state.pageSize"
    :page-sizes="[10, 20, 50, 100]"
    :background="true"
    layout="total, sizes, prev, pager, next, jumper"
    :total="state.total"
    @size-change="handleSizeChange"
    @current-change="handleCurrentChange"
  />

  <el-row class="pt20 pb20">
    <el-button type="primary" @click="() => (generatorState.currentStep = 4)">确认生成</el-button>
  </el-row>
  <el-dialog
    v-model="dialogVisible"
    :title="`${modalType === 'add' ? '新增' : '编辑'}规则`"
    width="770px"
    draggable
    @close="toClose"
    :close-on-press-escape="false"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="formData" label-width="100px" :rules="rules">
      <el-form-item label="服务者:" prop="pktrule_serto">
        <el-select v-model="formData.pktrule_serto" filterable placeholder="选择服务者组件标签">
          <el-option
            v-for="(item, index) in providerOptions"
            :key="`providerOptions_${index}`"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="服务:" prop="pktrule_service">
        <el-input v-model="formData.pktrule_service" type="textarea" placeholder="输入服务" :rows="4" />
        <p class="label_desc">
          只能配置单条服务<br />
          服务格式为：协议/端口号<br />
          协议支持 tcp 和 udp；端口号支持单个端口号，或端口号范围如：1~3306<br />
          示例：udp/1~3306
        </p>
      </el-form-item>
      <el-form-item label="访问者范围:" prop="visitors_area" v-if="generatorState.areaType === 'out'">
        <el-select
          v-model="formData.visitors_area"
          multiple
          collapse-tags
          collapse-tags-tooltip
          filterable
          placeholder="选择访问者范围组件标签"
          @change="onChangeArea"
        >
          <el-option
            v-for="(item, i) in areaOptions"
            :key="`areaOptions_${i}`"
            :label="item.label"
            :value="item.value"
            class="group-options"
          >
            <span>{{ item.label }}</span>
            <span v-if="item.value !== 'no_visitors_area'">
              <el-tag class="ml8">{{ item.loc_show_name ?? "无标签" }}</el-tag>
              <el-tag class="ml8" type="success">{{ item.org_show_name ?? "无标签" }}</el-tag>
              <el-tag class="ml8" type="warning">{{ item.business_show_name ?? "无标签" }}</el-tag>
            </span>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="访问者:" prop="pktrule_serfrom">
        <el-select v-model="formData.pktrule_serfrom" filterable placeholder="选择访问者组件标签">
          <el-option
            v-for="(item, index) in visitorsOptions"
            :key="`providerOptions_${index}`"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="toClose">取消</el-button>
        <el-button type="primary" @click="toSave">确认</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts" name="step3">
import { onMounted, ref, reactive, nextTick } from "vue";
import { ElMessage } from "element-plus";
import { useHandleData } from "@/hooks/useHandleData";
import { ColumnProps } from "@/components/PageTable/interface";
import { getTagList } from "@/api/modules/assets";
import { step3GetPktrule, step3AddRule, step3EditRule, step3DelRule } from "@/api/modules/policyGenerator";
import { generatorState } from "../state";

const state = ref<Record<string, any>>({
  isLoading: false,
  currentPage: 1,
  pageSize: 10,
  total: 0
});
let ruleList = ref<Record<string, any>[]>([]);
const columns = reactive<ColumnProps[]>([
  {
    field: "area_label",
    name: "范围",
    showOverflowTooltip: true
  },
  {
    field: "direction_label",
    name: "流量方向",
    showOverflowTooltip: true
  },
  {
    field: "serviceto_name",
    name: "服务者",
    showOverflowTooltip: true
  },
  {
    field: "service_label",
    name: "服务",
    showOverflowTooltip: true
  },
  {
    field: "servicefrom_name",
    name: "访问者",
    showOverflowTooltip: true
  }
]);

let dialogVisible = ref(false);
let modalType = ref("");
const formRef = ref();
let formData = ref<Record<string, any>>({
  id: "",
  pktrule_serto: "", // 服务者组件标签
  pktrule_service: "", // 服务
  visitors_area: ["no_visitors_area"], // 访问者范围，选择分组，默认不限
  pktrule_serfrom: "" // 访问者组件标签
});
const rules = reactive<Record<string, any>>({
  pktrule_serto: [{ required: true, message: "请选择服务者", trigger: "change" }],
  pktrule_service: [{ required: true, message: "请输入服务", trigger: "blur" }],
  visitors_area: [{ required: true, message: "请选择访问者范围", trigger: "change" }],
  pktrule_serfrom: [{ required: true, message: "请选择访问者", trigger: "change" }]
});
let providerOptions = ref<Record<string, any>[]>([]);
let areaOptions = ref<Record<string, any>[]>([]);
let visitorsOptions = ref<Record<string, any>[]>([]);

onMounted(() => {
  getOptions();
  getList();
  getTagVisitors();
});

const getOptions = () => {
  let options = generatorState.groupsOptions.map((k: Record<string, any>) => ({
    label: k.label,
    loc_show_name: k.loc_show_name,
    org_show_name: k.org_show_name,
    business_show_name: k.business_show_name,
    value: k.id
  }));
  options.unshift({ value: "no_visitors_area", label: "不限访问者范围" });
  areaOptions.value = options;

  providerOptions.value = generatorState.providerOptions.slice(1);
};

const getTagVisitors = async () => {
  try {
    let params: Record<string, any> = {
      label_type: "component"
    };
    if (generatorState.areaType === "in") {
      params.pktrule_scope = generatorState.selectedGroup.id;
    } else if (formData.value.visitors_area.length > 1 || formData.value.visitors_area[0] !== "no_visitors_area") {
      params.pktrule_scope = formData.value.visitors_area.join(",");
    }
    const tagItems = await getTagList(params);
    const tagList = ((tagItems || {}).data || {}).affected_items.map(k => ({
      value: k.id,
      label: k.show_name
    }));
    visitorsOptions.value = tagList;
  } catch (error) {
    console.log(`访问者组件标签列表错误: ${error}`);
  }
};

const getList = async () => {
  state.value.isLoading = true;
  try {
    const limit = state.value.pageSize;
    const offset = (state.value.currentPage - 1) * state.value.pageSize;
    const resItems = await step3GetPktrule({ limit, offset, task_id: generatorState.step2Form.task_id });
    if (resItems.message.includes("auto_policy task is deleted.")) {
      ElMessage({
        message: "策略预配置已间隔了1小时，任务已删除，请回到步骤2重新配置",
        type: "error"
      });
    } else {
      ruleList.value = ((resItems || {}).data || {}).affected_items.map(k => ({
        id: k.id,
        area_label: `${k.area === "in" ? "工作组内" : "工作组外"}`,
        direction_label: "入方向流量",
        serviceto: k.serviceto, // 服务者
        serviceto_name: k.serviceto_name,
        service_label: k.service,
        area: !k.scope || k.scope === "None" || k.scope === "any" ? ["no_visitors_area"] : k.scope.split(","),
        servicefrom: k.servicefrom, // 访问者
        servicefrom_name: k.servicefrom_name
      }));
      state.value.total = ((resItems || {}).data || {}).total_affected_items;
    }
  } catch (error) {
    console.log(`规则列表错误: ${error}`);
  }
  state.value.isLoading = false;
};

const handleSizeChange = (val: number) => {
  state.value.pageSize = val;
  state.value.currentPage = 1;
  getList();
};

const handleCurrentChange = (val: number) => {
  state.value.currentPage = val;
  getList();
};

const onChangeArea = (val: string[]) => {
  if (val.length < 1) {
    // 清空所选
    formData.value.visitors_area = ["no_visitors_area"];
  } else {
    const latestItem = val[val.length - 1];
    if (latestItem === "no_visitors_area") {
      formData.value.visitors_area = ["no_visitors_area"];
    } else {
      const noValueIndex = val.indexOf("no_visitors_area");
      if (noValueIndex !== -1) formData.value.visitors_area.splice(noValueIndex, 1);
    }
  }
  formData.value.pktrule_serfrom = "";
  getTagVisitors();
};

const toClose = () => {
  dialogVisible.value = false;
  modalType.value = "";
  formData.value = {
    id: "",
    pktrule_serto: "", // 服务者组件标签
    pktrule_service: "", // 服务
    visitors_area: ["no_visitors_area"], // 访问者范围，选择分组，默认不限
    pktrule_serfrom: "" // 访问者组件标签
  };
};

const toAdd = () => {
  dialogVisible.value = true;
  modalType.value = "add";
  nextTick(() => formRef.value.clearValidate());
};

const toEdit = (item: Record<string, any>) => {
  formData.value = {
    id: item.id,
    pktrule_serto: item.serviceto, // 服务者组件标签
    pktrule_service: item.service_label, // 服务
    visitors_area: item.area.length > 0 ? item.area : ["no_visitors_area"], // 访问者范围，选择分组，默认不限
    pktrule_serfrom: item.servicefrom // 访问者组件标签
  };
  dialogVisible.value = true;
  modalType.value = "edit";
};

const toSave = async () => {
  formRef.value.validate(async (valid: any) => {
    if (valid) {
      let params = {
        pktrule_num: formData.value.id ?? "",
        task_id: generatorState.step2Form.task_id,
        pktrule_serfrom: formData.value.pktrule_serfrom, // 访问者
        pktrule_service: formData.value.pktrule_service,
        pktrule_serto: formData.value.pktrule_serto, // 服务者
        pktrule_area: generatorState.areaType,
        pktrule_scope: "" // 访问者范围
      };
      if (
        (generatorState.areaType === "out" && formData.value["visitors_area"].length > 1) ||
        formData.value["visitors_area"][0] !== "no_visitors_area"
      ) {
        params.pktrule_scope = formData.value["visitors_area"].join(",");
      } else if (generatorState.areaType === "out") {
        params.pktrule_scope = "any";
      }
      let resItems;
      if (modalType.value === "add") {
        resItems = await step3AddRule(params);
      } else {
        resItems = await step3EditRule(params);
      }
      if (resItems.message.includes("failed")) {
        ElMessage({
          message: "保存失败",
          type: "error"
        });
      } else {
        ElMessage({
          message: "保存成功",
          type: "success"
        });
        toClose();
        getList();
      }
    } else {
      return false;
    }
  });
};

const toDel = async (item: Record<string, any>) => {
  await useHandleData(step3DelRule, { id: item.id }, `删除该数据`);
  getList();
};
</script>

<style scoped lang="scss">
.group-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.options-tag {
  font-size: 12px;
  color: #9ea7b4;
}
</style>
