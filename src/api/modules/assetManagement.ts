import http from "@/api";
/**
 * @name 资产管理
 */

//删除标签
export const removeLabel = (params: Record<string, string>) => {
  return http.delete(`/sys_labels?pretty=true`, params);
};

// 新增标签
export const addLabel = (params: Record<string, string>) => {
  return http.post(
    `/sys_labels?pretty=true`,
    {},
    {
      params
    }
  );
};

// 修改标签
export const editLabel = (params: Record<string, string>) => {
  return http.put(
    `/sys_labels?pretty=true`,
    {},
    {
      params
    }
  );
};

// 查询安装版本
export const getVersionList = () => {
  return http.put(`/manager/agentmanage?pretty=true&login_operation=version`);
};

// 查询部署任务列表
export const getTaskList = () => {
  return http.get(`/manager/agentmanage?pretty=true`);
};
// 删除部署任务
export const removeTask = (params: Record<string, string>) => {
  return http.put(
    `/manager/agentmanage?pretty=true`,
    {},
    {
      params
    }
  );
};

// 任务详情
export const getTaskInfo = (params: Record<string, string>) => {
  return http.put(
    `/manager/agentmanage?pretty=true`,
    {},
    {
      params
    }
  );
};

// 添加任务
export const addtask = (params: Record<string, string>) => {
  return http.post(`/manager/agentmanage?pretty=true&login_alias=${params.login_alias}&login_operation=add`, {
    login_info: params.login_info
  });
};
