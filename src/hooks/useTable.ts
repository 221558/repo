import { Table } from "./interface";
import { reactive, computed, toRefs } from "vue";

/**
 * @description table 页面操作方法封装
 * @param {Function} api 获取表格数据 api 方法 (必传)
 * @param {Object} initParam 获取数据初始化参数 (非必传，默认为{})
 * @param {String} isPageable 分页组件形式 ==> 非必传（默认为page）("page": 分页查询接口, "more": 点击加载更多, "noPage": 不分页)
 * @param {Function} dataCallBack 对后台返回的数据进行处理的方法 (非必传)
 * */
export const useTable = (
  api?: (params: any) => Promise<any>,
  initParam: object = {},
  isPageable: "page" | "more" | "noPage" = "page",
  dataCallBack?: (data: any, totalParam?: any) => any,
  requestError?: (error: any) => void,
  tableRef?: any
) => {
  const state = reactive<Table.StateProps>({
    // 表格数据
    tableData: [],
    // 表格loading状态
    isLoading: false,
    // 分页数据
    pageable: {
      // 当前页数
      pageNum: 1,
      // 每页显示条数
      pageSize: 10,
      // 总条数
      total: 0
    },
    // 查询参数(只包括查询)
    searchParam: {},
    // 初始化默认的查询参数
    searchInitParam: {},
    // 总参数(包含分页和查询参数)
    totalParam: {}
  });
  if (isPageable === "more") {
    state.pageable.pageSize = 100;
  }

  /**
   * @description 分页查询参数(只包括分页和表格字段排序,其他排序方式可自行配置)
   * */
  const pageParam = computed({
    get: () => {
      return {
        pageNum: state.pageable.pageNum,
        pageSize: state.pageable.pageSize
      };
    },
    set: (newVal: any) => {
      console.log("我是分页更新之后的值", newVal);
    }
  });

  /**
   * @description 获取表格数据
   * @return void
   * */
  const getTableList = async (fuzzyInput?: string, columsKey?: string) => {
    if (!api) return;
    state.isLoading = true;
    tableRef.value?.clearSelection();
    try {
      // 先把初始化参数和分页参数放到总参数里面
      Object.assign(
        state.totalParam,
        initParam,
        isPageable !== "noPage" ? pageParam.value : {},
        fuzzyInput ? { search: fuzzyInput, search_in_fields: columsKey } : {}
      );
      let { data } = await api({ ...state.searchInitParam, ...state.totalParam });
      dataCallBack && (data = dataCallBack(data, state.totalParam));
      let tableData = [];
      if (isPageable === "more" && state.totalParam.pageNum !== 1) {
        // 分页形式为点击加载更多。且不是第一页时
        tableData = state.tableData.concat(data.list);
      } else if (isPageable !== "noPage") {
        // 分页形式为点击加载更多，且是第一页，或分页形式为分页时
        tableData = data.list;
      } else {
        // 不分页时
        tableData = data;
      }
      state.tableData = tableData;
      // 解构后台返回的分页数据 (如果有分页更新分页信息)
      if (isPageable !== "noPage") {
        const { pageNum, pageSize, total } = data;
        updatePageable({ pageNum, pageSize, total });
      }
    } catch (error) {
      requestError && requestError(error);
    }
    state.isLoading = false;
  };

  /**
   * @description 更新查询参数
   * @return void
   * */
  const updatedTotalParam = () => {
    state.totalParam = {};
    // 处理查询参数，可以给查询参数加自定义前缀操作
    let nowSearchParam: Table.StateProps["searchParam"] = {};
    // 防止手动清空输入框携带参数（这里可以自定义查询参数前缀）
    for (let key in state.searchParam) {
      // 某些情况下参数为 false/0 也应该携带参数
      if (state.searchParam[key] || state.searchParam[key] === false || state.searchParam[key] === 0) {
        nowSearchParam[key] = state.searchParam[key];
      }
    }
    Object.assign(state.totalParam, nowSearchParam, isPageable !== "noPage" ? pageParam.value : {});
  };

  /**
   * @description 更新分页信息
   * @param {Object} pageable 后台返回的分页数据
   * @return void
   * */
  const updatePageable = (pageable: Table.Pageable) => {
    Object.assign(state.pageable, pageable);
  };

  /**
   * @description 表格数据查询
   * @return void
   * */
  const search = (fuzzyInput?: string, columsKey?: string) => {
    state.pageable.pageNum = 1;
    updatedTotalParam();
    getTableList(fuzzyInput, columsKey);
  };

  /**
   * @description 表格数据重置
   * @return void
   * */
  const reset = () => {
    state.pageable.pageNum = 1;
    // 重置搜索表单的时，如果有默认搜索参数，则重置默认的搜索参数
    state.searchParam = { ...state.searchInitParam };
    updatedTotalParam();
    getTableList();
  };

  /**
   * @description 每页条数改变
   * @param {Number} val 当前条数
   * @return void
   * */
  const handleSizeChange = (val: number) => {
    state.pageable.pageNum = 1;
    state.pageable.pageSize = val;
    getTableList();
  };

  /**
   * @description 当前页改变
   * @param {Number} val 当前页
   * @return void
   * */
  const handleCurrentChange = (val: number) => {
    state.pageable.pageNum = val;
    getTableList();
  };

  return {
    ...toRefs(state),
    getTableList,
    search,
    reset,
    handleSizeChange,
    handleCurrentChange,
    updatedTotalParam
  };
};
