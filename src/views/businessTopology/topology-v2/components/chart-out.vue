<template>
  <div id="topology-chart-out" />
</template>

<script setup lang="ts" name="chart-out">
import { onMounted, computed, nextTick, onUnmounted } from "vue";
import G6 from "@antv/g6";
import mittBus from "@/utils/mittBus";
import { cutForByte } from "@/utils";
import { topologyState } from "../state";

let graph: any = null;
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
          ...style
        },
        draggable: true,
        name: "combo-keyShape"
      });
      group.addShape("text", {
        attrs: {
          ...style,
          text: cutForByte(cfg.group, 0, 8),
          x: 0,
          y: -(style.height / 7 / 2),
          // opacity: 0,
          textAlign: "center",
          fontSize: style.height / 7,
          fill: "#2D8CF0"
        },
        name: "text-group"
      });
      group.addShape("text", {
        attrs: {
          ...style,
          text: "",
          x: 0,
          y: 0,
          textAlign: "center",
          fontSize: style.height / 100,
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

      rect.attr({
        ...style,
        radius: style.height / 5,
        lineWidth: style.height / 100,
        stroke: "#61DDAA",
        fill: "#F2FDF9"
      });

      const textGroup = group.find((ele: any) => ele.get("name") === "text-group");
      const textMargin = group.find((ele: any) => ele.get("name") === "text-margin");
      if (!cfg.collapsed) {
        textGroup.attr({
          ...style,
          text: cutForByte(cfg.group, 0, 8),
          x: 0,
          y: cfg.count ? -(style.height / 2 + (style.height / 7 / 4) * 7) : -(style.height / 2 + (style.height / 8 / 8) * 5),
          textAlign: "center",
          fontSize: style.height / 7,
          fill: "#2D8CF0"
        });
        textMargin.attr({
          ...style,
          text: "",
          x: 0,
          y: cfg.count ? -(style.height / 2 + (style.height / 7 / 4) * 12) : -(style.height / 2 + (style.height / 8 / 8) * 15),
          textAlign: "center",
          fontSize: style.height / 100,
          fill: "#464C5B"
        });
      } else {
        textGroup.attr({
          ...style,
          text: cutForByte(cfg.group, 0, 8),
          x: 0,
          y: -(style.height / 7 / 2),
          textAlign: "center",
          fontSize: style.height / 7,
          fill: "#2D8CF0"
        });
      }
    }
  },
  "rect"
);
// 自定义图形
G6.registerNode(
  "nRect",
  {
    drawShape: function drawShape(cfg: any, group: any) {
      let policy_style = {}; // 策略样式
      if (cfg.policy_status === "build") {
        policy_style = {
          lineWidth: 2,
          stroke: "#B9BDC5"
        };
      } else if (cfg.policy_status === "test") {
        policy_style = {
          lineWidth: 2,
          stroke: "#2D8CF0",
          lineDash: [4]
        };
      } else if (cfg.policy_status === "protect") {
        policy_style = {
          lineWidth: 2,
          stroke: "#2D8CF0"
        };
      } else {
        policy_style = {
          lineWidth: 0
        };
      }

      const rect = group.addShape("rect", {
        attrs: {
          x: -100,
          y: -50,
          width: 200,
          height: 100,
          radius: 100 / 2,
          fill: "#ffffff",
          cursor: "pointer",
          opacity: 0.8,
          ...policy_style
        },
        draggable: true,
        name: "combo-keyShape"
      });
      group.addShape("text", {
        attrs: {
          text: cutForByte(cfg.group, 0, 8),
          x: 0,
          y: 0,
          // opacity: 0,
          textAlign: "center",
          fontSize: 18,
          fill: "#2D8CF0"
        },
        name: "text-group"
      });
      group.addShape("text", {
        attrs: {
          text: cfg.count,
          x: 0,
          y: 20,
          textAlign: "center",
          fontSize: 16,
          fill: "#464C5B"
        },
        name: "text-count"
      });
      return rect;
    }
  },
  "rect"
);

const groupWidth = computed(() => {
  if (topologyState.viewSelected === "group") {
    // 分组视图，分组节点宽度
    return 200;
  } else {
    // 标签节点宽度
    const maxAgentCount = topologyState.combosOut.reduce((sum: number, g: Record<string, any>) => {
      const children = topologyState.nodesOut.filter((node: Record<string, any>) => node.comboId === g.id);
      return Math.max(children.length, sum);
    }, 0);
    const res = Math.ceil(Math.sqrt(maxAgentCount)) * 250;
    return res;
  }
});

mittBus.on("buildChartOut", () => {
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
    itemTypes: ["node"],
    // 自定义 tooltip 内容
    getContent: (e: any) => {
      const outDiv = document.createElement("div");
      let item = e.item.getModel();
      let content = "";
      if (item.id === "address" || item.id === "internet") {
        content = item.label;
      } else {
        content = `工作组: ${item.group}`;
      }
      outDiv.innerHTML = `<p class="tooltip-p">${content}</p>`;
      return outDiv;
    }
  });

  const container = document.getElementById("topology-chart-out") as HTMLDivElement | null;
  const width = container?.clientWidth;
  const height = container?.clientHeight;
  const data: Record<string, any> = {
    nodes: JSON.parse(JSON.stringify(topologyState.nodesOut)),
    edges: topologyState.edgesOut,
    combos: topologyState.combosOut
  };

  // 流量连线颜色
  data.edges.forEach((edge: any) => {
    if (!edge.edgeType) return;
    const config = typeConfigs[edge.edgeType];
    edge = Object.assign(edge, { ...config });
  });

  graph = new G6.Graph({
    container: "topology-chart-out",
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
          // 目前最外层必有 default 分组，不可能只有一个节点，暂时隐藏以下逻辑
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

          return [250, 150];
        },
        sortBy: "sort"
      }),
      outerLayout: new G6.Layout["grid"]({
        preventOverlap: true,
        nodeSize: (d: Record<string, any>) => {
          const combo = graph.findById(d.id);
          const model = combo.getModel();
          if (topologyState.viewSelected !== "group" && model.id.includes("tag_")) {
            // 当前标签视图，外围标签节点
            model.size = [groupWidth.value, groupWidth.value];
            model.fixCollapseSize = [groupWidth.value, groupWidth.value];
            model.labelCfg.style.fontSize = groupWidth.value / 10;
            model.labelCfg.refY = groupWidth.value / 10 / 5;
            graph.updateItem(combo, model, false);
            return [groupWidth.value, groupWidth.value];
          }
        },
        sortBy: "sort"
      })
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
        opacity: 0.8
      }
    },
    defaultNode: {
      type: "nRect",
      size: [200, 100],
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
        lineAppendWidth: (groupWidth.value / 100) * 1.5, // 边响应鼠标事件时的检测宽度
        // cursor: "pointer",
        lineWidth: groupWidth.value / 100
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
        "zoom-canvas",
        { type: "collapse-expand-combo", relayout: false }
      ]
    },
    plugins: [minimap, tooltip]
  });

  // 单击分组（500ms间隔内只点击一次时展示分组详情浮窗。点击多次为展开折叠分组，不执行单击逻辑）
  let comboClickValid = "none";
  graph.on("node:click", (e: any) => {
    const item = e.item.getModel();
    if (item.id.includes("address") || item.id.includes("internet")) return; // 点击了地址表或外网

    if (comboClickValid !== "none") {
      //500ms内点击过为双击
      comboClickValid = "secound";
      return false;
    }
    // 第一次点击
    comboClickValid = "first";
    let timer = setTimeout(() => {
      clearTimeout(timer);
      if (comboClickValid === "first") {
        // 单击分组详情
        const selectedGroup = topologyState.groupList.find((k: Record<string, string>) => k.name === item.id);
        if (selectedGroup) {
          topologyState.selectedDetail = selectedGroup;
          topologyState.modalType = "group";
        }
      } else {
        // 双击进入展开拓扑页
        topologyState.initOper();
        topologyState.combosIn = [
          {
            id: item.id,
            label: item.label,
            group: item.group,
            count: item.count,
            policy_status: item.policy_status
          }
        ];
        topologyState.initDataIn();
        Promise.all([topologyState.getNodesIn(item.id), topologyState.getEdgesInIn()])
          .then(() => {
            topologyState.chartType = "in";
            nextTick(() => {
              mittBus.emit("buildChartIn");
            });
          })
          .catch(error => {
            console.log(error);
          });
      }
      comboClickValid = "none";
    }, 500);
  });

  // 滚轮修改视图缩放，防抖修改连线宽度
  let wheelzoomTimer: NodeJS.Timeout | null = null;
  graph.on("wheelzoom", () => {
    if (wheelzoomTimer) {
      clearTimeout(wheelzoomTimer);
    }
    wheelzoomTimer = setTimeout(() => {
      const zoom = graph.getZoom();
      chageEdgeWidth(zoom);
    }, 500);
  });

  graph.read(data);
});

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

const chageSize = () => {
  if (!graph || graph.get("destroyed")) return;
  const container = document.getElementById("topology-chart-out") as HTMLDivElement | null;
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
  mittBus.off("buildChartOut");
});
</script>
<style scoped lang="scss">
#topology-chart-out {
  width: 100%;
  height: 100%;
}
</style>
