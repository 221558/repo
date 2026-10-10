import { reactive } from "vue";
import { getAgentList } from "@/api/modules/assets";
import { getTrafficFilter } from "@/api/modules/topology";
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
  groupList: [], // 分组列表
  agentList: [], // 负载列表
  nodes: [], // 拓扑图节点列表
  edges: [], // 拓扑图连线列表
  combos: [], // 拓扑图分组列表
  modalType: "", // 浮窗类型：agent=负载详情、traffic=流量详情、group=分组详情
  selectedDetail: {}, // 详情选中数据：负载、流量、分组
  lineStatusSelected: ["in_packet", "in_drop"], // 流量状态过滤：正常、异常
  lineTypeSelected: ["in_group", "out_group"], // 流量类型过滤：组内、组间
  agentPolicyStatusSelected: ["build", "test", "protect"], // 负载策略状态过滤：建设、测试、防护
  agentStatusSelected: ["active", "no_active"], // 负载状态过滤：在线、离线
  viewSelected: "group", // 视图选择：工作组、位置标签、组织标签、业务标签
  groupFilterType: "group", // 过滤工作组维度：按工作组、按标签
  selectedGroup: [], // 按工作组维度过滤，选中的工作组
  selectedTag: [] // 按标签维度过滤，选中的标签
});

export const topologyState = reactive<Record<string, any>>({
  ...createState(),
  ...{
    getCombos() {
      let combos: Record<string, any>[] = [],
        tagList = [];

      if (this.viewSelected === "loc") {
        tagList = this.tagList1.slice(1);
      } else if (this.viewSelected === "org") {
        tagList = this.tagList2.slice(1);
      } else if (this.viewSelected === "business") {
        tagList = this.tagList3.slice(1);
      }

      if (this.groupFilterType === "group") {
        this.groupList.forEach((k: Record<string, string>) => {
          if (this.selectedGroup.indexOf(k.name) !== -1) {
            combos.push({
              id: k.name,
              label: `${k.loc_show_name} | ${k.org_show_name} | ${k.business_show_name}`,
              group: `${k.label}`,
              count: `${k.count}`,
              loc_id: k.loc ?? "no_loc",
              org_id: k.org ?? "no_org",
              business_id: k.business ?? "no_business",
              policy_status: k.policy_status,
              parentId: this.viewSelected === "group" || !k[this.viewSelected] ? undefined : `tag_${k[this.viewSelected]}`,
              collapsed: true
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
            combos.push({
              id: k.name,
              label: `${k.loc_show_name} | ${k.org_show_name} | ${k.business_show_name}`,
              group: `${k.label}`,
              count: `${k.count}`,
              loc_id,
              org_id,
              business_id,
              policy_status: k.policy_status,
              parentId: this.viewSelected === "group" || !k[this.viewSelected] ? undefined : `tag_${k[this.viewSelected]}`,
              collapsed: true
            });
          }
        });
      }

      let tagCombos: Record<string, any>[] = [];
      if (this.viewSelected !== "group") {
        tagList.map((k: Record<string, string>) => {
          const groupArr = combos.filter((g: Record<string, any>) => g[`${this.viewSelected ?? ""}_id`] === k.id); // 该标签下的工作组列表
          const agentCount = groupArr.reduce((sum: number, g: Record<string, any>) => sum + Number(g.count || 0), 0); // 该标签下的工作负载个数
          if (groupArr.length > 0) {
            tagCombos.push({
              id: `tag_${k.id}`,
              label: `${groupArr.length}工作组 | ${agentCount}工作负载`,
              group: k.label,
              count: "",
              policy_status: "tagCombos",
              collapsed: true
            });
          }
        });
      }
      combos = combos.concat(tagCombos);

      this.combos = combos;
    },
    async getNodes() {
      let nodes: Record<string, any> = [];

      this.combos.forEach((combo: Record<string, any>) => {
        if (!combo.id.includes("tag_")) {
          nodes.push(
            {
              id: `${combo.id}_address`,
              label: "地址表",
              comboId: combo.id,
              sort: "1",
              style: {
                img: `/topology-img/group-address.png`
              }
            },
            {
              id: `${combo.id}_internet`,
              label: "外网",
              comboId: combo.id,
              sort: "1",
              style: {
                img: `/topology-img/group-internet.png`
              }
            }
          );
        }
      });

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
        const q = `id!=000;daemonset_id!=0;(${policyStatus.join(",")});(${agentStatus.join(",")})`;

        const agents = await getAgentList({ limit: 0, q });
        const list = ((agents || {}).data || {}).affected_items.filter(
          k => k.group && k.ip && k.ip !== "any" && this.combos.find((combo: Record<string, any>) => combo.id === k.group[0])
        );
        this.agentList = list.map(k => {
          const tag_show = this.tagList4.find((t: Record<string, string>) => t.id === k.tag)?.label ?? "无标签";
          return {
            name: k.name,
            ip: k.ip,
            group: (k.group && k.group[0]) ?? "",
            tag_show
          };
        });
        nodes = nodes.concat(
          list.map(k => {
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
            return {
              id: k.ip,
              label: cutForByte(this.tagList4.find((item: Record<string, string>) => item.id == k.tag)?.label ?? "无", 0, 8),
              comboId: k.group[0],
              sort: "0",
              style: {
                img: `/topology-img/${img}.png`
              }
            };
          })
        );

        this.nodes = nodes;
      } catch (error) {
        console.log(`主机节点错误: ${error}`);
      }
    },
    async getEdges() {
      let edges: edgesModel[] = [];

      try {
        let group_type = this.groupFilterType === "group" ? "name" : "tag";
        let group_name = "";
        if (this.groupFilterType === "group") {
          group_name = this.selectedGroup.join(",");
        } else {
          const locIndex = this.selectedTag.indexOf("no_loc");
          const orgIndex = this.selectedTag.indexOf("no_org");
          const businessIndex = this.selectedTag.indexOf("no_business");
          if (locIndex !== -1 && orgIndex !== -1 && businessIndex !== -1) group_name = "default";
        }

        let loc_list = this.selectedTag
          .filter(
            (id: string | number) => !isNaN(Number(id)) && this.tagList1.find((item: Record<string, any>) => item.id === id)
          )
          .join(",");
        let org_list = this.selectedTag
          .filter(
            (id: string | number) => !isNaN(Number(id)) && this.tagList2.find((item: Record<string, any>) => item.id === id)
          )
          .join(",");
        let business_list = this.selectedTag
          .filter(
            (id: string | number) => !isNaN(Number(id)) && this.tagList3.find((item: Record<string, any>) => item.id === id)
          )
          .join(",");
        if (!loc_list || !org_list || !business_list) {
          group_type = "name";
        }

        let flow_type =
          this.lineStatusSelected.length === 2
            ? "all"
            : this.lineStatusSelected
                .join(",")
                .replace(new RegExp(`^in_packet`), "accept")
                .replace(new RegExp(`^in_drop`), "drop");
        let flow_scope =
          this.lineTypeSelected.length === 2
            ? "all"
            : this.lineTypeSelected.join(",").replace(new RegExp(`^in_group`), "in").replace(new RegExp(`^out_group`), "out");
        let policy_state = this.agentPolicyStatusSelected.length === 3 ? "all" : this.agentPolicyStatusSelected.join(",");
        let agents_state =
          this.agentStatusSelected.length === 2
            ? "all"
            : this.agentStatusSelected.join(",").replace(new RegExp(`^no_active`), "disconnected,never_connected,pending");

        if ((group_type === "name" && !group_name) || (group_type === "tag" && (!loc_list || !org_list || !business_list))) {
          this.edges = edges;
          return;
        }

        let offset = 0;
        while (true) {
          let param = {
            group_type,
            group_name,
            loc_list,
            org_list,
            business_list,
            flow_type,
            flow_scope,
            policy_state,
            agents_state,
            limit: 100,
            offset
          };
          const dataRes = await getTrafficFilter(param);
          // let param = {
          //   limit: 100,
          //   offset
          // };
          // const dataRes = await getTraffic(param);
          const data = ((dataRes || {}).data || {}).affected_items ?? [];
          const isFinish = (dataRes || {}).message !== "continue";
          edges = edges.concat(data);
          if (isFinish) {
            break;
          }
          offset += 100;
        }
      } catch (error) {
        console.log(`查询流量错误: ${error}`);
      }
      this.edges = edges;
    }
  }
});
