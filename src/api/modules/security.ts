import http from "@/api";
import { ResList } from "@/api/interface/assets";
/**
 * @name 安全策略
 */
// 查询服务对象列表
export const getServiceList = (params: Record<string, any> = {}) => {
  return http.get<ResList>(`/service_obj?pretty=true`, params);
};

//删除服务对象
export const removeService = (params: Record<string, string>) => {
  return http.delete(`/service_obj?pretty=true`, params);
};

// 新增服务对象
export const addService = (params: Record<string, string>) => {
  return http.post(
    `/service_obj?pretty=true`,
    {},
    {
      params
    }
  );
};

// 修改服务对象
export const editService = (params: Record<string, string>) => {
  return http.put(
    `/service_obj?pretty=true`,
    {},
    {
      params
    }
  );
};

// 查询地址对象列表
export const getAddressList = (params: Record<string, any> = {}) => {
  return http.get<ResList>(`/address_obj?pretty=true`, params);
};

//删除地址对象
export const removeAddress = (params: Record<string, string>) => {
  return http.delete(`/address_obj?pretty=true`, params);
};

// 新增地址对象
export const addAddress = (params: Record<string, string>) => {
  return http.post(
    `/address_obj?pretty=true`,
    {},
    {
      params
    }
  );
};

// 修改地址对象
export const editAddress = (params: Record<string, string>) => {
  return http.put(
    `/address_obj?pretty=true`,
    {},
    {
      params
    }
  );
};
