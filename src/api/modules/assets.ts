import { ParamsGetAgentList, ResList, ParamsGetUsage } from "@/api/interface/assets";
import { useUserStore } from "@/stores/modules/user";
import http from "@/api";
/**
 * @name 资产模块
 */

const isCluster = () => {
  const clusterBool = useUserStore().isCluster;
  return clusterBool ? "/cluster" : "";
};

// 查询工作负载列表
export const getAgentList = (params: ParamsGetAgentList) => {
  return http.get<ResList>(`/agents`, params);
};

// 查询工作负载操作系统列表
export const getAgentOsList = (q: string = "id!=000") => {
  return http.get<ResList>(`/agents/stats/distinct`, {
    fields: "os.platform",
    q
  });
};

// 查询主机分组列表
export const getGroupList = (params: ParamsGetAgentList) => {
  return http.get<ResList>(`/groups`, params);
};

// 新增主机分组
export const addGroup = (params: Record<string, string>) => {
  return http.post<ResList>(
    `/groups?pretty=true`,
    {},
    {
      params
    }
  );
};

// 编辑主机分组
export const editGroup = (params: Record<string, string>) => {
  return http.put<ResList>(
    `/groups?pretty=true`,
    {},
    {
      params
    }
  );
};

// 删除主机分组
export const deleteGroup = (params: Record<string, string>) => {
  return http.delete<ResList>(`/groups`, params);
};

// 查询标签列表
export const getTagList = (params: Record<string, any>, cancel: boolean = true) => {
  return http.get<ResList>("/sys_labels?pretty=true", params, { cancel });
};

// 查询某工作组内工作负载
export const getGroupAgent = (params: Record<string, any>, cancel: boolean = true) => {
  return http.get<ResList>(`/groups/${params.urlId}/agents`, params.params, { cancel });
};

// 为工作组添加工作负载
export const groupAddAgent = (params: Record<string, any>) => {
  return http.put(
    `/agents/group`,
    {},
    {
      params
    }
  );
};

// 为工作组移除工作负载
export const groupDelAgent = (params: Record<string, any>) => {
  return http.delete(
    `/agents/group`,
    {},
    {
      params
    }
  );
};

// 启动代理
export const toStartAgent = (params: Record<string, string>) => {
  return http.put(`/agents/command?pretty=true&send_command=/var/ossec/bin/ossec-control+restart`, {}, { params });
};

// 关闭代理
export const toStopAgent = (params: Record<string, string>) => {
  return http.put(`/agents/command?pretty=true&send_command=/var/ossec/bin/ossec-control+sleep`, {}, { params });
};

// 编辑代理标签
export const toSaveTag = (params: Record<string, string>) => {
  return http.put(`/agents/tag`, {}, { params });
};

// 编辑代理策略状态
export const toSavePolicyStatus = (params: Record<string, string>) => {
  return http.put(`/agents/policy_status`, {}, { params });
};

// 编辑代理出站管理
export const toSaveOutbound = (params: Record<string, string | boolean>) => {
  return http.put(`/agents/out_block`, {}, { params });
};

// 重启代理
export const toRestartAgent = (params: Record<string, string>) => {
  return http.put(`/agents/${params.agents_list}/restart?op_user=${params.op_user}`);
};

// 卸载代理端探针
export const toRemoveAgent = (params: Record<string, string>) => {
  return http.put(
    `/active-response?pretty=true`,
    {
      command: "removeagent.sh",
      custom: true
    },
    { params }
  );
};

// 删除管理器代理数据
export const deleteAgent = (params: Record<string, string>) => {
  return http.delete<ResList>(`/agents?pretty=true&purge=true&older_than=0s`, {}, { params });
};

// 代理详情页-查询网络状态和cpu等实时数据
export const getUsage = (params: ParamsGetUsage) => {
  const cluster = isCluster() === "/cluster";
  const url = {
    isCluster: `/cluster/${params.node_name}/agents/${params.id}/usage?pretty=true`,
    noCluster: `/agents/${params.id}/usage?pretty=true`
  };
  return http.get<any>(`${cluster ? url.isCluster : url.noCluster}`);
};

// 代理详情-基本信息tab查询硬件信息
export const getHardware = (id: string) => {
  return http.get<any>(`/syscollector/${id}/hardware`);
};

// 代理详情-基本信息tab查询硬件信息
export const getOs = (id: string) => {
  return http.get<any>(`/syscollector/${id}/os`);
};

// 代理详情-基本信息tab查询POD详情
export const getPOD = (dstip: string) => {
  return http.get<any>(`/manager/podinfo?pretty=true&dstip=${dstip}`);
};

// 代理详情-查询网络接口
export const getNetiface = (params: Record<string, any>) => {
  return http.get<ResList>(`/syscollector/${params.urlId}/netiface`, params.params);
};

// 代理详情-查询端口
export const getPort = (params: Record<string, any>) => {
  return http.get<ResList>(`/syscollector/${params.urlId}/ports`, params.params);
};

// 代理详情-查询网络设置
export const getNetaddr = (params: Record<string, any>) => {
  return http.get<ResList>(`/syscollector/${params.urlId}/netaddr`, params.params);
};
