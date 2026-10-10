import { defineStore } from "pinia";
import { UserState } from "@/stores/interface";
import piniaPersistConfig from "@/stores/helper/persist";

export const useUserStore = defineStore({
  id: "geeker-user",
  state: (): UserState => ({
    token: "",
    userInfo: {},
    isCluster: false
  }),
  getters: {},
  actions: {
    // Set token
    setToken(token: string) {
      this.token = token;
    },
    // Set userInfo
    setUserInfo(userInfo: UserState["userInfo"]) {
      this.userInfo = userInfo;
    },
    // Set isCluster
    setIsCluster(isCluster: boolean) {
      this.isCluster = isCluster;
    }
  },
  persist: piniaPersistConfig("geeker-user")
});
