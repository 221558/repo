import { ResList } from "@/api/interface/assets";
import http from "@/api";
/**
 * @name 任务中心
 */

// 查询工单列表
export const getWorkOrder = (params: Record<string, any>) => {
  return http.get<ResList>(`/work_order?pretty=true&wait_for_complete=true`, params);
};

// 查询工单详情
export const getWorkOrderDetail = (params: Record<string, any>) => {
  return http.get<ResList>(`/work_order_detail?pretty=true&wait_for_complete=true`, params);
};

// 处理工单
export const operWorkOrder = (params: Record<string, any>) => {
  return http.put<ResList>(`/work_order?pretty=true&wait_for_complete=true`, {}, { params });
};

// 查询工单开关
export const getWorkOrderSwitch = () => {
  return http.get(`/work_order_switch?pretty=true&wait_for_complete=true`, {});
};

// 配置工单开关
export const operWorkOrderSwitch = (params: Record<string, any>) => {
  return http.put(`/work_order_switch`, {}, { params });
};

// 创建工单
export const createWorkOrder = (params: Record<string, string>) => {
  return http.post(`/work_order?pretty=true&wait_for_complete=true`, {}, { params });
};

// 上传工单附件
export const uploadAnnex = (body: any, params: Record<string, any>) => {
  return http.put(`/work_order_annex`, body, {
    headers: {
      "content-type": "application/octet-stream"
    },
    params
  });
};

// 下载工单附件
export const downloadAnnex = (params: Record<string, any>) => {
  return http.get(`/work_order_annex?pretty=true&wait_for_complete=true`, params);
};
