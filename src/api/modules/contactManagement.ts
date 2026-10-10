import { ResList } from "@/api/interface/assets";
import http from "@/api";
/**
 * @name 联系人管理
 */

// 查询联系人列表
export const getContact = (params: Record<string, any>) => {
  return http.get<ResList>(`/liaison_obj?pretty=true&wait_for_complete=true`, params);
};

// 新增联系人
export const addContact = (params: Record<string, string>) => {
  return http.post(
    `/liaison_obj?pretty=true&wait_for_complete=true`,
    {},
    {
      params
    }
  );
};

// 修改联系人
export const editContact = (params: Record<string, string>) => {
  return http.put(
    `/liaison_obj?pretty=true&wait_for_complete=true`,
    {},
    {
      params
    }
  );
};

// 删除联系人
export const deleteContact = (params: Record<string, string>) => {
  return http.delete<ResList>(`/liaison_obj?pretty=true&wait_for_complete=true`, params);
};
