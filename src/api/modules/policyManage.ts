import { ResList } from "@/api/interface/assets";
import http from "@/api";
/**
 * @name 策略管理模块
 */

// 查询策略列表
export const getPolicyList = (params: Record<string, any> = {}) => {
  return http.get<ResList>(`/manager/pktpolicy?pretty=true&wait_for_complete=true`, params);
};

//新增策略
export const addPolicy = (params: Record<string, any>) => {
  return http.post(
    `/manager/pktpolicy?pretty=true`,
    {},
    {
      params
    }
  );
};

// 编辑策略
export const editPolicy = (params: Record<string, any>) => {
  return http.put(
    `/manager/pktpolicy?pretty=true`,
    {},
    {
      params
    }
  );
};

// 删除策略
export const delPolicy = (params: Record<string, string>) => {
  return http.delete(`/manager/pktpolicy?pretty=true`, params);
};

// 查询策略规则
export const getPolicyRule = (params: Record<string, any>) => {
  return http.get(`/manager/pktrule`, params);
};

// 删除策略规则
export const delRule = (params: Record<string, any>) => {
  return http.delete(`/manager/pktrule?pretty=true`, params);
};

// 新增策略规则
export const addRule = (params: Record<string, any>) => {
  return http.post(
    `/manager/pktrule?pretty=true`,
    {},
    {
      params
    }
  );
};

// 编辑策略规则
export const editRule = (params: Record<string, any>) => {
  return http.put(
    `/manager/pktrule?pretty=true`,
    {},
    {
      params
    }
  );
};

// 策略下发/取消下发
export const changePolicyState = (params: Record<string, any>) => {
  return http.put(
    `/manager/pktpolicy?pretty=true`,
    {},
    {
      params
    }
  );
};
