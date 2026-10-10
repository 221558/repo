<template>
  <div id="topology-chart" />
</template>

<script setup lang="ts" name="chart">
import { onMounted, computed, onUnmounted } from "vue";
import G6 from "@antv/g6";
import { ModelConfig, IGroup } from "@antv/g6";
import mittBus from "@/utils/mittBus";
import { cutForByte } from "@/utils";
import { getAgentList } from "@/api/modules/assets";
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
      group.addShape("marker", {
        attrs: {
          ...style,
          x: 0,
          y: style.height / 2 - 5,
          r: 5,
          symbol: "triangle-down",
          lineWidth: 0
        },
        name: "combo-marker"
      });
      group.addShape("text", {
        attrs: {
          ...style,
          text: cfg.count,
          x: 0,
          y: (style.height / 8 / 16) * 25,
          textAlign: "center",
          fontSize: style.height / 8,
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
      } else if (cfg.policy_status === "tagCombos") {
        policy_style = {
          lineWidth: style.height / 100,
          stroke: "#61DDAA",
          fill: "#F2FDF9"
        };
      } else {
        policy_style = {
          lineWidth: 0
        };
      }

      rect.attr({
        ...style,
        radius: style.height / 5,
        ...policy_style
      });

      const textGroup = group.find((ele: any) => ele.get("name") === "text-group");
      const textCount = group.find((ele: any) => ele.get("name") === "text-count");
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
        textCount.attr({
          ...style,
          text: cfg.count,
          x: 0,
          y: -(style.height / 2 + (style.height / 8 / 8) * 5),
          textAlign: "center",
          fontSize: style.height / 8,
          fill: "#464C5B"
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
        textCount.attr({
          ...style,
          text: cfg.count,
          x: 0,
          y: (style.height / 8 / 16) * 25,
          textAlign: "center",
          fontSize: style.height / 8,
          fill: "#464C5B"
        });
      }
    }
  },
  "rect"
);

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
  graph.getCombos().forEach((combo: any) => {
    graph.clearItemStates(combo);
  });
  graph.paint();
  graph.setAutoPaint(true);
};

const groupWidth = computed(() => {
  // 分组节点宽度
  const maxAgentCount = topologyState.combos.reduce((sum: number, g: Record<string, any>) => {
    if (g.id.includes("tag_")) {
      return sum;
    } else {
      const children = topologyState.nodes.filter((node: Record<string, any>) => node.comboId === g.id);
      return Math.max(children.length, sum);
    }
  }, 0);
  const res = (Math.ceil(Math.sqrt(maxAgentCount)) + 3) * 60;
  return res;
});

const TagWidth = computed(() => {
  // 标签节点宽度
  const maxGroupCount = topologyState.combos.reduce((sum: number, g: Record<string, any>) => {
    const legnth = g.id.includes("tag_") ? g.children?.length ?? 0 : 0;
    return Math.max(legnth, sum);
  }, 0);
  const res = (Math.ceil(Math.sqrt(maxGroupCount)) + 0.5) * (groupWidth.value * 1.1);
  return res;
});

mittBus.on("buildChart", () => {
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
      if (item.id.includes("address") || item.id.includes("internet")) {
        content = item.label;
      } else if (e?.item?._cfg?.type === "combo") {
        content = `工作组: ${item.group}`;
      } else {
        content = `主机IP: ${item.id}`;
      }
      outDiv.innerHTML = `<p class="tooltip-p">${content}</p>`;
      return outDiv;
    }
  });

  const container = document.getElementById("topology-chart") as HTMLDivElement | null;
  const width = container?.clientWidth;
  const height = container?.clientHeight;
  const data: Record<string, any> = {
    nodes: JSON.parse(JSON.stringify(topologyState.nodes)),
    edges: topologyState.edges,
    combos: topologyState.combos
  };

  // 流量连线颜色
  data.edges.forEach((edge: any) => {
    if (!edge.edgeType) return;
    const config = typeConfigs[edge.edgeType];
    edge = Object.assign(edge, { ...config });
  });

  graph = new G6.Graph({
    container: "topology-chart",
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
        nodeSize: (d: Record<string, any>) => {
          const combos = graph.getCombos();

          const tagCombos = combos.filter((g: Record<string, any>) => {
            const combo = g.getModel();
            return combo.id.includes("tag_");
          });
          if (combos.length === 1 || tagCombos.length === 1) {
            // 最外层只有一个节点，不触发outerLayout布局，需要手动更新节点size
            const groups = combos.filter((g: Record<string, any>) => {
              const combo = g.getModel();
              return !combo.id.includes("tag_");
            });
            groups.forEach((group: Record<string, any>) => {
              const model = group.getModel();
              if (model.labelCfg.style.fontSize !== groupWidth.value / 10) {
                model.size = [groupWidth.value, groupWidth.value];
                model.fixCollapseSize = [groupWidth.value, groupWidth.value];
                model.labelCfg.style.fontSize = groupWidth.value / 10;
                model.labelCfg.refY = groupWidth.value / 10 / 5;
                graph.updateItem(group, model, false);
              }
            });

            if (tagCombos.length === 1) {
              // 最外层只有一个标签节点
              const model = tagCombos[0].getModel();
              if (model.labelCfg.style.fontSize !== TagWidth.value / 10) {
                model.size = [TagWidth.value, TagWidth.value];
                model.fixCollapseSize = [TagWidth.value, TagWidth.value];
                model.labelCfg.style.fontSize = TagWidth.value / 10;
                model.labelCfg.refY = TagWidth.value / 10 / 5;
                graph.updateItem(tagCombos[0], model, false);
              }
            }
          }

          const combo = graph.findById(d.id);
          const model = combo.getModel();
          if (!model.children) {
            // 工作组视图，设置负载nodeSize
            return 60;
          } else {
            // 标签视图，设置工作组nodeSize
            return groupWidth.value * 1.1;
          }
        },
        sortBy: "sort"
      }),
      outerLayout: new G6.Layout["grid"]({
        preventOverlap: true,
        nodeSize: (d: Record<string, any>) => {
          const combo = graph.findById(d.id);
          const model = combo.getModel();
          if (topologyState.viewSelected === "group") {
            // 当前工作组视图，外围分组节点
            model.size = [groupWidth.value, groupWidth.value];
            model.fixCollapseSize = [groupWidth.value, groupWidth.value];
            model.labelCfg.style.fontSize = groupWidth.value / 10;
            model.labelCfg.refY = groupWidth.value / 10 / 5;
            graph.updateItem(combo, model, false);
            return [groupWidth.value, groupWidth.value];
          } else {
            // 当前标签视图，外围标签节点
            model.size = [TagWidth.value, TagWidth.value];
            model.fixCollapseSize = [TagWidth.value, TagWidth.value];
            model.labelCfg.style.fontSize = TagWidth.value / 10;
            model.labelCfg.refY = TagWidth.value / 10 / 5;
            graph.updateItem(combo, model, false);

            if (model.id.includes("tag_") && model.children) {
              model.children.forEach((children: Record<string, any>) => {
                const group = graph.findById(children.id);
                const model = group.getModel();
                model.nodeSize = [groupWidth.value, groupWidth.value];
                model.size = [groupWidth.value, groupWidth.value];
                model.fixCollapseSize = [groupWidth.value, groupWidth.value];
                model.labelCfg.style.fontSize = groupWidth.value / 10;
                model.labelCfg.refY = groupWidth.value / 10 / 5;
                graph.updateItem(group, model, false);
              });
            }

            return [TagWidth.value, TagWidth.value];
          }
        }
      })
    },
    defaultNode: {
      type: "image",
      size: 30,
      style: {
        cursor: "pointer"
      },
      labelCfg: {
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
        cursor: "pointer",
        lineWidth: groupWidth.value / 100
      }
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

  // 鼠标移入交互颜色
  graph.on("node:mouseenter", (e: any) => {
    const item = e.item;
    clearAllStats();
    graph.getEdges().forEach((edge: any) => {
      if (edge.getSource() !== item && edge.getTarget() !== item) {
        graph.setItemState(edge, "inactive", true);
      }
    });
  });
  graph.on("edge:mouseenter", (e: any) => {
    const item = e.item;
    clearAllStats();
    graph.getEdges().forEach((edge: any) => {
      if (edge !== item) graph.setItemState(edge, "inactive", true);
    });
  });
  graph.on("node:mouseleave", () => clearAllStats());
  graph.on("edge:mouseleave", () => clearAllStats());

  // 点击负载
  graph.on("node:click", async (e: any) => {
    const item = e.item.getModel();
    if (item.id.includes("address") || item.id.includes("internet")) return; // 点击了地址表或外网
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
  });

  // 点击流量
  graph.on("edge:click", async (e: any) => {
    const item = e.item.getModel();
    if (item.isComboEdge) return; // 分组未展开点击流量
    topologyState.selectedDetail = item;
    if (item.source.includes("address") || item.source.includes("internet")) {
      // 点击了地址表或外网的流量
      topologyState.modalType = "otherTraffic";
    } else {
      topologyState.modalType = "traffic";
    }
  });

  // 单击分组（500ms间隔内只点击一次时展示分组详情浮窗。点击多次为展开折叠分组，不执行单击逻辑）
  let comboClickValid = "none";
  graph.on("combo:click", (e: any) => {
    if (comboClickValid !== "none") {
      //500ms内点击过为双击
      comboClickValid = "secound";
      return false;
    }
    // 第一次点击
    comboClickValid = "first";
    let timer = setTimeout(() => {
      clearTimeout(timer);
      const item = e.item.getModel();
      if (comboClickValid === "first") {
        // 单击分组详情
        const selectedGroup = topologyState.groupList.find((k: Record<string, string>) => k.name === item.id);
        if (selectedGroup) {
          topologyState.selectedDetail = selectedGroup;
          topologyState.modalType = "group";
        }
      } else {
        if (!item.collapsed && !item.id.includes("tag_")) {
          const zoom = graph.getZoom();
          if (zoom !== 1) {
            graph.zoomTo(1);
            chageEdgeWidth(1);
          }
          graph.focusItem(e.item);
        } else if (!item.id.includes("tag_") || item.collapsed) {
          graph.fitView();
        }
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

mittBus.on("moveAgent", (selected: any) => {
  const findCombo = graph.findById(selected.group);
  let findTagCombo,
    parentId = findCombo.get("model").parentId;
  if (parentId) {
    findTagCombo = graph.findById(parentId);
  }

  const zoom = graph.getZoom();
  if (zoom !== 3) {
    graph.zoomTo(3);
    chageEdgeWidth(3);
  }

  if (findTagCombo) graph.expandCombo(findTagCombo);
  if (findCombo) {
    graph.expandCombo(findCombo);
    graph.layout();
  }

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
  const container = document.getElementById("topology-chart") as HTMLDivElement | null;
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
  mittBus.off("buildChart");
  mittBus.off("moveAgent");
});
</script>
<style scoped lang="scss">
#topology-chart {
  width: 100%;
  height: 100%;
}
</style>
