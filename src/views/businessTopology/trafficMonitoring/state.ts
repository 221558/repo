import { reactive } from "vue";

export const createState = () => ({
  currentStep: 1,
  trafficItem: {},
  flowMatch: {},
  stepList: [], // 步骤列表
  ruleList: [], // 规则列表
  tagList1: [],
  tagList2: [],
  tagList3: [],
  scopeOptions: [
    // 规则范围
    { id: "in", label: "范围内" },
    { id: "out", label: "范围外" }
  ],
  directionOptions: [
    // 规则流量方向
    { id: "in", label: "入方向流量" },
    { id: "out", label: "出方向流量" }
  ],
  typeOptions: [
    // 服务者访问者类型
    { id: "tag", label: "组件" },
    { id: "address", label: "地址对象" },
    { id: "internal", label: "外网地址" }
  ]
});

export const policyState = reactive<Record<string, any>>(createState());
