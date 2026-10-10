import { reactive } from "vue";

export const createState = () => ({
  currentStep: 1,
  groupsOptions: [], // 分组列表，用于步骤1下拉框，和步骤3访问者范围下拉框
  tagList1: [], // 位置标签列表，用于步骤2访问者范围下拉框，和新建策略浮窗标签选择下拉
  tagList2: [], // 组织标签列表，用于步骤2访问者范围下拉框，和新建策略浮窗标签选择下拉
  tagList3: [], // 业务标签列表，用于步骤2访问者范围下拉框，和新建策略浮窗标签选择下拉
  selectedGroup: {}, // 步骤1选中的分组
  providerOptions: [], // 服务者组件标签列表，在步骤1选择分组后查询，用于步骤2和步骤3的服务者选择下拉
  areaType: "", // 策略范围：in=组内，out=组外
  step2Form: {
    // 步骤2表单
    pktrule_serto: ["any"], // 服务者组件标签，默认为不限
    pktrule_service: "", // 服务
    visitors_area: [
      { value: "no_loc", label: "不限位置", type: "loc" },
      { value: "no_org", label: "不限组织", type: "org" },
      { value: "no_business", label: "不限业务", type: "business" }
    ], // 访问者范围，默认不限位置、不限组织、不限业务
    pktrule_serfrom: ["any"], // 访问者组件标签，默认为不限
    pktrule_include: "include" // 是否包含，默认包含
  }
});

export const generatorState = reactive<Record<string, any>>(createState());
