import { ElNotification } from "element-plus";
import FileSaver from "file-saver";
import * as XLSX from "xlsx";

/**
 * @description 接收数据列表生成表格csv文件（支持生成多sheet表格）
 * @param {Function} sheetList 导出表格的数据 (必传)
 * @param {String} tempName 导出的文件名 (必传)
 * @param {Boolean} isNotify 是否有导出消息提示 (默认为 true)
 * */

interface paramList {
  header: Record<string, any>; // 表格头字段与文字映射
  list: Record<string, any>[]; // 表格数据
  sheetName?: string; // sheet名
  excelMerges?: any[]; // 拓展操作，如合并单元格
  // { // 合并单元格
  //   s: { // 合并开始位置
  //     r: 0, // 行下标
  //     c: 0 // 列下标
  //   },
  //   e: { // 合并结束位置
  //     r: 5,
  //     c: 0
  //   }
  // }
}

export const useDownloadData = (sheetList: paramList[], tempName: string, isNotify: boolean = true) => {
  if (isNotify) {
    ElNotification({
      title: "温馨提示",
      message: "如果数据庞大会导致下载缓慢哦，请您耐心等待！",
      type: "info",
      duration: 3000
    });
  }
  const wb = XLSX.utils.book_new();
  for (let i = 0, length = sheetList.length; i < length; i++) {
    const sheetItem = sheetList[i];
    const data = [sheetItem.header].concat(
      sheetItem.list.map((item: Record<string, any>) => {
        // 过滤数据多余字段
        let res: Record<string, string> = {};
        Object.keys(sheetItem.header).forEach((key: string) => {
          res[key] = item[key];
        });
        return res;
      })
    );
    const sheet = XLSX.utils.json_to_sheet(data, { skipHeader: true });
    if (sheetItem.excelMerges && sheetItem.excelMerges.length > 0) {
      sheet["!merges"] = sheetItem.excelMerges;
    }
    XLSX.utils.book_append_sheet(wb, sheet, sheetItem.sheetName ?? "");
  }
  const workbookBlob = workbook2blob(wb);
  FileSaver.saveAs(workbookBlob, `${tempName ?? "导出文件"}.csv`);
};

const workbook2blob = (workbook: any) => {
  // 生成excel的配置项
  let wopts: Record<string, any> = {
    // 要生成的文件类型
    bookType: "xlsx",
    // // 是否生成Shared String Table，官方解释是，如果开启生成速度会下降，但在低版本IOS设备上有更好的兼容性
    bookSST: false,
    type: "binary"
  };
  let wbout = XLSX.write(workbook, wopts);
  // 将字符串转ArrayBuffer
  const s2ab = (s: string) => {
    let buf = new ArrayBuffer(s.length);
    let view = new Uint8Array(buf);
    for (let i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xff;
    return buf;
  };
  let blob = new Blob([s2ab(wbout)], {
    type: "application/octet-stream"
  });
  return blob;
};
