import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { showFullScreenLoading, tryHideFullScreenLoading } from "@/components/Loading/fullScreen";
import { LOGIN_URL } from "@/config";
import { ElMessage } from "element-plus";
import { ResultData } from "@/api/interface/demo";
import { ResultEnum } from "@/enums/httpEnum";
import { errorHandle } from "./helper/errorHandle";
import { checkMsg } from "./helper/checkMsg";
import { AxiosCanceler } from "./helper/axiosCancel";
import { useUserStore } from "@/stores/modules/user";
import router from "@/routers";

export interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  loading?: boolean;
  cancel?: boolean;
}

const config = {
  // 默认地址请求地址，可在 .env.** 文件中修改
  baseURL: import.meta.env.VITE_API_URL as string,
  // 设置超时时间
  timeout: ResultEnum.TIMEOUT as number,
  // 跨域时候允许携带凭证
  withCredentials: true
};

const axiosCanceler = new AxiosCanceler();

const checkNoAuth = (apiUrl: string | undefined, method: string | undefined) => {
  // 无需用户token即可调用的接口
  const noAuthApi = [
    { method: "get", url: "/manager/webloggingconfig", des: "查询登录参数" },
    { method: "post", url: "/manager/webloggingconfig", des: "查询登录IP黑名单校验" },
    { method: "put", url: "/manager/logs/login", des: "记录登录日志" },
    { method: "get", url: "/manager/weblogging", des: "查询用户登录锁定信息" },
    { method: "put", url: "/manager/weblogging", des: "更新用户登录锁定信息" },
    { method: "get", url: "/security/user/authenticate", des: "登录查询token" }
  ];
  const url = apiUrl ? apiUrl.split("?")[0] : "";
  const noAuth = noAuthApi.find((item: Record<string, string>) => item.url === url && item.method === method);
  return noAuth ? true : false;
};

class RequestHttp {
  service: AxiosInstance;
  public constructor(config: AxiosRequestConfig) {
    // instantiation
    this.service = axios.create(config);

    /**
     * @description 请求拦截器
     * 客户端发送请求 -> [请求拦截器] -> 服务器
     * token校验(JWT) : 接受服务器返回的 token,存储到 vuex/pinia/本地储存当中
     */
    this.service.interceptors.request.use(
      (config: CustomAxiosRequestConfig) => {
        const userStore = useUserStore();
        // 默认取消重复请求（同路径同参数的请求，在未返回时重复调用取消上次请求），可在 api 服务中通过指定的第三个参数: { cancel: false } 来控制
        config.cancel ?? (config.cancel = true);
        config.cancel && axiosCanceler.addPending(config);
        // 默认不需要显示全屏 loading，可在 api 服务中通过指定的第三个参数: { loading: true } 来控制
        config.loading && showFullScreenLoading();
        if (config.headers && typeof config.headers.set === "function" && !config.headers.Authorization && userStore.token) {
          config.headers.set("Authorization", `Bearer ${userStore.token}`);
        } else if (!userStore.token && !checkNoAuth(config.url, config.method)) {
          // 无token，且当前接口需要身份认证时，取消接口调用（适用于调用多个接口时，第一个接口401清除token跳转到登录页，而取消逻辑中后续接口的调用）
          axiosCanceler.removePending(config);
        }
        if (userStore.userInfo?.name) {
          config.headers.set("user-name", userStore.userInfo.name);
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    /**
     * @description 响应拦截器
     *  服务器换返回信息 -> [拦截统一处理] -> 客户端JS获取到信息
     */
    this.service.interceptors.response.use(
      (response: AxiosResponse) => {
        const { data, config }: { data: any; config: CustomAxiosRequestConfig } = response;

        config.cancel && axiosCanceler.removePending(config);
        config.loading && tryHideFullScreenLoading();
        // 全局错误信息拦截（防止下载文件的时候返回数据流，没有 code 直接报错）
        if (data.code && data.code !== ResultEnum.SUCCESS) {
          ElMessage.error(data.msg);
          return Promise.reject(data);
        }
        if (response?.data?.error !== 0) {
          // 根据服务器响应的错误信息，做不同的提示
          const errorMsg = errorHandle(response);
          checkMsg(errorMsg);
          return Promise.reject(data);
        }
        // 成功请求（在页面上除非特殊情况，否则不用处理失败逻辑）
        return data;
      },
      async (error: AxiosError) => {
        const { response, config }: { response?: AxiosResponse; config?: CustomAxiosRequestConfig } = error;
        const userStore = useUserStore();
        config?.loading && tryHideFullScreenLoading();
        // 登陆失效
        if (response && response.status == 401) {
          axiosCanceler.removeAllPending();
          userStore.setToken("");
          router.replace(LOGIN_URL);
          ElMessage.warning("登录失效！请您重新登录");
          return Promise.reject(error);
        }
        // 请求取消时，或重启管理器后查询管理器进程状态时，不提示报错
        // 根据服务器响应的错误信息，做不同的提示
        if (response && error.message !== "canceled" && config?.url !== "/manager/status") {
          const errorMsg = errorHandle(response);
          checkMsg(errorMsg);
        }
        // 请求超时 && 网络错误单独判断，没有 response
        if (error.message.indexOf("timeout") !== -1) ElMessage.error("请求超时！请您稍后重试");
        if (error.message.indexOf("Network Error") !== -1) ElMessage.error("网络错误！请您稍后重试");
        // 服务器结果都没有返回(可能服务器错误可能客户端断网)，断网处理:可以跳转到断网页面
        if (!window.navigator.onLine) router.replace("/500");
        return Promise.reject(error);
      }
    );
  }

  /**
   * @description 常用请求方法封装
   */
  get<T>(url: string, params?: object, _object = {}): Promise<ResultData<T>> {
    return this.service.get(url, { params, ..._object });
  }
  post<T>(url: string, params?: object | string, _object = {}): Promise<ResultData<T>> {
    return this.service.post(url, params, _object);
  }
  put<T>(url: string, params?: object, _object = {}): Promise<ResultData<T>> {
    return this.service.put(url, params, _object);
  }
  delete<T>(url: string, params?: any, _object = {}): Promise<ResultData<T>> {
    return this.service.delete(url, { params, ..._object });
  }
  download(url: string, params?: object, _object = {}): Promise<BlobPart> {
    return this.service.post(url, params, { ..._object, responseType: "blob" });
  }
}

export default new RequestHttp(config);
