import { ElMessage } from "element-plus";

/**
 * @description: 网络请求错误提示
 * @param {String} detail
 * @return void
 */
export const checkMsg = (detail: string) => {
  const ids = detail.split("ids: ").length > 1 ? detail.split("ids: ")[1] : "";
  if (detail.includes("1731")) {
    ElMessage.error(`以下工作负载删除失败: ${ids}`);
  } else if (detail.includes("1657")) {
    ElMessage.error(`以下工作负载操作失败: ${ids}`);
  } else if (detail.includes("1651") || detail.includes("1652") || detail.includes("1117")) {
    // /active-response接口路径，负载离线操作失败，当前系统只有卸载代理时调用
    ElMessage.error(`以下工作负载状态离线，本次操作无法卸载代理，只删除工作负载数据: ${ids}`);
  } else if (detail.includes("passwd error")) {
    ElMessage.error("密码校验错误！请重新输入");
  } else if (detail.includes("group already exists")) {
    ElMessage.error("工作组保存失败: 名称不可重复");
  } else if (detail.includes("group.show_name")) {
    ElMessage.error("工作组保存失败: 显示名称不可重复");
  } else if (detail) {
    ElMessage.error(detail);
  } else {
    ElMessage.error("请求失败！请您稍后重试");
  }
};
