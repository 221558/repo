import { reactive } from "vue";

export const createState = () => ({
  tagList1: [], // 位置标签列表
  tagList2: [], // 组织标签列表
  tagList3: [], // 业务标签列表
  tagList4: [], // 组件标签列表
  policyOptions: [
    // 策略类型
    { id: "white", label: "白名单" },
    { id: "black", label: "黑名单" }
  ],
  serviceOptions: [], // 服务对象列表
  addressOptions: [], // 地址对象列表
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
    // 选择类型
    { id: "tag", label: "组件" },
    { id: "address", label: "地址对象" }
  ]
});

export const policyManageState = reactive<Record<string, any>>(createState());
