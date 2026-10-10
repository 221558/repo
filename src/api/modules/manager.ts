import { ResList } from "@/api/interface/assets";
import http from "@/api";
/**
 * @name 管理器相关
 */

// 查询集群状态
export const getIsCluster = () => {
  return http.get(`/cluster/status`);
};

// 查询集群节点列表
export const getClusterNodes = () => {
  return http.get<ResList>(`/cluster/nodes`);
};

// 查询守护进程列表
export const getDaemonsList = (logsPath: string) => {
  return http.get<ResList>(`${logsPath}/summary`);
};

// 重启集群管理器
export const restartCluster = () => {
  return http.put(`/cluster/restart`, { delay: 15000 });
};

// 重启单机管理器
export const restartManager = () => {
  return http.put(`/manager/restart`);
};

// 查询管理器状态
export const getDaemons = () => {
  return http.get(`/manager/status`);
};
