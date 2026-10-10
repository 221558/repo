import { reactive } from "vue";

export const createState = () => ({
  scale: "16",
  chartType: "out",
  groupList: [],
  selectedGroup: {},
  selectInGroup: "",
  selectOutGroup: ""
});

export const state = reactive<Record<string, any>>({
  ...createState()
});
