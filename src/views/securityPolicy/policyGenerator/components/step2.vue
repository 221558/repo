<template>
  <el-form ref="formRef" :model="generatorState.step2Form" label-width="100px" :rules="rules">
    <el-form-item label="服务者:" prop="pktrule_serto">
      <el-select
        v-model="generatorState.step2Form.pktrule_serto"
        multiple
        collapse-tags
        collapse-tags-tooltip
        filterable
        placeholder="选择服务者组件标签"
        @change="(val: string[]) => onChange(val, 'pktrule_serto')"
      >
        <el-option
          v-for="(item, index) in generatorState.providerOptions"
          :key="`providerOptions_${index}`"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="服务:" prop="pktrule_service">
      <el-input v-model="generatorState.step2Form.pktrule_service" type="textarea" placeholder="输入服务" :rows="4" />
      <p class="label_desc">
        不配置默认为不限服务<br />
        多个服务用英文逗号分割<br />
        服务格式为：协议/端口号<br />
        协议支持 tcp 和 udp；端口号支持单个端口号，或端口号范围如：1~3306<br />
        示例：tcp/80,udp/1~3306
      </p>
    </el-form-item>
    <el-form-item label="访问者范围:" prop="visitors_area" v-if="generatorState.areaType === 'out'">
      <el-select
        v-model="generatorState.step2Form.visitors_area"
        multiple
        filterable
        placeholder="选择访问者范围组件标签"
        value-key="value"
        @change="onChangeArea"
      >
        <el-option-group v-for="(options, index) in areaOptions" :key="`areaGroupOptions_${index}`" :label="options.label">
          <el-option
            v-for="(item, i) in generatorState[options.optionsField]"
            :key="`areaOptions_${i}`"
            :label="item.label"
            :value="item"
          />
        </el-option-group>
      </el-select>
    </el-form-item>
    <el-form-item label="访问者:" prop="pktrule_serfrom">
      <el-select
        v-model="generatorState.step2Form.pktrule_serfrom"
        multiple
        collapse-tags
        collapse-tags-tooltip
        filterable
        placeholder="选择访问者组件标签"
        @change="(val: string[]) => onChange(val, 'pktrule_serfrom')"
      >
        <el-option
          v-for="(item, index) in visitorsOptions"
          :key="`providerOptions_${index}`"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="是否包含:" prop="pktrule_include">
      <el-radio-group v-model="generatorState.step2Form.pktrule_include" class="radio-group-warp">
        <el-radio :label="'include'">包含</el-radio>
        <el-radio :label="'exclude'">不包含</el-radio>
      </el-radio-group>
      <p class="label_desc">是否包含当前指定部分流量</p>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" plain @click="onSubmit">确定</el-button>
      <el-button type="primary" :disabled="!isSearch || loading" @click="() => (generatorState.currentStep = 3)">
        下一步
      </el-button>
    </el-form-item>
  </el-form>
  <div class="detail-tag mt20 pt10 selected-agent">
    <span>{{ generatorState.selectedGroup.label }}：</span>
    <el-tag class="ml8">{{ generatorState.selectedGroup.loc_show_name }}</el-tag>
    <el-tag class="ml8" type="success">{{ generatorState.selectedGroup.org_show_name }}</el-tag>
    <el-tag class="ml8" type="warning">{{ generatorState.selectedGroup.business_show_name }}</el-tag>
    <div :style="{ flexGrow: 1 }" />
    <span>工作负载：{{ generatorState.selectedGroup.count }}</span>
  </div>
  <div v-if="isSearch" class="mt10" v-loading="loading">
    <p class="rate-title">流量筛选后的策略规则覆盖率：{{ coverRes.coverage }}%</p>
    <el-progress :percentage="coverRes.coverage" :show-text="false" color="#017D73" :stroke-width="10" />
    <div class="rate-count mt5">
      <span class="in-rate">{{ coverRes.covernum }}</span>
      <span>{{ coverRes.uncovernum }}</span>
    </div>
    <div class="rate-count mt5">
      <span>匹配策略的连接关系</span>
      <span>未匹配策略的连接关系</span>
    </div>
  </div>
</template>

<script setup lang="ts" name="step2">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { generatorState } from "../state";
import { getTagList } from "@/api/modules/assets";
import { step2ToPrepolicy, step2GetCoverage } from "@/api/modules/policyGenerator";

const formRef = ref();
let visitorsOptions = ref<Record<string, any>[]>([]);

let areaOptions = ref<Record<string, any>[]>([
  {
    label: "位置",
    optionsField: "tagList1"
  },
  {
    label: "组织",
    optionsField: "tagList2"
  },
  {
    label: "业务",
    optionsField: "tagList3"
  }
]);

const checkService = (rule: any, value: any, callback: any) => {
  const serviceArr = value.split(",");
  const noVerify = serviceArr.findIndex((service: string) => {
    const itemArr = service.split("/");
    if (itemArr.length !== 2) {
      return true;
    }

    const protocol = itemArr[0];
    if (protocol !== "tcp" && protocol !== "udp") {
      return true;
    }

    const port = itemArr[1];
    const portArr = port.split("~");
    const noPort = portArr.findIndex((port: string) => !port || isNaN(Number(port)) || Number(port) < 0 || Number(port) > 65535);
    if (!port || noPort !== -1) {
      return true;
    }
  });
  if (!value || noVerify === -1) {
    callback();
  } else {
    callback(new Error("格式不正确，请检验"));
  }
};
const rules = reactive<Record<string, any>>({
  pktrule_service: [{ validator: checkService, trigger: "blur" }]
});

let isSearch = ref(false);

let coverRes = ref<Record<string, any>>({
  coverage: 0,
  covernum: "0",
  uncovernum: "0"
});

const loading = ref(false);

onMounted(() => {
  getTagVisitors();
});

const onChange = (val: string[], type: string) => {
  if (val.length < 1) {
    generatorState.step2Form[type] = ["any"];
  } else {
    const latestItem = val[val.length - 1];
    if (latestItem === "any") {
      generatorState.step2Form[type] = ["any"];
    } else {
      const noValueIndex = val.indexOf("any");
      if (noValueIndex !== -1) generatorState.step2Form[type].splice(noValueIndex, 1);
    }
  }
};

const onChangeArea = (val: Record<string, any>[]) => {
  const keyArr = [
    { value: "no_loc", label: "不限位置", type: "loc", index: 0 },
    { value: "no_org", label: "不限组织", type: "org", index: 1 },
    { value: "no_business", label: "不限业务", type: "business", index: 2 }
  ];
  if (val.length < 3) {
    // 删除标签
    for (let i = 0, length = keyArr.length; i < length; i++) {
      let item = keyArr[i];
      if (!val.find(select => select.type === item.type)) {
        generatorState.step2Form.visitors_area.splice(item.index, 0, {
          value: item.value,
          label: item.label,
          type: item.type
        });
        break;
      }
    }
  } else {
    // 选择标签
    const addItem = val[3];
    for (let i = 0, length = keyArr.length; i < length; i++) {
      let item = keyArr[i];
      if (addItem.type === item.type) {
        generatorState.step2Form.visitors_area.splice(item.index, 1, addItem);
        generatorState.step2Form.visitors_area.splice(3);
        break;
      }
    }
  }
  generatorState.step2Form.pktrule_serfrom = ["any"];
  getTagVisitors();
};

const getTagVisitors = async () => {
  try {
    let params: Record<string, any> = {
      label_type: "component"
    };
    if (generatorState.areaType === "in") {
      params.pktrule_scope = generatorState.selectedGroup.id;
    } else {
      params.loc_id =
        generatorState.step2Form.visitors_area[0].value === "no_loc" ? "0" : generatorState.step2Form.visitors_area[0].value;
      params.org_id =
        generatorState.step2Form.visitors_area[1].value === "no_org" ? "0" : generatorState.step2Form.visitors_area[1].value;
      params.business_id =
        generatorState.step2Form.visitors_area[2].value === "no_business" ? "0" : generatorState.step2Form.visitors_area[2].value;
    }
    const tagItems = await getTagList(params);
    const tagList = ((tagItems || {}).data || {}).affected_items.map(k => ({
      value: k.id,
      label: k.show_name
    }));
    tagList.unshift({
      value: "any",
      label: "不限"
    });
    visitorsOptions.value = tagList;
  } catch (error) {
    console.log(`访问者组件标签列表错误: ${error}`);
  }
};

const onSubmit = () => {
  formRef.value.validate(async (valid: any) => {
    if (valid) {
      toPreConfig();
    } else {
      return false;
    }
  });
};

const toPreConfig = async () => {
  isSearch.value = true;
  loading.value = true;
  try {
    let params = {
      pktrule_area: generatorState.areaType,
      pktrule_include: generatorState.step2Form.pktrule_include,
      pktrule_serto: "any", // 服务者
      pktrule_serfrom: "any", // 访问者
      pktrule_service: generatorState.step2Form.pktrule_service || "any/any",
      loc_id: "",
      org_id: "",
      business_id: "",
      task_id: generatorState.step2Form.task_id ?? ""
    };
    if (generatorState.step2Form.pktrule_serto.length > 1 || generatorState.step2Form.pktrule_serto[0] !== "any") {
      params.pktrule_serto = generatorState.step2Form.pktrule_serto.join(",");
    }
    if (generatorState.step2Form.pktrule_serfrom.length > 1 || generatorState.step2Form.pktrule_serfrom[0] !== "any") {
      params.pktrule_serfrom = generatorState.step2Form.pktrule_serfrom.join(",");
    }
    if (generatorState.areaType === "out") {
      params.loc_id =
        generatorState.step2Form.visitors_area[0].value === "no_loc" ? "0" : generatorState.step2Form.visitors_area[0].value;
      params.org_id =
        generatorState.step2Form.visitors_area[1].value === "no_org" ? "0" : generatorState.step2Form.visitors_area[1].value;
      params.business_id =
        generatorState.step2Form.visitors_area[2].value === "no_business" ? "0" : generatorState.step2Form.visitors_area[2].value;
    }

    const resItems: any = await step2ToPrepolicy({
      id: generatorState.selectedGroup.id,
      params
    });
    if (resItems.message.includes("failed")) {
      ElMessage({
        message: "策略预配置错误",
        type: "error"
      });
    } else {
      generatorState.step2Form.task_id = resItems.task_id;
      await toGetCoverage();
    }
  } catch (error) {
    console.log(`策略预配置错误: ${error}`);
    loading.value = false;
  }
};

const toGetCoverage = async () => {
  const timer = setInterval(async () => {
    try {
      const param = {
        id: generatorState.selectedGroup.id,
        task_id: generatorState.step2Form.task_id
      };
      const dataRes = await step2GetCoverage(param);
      const data = ((dataRes || {}).data || {}).affected_items[0];
      if (data.status === "done") {
        clearInterval(timer!);
        coverRes.value = {
          coverage: data.coverage,
          covernum: data.cover_num,
          uncovernum: data.uncover_num
        };
        loading.value = false;
      }
    } catch (error) {
      console.log(`策略覆盖率错误: ${error}`);
      clearInterval(timer!);
      loading.value = false;
    }
  }, 3000);
};
</script>

<style scoped lang="scss">
.selected-agent {
  border-top: 1px solid #eeeff1;
}
.radio-group-warp {
  width: 350px;
}
</style>
