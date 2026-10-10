import { AxiosResponse } from "axios";

/**
 * @description 拼接网络接口错误信息
 * @param {AxiosResponse} response 接口返回
 * @returns {String} 返回处理后的错误信息
 */
export const errorHandle = (response?: AxiosResponse) => {
  const hasFailed = (((response || {}).data || {}).data || {}).total_failed_items || 0;
  if (hasFailed) {
    let res = "";
    const error = (((((response || {}).data || {}).data || {}).failed_items || [])[0] || {}).error || {};
    const failed_ids = (((((response || {}).data || {}).data || {}).failed_items || [])[0] || {}).id || {};
    const message = ((response || {}).data || {}).message || "意外错误";
    res = `${message} (${error.code}) - ${error.message} ${
      failed_ids && failed_ids.length > 0 ? ` Affected ids: ${failed_ids} ` : ""
    }`;
    return res;
  }
  return ((response || {}).data || {}).detail ?? "";
};
