import { reactive } from "vue";
import { getGroupList, getAgentList, getTagList } from "@/api/modules/assets";
import { getTrafficFilter, getTrafficFilterDetail } from "@/api/modules/topology";
import { getChart1TopologyGroup } from "@/api/modules/screen";
import { cutForByte } from "@/utils";

interface edgesModel {
  source: String;
  target: String;
  edgeType?: String;
  curveOffset?: Number;
}

export const createState = () => ({
  isLoading: false,
  tagList1: [], // 位置标签列表
  tagList2: [], // 组织标签列表
  tagList3: [], // 业务标签列表
  tagList4: [], // 组件标签列表
  policyStatusOptions: [
    // 策略状态
    { id: "build", label: "建设中" },
    { id: "test", label: "测试中" },
    { id: "protect", label: "防护中" }
  ],
  groupList: [], // 分组列表
  agentList: [], // 负载列表
  modalType: "", // 浮窗类型：agent=负载详情、traffic=流量详情、group=分组详情
  selectedDetail: {}, // 详情选中数据：负载、流量、分组
  lineStatusSelected: ["in_packet", "in_drop"], // 流量状态过滤：正常、异常
  lineTypeSelected: ["in_group", "out_group"], // 流量类型过滤：组内、组间
  agentPolicyStatusSelected: ["build", "test", "protect"], // 负载策略状态过滤：建设、测试、防护
  agentStatusSelected: ["active", "no_active"], // 负载状态过滤：在线、离线
  viewSelected: "group", // 视图选择：工作组、位置标签、组织标签、业务标签
  groupFilterType: "group", // 过滤工作组维度：按工作组、按标签
  selectedGroup: [], // 按工作组维度过滤，选中的工作组
  selectedTag: [], // 按标签维度过滤，选中的标签
  chartType: "out", // 拓扑图类型：out=组间、in=详情
  combosOut: [], // 组间拓扑图标签列表
  nodesOut: [], // 组间拓扑图节点列表
  edgesOut: [], // 组间拓扑图流量
  combosIn: [], // 展开的工作组
  nodesIn: [], // 展开的工作组内负载
  edgesIn: [], // 展开的工作组内流量
  selectGroupIn: undefined // 展开拓扑页-选中的分组
});

export const topologyState = reactive<Record<string, any>>({
  ...createState(),
  ...{
    async getGroupLabelOptions() {
      return Promise.all([
        getTagList({ label_type: "loc" }),
        getTagList({ label_type: "org" }),
        getTagList({ label_type: "business" })
      ]).then((values: Record<string, any>[]) => {
        let selectedTag: string[] = [],
          tagList1: Record<string, string>[] = [],
          tagList2: Record<string, string>[] = [],
          tagList3: Record<string, string>[] = [];

        ((values[0] || {}).data || {}).affected_items.forEach((k: Record<string, any>) => {
          selectedTag.push(k.id);
          tagList1.push({
            id: k.id,
            label: k.show_name
          });
        });
        selectedTag.push("no_loc");
        tagList1.unshift({ id: "no_loc", label: "无标签" });
        this.tagList1 = tagList1;

        ((values[1] || {}).data || {}).affected_items.forEach((k: Record<string, any>) => {
          selectedTag.push(k.id);
          tagList2.push({
            id: k.id,
            label: k.show_name
          });
        });
        selectedTag.push("no_org");
        tagList2.unshift({ id: "no_org", label: "无标签" });
        this.tagList2 = tagList2;

        ((values[2] || {}).data || {}).affected_items.forEach((k: Record<string, any>) => {
          selectedTag.push(k.id);
          tagList3.push({
            id: k.id,
            label: k.show_name
          });
        });
        selectedTag.push("no_business");
        tagList3.unshift({ id: "no_business", label: "无标签" });
        this.tagList3 = tagList3;

        this.selectedTag = selectedTag;
        console.log("selectedTag", selectedTag);
      });
    },
    async getInitGroupList() {
      let groupList: Record<string, string>[] = [],
        selectedGroup: string[] = [];
      try {
        const groups = await getGroupList({ limit: 0 });
        ((groups || {}).data || {}).affected_items.forEach(k => {
          let label = k.show_name ? k.show_name : k.name;
          selectedGroup.push(k.name);
          groupList.push({
            name: k.name,
            show_name: k.show_name,
            description: k.description,
            loc_show_name: k.loc_show_name ?? "无标签",
            org_show_name: k.org_show_name ?? "无标签",
            business_show_name: k.business_show_name ?? "无标签",
            loc: k.loc,
            org: k.org,
            business: k.business,
            count: k.count,
            policy_status: k.policy_status,
            mode: k.mode,
            label,
            searchableLabel: `${label} ${k.loc_show_name ?? "无标签"} ${k.org_show_name ?? "无标签"} ${
              k.business_show_name ?? "无标签"
            }`
          });
        });
      } catch (error) {
        console.log(`分组列表错误: ${error}`);
      }
      this.groupList = groupList;
      this.selectedGroup = selectedGroup;
    },
    getCombosOut() {
      let combosOut: Record<string, any>[] = [],
        tagList = [];

      if (this.viewSelected === "loc") {
        tagList = this.tagList1.slice(1);
      } else if (this.viewSelected === "org") {
        tagList = this.tagList2.slice(1);
      } else if (this.viewSelected === "business") {
        tagList = this.tagList3.slice(1);
      }

      if (this.viewSelected !== "group") {
        tagList.map((k: Record<string, string>) => {
          const groupArr = this.nodesOut.filter((g: Record<string, any>) => g[`${this.viewSelected ?? ""}_id`] === k.id); // 该标签下的工作组列表
          const agentCount = groupArr.reduce((sum: number, g: Record<string, any>) => sum + Number(g.count || 0), 0); // 该标签下的工作负载个数
          if (groupArr.length > 0) {
            combosOut.push({
              id: `tag_${k.id}`,
              label: `${groupArr.length}工作组 | ${agentCount}工作负载`,
              sort: "0",
              group: k.label,
              count: "",
              policy_status: "tagCombos"
            });
          }
        });
      }
      this.combosOut = combosOut;
    },
    getNodesOut() {
      let nodes: Record<string, any>[] = [];

      if (this.groupFilterType === "group") {
        this.groupList.forEach((k: Record<string, string>) => {
          if (this.selectedGroup.indexOf(k.name) !== -1) {
            nodes.push({
              id: k.name,
              label: `${k.loc_show_name} | ${k.org_show_name} | ${k.business_show_name}`,
              sort: "0",
              group: k.label,
              count: k.count,
              loc_id: k.loc ?? "no_loc",
              org_id: k.org ?? "no_org",
              business_id: k.business ?? "no_business",
              policy_status: k.policy_status,
              comboId: this.viewSelected === "group" || !k[this.viewSelected] ? undefined : `tag_${k[this.viewSelected]}`
            });
          }
        });
      } else if (this.groupFilterType === "tag") {
        this.groupList.forEach((k: Record<string, string>) => {
          const loc_id = k.loc ?? "no_loc";
          const org_id = k.org ?? "no_org";
          const business_id = k.business ?? "no_business";
          if (
            this.selectedTag.indexOf(loc_id) !== -1 &&
            this.selectedTag.indexOf(org_id) !== -1 &&
            this.selectedTag.indexOf(business_id) !== -1
          ) {
            nodes.push({
              id: k.name,
              label: `${k.loc_show_name} | ${k.org_show_name} | ${k.business_show_name}`,
              sort: "0",
              group: `${k.label}`,
              count: `${k.count}`,
              loc_id,
              org_id,
              business_id,
              policy_status: k.policy_status,
              comboId: this.viewSelected === "group" || !k[this.viewSelected] ? undefined : `tag_${k[this.viewSelected]}`
            });
          }
        });
      }

      this.nodesOut = nodes;
      this.getCombosOut();
    },
    async getEdgesOut() {
      let edges: edgesModel[] = [];

      try {
        const res = await getChart1TopologyGroup();
        const affected_items = ((res || {}).data || {}).affected_items ?? [];
        affected_items
          .filter((l: Record<string, any>) => this.nodesOut.find((item: Record<string, any>) => item.id === l.group_name))
          .forEach((l: Record<string, any>) => {
            if (this.lineStatusSelected.indexOf("in_packet") !== -1) {
              const packetIpArr =
                l.in_packet && l.in_packet !== "empty" ? l.in_packet.split(",").map((i: String) => i.split(":")[0]) : [];
              // 正常流量
              packetIpArr.forEach((group: String) => {
                const item = {
                  source: group,
                  target: l.group_name,
                  edgeType: "green",
                  curveOffset: 20
                };
                if (this.nodesOut.find((item: Record<string, any>) => item.id === group)) edges.push(item);
              });
            }
            if (this.lineStatusSelected.indexOf("in_drop") !== -1) {
              // 异常流量
              const dropIpArr =
                l.in_drop && l.in_drop !== "empty" ? l.in_drop.split(",").map((i: String) => i.split(":")[0]) : [];
              dropIpArr.forEach((group: String) => {
                const item = {
                  source: group,
                  target: l.group_name,
                  edgeType: "red",
                  curveOffset: 40
                };
                if (this.nodesOut.find((item: Record<string, any>) => item.id === group)) edges.push(item);
              });
            }
          });
      } catch (error) {
        console.log(`组间流量错误: ${error}`);
      }
      this.edgesOut = edges;
    },
    initOper() {
      this.selectedGroup = this.groupList.map((g: Record<string, string>) => g.name);
      this.selectedTag = [...this.tagList1, ...this.tagList2, ...this.tagList3].map((k: Record<string, string>) => k.id);
      this.lineStatusSelected = ["in_packet", "in_drop"];
      this.lineTypeSelected = ["in_group", "out_group"];
      this.agentPolicyStatusSelected = ["build", "test", "protect"];
      this.agentStatusSelected = ["active", "no_active"];
      this.viewSelected = "group";
      this.groupFilterType = "group";
      this.selectGroupIn = undefined;
    },
    initDataIn() {
      this.agentList = [];
      this.nodesIn = [
        {
          id: `address`,
          type: "image",
          label: "地址表",
          size: 30,
          style: {
            cursor: "default",
            img: `/topology-img/address.png`
          }
        },
        {
          id: `groupListNode`,
          label: "",
          group: this.selectGroupIn ? this.selectGroupIn.show_name : "其他工作组",
          anchorPoints: [
            // 连线接入点
            [0.5, 0],
            [1, 0.5],
            [0.5, 1],
            [0, 0.5]
          ]
        },
        {
          id: `internet`,
          type: "image",
          label: "外网",
          size: 30,
          style: {
            cursor: "default",
            img: `/topology-img/internet.png`
          }
        }
      ];
      this.edgesIn = [];
    },
    async getNodesIn(groupName: string) {
      // 拓扑展开页-查询某组内负载
      let nodes: Record<string, any> = [],
        agentList: Record<string, any> = [];

      try {
        let agentStatus: Record<string, any> = [];
        const policyStatus = this.agentPolicyStatusSelected.map((k: string) => `policy_status=${k}`);
        this.agentStatusSelected.forEach((k: string) => {
          if (k === "active") {
            agentStatus.push(`status=${k}`);
          } else {
            ["disconnected", "never_connected", "pending"].forEach(status => agentStatus.push(`status=${status}`));
          }
        });
        let q = `id!=000;daemonset_id!=0;(${policyStatus.join(",")});(${agentStatus.join(",")});(group=${groupName})`;

        const agents = await getAgentList({ limit: 0, q });
        let list = ((agents || {}).data || {}).affected_items.filter(k => k.group && k.ip && k.ip !== "any");

        list.forEach((k: Record<string, any>) => {
          agentList.push({
            name: k.name,
            ip: k.ip,
            group: (k.group && k.group[0]) ?? "",
            tag_show: k.tag_name ?? "无标签"
          });

          let img = "topology-agent";
          if (k.status !== "active") {
            img = "disconnected-agent";
          } else if (k.policy_status === "build" && k.os?.name !== "POD") {
            img = "build-agent";
          } else if (k.policy_status === "test" && k.os?.name !== "POD") {
            img = "test-agent";
          } else if (k.policy_status === "protect" && k.os?.name !== "POD") {
            img = "protect-agent";
          } else if (k.policy_status === "build" && k.os?.name === "POD") {
            img = "build-pod";
          } else if (k.policy_status === "test" && k.os?.name === "POD") {
            img = "test-pod";
          } else if (k.policy_status === "protect" && k.os?.name === "POD") {
            img = "protect-pod";
          }
          nodes.push({
            id: k.ip,
            type: "image",
            label: cutForByte(k.tag_name ?? "无", 0, 8),
            size: 40,
            comboId: k.group[0],
            style: {
              img: `/topology-img/${img}.png`
            },
            status: k.status
          });
        });

        this.agentList = this.agentList.concat(agentList);
        this.nodesIn = this.nodesIn.concat(nodes);
      } catch (error) {
        console.log(`${groupName}主机节点错误: ${error}`);
      }
    },
    async getEdgesInIn() {
      // 拓扑展开页-查询某组内、两个展开组间流量
      let edges: Record<string, any>[] = [];

      let flow_type =
        this.lineStatusSelected.length === 2
          ? "all"
          : this.lineStatusSelected.join(",").replace(new RegExp(`^in_packet`), "accept").replace(new RegExp(`^in_drop`), "drop");
      let policy_state = this.agentPolicyStatusSelected.length === 3 ? "all" : this.agentPolicyStatusSelected.join(",");
      let agents_state =
        this.agentStatusSelected.length === 2
          ? "all"
          : this.agentStatusSelected.join(",").replace(new RegExp(`^no_active`), "disconnected,never_connected,pending");
      let flow_scope = this.lineTypeSelected.length === 2 ? "all" : this.lineTypeSelected.join(",").replace("_group", "");
      let group_name = this.combosIn.map((combo: Record<string, any>) => combo.id).join(",");

      try {
        let offset = 0;
        while (true) {
          let param = {
            group_type: "name",
            group_name,
            flow_type,
            flow_scope,
            policy_state,
            agents_state,
            limit: 100,
            offset
          };
          const dataRes = await getTrafficFilter(param);
          const data = ((dataRes || {}).data || {}).affected_items ?? [];
          const isFinish = (dataRes || {}).message !== "continue";
          edges = edges.concat(
            data.map((edge: Record<string, string>) => {
              if (edge.source.includes("_internet")) edge.source = "internet";
              if (edge.source.includes("_address")) edge.source = "address";
              return edge;
            })
          );
          if (isFinish) {
            break;
          }
          offset += 100;
        }
      } catch (error) {
        console.log(`${group_name}组内流量查询错误: ${error}`);
      }

      this.edgesIn = this.edgesIn.concat(edges);
    },
    async getEdgesInOut(dest_group: string) {
      // 查询折叠组与展开组间流量
      let edges: Record<string, any>[] = [];

      if (this.lineTypeSelected.indexOf("out_group") === -1 || !this.selectGroupIn) {
        this.edges = edges;
        return;
      }

      let flow_type =
        this.lineStatusSelected.length === 2
          ? "all"
          : this.lineStatusSelected.join(",").replace(new RegExp(`^in_packet`), "accept").replace(new RegExp(`^in_drop`), "drop");
      let policy_state = this.agentPolicyStatusSelected.length === 3 ? "all" : this.agentPolicyStatusSelected.join(",");
      let agents_state =
        this.agentStatusSelected.length === 2
          ? "all"
          : this.agentStatusSelected.join(",").replace(new RegExp(`^no_active`), "disconnected,never_connected,pending");

      try {
        let offset = 0;
        while (true) {
          let param = {
            src_group: this.selectGroupIn.id,
            dest_group,
            flow_type,
            policy_state,
            agents_state,
            limit: 100,
            offset
          };
          const dataRes = await getTrafficFilterDetail(param);
          const data = ((dataRes || {}).data || {}).affected_items ?? [];
          const isFinish = (dataRes || {}).message !== "continue";
          edges = edges.concat(data);
          if (isFinish) {
            break;
          }
          offset += 100;
        }
      } catch (error) {
        console.log(`折叠组与${dest_group}组流量查询错误: ${error}`);
      }

      this.edgesIn = this.edgesIn.concat(edges);
    },
    policyStatusTransform(value: string) {
      return this.policyStatusOptions.find((status: Record<string, string>) => status.id == value)?.label ?? "-";
    }
  }
});
