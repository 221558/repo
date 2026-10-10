import { formatDate } from "@/utils";
import {
  getTagList,
  toSaveTag,
  toSavePolicyStatus,
  toSaveOutbound,
  toStartAgent,
  toStopAgent,
  toRestartAgent,
  editGroup,
  deleteGroup,
  groupAddAgent,
  toRemoveAgent,
  deleteAgent
} from "@/api/modules/assets";
import { editLabel, removeLabel } from "@/api/modules/assetManagement";
import { getServiceList, getAddressList } from "@/api/modules/security";
import { editPolicy, delPolicy, changePolicyState, addRule, editRule, delRule } from "@/api/modules/policyManage";
import { step4AddRule } from "@/api/modules/policyGenerator";
import { editAlarmManage } from "@/api/modules/alarmCenter";
import { addTrafficMatch } from "@/api/modules/topology";

// 系统内超级管理员
export const adminOptions: Record<string, string>[] = [{ value: "master", label: "master" }];

// 日志中心
// 操作日志-操作对象
export const logObjectOptions: Record<string, any>[] = [
  { label: "代理", value: "agent" },
  { label: "工作负载", value: "agent_info" },
  { label: "工作组", value: "group" },
  { label: "标签", value: "tag" },
  { label: "策略", value: "policy" },
  { label: "规则", value: "rule" },
  { label: "告警规则", value: "alert_policy" },
  { label: "告警", value: "alert" },
  { label: "秘钥", value: "key" },
  { label: "用户", value: "user" }
];

// 操作日志-操作对象-动作映射
export const logObjectMap: Record<string, any> = {
  agent: [
    { label: "安装", value: "install" },
    { label: "启动", value: "start" },
    { label: "重启", value: "restart" },
    { label: "停止", value: "stop" },
    { label: "删除", value: "delete" }
  ],
  agent_info: [
    { label: "组件标签设置", value: "agent_tag" },
    { label: "策略状态设置", value: "agent_policy" },
    { label: "出站管理设置", value: "agent_out_block" }
  ],
  group: [
    { label: "新建", value: "add" },
    { label: "更新", value: "update" },
    { label: "删除", value: "delete" },
    { label: "组内负载管理", value: "group_agent" }
  ],
  tag: [
    { label: "新建", value: "add" },
    { label: "更新", value: "update" },
    { label: "删除", value: "delete" }
  ],
  policy: [
    { label: "新建", value: "add" },
    { label: "更新", value: "update" },
    { label: "策略发送", value: "send" },
    { label: "删除", value: "delete" }
  ],
  rule: [
    { label: "新建", value: "add" },
    { label: "更新", value: "update" },
    { label: "删除", value: "delete" }
  ],
  alert_policy: [
    { label: "新建", value: "add" },
    { label: "更新", value: "update" },
    { label: "删除", value: "delete" }
  ],
  alert: [
    { label: "处理", value: "treat" },
    { label: "删除", value: "delete" }
  ],
  key: [{ label: "导入", value: "import" }],
  user: [
    { label: "新建", value: "add" },
    { label: "更新", value: "update" }
  ]
};

// 操作日志-动作-操作对象映射
export const logActionMap: Record<string, any> = {
  add: [
    { label: "工作组", value: "group" },
    { label: "标签", value: "tag" },
    { label: "策略", value: "policy" },
    { label: "规则", value: "rule" },
    { label: "告警规则", value: "alert_policy" },
    { label: "用户", value: "user" }
  ],
  delete: [
    { label: "代理", value: "agent" },
    { label: "工作组", value: "group" },
    { label: "标签", value: "tag" },
    { label: "策略", value: "policy" },
    { label: "规则", value: "rule" },
    { label: "告警规则", value: "alert_policy" },
    { label: "告警", value: "alert" }
  ],
  update: [
    { label: "工作组", value: "group" },
    { label: "标签", value: "tag" },
    { label: "策略", value: "policy" },
    { label: "规则", value: "rule" },
    { label: "告警规则", value: "alert_policy" },
    { label: "用户", value: "user" }
  ],
  install: [{ label: "代理", value: "agent" }],
  start: [{ label: "代理", value: "agent" }],
  restart: [{ label: "代理", value: "agent" }],
  stop: [{ label: "代理", value: "agent" }],
  agent_tag: [{ label: "工作负载", value: "agent_info" }],
  agent_policy: [{ label: "工作负载", value: "agent_info" }],
  agent_out_block: [{ label: "工作负载", value: "agent_info" }],
  group_agent: [{ label: "工作组", value: "group" }],
  send: [{ label: "策略", value: "policy" }],
  import: [{ label: "秘钥", value: "key" }],
  treat: [{ label: "告警", value: "alert" }]
};

// 操作日志-动作
export const logActionOptions: Record<string, any>[] = [
  { label: "新建", value: "add" },
  { label: "删除", value: "delete" },
  { label: "更新", value: "update" },
  { label: "安装", value: "install" },
  { label: "启动", value: "start" },
  { label: "重启", value: "restart" },
  { label: "停止", value: "stop" },
  { label: "组件标签设置", value: "agent_tag" },
  { label: "策略状态设置", value: "agent_policy" },
  { label: "出站管理设置", value: "agent_out_block" },
  { label: "组内负载管理", value: "group_agent" },
  { label: "策略发送", value: "send" },
  { label: "导入", value: "import" },
  { label: "处理", value: "treat" }
];

// 系统日志-系统事件
export const logEventOptions: Record<string, any>[] = [
  { label: "重复IP注册失败", value: "auth_dupip" },
  { label: "超过授权数量", value: "auth_lack" },
  { label: "超过授权时间", value: "auth_expried" },
  { label: "注册成功", value: "auth_success" },
  { label: "负载信息更新", value: "agent_update" },
  { label: "上线", value: "agent_active" },
  { label: "离线", value: "agent_disconnect" },
  { label: "IP变化", value: "ip_change" },
  { label: "标签变化", value: "tag_change" },
  { label: "负载分组变化", value: "group_assign_change" },
  { label: "服务端策略下发完成", value: "send" },
  { label: "负载策略执行成功", value: "receive_success" },
  { label: "负载策略执行失败", value: "receive_fail" },
  { label: "主板启动", value: "master" },
  { label: "备板启动", value: "backup" }
];

// 系统日志-系统模块
export const logModuleOptions: Record<string, any>[] = [
  { label: "工作负载日志", value: "agent" },
  { label: "策略自适应日志", value: "auto" },
  { label: "策略下发日志", value: "manual" },
  { label: "主备倒换日志", value: "swap" }
];

// 操作日志-内容映射
export function operInfoTransform(infoArr: string[]) {
  const res = infoArr.map((item: string) => {
    const keyOptions: Record<string, string> = {
      agent_id: "代理ID",
      ip: "代理IP",
      agent_name: "主机名",
      tag_name: "标签",
      group_name: "工作组",
      policy_status: "策略状态",
      out_block: "出站管理开关",
      state: "状态",
      loc: "位置",
      org: "组织",
      business: "业务",
      description: "描述",
      tag_type: "标签类型",
      policy_name: "策略名",
      service_name: "服务名",
      protocol: "协议",
      port: "端口",
      alert_policy_type: "规则类型",
      alert_policy_name: "规则名称",
      alert_id: "告警id",
      alert_name: "告警名称",
      alert_level: "告警级别",
      treat: "告警状态",
      auth_num: "授权数量",
      auth_time: "授权时间",
      user_name: "用户名",
      user_role: "用户角色",
      password: "否更改密码"
    };
    const index = item.indexOf(":");
    const key = item.slice(0, index);
    let value = item.slice(index + 1);
    if (key === "policy_status") {
      const valueOptions: Record<string, string> = {
        build: "建设中",
        test: "测试中",
        protect: "防护中"
      };
      value = valueOptions[value ?? "-"];
    } else if (key === "out_block") {
      const valueOptions: Record<string, string> = {
        True: "开启",
        False: "关闭"
      };
      value = valueOptions[value ?? "-"];
    } else if (key === "state") {
      const valueOptions: Record<string, string> = {
        enable: "下发",
        disable: "取消下发"
      };
      value = valueOptions[value ?? "-"];
    } else if (key === "tag_type") {
      const valueOptions: Record<string, string> = {
        loc: "位置",
        org: "组织",
        business: "业务",
        component: "组件"
      };
      value = valueOptions[value ?? "-"];
    } else if (key === "alert_policy_type") {
      const valueOptions: Record<string, string> = {
        drop_packets: "异常访问",
        system: "系统日志",
        operation: "操作日志"
      };
      value = valueOptions[value ?? "-"];
    } else if (key === "alert_level") {
      const valueOptions: Record<string, string> = {
        high: "高",
        normal: "中",
        low: "低"
      };
      value = valueOptions[value ?? "-"];
    } else if (key === "treat") {
      const valueOptions: Record<string, string> = {
        treated: "处理",
        ignored: "忽略",
        untreated: "未处理"
      };
      value = valueOptions[value ?? "-"];
    } else if (key === "auth_time") {
      value = formatDate(new Date(value));
    } else if (key === "user_role") {
      const valueOptions: Record<string, string> = {
        adminuser: "用户管理员",
        audit: "审计管理员",
        system: "系统管理员"
      };
      value = valueOptions[value ?? "-"];
    } else if (key === "password") {
      const valueOptions: Record<string, string> = {
        change: "更改",
        nochange: "未更改"
      };
      value = valueOptions[value ?? "-"];
    } else if (key === "tag_name") {
      value = value === "empty" ? "-" : value;
    } else if (key === "loc") {
      value = value === "empty" ? "-" : value;
    } else if (key === "org") {
      value = value === "empty" ? "-" : value;
    } else if (key === "business") {
      value = value === "empty" ? "-" : value;
    } else if (key === "description") {
      value = value === "None" || value === "empty" ? "-" : value;
    }
    return {
      label: keyOptions[key ?? "-"] ?? "-",
      value
    };
  });
  return res;
}

// 任务中心
// 任务类型
export const taskTypeOptions: Record<string, string>[] = [
  { value: "alert", label: "告警处置" },
  { value: "operate", label: "操作审批" }
];

// 任务优先级
export const taskLevelOptions: Record<string, string>[] = [
  { value: "low", label: "低" },
  { value: "normal", label: "中" },
  { value: "high", label: "高" }
];

// 任务状态
export const taskStatusOptions: Record<string, string>[] = [
  { value: "unreceived", label: "未接收" },
  { value: "treating", label: "处理中" },
  { value: "treated", label: "已处理" },
  { value: "close", label: "已关闭" }
];

// 任务动作
export const taskActionOptions: Record<string, string>[] = [
  { value: "create", label: "创建" },
  { value: "accept", label: "接收" },
  { value: "transmit", label: "流转" },
  { value: "close", label: "关闭" },
  { value: "pass", label: "确认" },
  { value: "fail", label: "驳回" }
];

// 任务详情-参数映射
export async function taskParamsTransform(params: Record<string, string>) {
  let res: Record<string, string>[] = [];
  let loc_tag: Record<string, any>[] | undefined,
    org_tag: Record<string, any>[] | undefined,
    business_tag: Record<string, any>[] | undefined,
    component_tag: Record<string, any>[] | undefined,
    address_options: Record<string, any>[] | undefined,
    service_options: Record<string, any>[] | undefined;

  for (let key in params) {
    let value = params[key];

    const keyOptions: Record<string, string> = {
      agents_list: "主机ID",
      agent_tag: "组件标签",
      policy_status: "策略状态", // 工作组、工作负载策略状态
      out_block: "出站管理",
      group_id: "工作组名称",
      showname: "显示名称", // 工作组、标签显示名称
      labels_list: "标签",
      description: "描述",
      groups_list: "工作组名称",
      label_id: "标签ID",
      label_type: "标签类型",
      label_name: "标签名称",
      pktpolicy_name: "策略名称",
      pktpolicy_type: "策略类型",
      pktpolicy_info: "描述",
      pktpolicy_loc: "位置",
      pktpolicy_org: "组织",
      pktpolicy_bus: "业务",
      pktpolicy_state: "状态",
      pktrule_area: "范围",
      pktrule_scope: "组外范围",
      pktrule_direction: "流量方向",
      loc_id: `${params.pktrule_direction === "out" ? "服务者" : params.pktrule_direction === "in" ? "访问者" : ""}位置范围`,
      org_id: `${params.pktrule_direction === "out" ? "服务者" : params.pktrule_direction === "in" ? "访问者" : ""}组织范围`,
      business_id: `${params.pktrule_direction === "out" ? "服务者" : params.pktrule_direction === "in" ? "访问者" : ""}业务范围`,
      serto_type: "服务者类型",
      pktrule_serto: "服务者",
      pktrule_service: "服务",
      serfrom_type: "访问者类型",
      pktrule_serfrom: "访问者",
      pktrule_num: "规则ID",
      task_id: "任务ID",
      alert_list: "告警ID",
      treat_type: "处置类型",
      treat_info: "说明"
    };

    if (key === "agent_tag") {
      if (!component_tag) {
        try {
          const tagItems = await getTagList({ label_type: "component" });
          component_tag = ((tagItems || {}).data || {}).affected_items.map(k => ({
            value: String(k.id),
            text: k.show_name
          }));
        } catch (error) {
          console.log(`组件标签列表错误: ${error}`);
        }
      }
      const valueOptions: Record<string, string>[] = JSON.parse(JSON.stringify(component_tag ?? []));

      value = valueOptions.find(v => v.value == value)?.text ?? "-";
    } else if (key === "policy_status") {
      const valueOptions: Record<string, string>[] = [
        { value: "build", text: "建设中" },
        { value: "test", text: "测试中" },
        { value: "protect", text: "防护中" }
      ];
      value = valueOptions.find(v => v.value == value)?.text ?? "-";
    } else if (key === "out_block") {
      const valueOptions: Record<string, any>[] = [
        { value: "True", text: "开启" },
        { value: "False", text: "关闭" }
      ];
      value = valueOptions.find(v => v.value == value)?.text ?? "-";
    } else if (key === "labels_list") {
      if (!loc_tag) {
        try {
          const tagItems = await getTagList({ label_type: "loc" });
          loc_tag = ((tagItems || {}).data || {}).affected_items.map(k => ({
            value: String(k.id),
            text: k.show_name
          }));
        } catch (error) {
          console.log(`位置标签列表错误: ${error}`);
        }
      }
      if (!org_tag) {
        try {
          const tagItems = await getTagList({ label_type: "org" });
          org_tag = ((tagItems || {}).data || {}).affected_items.map(k => ({
            value: String(k.id),
            text: k.show_name
          }));
        } catch (error) {
          console.log(`组织标签列表错误: ${error}`);
        }
      }
      if (!business_tag) {
        try {
          const tagItems = await getTagList({ label_type: "business" });
          business_tag = ((tagItems || {}).data || {}).affected_items.map(k => ({
            value: String(k.id),
            text: k.show_name
          }));
        } catch (error) {
          console.log(`业务标签列表错误: ${error}`);
        }
      }
      const locOptions: Record<string, string>[] = JSON.parse(JSON.stringify(loc_tag ?? []));
      const orgOptions: Record<string, string>[] = JSON.parse(JSON.stringify(org_tag ?? []));
      const businessOptions: Record<string, string>[] = JSON.parse(JSON.stringify(business_tag ?? []));
      const valueArr = value.split(",");
      valueArr[0] = locOptions.find(v => v.value == valueArr[0])?.text ?? "-";
      valueArr[1] = orgOptions.find(v => v.value == valueArr[1])?.text ?? "-";
      valueArr[2] = businessOptions.find(v => v.value == valueArr[2])?.text ?? "-";
      value = valueArr.join(",");
    } else if (key === "label_type") {
      const valueOptions: Record<string, string>[] = [
        { value: "loc", text: "位置标签" },
        { value: "org", text: "组织标签" },
        { value: "business", text: "业务标签" },
        { value: "component", text: "组件标签" }
      ];
      value = valueOptions.find(v => v.value == value)?.text ?? "-";
    } else if (key === "pktpolicy_type") {
      const valueOptions: Record<string, string>[] = [
        { value: "white", text: "白名单" },
        { value: "black", text: "黑名单" }
      ];
      value = valueOptions.find(v => v.value == value)?.text ?? "-";
    } else if (key === "pktpolicy_loc") {
      if (!loc_tag) {
        try {
          const tagItems = await getTagList({ label_type: "loc" });
          loc_tag = ((tagItems || {}).data || {}).affected_items.map(k => ({
            value: String(k.id),
            text: k.show_name
          }));
        } catch (error) {
          console.log(`位置标签列表错误: ${error}`);
        }
      }
      let valueOptions: Record<string, string>[] = JSON.parse(JSON.stringify(loc_tag ?? []));
      valueOptions.unshift({ value: "0", text: "不限" });
      value = valueOptions.find(v => v.value == value)?.text ?? "-";
    } else if (key === "pktpolicy_org") {
      if (!org_tag) {
        try {
          const tagItems = await getTagList({ label_type: "org" });
          org_tag = ((tagItems || {}).data || {}).affected_items.map(k => ({
            value: String(k.id),
            text: k.show_name
          }));
        } catch (error) {
          console.log(`组织标签列表错误: ${error}`);
        }
      }
      let valueOptions: Record<string, string>[] = JSON.parse(JSON.stringify(org_tag ?? []));
      valueOptions.unshift({ value: "0", text: "不限" });
      value = valueOptions.find(v => v.value == value)?.text ?? "-";
    } else if (key === "pktpolicy_bus") {
      if (!business_tag) {
        try {
          const tagItems = await getTagList({ label_type: "business" });
          business_tag = ((tagItems || {}).data || {}).affected_items.map(k => ({
            value: String(k.id),
            text: k.show_name
          }));
        } catch (error) {
          console.log(`业务标签列表错误: ${error}`);
        }
      }
      let valueOptions: Record<string, string>[] = JSON.parse(JSON.stringify(business_tag ?? []));
      valueOptions.unshift({ value: "0", text: "不限" });
      value = valueOptions.find(v => v.value == value)?.text ?? "-";
    } else if (key === "pktpolicy_state") {
      const valueOptions: Record<string, string>[] = [
        { value: "enable", text: "下发" },
        { value: "disable", text: "取消下发" }
      ];
      value = valueOptions.find(v => v.value == value)?.text ?? "-";
    } else if (key === "pktrule_area") {
      const valueOptions: Record<string, string>[] = [
        { value: "in", text: "范围内" },
        { value: "out", text: "范围外" }
      ];
      value = valueOptions.find(v => v.value == value)?.text ?? "-";
    } else if (key === "pktrule_direction") {
      const valueOptions: Record<string, string>[] = [
        { value: "in", text: "入方向流量" },
        { value: "out", text: "出方向流量" }
      ];
      value = valueOptions.find(v => v.value == value)?.text ?? "-";
    } else if (key === "loc_id") {
      if (!loc_tag) {
        try {
          const tagItems = await getTagList({ label_type: "loc" });
          loc_tag = ((tagItems || {}).data || {}).affected_items.map(k => ({
            value: String(k.id),
            text: k.show_name
          }));
        } catch (error) {
          console.log(`位置标签列表错误: ${error}`);
        }
      }
      let valueOptions: Record<string, string>[] = JSON.parse(JSON.stringify(loc_tag ?? []));
      valueOptions.unshift({ value: "0", text: "不限" });
      value = valueOptions.find(v => v.value == value)?.text ?? "-";
    } else if (key === "org_id") {
      if (!org_tag) {
        try {
          const tagItems = await getTagList({ label_type: "org" });
          org_tag = ((tagItems || {}).data || {}).affected_items.map(k => ({
            value: String(k.id),
            text: k.show_name
          }));
        } catch (error) {
          console.log(`组织标签列表错误: ${error}`);
        }
      }
      let valueOptions: Record<string, string>[] = JSON.parse(JSON.stringify(org_tag ?? []));
      valueOptions.unshift({ value: "0", text: "不限" });
      value = valueOptions.find(v => v.value == value)?.text ?? "-";
    } else if (key === "business_id") {
      if (!business_tag) {
        try {
          const tagItems = await getTagList({ label_type: "business" });
          business_tag = ((tagItems || {}).data || {}).affected_items.map(k => ({
            value: String(k.id),
            text: k.show_name
          }));
        } catch (error) {
          console.log(`业务标签列表错误: ${error}`);
        }
      }
      let valueOptions: Record<string, string>[] = JSON.parse(JSON.stringify(business_tag ?? []));
      valueOptions.unshift({ value: "0", text: "不限" });
      value = valueOptions.find(v => v.value == value)?.text ?? "-";
    } else if (key === "serto_type" || key === "serfrom_type") {
      const valueOptions: Record<string, string>[] = [
        { value: "tag", text: "组件" },
        { value: "address", text: "地址对象" },
        { value: "internal", text: "外网地址" }
      ];
      value = valueOptions.find(v => v.value == value)?.text ?? "-";
    } else if (key === "pktrule_serto") {
      let valueOptions: Record<string, string>[] = [];
      if (params["serto_type"] === "tag") {
        if (!component_tag) {
          try {
            const tagItems = await getTagList({ label_type: "component" });
            component_tag = ((tagItems || {}).data || {}).affected_items.map(k => ({
              value: String(k.id),
              text: k.show_name
            }));
          } catch (error) {
            console.log(`组件标签列表错误: ${error}`);
          }
        }
        valueOptions = JSON.parse(JSON.stringify(component_tag ?? []));
        value = valueOptions.find(v => v.value == value)?.text ?? "-";
      } else if (params["serto_type"] === "address") {
        if (!address_options) {
          try {
            const data: any = await getAddressList();
            address_options = ((data || {}).data || {}).affected_items.map((k: Record<string, any>) => ({
              value: String(k.id),
              text: k.show_name
            }));
          } catch (error) {
            console.log(`地址对象列表错误: ${error}`);
          }
        }
        valueOptions = JSON.parse(JSON.stringify(address_options ?? []));
        value = valueOptions.find(v => v.value == value)?.text ?? "-";
      }
    } else if (key === "pktrule_service") {
      if (!service_options) {
        try {
          const data: any = await getServiceList();
          service_options = ((data || {}).data || {}).affected_items.map((k: Record<string, any>) => ({
            value: String(k.id),
            text: k.show_name
          }));
        } catch (error) {
          console.log(`服务对象列表错误: ${error}`);
        }
      }
      let valueOptions: Record<string, string>[] = JSON.parse(JSON.stringify(service_options ?? []));
      value = valueOptions.find(v => v.value == value)?.text ?? value ?? "-";
    } else if (key === "pktrule_serfrom") {
      let valueOptions: Record<string, string>[] = [];
      if (params["serfrom_type"] === "tag") {
        if (!component_tag) {
          try {
            const tagItems = await getTagList({ label_type: "component" });
            component_tag = ((tagItems || {}).data || {}).affected_items.map(k => ({
              value: String(k.id),
              text: k.show_name
            }));
          } catch (error) {
            console.log(`组件标签列表错误: ${error}`);
          }
        }
        valueOptions = JSON.parse(JSON.stringify(component_tag ?? []));
        value = valueOptions.find(v => v.value == value)?.text ?? "-";
      } else if (params["serfrom_type"] === "address") {
        if (!address_options) {
          try {
            const data: any = await getAddressList();
            address_options = ((data || {}).data || {}).affected_items.map((k: Record<string, any>) => ({
              value: String(k.id),
              text: k.show_name
            }));
          } catch (error) {
            console.log(`地址对象列表错误: ${error}`);
          }
        }
        valueOptions = JSON.parse(JSON.stringify(address_options ?? []));
        value = valueOptions.find(v => v.value == value)?.text ?? "-";
      }
    } else if (key === "treat_type") {
      const valueOptions: Record<string, string>[] = [
        { value: "treated", text: "处理" },
        { value: "ignored", text: "忽略" }
      ];
      value = valueOptions.find(v => v.value == value)?.text ?? "-";
    }

    res.push({
      key,
      label: keyOptions[key ?? "-"] ?? "-",
      value
    });
  }
  res = res.filter(
    (item: Record<string, any>) => ["pretty", "wait_for_complete", "op_user", "paramsArr"].indexOf(item.key) === -1
  );
  return res;
}

// 任务详情-函数映射
export function taskApiTransform(taskType: string, logObject: string, logAction: string, params: Record<string, any> = {}) {
  let api,
    successMsg = "",
    failedMsg = "",
    apis = [];
  if (taskType === "alert") {
    api = editAlarmManage;
  } else if (logObject === "agent_info" && logAction === "agent_tag") {
    api = toSaveTag;
  } else if (logObject === "agent_info" && logAction === "agent_policy") {
    api = toSavePolicyStatus;
  } else if (logObject === "agent_info" && logAction === "agent_out_block") {
    api = toSaveOutbound;
  } else if (logObject === "agent" && logAction === "start") {
    api = toStartAgent;
    successMsg = "启动该工作负载成功，执行需要一定时间，工作负载状态延迟后更新";
  } else if (logObject === "agent" && logAction === "stop") {
    api = toStopAgent;
    successMsg = "关闭该工作负载成功，执行需要一定时间，工作负载状态延迟后更新";
  } else if (logObject === "agent" && logAction === "restart") {
    api = toRestartAgent;
    successMsg = "重启该工作负载成功，执行需要一定时间，工作负载状态延迟后更新";
  } else if (logObject === "agent" && logAction === "delete") {
    apis = [
      {
        api: toRemoveAgent,
        desc: "卸载代理"
      },
      {
        api: deleteAgent,
        desc: "删除代理"
      }
    ];
  } else if (logObject === "group" && logAction === "update") {
    api = editGroup;
  } else if (logObject === "group" && logAction === "delete") {
    api = deleteGroup;
    failedMsg = "工作组删除失败: 该工作组已被策略规则使用，不可删除";
  } else if (logObject === "group" && logAction === "group_agent") {
    apis = params.paramsArr.map(() => ({
      api: groupAddAgent,
      desc: "移动负载"
    }));
  } else if (logObject === "tag" && logAction === "update") {
    api = editLabel;
    failedMsg = "标签保存失败: 名称不可重复";
  } else if (logObject === "tag" && logAction === "delete") {
    api = removeLabel;
    failedMsg = "标签删除失败: 该标签已被使用，不可删除";
  } else if (logObject === "policy" && logAction === "update") {
    api = editPolicy;
    failedMsg = "策略保存失败: 该策略名称已存在";
  } else if (logObject === "policy" && logAction === "delete") {
    api = delPolicy;
    failedMsg = "策略删除失败: 该策略正在被使用，不可删除";
  } else if (logObject === "policy" && logAction === "send") {
    api = changePolicyState;
  } else if (logObject === "rule" && logAction === "add") {
    api = addRule;
    failedMsg = "规则保存失败: 该策略规则已存在";
  } else if (logObject === "rule" && logAction === "update") {
    api = editRule;
    failedMsg = "规则保存失败: 该策略规则已存在";
  } else if (logObject === "rule" && logAction === "delete") {
    api = delRule;
  } else if (logObject === "auto_policy" && logAction === "add") {
    api = step4AddRule;
  } else if (logObject === "auto_rule" && logAction === "add") {
    apis = params.paramsArr.map(() => ({
      api: addTrafficMatch,
      desc: "保存匹配策略"
    }));
  } else if (logObject === "agent_info" && logAction === "group_agent") {
    apis = params.paramsArr.map(() => ({
      api: groupAddAgent,
      desc: "移动负载"
    }));
  }
  return {
    apis,
    api,
    successMsg,
    failedMsg
  };
}
