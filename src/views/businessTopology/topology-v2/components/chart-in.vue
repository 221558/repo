<template>
  <div class="chart-in-warp">
    <div id="topology-chart-in" />
    <el-popover
      :visible="groupsListVisible"
      :popper-style="popperStyle"
      placement="bottom"
      :width="380"
      :teleported="false"
      @show="onShowGroupPopover"
    >
      <template #reference><span ref="detailRef" style="position: absolute"></span></template>
      <div>
        <p class="filter-title">工作组</p>
        <div class="filter-contain">
          <el-input v-model="filterText" placeholder="过滤工作组" class="mb10" v-debounce:input="filterData" />
          <el-tree
            ref="groupTreeRef"
            class="tree-warp"
            :data="groupTree"
            show-checkbox
            node-key="id"
            :expand-on-click-node="false"
            check-on-click-node
            :filter-node-method="filterNode"
            @check-change="checkChange"
            :props="{
              disabled: data => topologyState.combosIn.find((combo: Record<string, any>) => combo.id === data.id)
            }"
          >
            <template #default="{ node }">
              <span class="custom-tree-node">
                <span>{{ JSON.parse(node.label).show_name }}</span>
                <span>
                  <el-tag class="ml8">{{ JSON.parse(node.label).loc_show_name }}</el-tag>
                  <el-tag class="ml8" type="success">{{ JSON.parse(node.label).org_show_name }}</el-tag>
                  <el-tag class="ml8" type="warning">{{ JSON.parse(node.label).business_show_name }}</el-tag>
                </span>
              </span>
            </template>
          </el-tree>
        </div>
        <div class="popover-footer">
          <el-button type="primary" @click="toSelectGroup">确认</el-button>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts" name="chart-in">
import { ref, onMounted, computed, nextTick, onUnmounted } from "vue";
import { ElTree } from "element-plus";
import G6 from "@antv/g6";
import { ModelConfig, IGroup } from "@antv/g6";
import mittBus from "@/utils/mittBus";
import { cutForByte } from "@/utils";
import { topologyState } from "../state";
import { getAgentList } from "@/api/modules/assets";

const groupsListVisible = ref(false);
const popperStyle = ref({
  left: "0px",
  top: "0px"
});
const filterText = ref("");
const groupTreeRef = ref<InstanceType<typeof ElTree>>();
const groupTree = computed(() => {
  return topologyState.groupList.map((k: Record<string, string>) => ({
    id: k.name,
    label: `{"show_name":"${k.show_name}","loc_show_name":"${k.loc_show_name}","org_show_name":"${k.org_show_name}","business_show_name":"${k.business_show_name}"}`,
    show_name: k.show_name,
    tag_show_label: `${k.loc_show_name} | ${k.org_show_name} | ${k.business_show_name}`,
    group: k.label,
    count: k.count,
    policy_status: k.policy_status
  }));
});

let graph: any = null;
const dragId = ref(""); // 被拖拽的元素id
const detailRef = ref<HTMLElement | null>(null);
// 流量类型样式
const typeConfigs: Record<string, any> = {
  green: {
    style: {
      stroke: "#00A846"
    }
  },
  red: {
    style: {
      stroke: "#ff0000"
    }
  }
};

// 自定义图形
G6.registerCombo(
  "cRect",
  {
    drawShape: function drawShape(cfg: any, group: any) {
      const style: any = this.getShapeStyle(cfg);

      const rect = group.addShape("rect", {
        attrs: {
          ...style,
          lineWidth: 0,
          fill: "#ffffff"
        },
        draggable: true,
        name: "combo-keyShape"
      });
      group.addShape("text", {
        attrs: {
          ...style,
          text: cutForByte(cfg.group, 0, 8),
          x: 0,
          y: 0,
          // opacity: 0,
          textAlign: "center",
          fill: "#2D8CF0"
        },
        name: "text-group"
      });
      group.addShape("text", {
        attrs: {
          ...style,
          text: cfg.count,
          x: 0,
          y: 0,
          textAlign: "center",
          fill: "#464C5B"
        },
        name: "text-count"
      });
      group.addShape("text", {
        attrs: {
          ...style,
          text: "",
          x: 0,
          y: 0,
          textAlign: "center",
          fill: "#464C5B"
        },
        name: "text-margin"
      });
      return rect;
    },
    afterUpdate: function afterUpdate(cfg: any, combo: any) {
      const group = combo.get("group");
      const rect = group.find((ele: any) => ele.get("name") === "combo-keyShape");
      const style = this.getShapeStyle(cfg);

      let policy_style = {}; // 策略样式
      if (cfg.policy_status === "build") {
        policy_style = {
          lineWidth: style.height / 100,
          stroke: "#B9BDC5"
        };
      } else if (cfg.policy_status === "test") {
        policy_style = {
          lineWidth: style.height / 100,
          stroke: "#2D8CF0",
          lineDash: [style.height / 50]
        };
      } else if (cfg.policy_status === "protect") {
        policy_style = {
          lineWidth: style.height / 100,
          stroke: "#2D8CF0"
        };
      } else {
        policy_style = {
          lineWidth: 0
        };
      }

      rect.attr({
        ...style,
        ...policy_style,
        radius: style.height / 5
      });

      const textGroup = group.find((ele: any) => ele.get("name") === "text-group");
      const textCount = group.find((ele: any) => ele.get("name") === "text-count");
      const textMargin = group.find((ele: any) => ele.get("name") === "text-margin");
      textCount.attr({
        ...style,
        text: cfg.count,
        x: 0,
        y: -(style.height / 2 + 10),
        textAlign: "center",
        fontSize: 18,
        fill: "#464C5B"
      });
      textGroup.attr({
        ...style,
        text: cutForByte(cfg.group, 0, 8),
        x: 0,
        y: -(style.height / 2 + 10 + 25),
        textAlign: "center",
        fontSize: 20,
        fill: "#2D8CF0"
      });
      textMargin.attr({
        ...style,
        text: "",
        x: 0,
        y: -(style.height / 2 + 10 + 25 + 25),
        textAlign: "center",
        fontSize: 10,
        fill: "#464C5B"
      });
    }
  },
  "rect"
);
// 自定义图形-工作组节点
G6.registerNode(
  "nRect",
  {
    drawShape: function drawShape(cfg: any, group: any) {
      const rect = group.addShape("rect", {
        attrs: {
          x: -100,
          y: -25,
          width: 200,
          height: 50,
          radius: 50 / 2,
          fill: "#ffffff",
          cursor: "pointer",
          opacity: 0.8
        },
        draggable: true,
        name: "node-keyShape"
      });
      group.addShape("text", {
        attrs: {
          text: cutForByte(cfg.group, 0, 16),
          x: 0,
          y: 10,
          // opacity: 0,
          textAlign: "center",
          fontSize: 16,
          fontWeight: "bolder",
          fill: "#3F3F3F"
        },
        name: "text-node"
      });
      return rect;
    }
  },
  "rect"
);
// 自定义布局
G6.registerLayout("randomCombos", {
  // 默认参数
  getDefaultCfg() {
    return {};
  },
  // 执行布局
  execute() {
    const rowSpace = Math.max(groupWidth.value + 50, 200 + 50 + 50);
    const colSpace = Math.max(groupWidth.value / 2 + 50 + 100, 100 + 100);

    const internetNode = this.nodes.find((node: Record<string, any>) => node.id === "internet");
    internetNode.x = 0;
    internetNode.y = 0;
    const addressNode = this.nodes.find((node: Record<string, any>) => node.id === "address");
    addressNode.x = rowSpace;
    addressNode.y = 0;
    const agentsNode = this.nodes.find((node: Record<string, any>) => node.id === "groupListNode");
    agentsNode.x = rowSpace / 2;
    agentsNode.y = 0;

    const groups = this.nodes.filter(
      (node: Record<string, any>) => node.id !== "internet" && node.id !== "address" && node.id !== "groupListNode"
    );
    groups.forEach((node: Record<string, any>, index: number) => {
      if (groups.length === 1) {
        // 只展开一个组
        node.x = rowSpace / 2;
      } else if (index === 0) {
        // 展开了两个组，第一个组节点
        node.x = 0;
      } else {
        // 展开了两个组，第二个组节点
        node.x = rowSpace;
      }
      node.y = colSpace;
    });

    this.onLayoutEnd();
  },
  onLayoutEnd() {
    const groups = this.nodes.filter(
      (node: Record<string, any>) => ["address", "internet", "groupListNode"].indexOf(node.id) === -1
    );
    groups.forEach((node: Record<string, any>) => {
      const combo = graph.findById(node.id);
      const model = combo.getModel();
      if (["address", "internet", "groupListNode"].indexOf(model.id) === -1) {
        // 外围分组节点
        model.size = [groupWidth.value, groupWidth.value];
        model.fixCollapseSize = [groupWidth.value, groupWidth.value];
        model.labelCfg.style.fontSize = groupWidth.value / 10;
        model.labelCfg.refY = groupWidth.value / 10 / 5;
        graph.updateItem(combo, model, false);
      }
    });
  }
});
// 自定义连线-自环边-重置大屏页定义样式
G6.registerEdge(
  "edge-loop",
  {},
  "loop" // 自环边
);

// 查找负载聚焦动画
G6.registerNode(
  "background-animate",
  {
    afterDraw(cfg?: ModelConfig | undefined, group?: IGroup | undefined) {
      const r = Number(cfg?.size) / 2;
      const back1 = group?.addShape("circle", {
        zIndex: -3,
        attrs: {
          x: 0,
          y: 0,
          r,
          fill: "#40a9ff",
          opacity: 0.6
        },
        // must be assigned in G6 3.3 and later versions. it can be any string you want, but should be unique in a custom item type
        name: "back1-shape"
      });
      const back2 = group?.addShape("circle", {
        zIndex: -2,
        attrs: {
          x: 0,
          y: 0,
          r,
          fill: "#40a9ff",
          opacity: 0.6
        },
        // must be assigned in G6 3.3 and later versions. it can be any string you want, but should be unique in a custom item type
        name: "back2-shape"
      });
      const back3 = group?.addShape("circle", {
        zIndex: -1,
        attrs: {
          x: 0,
          y: 0,
          r,
          fill: "#40a9ff",
          opacity: 0.6
        },
        // must be assigned in G6 3.3 and later versions. it can be any string you want, but should be unique in a custom item type
        name: "back3-shape"
      });
      group?.sort(); // Sort according to the zIndex
      back1?.animate(
        {
          // Magnifying and disappearing
          r: r + 10,
          opacity: 0.1
        },
        {
          duration: 3000,
          easing: "easeCubic",
          delay: 0,
          repeat: true // repeat
        }
      ); // no delay
      back2?.animate(
        {
          // Magnifying and disappearing
          r: r + 10,
          opacity: 0.1
        },
        {
          duration: 3000,
          easing: "easeCubic",
          delay: 1000,
          repeat: true // repeat
        }
      ); // 1s delay
      back3?.animate(
        {
          // Magnifying and disappearing
          r: r + 10,
          opacity: 0.1
        },
        {
          duration: 3000,
          easing: "easeCubic",
          delay: 2000,
          repeat: true // repeat
        }
      ); // 3s delay
    }
  },
  "circle"
);

const clearAllStats = () => {
  graph.setAutoPaint(false);
  graph.getEdges().forEach((edge: any) => {
    graph.clearItemStates(edge);
  });
  graph.paint();
  graph.setAutoPaint(true);
};

const groupWidth = computed(() => {
  // 分组节点宽度
  const maxAgentCount = topologyState.combosIn.reduce((sum: number, g: Record<string, any>) => {
    const children = topologyState.nodesIn.filter((node: Record<string, any>) => node.comboId === g.id);
    return Math.max(children.length, sum);
  }, 0);
  const res = (Math.ceil(Math.sqrt(maxAgentCount)) + 1) * 60;
  return res;
});

mittBus.on("buildChartIn", () => {
  if (graph) graph.destroy();

  // 小地图
  const minimap = new G6.Minimap({
    size: [150, 100],
    hideEdge: true
  });
  // 自定义浮窗
  const tooltip = new G6.Tooltip({
    offsetX: 5,
    offsetY: -45,
    // 允许出现 tooltip 的 item 类型
    itemTypes: ["combo", "node"],
    // 自定义 tooltip 内容
    getContent: (e: any) => {
      const outDiv = document.createElement("div");
      let item = e.item.getModel();
      let content = "";
      if (item.id === "address" || item.id === "internet") {
        content = item.label;
      } else if (item.id === "groupListNode") {
        content = item.group;
      } else if (e?.item?._cfg?.type === "combo") {
        content = `工作组: ${item.group}`;
      } else {
        content = `主机IP: ${item.id}`;
      }
      outDiv.innerHTML = `<p class="tooltip-p">${content}</p>`;
      return outDiv;
    }
  });

  const container = document.getElementById("topology-chart-in") as HTMLDivElement | null;
  const width = container?.clientWidth;
  const height = container?.clientHeight;
  const data: Record<string, any> = {
    nodes: JSON.parse(JSON.stringify(topologyState.nodesIn)),
    edges: topologyState.edgesIn,
    combos: topologyState.combosIn
  };

  // 流量连线颜色
  data.edges.forEach((edge: any) => {
    if (!edge.edgeType) return;
    const config = typeConfigs[edge.edgeType];
    edge = Object.assign(edge, { ...config });
  });

  graph = new G6.Graph({
    container: "topology-chart-in",
    width,
    height,
    // animate: true, // 全局动画
    enabledStack: true,
    fitView: true, // 图是否自适应画布
    fitViewPadding: 50, // 图自适应画布时的四周留白像素值。fitView 为 true 时生效
    fitCenter: true, // 是否平移图使其中心对齐到画布中心
    minZoom: 0.00000001, // 最小缩放比例。默认 0.02
    groupByTypes: false, // 若希望在带有 combo 的图上，节点、边、combo 的层级符合常规逻辑，需要将 groupByTypes 设置为 false
    layout: {
      type: "comboCombined",
      innerLayout: new G6.Layout["grid"]({
        preventOverlap: true,
        nodeSize: () => {
          // 目前最外层必有地址表外网分组列表节点，不可能只有一个节点，暂时隐藏以下逻辑
          // const combos = graph.getCombos();

          // if (combos.length === 1) {
          //   // 最外层只有一个节点，不触发outerLayout布局，需要手动更新节点size
          //   combos.forEach((group: Record<string, any>) => {
          //     const model = group.getModel();
          //     if (model.labelCfg.style.fontSize !== groupWidth.value / 10) {
          //       model.size = [groupWidth.value, groupWidth.value];
          //       model.fixCollapseSize = [groupWidth.value, groupWidth.value];
          //       model.labelCfg.style.fontSize = groupWidth.value / 10;
          //       model.labelCfg.refY = groupWidth.value / 10 / 5;
          //       graph.updateItem(group, model, false);
          //     }
          //   });
          // }

          return 60;
        }
      }),
      outerLayout: new G6.Layout["randomCombos"]()
    },
    defaultCombo: {
      type: "cRect",
      anchorPoints: [
        // 连线接入点
        [0.5, 0],
        [1, 0.5],
        [0.5, 1],
        [0, 0.5]
      ],
      labelCfg: {
        // refY: 30,
        position: "bottom",
        style: {
          fill: "#657180"
        }
      },
      style: {
        cursor: "pointer",
        opacity: 0.8
      }
    },
    defaultNode: {
      type: "nRect",
      size: [200, 100],
      style: {
        cursor: "pointer"
      },
      labelCfg: {
        // refY: 30,
        position: "bottom",
        style: {
          fill: "#657180"
        }
      }
    },
    defaultEdge: {
      type: "quadratic", // 弧线
      style: {
        stroke: "#B9BDC5",
        endArrow: true,
        lineAppendWidth: (groupWidth.value / 200) * 1.5, // 边响应鼠标事件时的检测宽度
        cursor: "pointer",
        lineWidth: groupWidth.value / 200
      }
    },
    comboStateStyles: {
      dragging: {
        fill: "#a8ecd0"
      }
    },
    nodeStateStyles: {
      dragging: {
        fill: "#a8ecd0"
      }
    },
    edgeStateStyles: {
      inactive: {
        stroke: "#B9BDC5"
      }
    },
    modes: {
      default: [
        { type: "drag-combo", onlyChangeComboSize: true },
        { type: "drag-node", onlyChangeComboSize: true },
        "drag-canvas",
        "zoom-canvas"
      ]
    },
    plugins: [minimap, tooltip]
  });

  // 点击节点
  graph.on("node:click", async (e: any) => {
    const item = e.item.getModel();
    groupsListVisible.value = false;
    if (item.id === "address" || item.id === "internet") {
      // 点击了地址表或外网
      return;
    } else if (item.id === "groupListNode") {
      // 点击分组列表节点
      const point = graph.getCanvasByPoint(item.x, item.y); // 坐标转换，获取分组中心坐标
      const zoom = graph.getZoom();
      popperStyle.value = {
        left: point.x - 190 + "px",
        top: point.y + 30 * zoom + "px"
      };
      if (detailRef.value) {
        detailRef.value.style.left = point.x + "px";
        detailRef.value.style.top = point.y + 25 * zoom + "px";
      }
      groupsListVisible.value = true;
    } else {
      // 点击负载 节点
      const rawAgents = await getAgentList({ q: `ip=${item.id}` });
      const selectedAgent = ((rawAgents || {}).data || {} || {}).affected_items[0];
      topologyState.selectedDetail = selectedAgent;
      topologyState.modalType = "agent";

      item.type = "background-animate";
      graph.updateItem(e.item, item, false);
      let timer = setTimeout(() => {
        clearTimeout(timer);
        item.type = "image";
        graph.updateItem(e.item, item, false);
      }, 3000);
    }
  });
  // 点击分组
  graph.on("combo:click", (e: any) => {
    toCloseDetail();
    const item = e.item.getModel();
    const selectedGroup = topologyState.groupList.find((k: Record<string, string>) => k.name === item.id);
    if (selectedGroup) {
      topologyState.selectedDetail = selectedGroup;
      topologyState.modalType = "group";
    }
  });
  // 点击流量
  graph.on("edge:click", async (e: any) => {
    const item = e.item.getModel();
    if (item.source === "groupListNode" || item.target === "groupListNode") {
      // 点击了折叠组和展开组间流量
      return;
    }
    topologyState.selectedDetail = item;
    if (item.source === "address" || item.source === "internet") {
      // 点击了地址表或外网的流量
      topologyState.modalType = "otherTraffic";
    } else {
      topologyState.selectedDetail.noGroupTag =
        topologyState.combosIn.filter((combo: Record<string, any>) => combo.label === `无标签 | 无标签 | 无标签`).length > 0;
      topologyState.modalType = "traffic";
    }
  });
  // 当拖拽画布、点击画布、缩放画布、拖拽节点、拖拽分组、点击分组时，关闭详情浮窗
  graph.on("canvas:dragstart", toCloseDetail);
  graph.on("canvas:click", toCloseDetail);
  graph.on("node:dragstart", toCloseDetail);
  graph.on("combo:dragstart", toCloseDetail);

  // 滚轮修改视图缩放，防抖修改连线宽度
  let wheelzoomTimer: NodeJS.Timeout | null = null;
  graph.on("wheelzoom", () => {
    toCloseDetail();
    if (wheelzoomTimer) {
      clearTimeout(wheelzoomTimer);
    }
    wheelzoomTimer = setTimeout(() => {
      const zoom = graph.getZoom();
      chageEdgeWidth(zoom);
    }, 500);
  });
  // 拖拽节点开始
  graph.on("node:dragstart", (e: any) => {
    const item = e.item.getModel();
    if (item.id === "groupListNode") dragId.value = item.id;
  });
  // 拖拽节点结束
  graph.on("node:dragend", () => {
    dragId.value = "";
  });
  // 拖拽进入分组
  graph.on("combo:dragenter", (e: any) => {
    if (dragId.value === "groupListNode") graph.setItemState(e.item, "dragging", true);
  });
  // 拖拽移出分组
  graph.on("combo:dragleave", (e: any) => {
    if (dragId.value === "groupListNode") graph.setItemState(e.item, "dragging", false);
  });
  // 拖拽分组开始
  graph.on("combo:dragstart", (e: any) => {
    const item = e.item.getModel();
    dragId.value = item.id;
  });
  // 拖拽分组结束
  graph.on("combo:dragend", () => {
    dragId.value = "";
  });
  // 拖拽进入节点
  graph.on("node:dragenter", (e: any) => {
    const item = e.item.getModel();
    if (dragId.value === "groupListNode" && item.comboId) {
      // 拖拽分组列表节点进入组内负载
      const findCombo = graph.findById(item.comboId);
      graph.setItemState(findCombo, "dragging", true);
    } else if (
      topologyState.combosIn.find((combo: Record<string, any>) => combo.id === dragId.value) &&
      item.id === "groupListNode"
    ) {
      // 拖拽分组进入分组列表节点
      graph.setItemState(e.item, "dragging", true);
    }
  });
  // 拖拽移出节点
  graph.on("node:dragleave", (e: any) => {
    graph.setItemState(e.item, "dragging", false);
  });

  // 拖拽进入分组
  graph.on("combo:drop", (e: any) => {
    graph.setItemState(e.item, "dragging", false);
    if (dragId.value === "groupListNode" && topologyState.selectGroupIn) {
      // 分组列表节点选中分组后，拖拽分组列表节点进入展开组
      dropIntoCombo(e.item);
    }
  });

  // 拖拽进入节点
  graph.on("node:drop", (e: any) => {
    const item = e.item.getModel();
    if (item.id === "groupListNode" && dragId.value) {
      // 拖拽展开分组进入分组列表节点
      if (topologyState.combosIn.length === 1) {
        // 关闭所有分组，离开展开拓扑页
        topologyState.initOper();
        topologyState.combosIn = [];
        topologyState.initDataIn();
        Promise.all([topologyState.getNodesOut(), topologyState.getEdgesOut()])
          .then(() => {
            topologyState.chartType = "out";
            nextTick(() => {
              mittBus.emit("buildChartOut");
            });
          })
          .catch(error => {
            console.log(error);
          });
      } else {
        if (!topologyState.selectGroupIn)
          topologyState.selectGroupIn = groupTree.value.find((k: Record<string, string>) => k.id === dragId.value);
        topologyState.combosIn = topologyState.combosIn.filter((combo: Record<string, any>) => combo.id !== dragId.value);
        topologyState.initDataIn();
        const getNodes = topologyState.combosIn.map((combo: Record<string, any>) => topologyState.getNodesIn(combo.id));
        const getEdgesOut = topologyState.combosIn.map((combo: Record<string, any>) => topologyState.getEdgesInOut(combo.id));
        Promise.all([...getNodes, topologyState.getEdgesInIn(), ...getEdgesOut])
          .then(() => {
            mittBus.emit("buildChartIn");
          })
          .catch(error => {
            console.log(error);
          });
      }
    } else if (item.comboId && dragId.value === "groupListNode" && topologyState.selectGroupIn) {
      // 分组列表节点选中分组后，拖拽进入展开组内节点
      const findCombo = graph.findById(item.comboId);
      graph.setItemState(findCombo, "dragging", false);
      dropIntoCombo(findCombo);
    }
  });

  // 鼠标移入负载
  graph.on("node:mouseenter", (e: any) => {
    clearAllStats();
    const item = e.item;
    const model = item.getModel();
    if (model.id === "address" || model.id === "groupListNode" || model.id === "internet") return;

    model.style.img = model.style.img.replace(".png", "-active.png");
    graph.updateItem(item, model, false);

    graph.getEdges().forEach((edge: any) => {
      if (edge.getSource() === item || edge.getTarget() === item) {
        const edgeModel = edge.getModel();
        edgeModel.style.lineWidth = edgeModel.style.lineWidth * 2;
        graph.updateItem(edge, edgeModel, false);
      } else {
        graph.setItemState(edge, "inactive", true);
      }
    });
  });
  // 鼠标移出负载
  graph.on("node:mouseleave", (e: any) => {
    clearAllStats();
    const item = e.item;
    const model = item.getModel();
    if (model.id === "address" || model.id === "groupListNode" || model.id === "internet") return;

    model.style.img = model.style.img.replace("-active.png", ".png");
    graph.updateItem(item, model, false);

    graph.getEdges().forEach((edge: any) => {
      if (edge.getSource() === item || edge.getTarget() === item) {
        const edgeModel = edge.getModel();
        edgeModel.style.lineWidth = edgeModel.style.lineWidth / 2;
        graph.updateItem(edge, edgeModel, false);
      }
    });
  });
  // 鼠标移入流量
  graph.on("edge:mouseenter", (e: any) => {
    clearAllStats();
    const item = e.item;
    const model = item.getModel();
    model.style.lineWidth = model.style.lineWidth * 2;
    graph.updateItem(item, model, false);
    graph.getEdges().forEach((edge: any) => {
      if (edge !== item) graph.setItemState(edge, "inactive", true);
    });
  });
  // 鼠标移出流量
  graph.on("edge:mouseleave", (e: any) => {
    clearAllStats();
    const item = e.item;
    const model = item.getModel();
    model.style.lineWidth = model.style.lineWidth / 2;
    graph.updateItem(item, model, false);
  });

  graph.read(data);
});

mittBus.on("moveAgent", (selected: any) => {
  const findNode = graph.findById(selected.ip);

  let timer1 = setTimeout(() => {
    clearTimeout(timer1);
    graph.focusItem(findNode, true);
  }, 0);

  const model = findNode.getModel();
  model.type = "background-animate";
  graph.updateItem(findNode, model, false);
  let timer = setTimeout(() => {
    clearTimeout(timer);
    model.type = "image";
    graph.updateItem(findNode, model, false);
  }, 3000);
});

const toCloseDetail = () => {
  groupsListVisible.value = false;
};

const dropIntoCombo = (item: any) => {
  const addCombo = {
    id: topologyState.selectGroupIn.id,
    label: topologyState.selectGroupIn.tag_show_label,
    group: topologyState.selectGroupIn.group,
    count: topologyState.selectGroupIn.count,
    policy_status: topologyState.selectGroupIn.policy_status
  };
  if (topologyState.combosIn.length === 1) {
    // 当前只展开了一个组
    topologyState.combosIn.push(addCombo);
  } else {
    // 当前已展开了两个组
    const model = item.getModel();
    topologyState.combosIn = topologyState.combosIn.map((combo: Record<string, any>) =>
      combo.id === model.id ? addCombo : combo
    );
  }
  topologyState.selectGroupIn = undefined;
  topologyState.initDataIn();
  const getNodes = topologyState.combosIn.map((combo: Record<string, any>) => topologyState.getNodesIn(combo.id));
  const getEdgesOut = topologyState.combosIn.map((combo: Record<string, any>) => topologyState.getEdgesInOut(combo.id));
  Promise.all([...getNodes, topologyState.getEdgesInIn(), ...getEdgesOut])
    .then(() => {
      mittBus.emit("buildChartIn");
    })
    .catch(error => {
      console.log(error);
    });
};

const chageEdgeWidth = (zoom: number) => {
  const edges = graph.getEdges();
  edges.forEach((edge: Record<string, any>) => {
    const model = edge.getModel();
    let lineWidth = 1;
    if (1.5 <= zoom) {
      lineWidth = 1;
    } else if (0.3 <= zoom && zoom < 1.5) {
      lineWidth = 2;
    } else if (0.2 <= zoom && zoom < 0.3) {
      lineWidth = 4;
    } else if (0.15 <= zoom && zoom < 0.2) {
      lineWidth = 8;
    } else {
      lineWidth = 16;
    }
    if (model.style.lineWidth !== lineWidth) {
      model.style.lineWidth = lineWidth;
      model.style.lineAppendWidth = lineWidth * 1.5;
      graph.updateItem(edge, model, false);
    }
  });
};

const onShowGroupPopover = () => {
  filterText.value = "";
  filterData();
  groupTreeRef.value!.setCheckedKeys(topologyState.selectGroupIn ? [topologyState.selectGroupIn.id] : []);
};

const filterData = () => {
  groupTreeRef.value && groupTreeRef.value.filter(filterText.value);
};

const filterNode = (value: string, data: Record<string, any>) => {
  if (!value) return true;

  try {
    const labels = Object.values(JSON.parse(data.label));
    const filterArr = labels.filter((label: any) => label.includes(value));
    return filterArr.length > 0;
  } catch (error) {
    return data.label.includes(value);
  }
};

const checkChange = (data: Record<string, any>, isChecked: boolean) => {
  if (isChecked) {
    groupTreeRef.value!.setCheckedKeys([data.id]);
  }
};

const toSelectGroup = async () => {
  topologyState.selectGroupIn = groupTreeRef.value!.getCheckedNodes()[0];
  toCloseDetail();
  topologyState.initDataIn();
  const getNodes = topologyState.combosIn.map((combo: Record<string, any>) => topologyState.getNodesIn(combo.id));
  const getEdgesOut = topologyState.combosIn.map((combo: Record<string, any>) => topologyState.getEdgesInOut(combo.id));
  Promise.all([...getNodes, topologyState.getEdgesInIn(), ...getEdgesOut])
    .then(() => {
      mittBus.emit("buildChartIn");
    })
    .catch(error => {
      console.log(error);
    });
};

const chageSize = () => {
  if (!graph || graph.get("destroyed")) return;
  const container = document.getElementById("topology-chart-in") as HTMLDivElement | null;
  if (!container || !container.clientWidth || !container.clientHeight) return;
  graph.setAutoPaint(false);
  graph.changeSize(container.clientWidth, container.clientHeight);
  graph.paint();
  graph.setAutoPaint(true);
};

onMounted(() => {
  chageSize();
  window.addEventListener("resize", chageSize);
});

onUnmounted(() => {
  window.removeEventListener("resize", chageSize);
  mittBus.off("buildChartIn");
  mittBus.off("moveAgent");
});
</script>
<style scoped lang="scss">
.chart-in-warp {
  position: relative;
  width: 100%;
  height: 100%;
  #topology-chart-in {
    width: 100%;
    height: 100%;
  }
  .filter-contain {
    min-height: 192px;
  }
}
</style>
