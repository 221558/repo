import { useUserStore } from "@/stores/modules/user";
import http from "@/api";
import esHttp from "@/api/esHttp";
import { ResList } from "@/api/interface/assets";
/**
 * @name 系统管理
 */
const isCluster = () => {
  const clusterBool = useUserStore().isCluster;
  return clusterBool ? "/cluster" : "/manager";
};

// 查询用户列表
export const getUserList = () => {
  return http.get<ResList>(`/security/users?pretty=true`);
};

//删除用户
export const removeUser = (params: Record<string, string>) => {
  return http.delete(`/security/users?pretty=true`, {
    user_ids: params.id
  });
};

// 新增用户
export const addUser = (params: Record<string, string>) => {
  return http.post(`/security/users?pretty=true`, params);
};

// 修改用户
export const editUser = (params: Record<string, string>, id: any) => {
  return http.put(`/security/users/${id}?pretty=true`, params);
};

// 查询激活码
export const getCode = () => {
  return http.get(`security/activecode?pretty=true`);
};

// 导入密钥
export const exportSecretKey = (params: Record<string, string>) => {
  const isCluster = useUserStore().isCluster;
  const urlOptions = {
    isCluster: `/cluster/authcode?pretty=true`,
    noCluster: `/security/authcode?pretty=true`
  };
  let url = isCluster ? urlOptions.isCluster : urlOptions.noCluster;
  return http.post(
    url,
    {},
    {
      params
    }
  );
};

// 查询授权列表
export const toLicenseList = () => {
  return http.get(`/security/authcode?pretty=true`);
};

// 查询登录配置信息
export const getLoginConfig = () => {
  return http.get<ResList>(`/manager/webloggingconfig?pretty=true`);
};

// 配置登录配置信息
export const toWebLoggingConfig = (params: Record<string, string>) => {
  return http.put(
    `/manager/webloggingconfig?pretty=true`,
    {},
    {
      params
    }
  );
};

// 查询日志保留天数
export const getManagerConfig = () => {
  return esHttp.get(`/_ilm/policy/filebeat`);
};

// 配置日志保留天数
export const toManagerConfig = (params: Record<string, any>) => {
  return esHttp.put(`/_ilm/policy/filebeat`, params);
};

// 查询运行异常时是否自动重启管理器
export const getManagerConfiguration = () => {
  return http.get(`/manager/configuration?pretty=true&section=command`);
};

// 切换运行异常时自动重启管理器
export const toManagerConfiguration = () => {
  return http.put(`${isCluster()}/switch_wodle_command?pretty=true&tag_list=manager_monitor,cluster_monitor`);
};

// 查询系统监控状态
export const getSystemStatus = (selectedNode: string = "") => {
  const isCluster = useUserStore().isCluster;
  const urlOptions = {
    isCluster: `/cluster/hardwareusedinfo?pretty=true&&nodes_list=${selectedNode}`,
    noCluster: `/manager/hardwareusedinfo?pretty=true`
  };
  let url = isCluster ? urlOptions.isCluster : urlOptions.noCluster;
  return http.get<ResList>(url);
};

// 查询邮箱服务配置
export const getEmailConfig = () => {
  return http.get(`/email_cfg?pretty=true&wait_for_complete=true`);
};

// 保存邮箱服务配置
export const toEmailConfig = (params: Record<string, any>) => {
  return http.put(
    `/email_cfg?pretty=true&wait_for_complete=true`,
    {},
    {
      params
    }
  );
};

// 测试邮箱服务连接
export const toEmailTest = (params: Record<string, any>) => {
  return http.put(
    `/email_test?pretty=true&wait_for_complete=true`,
    {},
    {
      params
    }
  );
};
