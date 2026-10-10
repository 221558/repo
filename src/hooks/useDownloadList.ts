import { ElNotification } from "element-plus";
import { ResultData } from "@/api/interface/demo";
import { Parser } from "@json2csv/plainjs";
import FileSaver from "file-saver";

/**
 * @description 接收数据列表生成 blob，下载文件
 * @param {Function} api 导出表格的api方法 (必传)
 * @param {String} tempName 导出的文件名 (必传)
 * @param {Array} columns 导出的列配置 (默认[])
 * @param {Object} params 导出的参数 (默认{})
 * @param {Boolean} isMultipleQuery 是否循环多次查询接口返回全部数据 (默认为 true)，不循环 limit 传递为 0 (适用于主机分组列表、主机列表)
 * @param {Boolean} isUrlId 是否包含 url id参数 (默认为 false)，包含时查询参数需嵌套一层 params (适用于主机详情列表导出、工作组管理工作负载列表导出)
 * @param {Boolean} isNotify 是否有导出消息提示 (默认为 true)
 * @param {Function} dataCallback 数据处理回调函数 (非必传)
 * @param {String} isLastTime 传参中如果需要有lastTime参数（上一页中最后一条数据的时间字段），指定lastTime字段 (非必传)
 * */

interface paramColumns {
  label: string; // 列展示文字
  value: string; // 列取值字段
}

export const useDownloadList = async (
  api: (param: any) => Promise<ResultData>,
  tempName: string,
  columns: paramColumns[] = [],
  params: Record<string, any> = {},
  isMultipleQuery: boolean = true,
  isUrlId: boolean = false,
  isNotify: boolean = true,
  dataCallBack?: (item: Record<string, any>) => Record<string, any>,
  isLastTime: string = ""
) => {
  if (isNotify) {
    ElNotification({
      title: "温馨提示",
      message: "如果数据庞大会导致下载缓慢哦，请您耐心等待！",
      type: "info",
      duration: 3000
    });
  }
  try {
    let exportList: Record<string, any>[] = [];
    if (isMultipleQuery) {
      exportList = await getAll(params, api, isUrlId, isLastTime);
    } else {
      exportList = await getOnce(params, api, isUrlId);
    }
    dataCallBack && (exportList = exportList.map(item => dataCallBack(item)));
    let opts = {
      fields: columns
    };
    const json2csvParser = new Parser(opts);
    const csv = json2csvParser.parse(exportList);
    let blob = new Blob(["\uFEFF" + csv], {
      type: "text/plain;charset=utf-8;"
    });
    FileSaver.saveAs(blob, `${tempName}.csv`);
  } catch (error) {
    console.log(error);
  }
};

const getAll = async (
  params: Record<string, any>,
  api: (param: any) => Promise<ResultData>,
  isUrlId: boolean = false,
  isLastTime: string = ""
) => {
  let exportList: Record<string, any>[] = [];
  try {
    let offset = 0,
      lastTime = undefined;
    if (isLastTime) params.lastTime = lastTime;
    while (true) {
      let param = {};
      if (!isUrlId) {
        param = {
          ...params,
          limit: 100,
          offset
        };
      } else {
        param = {
          urlId: params.urlId,
          params: {
            ...params.params,
            limit: 100,
            offset
          }
        };
      }
      const data = await api(param);
      const pageList = ((data || {}).data || {}).affected_items;
      if (isLastTime && pageList.length > 0) params.lastTime = pageList[pageList.length - 1][isLastTime];
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

const getOnce = async (params: Record<string, any>, api: (param: any) => Promise<ResultData>, isUrlId: boolean = false) => {
  let exportList: Record<string, any>[] = [];
  try {
    let param = {};
    if (!isUrlId) {
      param = {
        ...params,
        limit: 0
      };
    } else {
      param = {
        urlId: params.urlId,
        params: {
          ...params.params,
          limit: 0
        }
      };
    }
    const data = await api(param);
    exportList = ((data || {}).data || {}).affected_items;
  } catch (error) {
    console.log(`导出列表错误: ${error}`);
  }
  return exportList;
};
