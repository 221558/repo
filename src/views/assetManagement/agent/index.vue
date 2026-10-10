<template>
  <div class="card no-card agent-warp">
    <el-tabs v-model="activeType">
      <el-tab-pane label="主机" name="agent" />
      <el-tab-pane label="容器" name="pod" />
    </el-tabs>
    <div class="agent-contain">
      <ProTable
        ref="proTable"
        :columns="columns"
        :request-api="getList"
        :init-param="initParam"
        :tool-button="false"
        :data-callback="dataCallback"
        :request-auto="false"
      >
        <template #tableHeader="scope">
          <div class="btn-warp mt2 mb5">
            <div>
              <el-button
                type="primary"
                icon="Delete"
                :disabled="!scope.isSelected || checkSelectedPOD(scope.selectedList)"
                @click="delAgent(scope.selectedList)"
              >
                批量删除
              </el-button>
              <el-dropdown trigger="click" :disabled="!scope.isSelected" class="ml12">
                <el-button :disabled="!scope.isSelected">
                  批量编辑<el-icon class="el-icon--right"><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      :disabled="!scope.isSelected || checkSelectedPOD(scope.selectedList)"
                      @click="openBatch('tag', scope.selectedList)"
                    >
                      组件标签
                    </el-dropdown-item>
                    <el-dropdown-item @click="openBatch('policy_status', scope.selectedList)">策略状态</el-dropdown-item>
                    <el-dropdown-item @click="openBatch('out_block', scope.selectedList)">出站管理</el-dropdown-item>
                    <el-dropdown-item
                      :disabled="!scope.isSelected || checkSelectedPOD(scope.selectedList)"
                      @click="openBatch('group_id', scope.selectedList)"
                    >
                      工作组
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <div>
              <el-tooltip effect="dark" content="部署代理" placement="top">
                <el-button
                  icon="Connection"
                  type="primary"
                  circle
                  :disabled="!isRoutePermission('/assetManagement/managerTool/proxy')"
                  @click="toProxy"
                />
              </el-tooltip>
              <el-tooltip effect="dark" content="导出" placement="top">
                <el-button icon="Upload" circle @click="downloadFile" />
              </el-tooltip>
              <el-tooltip effect="dark" content="刷新" placement="top">
                <el-button icon="Refresh" circle @click="refresh" />
              </el-tooltip>
            </div>
          </div>
        </template>
        <!-- 工作组 -->
        <template #group="scope">
          <el-tooltip
            effect="dark"
            :content="scope.row.os?.name === 'POD' ? 'K8工作负载不可编辑工作组' : '编辑工作负载工作组'"
            placement="top"
          >
            <el-button
              type="primary"
              link
              :disabled="scope.row.os?.name === 'POD'"
              @click="
                () => {
                  selectedAgents = [scope.row];
                  openDrawer('group_id', scope.row);
                }
              "
            >
              {{ scope.row.group_show }}
            </el-button>
          </el-tooltip>
        </template>
        <!-- 组件标签 -->
        <template #tag="scope">
          <el-tooltip
            effect="dark"
            :content="scope.row.os?.name === 'POD' ? 'K8工作负载不可编辑组件标签' : '编辑工作负载组件标签'"
            placement="top"
          >
            <el-button
              type="primary"
              link
              :disabled="scope.row.os?.name === 'POD'"
              @click="
                () => {
                  selectedAgents = [scope.row];
                  openDrawer('tag', scope.row);
                }
              "
            >
              {{ scope.row.tag_show }}
            </el-button>
            <!-- <div
              @mouseenter="
                () => {
                  if (scope.row.os?.name !== 'POD') hoverItem = `${scope.row.id}_tag`;
                }
              "
              @mouseleave="
                e => {
                  // 火狐浏览器从select控件移入option即触发外层mouseleave兼容性解决
                  // 火狐从select控件移入option时触发e.relatedTarget为null，从option移出时不触发外层mouseleave
                  // edge、谷歌从select控件移入option时不触发，从option移出时触发e.relatedTarget为事件元素
                  const o = e.relatedTarget;
                  if (o) hoverItem = '';
                }
              "
              class="td-warp"
            >
              <el-tag v-show="hoverItem !== `${scope.row.id}_tag`" effect="dark" disable-transitions class="tag-warp">
                {{ scope.row.tag_show }}
              </el-tag>
              <select
                v-model="scope.row.tag"
                filterable
                placeholder="请选择组件标签"
                v-show="hoverItem === `${scope.row.id}_tag`"
                @change="e => saveTag(scope.row.id, (e.target as HTMLInputElement).value, [scope.row])"
              >
                <option v-for="(item, index) in tagList" :key="`tagList_${index}`" :value="item.value">
                  {{ item.text }}
                </option>
              </select>
            </div> -->
          </el-tooltip>
        </template>
        <!-- 策略状态 -->
        <template #policy_status="scope">
          <el-tooltip effect="dark" content="编辑工作负载策略状态" placement="top">
            <div
              @mouseenter="hoverItem = `${scope.row.id}_policy_status`"
              @mouseleave="
                e => {
                  // 火狐浏览器从select控件移入option即触发外层mouseleave兼容性解决
                  // 火狐从select控件移入option时触发e.relatedTarget为null，从option移出时不触发外层mouseleave
                  // edge、谷歌从select控件移入option时不触发，从option移出时触发e.relatedTarget为事件元素
                  const o = e.relatedTarget;
                  if (o) hoverItem = '';
                }
              "
              class="td-warp"
            >
              <el-tag
                v-show="hoverItem !== `${scope.row.id}_policy_status`"
                effect="plain"
                disable-transitions
                :type="scope.row.policy_status === 'build' ? 'info' : scope.row.policy_status === 'test' ? 'warning' : 'success'"
              >
                {{ scope.row.policy_status_show }}
              </el-tag>
              <select
                v-model="scope.row.policy_status"
                filterable
                placeholder="请选择策略状态"
                v-show="hoverItem === `${scope.row.id}_policy_status`"
                @change="e => savePolicyStatus(scope.row.id, (e.target as HTMLInputElement).value, [scope.row])"
              >
                <option v-for="(item, index) in policyOptions" :key="`policyOptions_${index}`" :value="item.value">
                  {{ item.text }}
                </option>
              </select>
            </div>
          </el-tooltip>
        </template>
        <!-- 出站管理 -->
        <template #out_block="scope">
          <el-tooltip effect="dark" content="编辑工作负载出站管理" placement="top">
            <el-switch
              v-model="scope.row.out_block"
              :active-value="1"
              :inactive-value="0"
              :before-change="() => beforeChangeOutBlock(scope.row.out_block)"
              @change="(val: string | number | boolean) => saveOutbound(scope.row.id, val, [scope.row])"
            />
          </el-tooltip>
        </template>
        <!-- 状态 -->
        <template #status="scope">
          <el-tag v-if="scope.row.status === 'active'" type="success">已连接</el-tag>
          <el-tag v-else-if="scope.row.status === 'disconnected'" type="warning">未连接</el-tag>
          <el-tag v-else-if="scope.row.status === 'never_connected'" type="warning">从未连接</el-tag>
          <el-tag v-else-if="scope.row.status === 'pending'" type="warning">挂起</el-tag>
        </template>
        <!-- 操作 -->
        <template #operation="scope">
          <el-tooltip effect="dark" content="工作负载详情" placement="top">
            <el-button link type="primary" size="small" @click="toDetail(scope.row)">
              <el-icon><View /></el-icon>
            </el-button>
          </el-tooltip>
          <span class="ml6" v-if="(scope.row.os || {}).name !== 'POD'">
            <el-tooltip
              effect="dark"
              content="启动工作负载"
              placement="top"
              v-if="
                (scope.row.os || {}).platform !== 'windows' &&
                (scope.row.status === 'disconnected' || scope.row.status === 'never_connected')
              "
            >
              <el-button link type="primary" size="small" @click="startAgent(scope.row)">
                <el-icon><VideoPlay /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip
              effect="dark"
              content="关闭工作负载"
              placement="top"
              v-if="(scope.row.os || {}).platform !== 'windows' && scope.row.status === 'active'"
            >
              <el-button link type="primary" size="small" @click="stopAgent(scope.row)">
                <el-icon><SwitchButton /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip
              effect="dark"
              content="重启工作负载"
              placement="top"
              v-if="(scope.row.os || {}).platform !== 'windows' && scope.row.status === 'active'"
            >
              <el-button link type="primary" size="small" @click="restartAgent(scope.row)">
                <el-icon><RefreshRight /></el-icon>
              </el-button>
            </el-tooltip>
            <el-tooltip effect="dark" content="删除工作负载" placement="top">
              <el-button link type="primary" size="small" @click="delAgent([scope.row])">
                <el-icon><Delete /></el-icon>
              </el-button>
            </el-tooltip>
          </span>
        </template>
      </ProTable>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="`编辑工作负载${dialogTitle}`"
      width="500px"
      draggable
      @close="toClose"
      :close-on-press-escape="false"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" label-width="100px" :rules="rules">
        <el-form-item :label="`${dialogTitle}:`" prop="value">
          <el-select v-model="formData.value" filterable placeholder="请选择组件标签" v-if="dialogType === 'tag'">
            <el-option v-for="(item, index) in tagList" :key="`tagOptions_${index}`" :label="item.text" :value="item.value" />
            <template #footer>
              <el-button
                v-if="!isAddLabel"
                text
                bg
                size="small"
                :disabled="!isRoutePermission('/assetManagement/label')"
                @click="
                  () => {
                    isAddLabel = true;
                  }
                "
              >
                新增
              </el-button>
              <template v-else>
                <el-form ref="formAddRef" :model="formAddData" :rules="rulesAdd">
                  <el-form-item label="显示名称:" class="el-form-item--small" prop="addValue">
                    <el-input v-model="formAddData.addValue" size="small" />
                  </el-form-item>
                </el-form>

                <el-button type="primary" size="small" @click="saveLabel">保存</el-button>
                <el-button
                  size="small"
                  @click="
                    () => {
                      isAddLabel = false;
                      formAddData.addValue = '';
                    }
                  "
                >
                  取消
                </el-button>
              </template>
            </template>
          </el-select>
          <el-select v-model="formData.value" filterable placeholder="请选择策略状态" v-if="dialogType === 'policy_status'">
            <el-option
              v-for="(item, index) in policyOptions"
              :key="`policyOptions_${index}`"
              :label="item.text"
              :value="item.value"
            />
          </el-select>
          <el-select v-model="formData.value" filterable placeholder="请选择出站管理" v-if="dialogType === 'out_block'">
            <el-option
              v-for="(item, index) in outboundOptions"
              :key="`outboundOptions_${index}`"
              :label="item.text"
              :value="item.value"
            />
          </el-select>
          <el-select v-model="formData.value" placeholder="请选择工作组" v-if="dialogType === 'group_id'">
            <el-option
              v-for="item in groupsGender"
              :key="`groupsGender_${item.id}`"
              :label="item.show_name"
              :value="item.name"
              class="flx-justify-between"
            >
              <span>{{ item.show_name }}</span>
              <span>
                <el-tag class="ml8">{{ item.loc_show_name ?? "无标签" }}</el-tag>
                <el-tag class="ml8" type="success">{{ item.org_show_name ?? "无标签" }}</el-tag>
                <el-tag class="ml8" type="warning">{{ item.business_show_name ?? "无标签" }}</el-tag>
              </span>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <el-alert
        v-if="dialogType === 'out_block' && formData.value === 1"
        title="打开出站管理需要配置出站策略，否则出站流量全拦截"
        type="info"
        :closable="false"
        show-icon
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="toClose">取消</el-button>
          <el-button type="primary" @click="toSaveEdit">保存</el-button>
        </span>
      </template>
    </el-dialog>
    <OrderDialog
      ref="orderDialog"
      :task_type="orderProps.task_type"
      :log_object="orderProps.log_object"
      :log_action="orderProps.log_action"
      :params="orderProps.params"
      :unuse_params="orderProps.unuse_params"
      @callback-fn="orderDialogCallback"
    />
  </div>
</template>

<script setup lang="tsx" name="agent">
import { reactive, ref, onMounted, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import ProTable from "@/components/ProTable/index.vue";
import OrderDialog from "@/components/OrderDialog/index.vue";
import { OrderDialogProps } from "@/components/OrderDialog/interface";
import { ProTableInstance, ColumnProps } from "@/components/ProTable/interface";
import { getGroupList, getAgentOsList, getAgentList, getTagList } from "@/api/modules/assets";
import { addLabel } from "@/api/modules/assetManagement";
import { formatDate, localSet, isRoutePermission } from "@/utils";
import { ElMessageBox, ElMessage } from "element-plus";
import { useDownloadList } from "@/hooks/useDownloadList";
import { checkIp, checkAgentName, checkChineseLettertNumber } from "@/utils/eleValidate";

const route = useRoute();
const activeType = ref<any>(route.query.tab ?? "agent");
watch(
  () => activeType.value,
  async () => {
    Promise.all([getGroupOptions(), getOsOptions()])
      .then(() => {
        proTable.value?.reset();
      })
      .catch(error => {
        console.log(error);
      });
  }
);

const router = useRouter();

const tagList = ref<Record<string, string>[]>([]);
const policyOptions = ref([
  { value: "build", text: "建设中" },
  { value: "test", text: "测试中" },
  { value: "protect", text: "防护中" }
]);
const outboundOptions = ref([
  { value: 1, text: "开启" },
  { value: 0, text: "关闭" }
]);
const hoverItem = ref("");

const isAddLabel = ref<boolean>(false); // 组件标签下拉框中新增
const formAddRef = ref();
const formAddData = ref<Record<string, any>>({
  addValue: ""
});
const rulesAdd = reactive<Record<string, any>>({
  addValue: [
    { required: true, message: "请输入显示名称", trigger: "blur" },
    { validator: checkChineseLettertNumber, trigger: "blur" }
  ]
});

const orderDialog = ref();
let orderProps = ref<OrderDialogProps>({
  task_type: "operate",
  log_object: "",
  log_action: "",
  params: {},
  unuse_params: ""
});

const proTable = ref<ProTableInstance>();
const initParam = reactive({ pageSize: 10, pageNum: 1, q: "id!=000", sort: "+id" });
const dataCallback = (data: any, totalParam?: any) => {
  const list = data.affected_items.map((item: Record<string, any>) => {
    item.group_id = item.group[0] ?? "";
    item.group_show = groupsGender.value.find(group => group.name === item.group_id)?.show_name ?? "无";
    item.tag_show = tagList.value.find(tag => tag.value == item.tag)?.text ?? "无";
    item.policy_status_show = policyOptions.value.find(tag => tag.value == item.policy_status)?.text ?? "无";
    return item;
  });
  return {
    list,
    total: data.total_affected_items,
    pageNum: totalParam.pageNum,
    pageSize: totalParam.pageSize
  };
};
const statusGender = ref([
  { value: "active", text: "已连接" },
  { value: "disconnected", text: "未连接" },
  { value: "never_connected", text: "从未连接" }
]);
let groupsList = ref<Record<string, any>[]>([]);
let groupsGender = ref<Record<string, any>[]>([]);
let osGender = ref<Record<string, any>[]>([]);
const checkSelectedPOD = (selectedList: Record<string, any>[]) => {
  const pod = selectedList.find((agent: Record<string, any>) => (agent.os || {}).name === "POD");
  if (pod) {
    return true;
  } else {
    return false;
  }
};
const columns = reactive<ColumnProps[]>([
  { type: "selection", fixed: "left", width: 70 },
  {
    prop: "id",
    label: "ID"
  },
  {
    prop: "ip",
    label: "IP",
    search: {
      el: "input",
      order: 3,
      props: { filterable: true },
      rules: [
        {
          validator: (rule: any, value: any, callback: any) => checkIp(rule, value, callback),
          trigger: "blur"
        }
      ]
    }
  },
  {
    prop: "name",
    label: "主机名",
    search: {
      el: "input",
      order: 5,
      props: { filterable: true },
      rules: [
        {
          validator: checkAgentName,
          trigger: "blur"
        }
      ]
    }
  },
  {
    prop: "group",
    label: "组",
    enum: groupsGender,
    // search: { el: "select", order: 2, props: { filterable: true } },
    search: {
      order: 2,
      // 自定义 search 显示内容
      render: scope => {
        return (
          <el-select vModel_trim={scope.searchParam.group} placeholder="请选择" style="width: 100%" clearable>
            {groupsGender.value.map(item => {
              return (
                <el-option
                  label={item.show_name}
                  value={item.name}
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
    fieldNames: { label: "show_name", value: "name" }
  },
  {
    prop: "tag",
    label: "组件标签",
    hideOverflowTooltip: true
  },
  {
    prop: "policy_status",
    label: "策略状态",
    hideOverflowTooltip: true
  },
  {
    prop: "out_block",
    label: "出站管理",
    hideOverflowTooltip: true
  },
  {
    prop: "os_name",
    label: "操作系统",
    enum: osGender,
    search: { el: "select", order: 4, props: { filterable: true }, key: "os.platform" },
    fieldNames: { label: "platform", value: "platform" },
    render: scope => {
      const name = ((scope.row || {}).os || {}).name ?? "-";
      const version = ((scope.row || {}).os || {}).version ?? "";
      return !name && !version ? "-" : `${name} ${version}`;
    }
  },
  {
    prop: "node_name",
    label: "集群节点"
  },
  {
    prop: "dateAdd",
    label: "注册日期",
    render: scope => formatDate(new Date(scope.row.dateAdd))
  },
  {
    prop: "lastKeepAlive",
    label: "上次连接时间",
    render: scope => formatDate(new Date(scope.row.lastKeepAlive))
  },
  {
    prop: "status",
    label: "状态",
    width: 95,
    enum: statusGender,
    search: { el: "select", order: 1, props: { filterable: true } },
    fieldNames: { label: "text", value: "value" }
  },
  { prop: "operation", label: "操作", fixed: "right", width: 120, align: "left", hideOverflowTooltip: true }
]);
let searchParams = reactive<Record<string, any>>({});

onMounted(async () => {
  Promise.all([getInitList(), getOsOptions()])
    .then(() => {
      getGroupOptions();
      proTable.value?.getTableList();
    })
    .catch(error => {
      console.log(error);
    });
});

const dialogVisible = ref(false);
const dialogType = ref("");
const dialogTitle = computed(() => {
  let type = "";
  switch (dialogType.value) {
    case "tag":
      type = "组件标签";
      break;
    case "policy_status":
      type = "策略状态";
      break;
    case "out_block":
      type = "出站管理";
      break;
    case "group_id":
      type = "工作组";
      break;
    default:
      type = "-";
      break;
  }
  return type;
});
const formRef = ref();
const formData = ref<Record<string, any>>({
  agents_list: "",
  value: ""
});
const rules = reactive<Record<string, any>>({
  value: [{ required: true, message: "请选择", trigger: "change" }]
});
const selectedAgents = ref<Record<string, any>[]>([]);

const toClose = () => {
  formRef.value.clearValidate();
  dialogVisible.value = false;
  dialogType.value = "";
  formData.value = {
    agents_list: "",
    value: ""
  };
  isAddLabel.value = false;
  formAddData.value.addValue = "";
  selectedAgents.value = [];
};

const saveLabel = async () => {
  formAddRef.value.validate(async (valid: any) => {
    if (valid) {
      let addParams = {
        showname_list: formAddData.value.addValue,
        label_type: "component"
      };
      try {
        const res: any = await addLabel(addParams);
        if (res.message.includes("failed")) {
          ElMessage({
            message: "标签保存失败: 显示名称不可重复",
            type: "error"
          });
        } else {
          ElMessage({
            message: "保存成功",
            type: "success"
          });
          formAddData.value.addValue = "";
          const tagItems = await getTagList({ label_type: "component" });
          tagList.value = ((tagItems || {}).data || {}).affected_items.map(k => ({
            value: String(k.id),
            text: k.show_name
          }));
        }
      } catch (error) {
        console.log(`新增标签错误: ${error}`);
      }
    } else {
      return false;
    }
  });
};

const getInitList = async () => {
  try {
    const tagItems = await getTagList({ label_type: "component" });
    tagList.value = ((tagItems || {}).data || {}).affected_items.map(k => ({
      value: String(k.id),
      text: k.show_name
    }));
  } catch (error) {
    console.log(`组件标签列表错误: ${error}`);
  }

  try {
    const groups = await getGroupList({ limit: 0 });
    groupsList.value = ((groups || {}).data || {}).affected_items;
  } catch (error) {
    console.log(`分组列表错误: ${error}`);
  }
};

const getGroupOptions = async () => {
  try {
    groupsGender.value = groupsList.value.filter(k => {
      if (activeType.value === "agent") {
        return k.mode !== "auto";
      } else {
        return k.mode === "auto" || k.name === "default";
      }
    });
  } catch (error) {
    console.log(`分组列表错误: ${error}`);
  }
};

const getOsOptions = async () => {
  try {
    let q = "id!=000";
    if (activeType.value === "agent") {
      q = `${q};daemonset_id=-1`;
    } else {
      q = `${q};daemonset_id!=-1`;
    }
    const listRes = await getAgentOsList(q);
    osGender.value = ((listRes || {}).data || {}).affected_items.map(k => ({
      platform: k.os.platform
    }));
  } catch (error) {
    console.log(`操作系统列表错误: ${error}`);
  }
};

const getList = (params: any) => {
  const newParams = JSON.parse(JSON.stringify(params));
  const limit = newParams.pageSize;
  const offset = (newParams.pageNum - 1) * newParams.pageSize;
  const filterArr = columns.filter(column => column.search).map(column => column.search?.key ?? column.prop);
  let q = "id!=000";
  if (activeType.value === "agent") {
    q = `${q};daemonset_id=-1`;
  } else {
    q = `${q};daemonset_id!=-1`;
  }

  filterArr.forEach((k: any) => {
    if (newParams[k]) {
      q = `${q};(${k}=${newParams[k]})`;
    }
  });
  const param = {
    limit,
    offset,
    q,
    sort: "+id"
  };
  searchParams = param;
  return getAgentList(param);
};

const openDrawer = (type: string, item: Record<string, any>) => {
  dialogType.value = type;
  formData.value = {
    agents_list: item.id,
    value: item[type]
  };
  dialogVisible.value = true;
};

const openBatch = (type: string, itemArr: Record<string, any>[]) => {
  selectedAgents.value = itemArr;
  dialogType.value = type;
  const agents_list = itemArr.map(item => item.id).join(",");
  formData.value = {
    agents_list,
    value: ""
  };
  dialogVisible.value = true;
};

const toSaveEdit = async () => {
  formRef.value.validate(async (valid: any) => {
    if (valid) {
      if (dialogType.value === "tag") {
        saveTag(formData.value.agents_list, formData.value.value, selectedAgents.value);
      } else if (dialogType.value === "policy_status") {
        savePolicyStatus(formData.value.agents_list, formData.value.value, selectedAgents.value);
      } else if (dialogType.value === "out_block") {
        saveOutbound(formData.value.agents_list, formData.value.value, selectedAgents.value);
      } else if (dialogType.value === "group_id") {
        saveGroup(formData.value.agents_list, formData.value.value, selectedAgents.value);
      }
      toClose();
    } else {
      return false;
    }
  });
};

const orderDialogCallback = () => {
  if (
    ["agent_tag", "agent_policy", "agent_out_block", "delete", "group_agent"].indexOf(orderProps.value.log_action ?? "") !== -1
  ) {
    // 组件标签、策略状态、出站管理、工作组，修改后即时生效，重新查询列表；删除负载即时查询列表
    proTable.value?.getTableList();
  }
  orderProps.value = {
    task_type: "operate",
    log_object: "",
    log_action: "",
    params: {},
    unuse_params: ``
  };
};

const saveTag = async (agents_list: string, agent_tag: string, selectedAgents: Record<string, any>[]) => {
  const unuse_params_arr = selectedAgents.map((agent: Record<string, any>) => ({
    主机ID: agent.id,
    主机IP: agent.ip,
    主机名: agent.name,
    工作组: agent.group_show,
    组件标签: agent.tag_show
  }));
  orderProps.value = {
    task_type: "operate",
    log_object: "agent_info",
    log_action: "agent_tag",
    params: {
      pretty: true,
      agents_list,
      agent_tag
    },
    unuse_params: JSON.stringify(unuse_params_arr)
  };
  orderDialog.value?.judgeSwitch();
};

const savePolicyStatus = async (agents_list: string, policy_status: string, selectedAgents: Record<string, any>[]) => {
  const unuse_params_arr = selectedAgents.map((agent: Record<string, any>) => ({
    主机ID: agent.id,
    主机IP: agent.ip,
    主机名: agent.name,
    工作组: agent.group_show,
    组件标签: agent.tag_show,
    策略状态: agent.policy_status_show
  }));
  orderProps.value = {
    task_type: "operate",
    log_object: "agent_info",
    log_action: "agent_policy",
    params: {
      agents_list,
      policy_status
    },
    unuse_params: JSON.stringify(unuse_params_arr)
  };
  orderDialog.value?.judgeSwitch();
};

const beforeChangeOutBlock = async (out_block: number) => {
  let res = false;
  await ElMessageBox.confirm(
    out_block == 1 ? "确认关闭出站管理?" : "打开出站管理需要配置出站策略，否则出站流量全拦截。确认开启出站管理?",
    "温馨提示",
    { type: "warning" }
  ).then(() => {
    res = true;
  });
  return res;
};

const saveOutbound = async (agents_list: string, out_block: string | number | boolean, selectedAgents: Record<string, any>[]) => {
  const unuse_params_arr = selectedAgents.map((agent: Record<string, any>) => ({
    主机ID: agent.id,
    主机IP: agent.ip,
    主机名: agent.name,
    工作组: agent.group_show,
    组件标签: agent.tag_show,
    出站管理: out_block == 1 ? "关闭" : "开启"
  }));
  orderProps.value = {
    task_type: "operate",
    log_object: "agent_info",
    log_action: "agent_out_block",
    params: {
      agents_list,
      out_block: out_block == 1
    },
    unuse_params: JSON.stringify(unuse_params_arr)
  };
  orderDialog.value?.judgeSwitch();
};

const saveGroup = async (agents_list: string, group_id: string | number | boolean, selectedAgents: Record<string, any>[]) => {
  const groupItem = groupsList.value.find(group => group.name === group_id);
  const agents = selectedAgents.map(
    (k: Record<string, any>) => `${k.id} - ${k.name} ( IP: ${k.ip}, 组件标签: ${k.tag_show}, 策略状态: ${k.policy_status_show} )`
  );
  const unuse_params_arr = [
    {
      移入工作组: `${groupItem?.show_name ?? "-"} ( 位置: ${groupItem?.loc_show_name ?? "-"}, 组织: ${
        groupItem?.org_show_name ?? "-"
      }, 业务: ${groupItem?.business_show_name ?? "-"} )`,
      移入负载: agents.join("、")
    }
  ];
  orderProps.value = {
    task_type: "operate",
    log_object: "agent_info",
    log_action: "group_agent",
    params: {
      paramsArr: [
        {
          group_id,
          agents_list
        }
      ]
    },
    unuse_params: JSON.stringify(unuse_params_arr)
  };
  orderDialog.value?.judgeSwitch();
};

const toDetail = (item: Record<string, any>) => {
  localSet("agent-detail", item);
  router.push({
    path: `/assetManagement/agent/detail`,
    query: {
      tab: activeType.value
    }
  });
};

const startAgent = async (item: Record<string, any>) => {
  ElMessageBox.confirm("确认启动该工作负载?", "温馨提示", { type: "warning" }).then(async () => {
    const unuse_params_arr = [item].map((agent: Record<string, any>) => ({
      主机ID: agent.id,
      主机IP: agent.ip,
      主机名: agent.name,
      工作组: agent.group_show,
      组件标签: agent.tag_show
    }));
    orderProps.value = {
      task_type: "operate",
      log_object: "agent",
      log_action: "start",
      params: {
        agents_list: item.id
      },
      unuse_params: JSON.stringify(unuse_params_arr)
    };
    orderDialog.value?.judgeSwitch();
  });
};

const stopAgent = async (item: Record<string, any>) => {
  ElMessageBox.confirm("确认关闭该工作负载?", "温馨提示", { type: "warning" }).then(async () => {
    const unuse_params_arr = [item].map((agent: Record<string, any>) => ({
      主机ID: agent.id,
      主机IP: agent.ip,
      主机名: agent.name,
      工作组: agent.group_show,
      组件标签: agent.tag_show
    }));
    orderProps.value = {
      task_type: "operate",
      log_object: "agent",
      log_action: "stop",
      params: {
        agents_list: item.id
      },
      unuse_params: JSON.stringify(unuse_params_arr)
    };
    orderDialog.value?.judgeSwitch();
  });
};

const restartAgent = async (item: Record<string, any>) => {
  ElMessageBox.confirm("确认重启该工作负载?", "温馨提示", { type: "warning" }).then(async () => {
    const unuse_params_arr = [item].map((agent: Record<string, any>) => ({
      主机ID: agent.id,
      主机IP: agent.ip,
      主机名: agent.name,
      工作组: agent.group_show,
      组件标签: agent.tag_show
    }));
    orderProps.value = {
      task_type: "operate",
      log_object: "agent",
      log_action: "restart",
      params: {
        agents_list: item.id
      },
      unuse_params: JSON.stringify(unuse_params_arr)
    };
    orderDialog.value?.judgeSwitch();
  });
};

const delAgent = async (itemArr: Record<string, any>[]) => {
  ElMessageBox.confirm("确认删除该工作负载?", "温馨提示", { type: "warning" }).then(async () => {
    const agents_list = itemArr.map(item => item.id).join(",");
    const status_list = itemArr.map(item => item.status).join(",");
    const unuse_params_arr = itemArr.map((agent: Record<string, any>) => ({
      主机ID: agent.id,
      主机IP: agent.ip,
      主机名: agent.name,
      工作组: agent.group_show,
      组件标签: agent.tag_show
    }));
    orderProps.value = {
      task_type: "operate",
      log_object: "agent",
      log_action: "delete",
      params: {
        paramsArr: [
          {
            agents_list
          },
          {
            agents_list,
            status: status_list
          }
        ]
      },
      unuse_params: JSON.stringify(unuse_params_arr)
    };
    orderDialog.value?.judgeSwitch();
  });
};

const toProxy = () => {
  router.push(`/assetManagement/managerTool/proxy`);
};

const downloadFile = () => {
  ElMessageBox.confirm("确认导出工作负载列表?", "温馨提示", { type: "warning" }).then(async () => {
    const csvColumns = columns.slice(1, columns.length - 1).map((item: Record<string, any>) => ({
      label: item.label,
      value: item.prop
    }));
    const param = {
      q: searchParams.q,
      sort: "+id"
    };
    const dataCallBack = (item: Record<string, any>) => {
      const name = ((item || {}).os || {}).name ?? "-";
      const version = ((item || {}).os || {}).version ?? "-";
      item.group = item.group
        ?.map((group: string[]) => groupsList.value?.find(option => option.name === group)?.show_name ?? "-")
        .join("，");
      item.os_name = !name && !version ? "-" : `${name} ${version}`;
      item.dateAdd = formatDate(new Date(item.dateAdd));
      item.lastKeepAlive = formatDate(new Date(item.lastKeepAlive));
      item.status = statusGender.value?.find(option => option.value === item.status)?.text ?? "-";
      item.tag = tagList.value.find(tag => tag.value == item.tag)?.text ?? "无";
      item.policy_status = policyOptions.value?.find(option => option.value === item.policy_status)?.text ?? "无";
      item.out_block = outboundOptions.value?.find(option => option.value === item.out_block)?.text ?? "无";

      return item;
    };
    useDownloadList(getAgentList, "工作负载列表", csvColumns, param, false, false, true, dataCallBack);
  });
};

const refresh = () => {
  proTable.value?.search();
};
</script>

<style scoped lang="scss">
.agent-warp {
  height: 100%;
  .agent-contain {
    height: calc(100% - 54px);
    .cell select {
      width: 100%;
    }
  }
  .btn-warp {
    display: flex;
    justify-content: space-between;
  }
  .tag-warp {
    max-width: 100%;
    height: auto;
    padding: 5px 9px;
    white-space: normal;
  }
  .td-warp {
    height: 27px;
  }
}
</style>
