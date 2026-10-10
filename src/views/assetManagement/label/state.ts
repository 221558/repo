import { reactive } from "vue";

export const createState = () => ({
  activeName: "loc",
  pageType: "list" // list=列表页，add=新增，detail=编辑
});

export const labelState = reactive<Record<string, string>>(createState());
