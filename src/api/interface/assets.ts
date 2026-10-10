// 查询主机列表参数
export interface ParamsGetAgentList {
  limit?: number;
  offset?: number;
  q?: string;
  sort?: string;
  select?: string;
}
// 列表返回
export interface ResList {
  affected_items: any[];
  failed_items: any[];
  total_affected_items: number;
  total_failed_items: number;
}
// 负载详情-查询负载CPU内存硬盘网络
export interface ParamsGetUsage {
  node_name?: string;
  id: string;
}
