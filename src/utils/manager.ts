import { getDaemons, restartCluster, restartManager } from "@/api/modules/manager";
import { useUserStore } from "@/stores/modules/user";
import { ElLoading, ElMessage } from "element-plus";

/**
 * @description 管理器控制相关
 * */
export const restartClusterOrManager = async () => {
  const loadingInstance = ElLoading.service({ fullscreen: true });
  try {
    const isCluster = useUserStore().isCluster;
    isCluster ? await restartCluster() : await restartManager();
    await delay(5000);
    await makeStatusPing(isCluster);
    loadingInstance.close();
    ElMessage({
      message: "管理器重启完成",
      type: "success"
    });
  } catch (error) {
    loadingInstance.close();
    ElMessage({
      message: "管理器重启缓慢，重启中服务不可用，请耐心等待稍后尝试",
      type: "warning"
    });
    return Promise.reject(error);
  }
};

export const delay = (timeMs: number) => new Promise(resolve => setTimeout(resolve, timeMs));

const makeStatusPing = async (isCluster: boolean, tries = 30) => {
  try {
    let isValid: boolean | undefined = false;
    while (tries--) {
      await delay(2000);
      try {
        isValid = await checkDaemons(isCluster);
        if (isValid) {
          break;
        }
      } catch (error) {
        console.error(error);
      }
    }
    if (!isValid) {
      throw new Error("未恢复");
    }
    return Promise.resolve("系统已准备");
  } catch (error) {
    return Promise.reject("应用程序无法恢复。");
  }
};

const checkDaemons = async (isCluster: boolean) => {
  try {
    const res: any = await getDaemons();
    let daemons = (((res || {}).data || {}).affected_items || [])[0] || {};
    const wazuhdbExists = typeof daemons["wazuh-db"] !== "undefined";

    const execd = daemons["ossec-execd"] === "running";
    const modulesd = daemons["wazuh-modulesd"] === "running";
    const wazuhdb = wazuhdbExists ? daemons["wazuh-db"] === "running" : true;

    let clusterd = true;
    if (isCluster) {
      clusterd = daemons["wazuh-clusterd"] === "running";
    }

    const isValid = execd && modulesd && wazuhdb && (isCluster ? clusterd : true);
    if (isValid) {
      return isValid;
    } else {
      console.warn("Wazuh还没有准备好");
    }
  } catch (error) {
    return Promise.reject(error);
  }
};
