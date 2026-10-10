import { ResList } from "@/api/interface/assets";
import http from "@/api";
/**
 * @name 告警中心
 */

// 查询告警策略列表
export const getAlarmPolicy = (params: Record<string, any>) => {
  return http.get<ResList>(`/alert_policy?pretty=true&wait_for_complete=true`, params);
};

// 删除告警策略
export const removeAlarmPolicy = (params: Record<string, string>) => {
  return http.delete(`/alert_policy`, params);
};

// 新增告警策略
export const addAlarmPolicy = (params: Record<string, any>) => {
  return http.post(
    `/alert_policy`,
    {},
    {
      params
    }
  );
};

// 修改告警策略
export const editAlarmPolicy = (params: Record<string, any>) => {
  return http.put(
    `/alert_policy`,
    {},
    {
      params
    }
  );
};

// 查询告警列表
export const getAlarmManage = (params: Record<string, any>, cancel: boolean = true) => {
  return http.get<ResList>(`/alert?pretty=true&wait_for_complete=true`, params, { cancel });
};

// 删除告警
export const removeAlarmManage = (params: Record<string, string>) => {
  return http.delete(`/alert`, params);
};

// 修改告警
export const editAlarmManage = (params: Record<string, any>) => {
  return http.put(
    `/alert`,
    {},
    {
      params
    }
  );
};
