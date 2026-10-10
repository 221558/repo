import { ResList } from "@/api/interface/assets";
import http from "@/api";
/**
 * @name 策略生成器模块
 */

// 步骤1-查询覆盖率
export const step1GetCoverage = (id: String) => {
  return http.get<ResList>(`/manager/${id}/pktcoverage?pretty=true&wait_for_complete=true`);
};

// 步骤2-策略预配置
export const step2ToPrepolicy = (params: Record<string, any>) => {
  return http.post(
    `/manager/${params.id}/prepolicy?pretty=true&wait_for_complete=true`,
    {},
    {
      params: params.params
    }
  );
};

// 步骤2-查询覆盖率
export const step2GetCoverage = (params: Record<string, string>) => {
  return http.get<ResList>(`/manager/${params.id}/prepolicy?pretty=true&wait_for_complete=true&task_id=${params.task_id}`);
};

// 步骤3-查询规则列表
export const step3GetPktrule = (params: Record<string, any>) => {
  return http.get<ResList>(`/manager/interim_pktrule?pretty=true&wait_for_complete=true`, {}, { params });
};

// 步骤3-新增规则
export const step3AddRule = (params: Record<string, any>) => {
  return http.post(
    `/manager/interim_pktrule?pretty=true&wait_for_complete=true`,
    {},
    {
      params
    }
  );
};

// 步骤3-编辑规则
export const step3EditRule = (params: Record<string, any>) => {
  return http.put(
    `/manager/interim_pktrule?pretty=true&wait_for_complete=true`,
    {},
    {
      params
    }
  );
};

// 步骤3-删除规则
export const step3DelRule = (params: Record<string, string>) => {
  return http.delete(`/manager/interim_pktrule?pktrule_num=${params.id}`);
};

// 步骤4-将规则存放策略
export const step4AddRule = (params: Record<string, any>) => {
  return http.post(`/manager/prepolicy/effect?pretty=true&wait_for_complete=true`, {}, { params });
};
