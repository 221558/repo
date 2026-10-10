import http from "@/api";
import { ResList } from "@/api/interface/assets";

// chart1-数量统计
export const getChart1Total = () => {
  return http.get(`/agents/statusandflowinfo?pretty=true`);
};

// chart1-组间流量
export const getChart1TopologyGroup = (params: Record<string, string> = {}) => {
  return http.get<ResList>(`/manager/topology/group?pretty=true`, params);
};

// chart1-组间分组详情
export const getChart1GroupDetail = (group: string) => {
  return http.get(`/agents/${group}/statusandflowinfo?pretty=true`);
};

// chart1-两个组间流量
export const getChart1TopologyDetail = (params: Record<string, any>) => {
  return http.get<ResList>(`/manager/topology/group/detail?pretty=true`, params);
};

// chart1-负载详情
export const getChart1AgentDetail = (agent: string) => {
  return http.get<ResList>(`/agents/${agent}/usage_plus?pretty=true`);
};

// chart2-工作负载属性统计
export const getChart2 = () => {
  return http.get(`/agents/summary/type?pretty=true`);
};

// chart3-工作负载流量top10
export const getChart3 = () => {
  return http.get<ResList>(`/manager/topology/top?pretty=true`);
};

// chart4-工作负载资源消耗top10
export const getChart4 = (params: Record<string, string>) => {
  return http.get(`/agents/usage?pretty=true&limit=10`, params);
};

// chart5-流量阻断告警
export const getChart5 = () => {
  return http.get<ResList>(`/manager/drop_flow/top?pretty=true`);
};

// chart6-负载标签使用频率
export const getChart6 = (params: Record<string, string>) => {
  return http.get(`/lables/usage?pretty=true&limit=10`, params);
};

// chart8-负载与流量状态趋势
export const getChart8 = () => {
  return http.get(`/manager/daily_flow?pretty=true&days=14`);
};

// chart9-五元组维度正常流量TOP10
export const getChart9 = () => {
  return http.get<ResList>(`/manager/conntrack/top?pretty=true`);
};
