// 登录模块
export namespace WzLogin {
  export interface ReqLoginForm {
    username: string;
    password: string;
    params?: Record<string, boolean>;
  }
  export interface ResLogin {
    token: string;
  }
  export interface ParamsUpdateUserLock {
    webloguser: string; // 用户名
    Bjtimestamp: number; // 尝试时间
    attempttimes: number; // 尝试次数
  }
  export interface ParamsSaveLoginLog {
    login_user: string; // 用户名
    Bjtimestamp: string; // 登录时间
    result: string; // 登录结果：success | failed
  }
}
