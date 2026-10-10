import { reactive } from "vue";

export const createState = () => ({
  tagList1: [], // 位置标签列表
  tagList2: [], // 组织标签列表
  tagList3: [], // 业务标签列表
  policyStatusOptions: [
    // 策略状态
    { id: "build", label: "建设中" },
    { id: "test", label: "测试中" },
    { id: "protect", label: "防护中" }
  ],
  policyOptions: [
    // 策略类型
    { id: "white", label: "白名单" },
    { id: "black", label: "黑名单" }
  ]
});

export const groupState = reactive<Record<string, any>>(createState());
