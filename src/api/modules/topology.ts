import { ResList } from "@/api/interface/assets";
import { ParamsGetTrafficPort } from "@/api/interface/topology";
import http from "@/api";
/**
 * @name 资产模块
 */

// 查询流量
export const getTraffic = (params: Record<string, any>) => {
  return http.get<ResList>(`/manager/topology?pretty=true`, {}, { params });
};

// 查询过滤流量
export const getTrafficFilter = (params: Record<string, any>) => {
  return http.get<ResList>(`/manager/topology/filter?pretty=true`, {}, { params });
};

// 查询折叠组与展开组间流量
export const getTrafficFilterDetail = (params: Record<string, any>) => {
  return http.get<ResList>(`/manager/topology/group/detail2?pretty=true`, {}, { params });
};

// 负载详情-查询负载标签
export const getAgentTag = (id: String) => {
  return http.get<ResList>(`/agents/${id}/syslabels?pretty=true`);
};

// 负载详情-查询负载上服务列表
export const getAgentService = (id: String) => {
  return http.get<ResList>(`/syscollector/${id}/ports`);
};

// 流量详情-查询端口列表
export const getTrafficPort = (params: ParamsGetTrafficPort) => {
  return http.get<ResList>(`/manager/flow_detail?pretty=true`, {}, { params });
};

// 查询连接分析/阻断日志
export const getTrafficLog = (params: Record<string, string>) => {
  return http.get<ResList>(`/manager/flow_log?pretty=true`, params);
};

// 查询异常流量匹配规则
export const getTrafficMatch = (params: Record<string, string>) => {
  return http.get(`/manager/red_flow_match_rule?pretty=true&wait_for_complete=true`, params);
};

// 查询流量匹配策略集
export const getTrafficPolicy = (params: Record<string, string>) => {
  return http.get<ResList>(`/manager/pktpolicy/effect?pretty=true&wait_for_complete=true`, params);
};

// 保存异常流量匹配策略
export const addTrafficMatch = (params: Record<string, string>) => {
  return http.post<ResList>(
    `/manager/red_flow_match_rule?pretty=true&wait_for_complete=true`,
    {},
    {
      params
    }
  );
};

// 查询正常流量存在规则
export const getGreenTrafficMatch = (params: Record<string, string>) => {
  return http.get<ResList>(`/manager/green_flow_match_rule?pretty=true&wait_for_complete=true`, params);
};
