<template>
  <div class="card no-card traffic-monitoring-warp">
    <ProTable ref="proTable" :data="list" :columns="columns" @search="toSearch" @reset="toSearch" :tool-button="false">
      <!-- 操作 -->
      <template #operation="scope">
        <el-tooltip effect="dark" content="匹配规则" placement="top" v-if="scope.row.conntype === 'drop'">
          <el-button link type="primary" size="small" @click="toPolicy(scope.row)">
            <el-icon><Operation /></el-icon>
          </el-button>
        </el-tooltip>
      </template>
    </ProTable>
  </div>
</template>

<script setup lang="tsx" name="blcokLogPage">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import ProTable from "@/components/ProTable/index.vue";
import { ProTableInstance } from "@/components/ProTable/interface";
import { getTrafficLog, getTrafficMatch } from "@/api/modules/topology";
import { getTagList, getGroupList, getAgentList } from "@/api/modules/assets";
import { ColumnProps } from "@/components/ProTable/interface";
import { formatDate, localSet, isRoutePermission } from "@/utils";
import { useRouter } from "vue-router";
import { checkIp, checkPort } from "@/utils/eleValidate";

const router = useRouter();
const proTable = ref<ProTableInstance>();
const list = ref<Record<string, any>[]>([]);
const tagsGender = ref<Record<string, string>[]>([]);
const groupsGender = ref<Record<string, any>[]>([]);
const getInitList = async () => {
  try {
    const tagItems = await getTagList({ label_type: "component" });
    tagsGender.value = ((tagItems || {}).data || {}).affected_items.map(k => ({
      value: String(k.id),
      text: k.show_name
    }));
  } catch (error) {
    console.log(`组件标签列表错误: ${error}`);
  }

  try {
    const groups = await getGroupList({ limit: 0 });
    groupsGender.value = ((groups || {}).data || {}).affected_items;
  } catch (error) {
    console.log(`分组列表错误: ${error}`);
  }
};

onMounted(() => {
  getInitList();
  toSearch();
});

const toSearch = async () => {
  try {
    let newParams = JSON.parse(JSON.stringify(proTable.value?.searchParam || {}));
    newParams.time && (newParams.starttime = String(newParams.time[0]).slice(0, 10));
    newParams.time && (newParams.endtime = String(newParams.time[1]).slice(0, 10));
    delete newParams.time;
    const data: any = await getTrafficLog(newParams);
    list.value = ((data || {}).data || {}).affected_items.map((k: Record<string, any>) => {
      if (k.dest_group === "-/-") {
        k.dest_type = "internet";
      } else if (k.dest_group.split("/").length === 2) {
        k.dest_type = "address";
      } else {
        k.dest_type = "agent";
      }

      if (k.src_group === "-/-") {
        k.src_type = "internet";
      } else if (k.src_group.split("/").length === 2) {
        k.src_type = "address";
      } else {
        k.src_type = "agent";
      }
      return k;
    });
  } catch (error) {
    console.log(`查询连接分析错误: ${error}`);
  }
};

const toAgentDetail = async (ip: string) => {
  try {
    const param = {
      q: `ip=${ip}`
    };
    const rawItems = await getAgentList(param);
    if (((rawItems.data || {}).affected_items || []).length > 0) {
      const agent = rawItems.data.affected_items[0];
      agent.tag_show = tagsGender.value.find(tag => tag.value == agent.tag)?.text ?? "无";
      localSet("agent-detail", agent);
      router.push(`/assetManagement/agent/detail`);
    }
  } catch (error) {
    console.log(`负载详情错误: ${error}`);
  }
};

const now = new Date().getTime();
const start = now - 24 * 60 * 60 * 1000;
const columns = reactive<ColumnProps[]>([
  {
    prop: "serto",
    label: "服务者",
    render: scope => {
      return (
        <div>
          {scope.row.dest_type !== "agent" && <span>{scope.row.destip}</span>}
          {scope.row.dest_type === "agent" && (
            <>
              <el-button
                link
                type="primary"
                disabled={!isRoutePermission("/assetManagement/agent/detail")}
                onClick={() => toAgentDetail(scope.row.destip)}
              >
                {scope.row.destip}
              </el-button>
              <el-tag effect="dark" disable-transitions class="ml5">
                {scope.row.dest_tag?.replace("empty", "无标签")}
              </el-tag>
            </>
          )}
          {scope.row.dest_type === "address" && <div class="mt5">{scope.row.dest_group?.split("/")[1] ?? "-"}</div>}
          {scope.row.dest_type === "agent" && (
            <>
              <div class="mt5">
                {scope.row.dest_group?.split("/")[0]}
                <el-tag disable-transitions class="ml5">
                  {scope.row.dest_group?.replace(/empty/g, "无标签")?.split("/")[1] ?? "-"}
                </el-tag>
                <el-tag type="success" disable-transitions class="ml5">
                  {scope.row.dest_group?.replace(/empty/g, "无标签")?.split("/")[2] ?? "-"}
                </el-tag>
                <el-tag type="warning" disable-transitions class="ml5">
                  {scope.row.dest_group?.replace(/empty/g, "无标签")?.split("/")[3] ?? "-"}
                </el-tag>
              </div>
            </>
          )}
        </div>
      );
    },
    hideOverflowTooltip: true
  },
  {
    prop: "service",
    label: "服务",
    render: scope => `${scope.row.protocol}/${scope.row.destport}`
  },
  {
    prop: "serfrom",
    label: "访问者",
    render: scope => {
      return (
        <div>
          {scope.row.src_type !== "agent" && <span>{scope.row.srcip}</span>}
          {scope.row.src_type === "agent" && (
            <>
              <el-button link type="primary" onClick={() => toAgentDetail(scope.row.srcip)}>
                {scope.row.srcip}
              </el-button>
              <el-tag effect="dark" disable-transitions class="ml5">
                {scope.row.src_tag?.replace("empty", "无标签")}
              </el-tag>
            </>
          )}
          {scope.row.src_type === "address" && <div class="mt5">{scope.row.src_group?.split("/")[1] ?? "-"}</div>}
          {scope.row.src_type === "agent" && (
            <>
              <div class="mt5">
                {scope.row.src_group?.split("/")[0]}
                <el-tag disable-transitions class="ml5">
                  {scope.row.src_group?.replace(/empty/g, "无标签")?.split("/")[1] ?? "-"}
                </el-tag>
                <el-tag type="success" disable-transitions class="ml5">
                  {scope.row.src_group?.replace(/empty/g, "无标签")?.split("/")[2] ?? "-"}
                </el-tag>
                <el-tag type="warning" disable-transitions class="ml5">
                  {scope.row.src_group?.replace(/empty/g, "无标签")?.split("/")[3] ?? "-"}
                </el-tag>
              </div>
            </>
          )}
        </div>
      );
    },
    hideOverflowTooltip: true
  },
  {
    prop: "count",
    label: "连接次数",
    width: "120"
  },
  {
    prop: "conntype",
    label: "流量状态",
    enum: [
      { value: "green", text: "正常" },
      { value: "red", text: "异常" }
    ],
    search: { el: "select", order: 9, key: "flow", props: { filterable: true } },
    fieldNames: { label: "text", value: "value" },
    width: "120",
    render: scope => (scope.row.conntype === "new" ? "正常" : scope.row.conntype === "drop" ? "异常" : "-")
  },
  {
    prop: "time",
    label: "最新时间",
    search: {
      el: "date-picker",
      label: "时间",
      order: 1,
      span: 2,
      props: { type: "datetimerange", valueFormat: "x", filterable: true },
      defaultValue: [start, now]
    },
    isShow: true,
    render: scope => formatDate(new Date(scope.row.timestamp))
  },
  {
    prop: "srcip",
    label: "来源IP",
    search: {
      el: "input",
      order: 2,
      props: { filterable: true, placeholder: "请输入" },
      rules: [
        {
          validator: (rule: any, value: any, callback: any) => checkIp(rule, value, callback),
          trigger: "blur"
        }
      ]
    },
    isShow: false
  },
  {
    prop: "src_group",
    label: "来源工作组",
    enum: groupsGender,
    search: {
      order: 3,
      // 自定义 search 显示内容
      render: scope => {
        return (
          <el-select vModel_trim={scope.searchParam.src_group} placeholder="请选择" style="width: 100%" clearable>
            {groupsGender.value.map(item => {
              return (
                <el-option
                  label={item.show_name}
                  value={`${item.show_name}/${item.loc ?? 0}/${item.org ?? 0}/${item.business ?? 0}`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                  <span>{item.show_name}</span>
                  <span>
                    <el-tag class="ml8">{item.loc_show_name ?? "无标签"}</el-tag>
                    <el-tag class="ml8" type="success">
                      {item.org_show_name ?? "无标签"}
                    </el-tag>
                    <el-tag class="ml8" type="warning">
                      {item.business_show_name ?? "无标签"}
                    </el-tag>
                  </span>
                </el-option>
              );
            })}
          </el-select>
        );
      }
    },
    fieldNames: { label: "show_name", value: "name" },
    isShow: false
  },
  {
    prop: "src_tag",
    label: "来源组件标签",
    enum: tagsGender,
    search: { el: "select", order: 4, props: { filterable: true } },
    fieldNames: { label: "text", value: "value" },
    isShow: false
  },
  {
    prop: "destip",
    label: "目的IP",
    search: {
      el: "input",
      order: 5,
      props: { filterable: true, placeholder: "请输入" },
      key: "dstip",
      rules: [
        {
          validator: (rule: any, value: any, callback: any) => checkIp(rule, value, callback),
          trigger: "blur"
        }
      ]
    },
    isShow: false
  },
  {
    prop: "destport",
    label: "目的端口",
    search: {
      el: "input",
      order: 6,
      props: { filterable: true, placeholder: "请输入" },
      key: "dstport",
      rules: [
        {
          validator: (rule: any, value: any, callback: any) => checkPort(rule, value, callback),
          trigger: "blur"
        }
      ]
    },
    isShow: false
  },
  {
    prop: "dest_group",
    label: "目的工作组",
    enum: groupsGender,
    search: {
      order: 7,
      // 自定义 search 显示内容
      render: scope => {
        return (
          <el-select vModel_trim={scope.searchParam.dest_group} placeholder="请选择" style="width: 100%" clearable>
            {groupsGender.value.map(item => {
              return (
                <el-option
                  label={item.show_name}
                  value={`${item.show_name}/${item.loc ?? 0}/${item.org ?? 0}/${item.business ?? 0}`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                  <span>{item.show_name}</span>
                  <span>
                    <el-tag class="ml8">{item.loc_show_name ?? "无标签"}</el-tag>
                    <el-tag class="ml8" type="success">
                      {item.org_show_name ?? "无标签"}
                    </el-tag>
                    <el-tag class="ml8" type="warning">
                      {item.business_show_name ?? "无标签"}
                    </el-tag>
                  </span>
                </el-option>
              );
            })}
          </el-select>
        );
      }
    },
    fieldNames: { label: "show_name", value: "name" },
    isShow: false
  },
  {
    prop: "dest_tag",
    label: "目的组件标签",
    enum: tagsGender,
    search: { el: "select", order: 8, props: { filterable: true } },
    fieldNames: { label: "text", value: "value" },
    isShow: false
  },
  { prop: "operation", label: "操作", fixed: "right", width: 120, align: "left", hideOverflowTooltip: true }
]);

const toPolicy = async (item: Record<string, any>) => {
  try {
    if (item.dest_group.includes("/empty/empty/empty") || item.src_group.includes("/empty/empty/empty")) {
      ElMessage({
        message: `需要先为服务者、访问者所在工作组配置标签，才可进行规则匹配`,
        type: "info"
      });
      return;
    }
    const params = {
      srcip: item.srcip,
      dstip: item.destip,
      service_list: `${item.protocol}/${item.destport}`
    };
    const rawItems: any = await getTrafficMatch(params);
    if (rawItems.rule_status === 0) {
      ElMessage({
        message: "规则已存在",
        type: "info"
      });
    } else if (rawItems.rule_status === 1) {
      ElMessage({
        message: `规则需要下发，存在在以下策略集中：${rawItems.message}`,
        type: "info"
      });
    } else if (rawItems.rule_status === 2) {
      localSet("traffic-detail", item);
      localSet("flow-match", rawItems);
      router.push({
        path: `/businessTopology/trafficMonitoring/policy`
      });
    } else if (rawItems.rule_status === 3) {
      ElMessage({
        message: `需要先设置以下代理的组件标签和工作组：${rawItems.message}`,
        type: "info"
      });
    } else if (rawItems.rule_status === 4) {
      ElMessage({
        message: `无需创建规则`,
        type: "info"
      });
    }
  } catch (error) {
    console.log(`查询流量匹配策略错误: ${error}`);
  }
};
</script>
<style scoped lang="scss">
.traffic-monitoring-warp {
  height: 100%;
}
.btn-warp {
  display: flex;
}
</style>
