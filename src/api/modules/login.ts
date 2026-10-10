import { WzLogin } from "@/api/interface/user";
import adminMenuList from "@/assets/json/adminMenuList.json";
// import authMenuList from "@/assets/json/authMenuList.json";
import authButtonList from "@/assets/json/authButtonList.json";
import { ResList } from "@/api/interface/assets";
import http from "@/api";
import axios from "axios";

/**
 * @name 登录模块
 */

// 用户登录（wazuh 服务）
export const loginWazuh = (params: WzLogin.ReqLoginForm) => {
  return http.get<WzLogin.ResLogin>(
    `/security/user/authenticate`,
    {},
    {
      headers: {
        Authorization: `Basic ${window.btoa(`${params.username}:${params.password}`)}`
      },
      params: params.params
    }
  );
  // return http.post<WzLogin.ResLogin>(`/login`, params, { loading: true, cancel: false }); // 控制当前请求显示全屏 loading，正常 post json 请求  ==>  application/json
  // return http.post<WzLogin.ResLogin>(`/login`, {}, { params }); // post 请求携带 query 参数  ==>  ?username=admin&password=123456
  // return http.post<WzLogin.ResLogin>(`/login`, qs.stringify(params)); // post 请求携带表单参数  ==>  application/x-www-form-urlencoded
  // return http.get<WzLogin.ResLogin>(`/login?${qs.stringify(params, { arrayFormat: "repeat" })}`); // get 请求可以携带数组等复杂参数
};

// 查询当前用户信息
export const getCurrentUser = () => {
  return http.get<ResList>(`/security/users/me?pretty=true`);
};

// 获取菜单列表
export const getAuthMenuListApi = () => {
  return adminMenuList; // 返回超级管理员角色全部导航
  // return authMenuList; // 返回系统默认 demo 导航。部分 demo 页面有调用测试服务接口，需修改代理指向测试服务
};

// 获取按钮权限
export const getAuthButtonListApi = () => {
  // 测试数据，系统设计对按钮操作无权限控制
  return authButtonList;
};

// 用户退出登录（wazuh 服务）
export const logoutWazuh = () => {
  return http.delete(`/security/user/authenticate`);
};

// 查询登录IP黑名单校验
export const getLoginIPCheck = () => {
  return http.post<ResList>(`/manager/webloggingconfig?pretty=true`);
};

// 查询用户登录锁定信息
export const getUserLock = (username: string) => {
  return http.get<ResList>(`/manager/weblogging?pretty=true&&webloguser=${username}`);
};

// 更新用户登录锁定信息
export const updateUserLock = (params: WzLogin.ParamsUpdateUserLock) => {
  return http.put(
    `/manager/weblogging?pretty=true`,
    {},
    {
      params
    }
  );
};

// 记录登录日志
export const saveLoginLog = (params: WzLogin.ParamsSaveLoginLog) => {
  return http.put(
    `/manager/logs/login?pretty=true`,
    {},
    {
      params
    }
  );
};

// 查询版本信息
export const getPlatform = () => {
  return axios.get(`/platform.json`);
};
