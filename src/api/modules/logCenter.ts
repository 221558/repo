import { ResList } from "@/api/interface/assets";
import http from "@/api";
/**
 * @name 日志中心
 */

// 获取登录日志列表
export const getLoginLog = (params: Record<string, any>) => {
  return http.get<ResList>(`/manager/logs/login`, params);
};

// 获取系统日志列表
export const getSystemLog = (params: Record<string, any>) => {
  return http.get<ResList>(`/manager/system_log?pretty=true`, params);
};

// 获取操作日志列表
export const getOperationLog = (params: Record<string, any>) => {
  return http.get<ResList>(`/manager/operation_log?pretty=true`, params);
};
