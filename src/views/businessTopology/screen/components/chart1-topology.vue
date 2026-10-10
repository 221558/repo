<template>
  <div id="chart1-topology">
    <div v-show="detailVisible" class="agent-detail-warp" ref="agentDetailRef">
      <div class="detail-title">
        <div class="detail-name" :title="agentDetail.ip">{{ agentDetail.ip }}</div>
        <span class="close" @click="toCloseDetail" />
      </div>
      <div class="detail-warp p0">
        <div class="detail-row">
          <span class="label-key">主机名：</span>
          <div class="label-value">
            <span>{{ agentDetail.hostname }}</span>
          </div>
        </div>
        <div class="detail-row">
          <span class="label-key">IP：</span>
          <div class="label-value">
            <span>{{ agentDetail.ip }}</span>
          </div>
        </div>
        <!-- <div class="detail-row tag-warp">
          <span class="label-key">工作环境：</span>
          <div class="detail-tag">
            <span>{{ agentDetail.loc ?? "无" }}</span>
          </div>
          <div class="detail-tag">
            <span>{{ agentDetail.org ?? "无" }}</span>
          </div>
          <div class="detail-tag">
            <span>{{ agentDetail.bus ?? "无" }}</span>
          </div>
        </div> -->
        <div class="detail-row">
          <span class="label-key">位置标签：</span>
          <div class="detail-tag-row" :title="agentDetail.loc ?? '无'">
            <span>{{ agentDetail.loc ?? "无" }}</span>
          </div>
        </div>
        <div class="detail-row">
          <span class="label-key">组织标签：</span>
          <div class="detail-tag-row" :title="agentDetail.org ?? '无'">
            <span>{{ agentDetail.org ?? "无" }}</span>
          </div>
        </div>
        <div class="detail-row">
          <span class="label-key">业务标签：</span>
          <div class="detail-tag-row" :title="agentDetail.bus ?? '无'">
            <span>{{ agentDetail.bus ?? "无" }}</span>
          </div>
        </div>
        <div class="detail-row">
          <span class="label-key">组件标签：</span>
          <div class="detail-tag-row" :title="agentDetail.com ?? '无'">
            <span>{{ agentDetail.com ?? "无" }}</span>
          </div>
        </div>
        <div class="detail-row">
          <span class="label-key">CPU占用率：</span>
          <div class="label-value">
            <span>{{ agentDetail.cpu }}</span>
          </div>
        </div>
        <div class="detail-row">
          <span class="label-key">内存占用率：</span>
          <div class="label-value">
            <span>{{ agentDetail.mem }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="chart1-topology">
import { onUnmounted, nextTick, ref } from "vue";
import G6 from "@antv/g6";
import mittBus from "@/utils/mittBus";
import { debounce, cutForByte } from "@/utils";
import { getGroupAgent } from "@/api/modules/assets";
import { getChart1TopologyDetail, getChart1AgentDetail } from "@/api/modules/screen";
import { getTrafficFilter } from "@/api/modules/topology";
import { state } from "../state";

let graph: any = null;
const topologyState: Record<string, any> = {
  nodes: {
    current: [],
    in: [],
    out: []
  },
  edges: {
    current: [],
    in: [],
    out: []
  }
};

const detailVisible = ref(false);
const agentDetail = ref<Record<string, any>>({
  ip: "",
  hostname: "",
  loc: "",
  org: "",
  bus: "",
  com: "",
  cpu: "",
  mem: ""
});
const agentDetailRef = ref<HTMLElement | null>(null);

mittBus.on("initTopology", () => {
  Promise.all([getCurrnetNodes(), getInNodes(), getOutNodes(), getCurrentEdges(), getInEdges(), getOutEdges()]).then(() => {
    buildChart();
    chageSize();
    window.addEventListener("resize", debounce(chageSize));
  });
});

mittBus.on("buildTopology", () => {
  toCloseDetail();
  graph.clear();
  Promise.all([getCurrnetNodes(), getInNodes(), getOutNodes(), getCurrentEdges(), getInEdges(), getOutEdges()]).then(() => {
    // getPipes计算布局时会read数据
    graph.updateLayout({
      pipes: getPipes()
    });
    setTimeout(() => {
      graph.zoom(0.9);
      graph.focusItem("current-group", true);
    }, 0);
  });
});

// 流量类型样式
const typeConfigs: Record<string, any> = {
  green: {
    style: {
      stroke: "#28cfff"
    }
  },
  red: {
    style: {
      stroke: "#ffa336"
    }
  }
};
// 自定义浮窗
const tooltip = new G6.Tooltip({
  offsetX: -60,
  offsetY: -45,
  // 允许出现 tooltip 的 item 类型
  itemTypes: ["node"],
  // 是否允许 tooltip 出现
  shouldBegin: (e: any) => {
    let item = e.item.getModel();
    if (item.id === "blank_current" || item.id === "blank_in" || item.id === "blank_out") {
      return false;
    }
    return true;
  },
  // 自定义 tooltip 内容
  getContent: (e: any) => {
    const outDiv = document.createElement("div");
    let item = e.item.getModel();
    outDiv.innerHTML = item.id === "current-group" ? `当前工作组: ${item.group}` : `<p class="tooltip-p">主机IP: ${item.ip}</p>`;
    return outDiv;
  }
});
// 自定义连线-圆形动画
G6.registerEdge(
  "circle-running",
  {
    afterDraw(cfg, group) {
      // 得到组中的第一个形状，它是边的路径
      const shape = group?.get("children")[0];
      // 边缘路径的起始位置
      const startPoint = shape.getPoint(0);
      const duration = Math.ceil(Math.random() * 30);

      // 圆形
      const circle = group?.addShape("circle", {
        attrs: {
          x: startPoint.x,
          y: startPoint.y,
          // fill: "#1890ff", // 蓝色
          fill: cfg?.style?.stroke,
          r: 3
        },
        name: "circle-shape"
      });
      // 圆形动画
      circle?.animate(
        (ratio: any) => {
          // 每一帧中的操作。比率范围从0到1，表示动画的进度。返回修改后的配置
          // 根据比例得到边缘上的位置
          const tmpPoint = shape.getPoint(ratio);
          // 返回修改后的配置，这里返回x和y
          return {
            x: tmpPoint.x,
            y: tmpPoint.y
          };
        },
        {
          repeat: true, // 是否重复执行动画
          duration: duration * 100 // 执行一次的持续时间
        }
      );
    }
  },
  "quadratic" // 弧线
);
// 自定义连线-箭头动画
const { getLabelPosition, transform } = G6.Util;
G6.registerEdge(
  "arrow-running",
  {
    afterDraw(cfg, group) {
      // 得到组中的第一个形状，它是边的路径
      const shape = group?.get("children")[0];
      const duration = Math.ceil(Math.random() * 30);

      // 箭头
      const arrow = group?.addShape("marker", {
        attrs: {
          x: 16,
          y: 0,
          r: 8,
          lineWidth: 2,
          // stroke: "#3370ff", // 蓝色
          stroke: cfg?.style?.stroke,
          fill: "#fff",
          symbol: (x: number, y: number) => {
            return [
              ["M", x - 6, y - 4],
              ["L", x - 2, y],
              ["L", x - 6, y + 4]
            ];
          }
        }
      });
      // 箭头动画
      arrow?.animate(
        (ratio: any) => {
          // 每一帧中的操作。比率范围从0到1，表示动画的进度。返回修改后的配置
          // 根据比例得到边缘上的位置
          const tmpPoint = shape.getPoint(ratio);
          const pos = getLabelPosition(shape, ratio);
          let matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];
          matrix = transform(matrix, [
            ["t", -tmpPoint.x, -tmpPoint.y],
            ["r", pos.angle],
            ["t", tmpPoint.x, tmpPoint.y]
          ]);

          // 返回修改后的配置，这里返回x和y
          return {
            x: tmpPoint.x,
            y: tmpPoint.y,
            matrix
          };
        },
        {
          repeat: true, // 是否重复执行动画
          duration: duration * 100 // 执行一次的持续时间
        }
      );
    }
  },
  "quadratic" // 弧线
);
// 自定义连线-虚线动画
const lineDash = [4, 2, 1, 2];
G6.registerEdge(
  "dash-running",
  {
    options: {
      style: {
        endArrow: {
          path: G6.Arrow.triangle(8, 10, 20),
          d: 20
        }
      }
    },
    afterDraw(cfg, group) {
      // 得到组中的第一个形状，它是边的路径
      const shape = group?.get("children")[0];
      const duration = Math.ceil(Math.random() * 30);
      let index = 0;
      // 虚线动画
      shape.animate(
        () => {
          index++;
          if (index > 9) {
            index = 0;
          }
          const res = {
            lineDash,
            lineDashOffset: -index
          };
          // 这里返回修改后的配置，这里返回lineDash和lineDashOffset
          return res;
        },
        {
          repeat: true, // 是否重复执行动画
          duration: duration * 100 // 执行一次的持续时间
        }
      );
    }
  },
  "quadratic" // 弧线
);
// 自定义连线-虚线动画-自环边
G6.registerEdge(
  "edge-loop",
  {
    options: {
      style: {
        endArrow: {
          path: G6.Arrow.triangle(8, 10, 0)
        }
      }
    },
    afterDraw(cfg, group) {
      // 得到组中的第一个形状，它是边的路径
      const shape = group?.get("children")[0];
      const duration = Math.ceil(Math.random() * 30);
      let index = 0;
      // 虚线动画
      shape.animate(
        () => {
          index++;
          if (index > 9) {
            index = 0;
          }
          const res = {
            lineDash,
            lineDashOffset: -index
          };
          // 这里返回修改后的配置，这里返回lineDash和lineDashOffset
          return res;
        },
        {
          repeat: true, // 是否重复执行动画
          duration: duration * 100 // 执行一次的持续时间
        }
      );
    }
  },
  "loop" // 自环边
);

const getPipes = () => {
  let pipes = [];
  let currentRadius = 400;

  const currentLength = topologyState.nodes.current.length;
  let current_layer = 0; // 层数
  for (let i = 0; i < currentLength; i += 30 + current_layer * 2, current_layer++, currentRadius += 100) {
    let lay = 30 + current_layer * 2; // 本层节点数量

    const nodes = topologyState.nodes.current.filter(
      (node: Record<string, any>) => node.group_type === "current" && i <= node.index && node.index < i + lay
    );
    if (nodes.length === 1) {
      // 该层只有一个节点时会定位到中心，所以加一个透明节点
      topologyState.nodes.current.push({
        id: `blank_current`,
        group_type: "current",
        agent_id: "",
        size: [1, 1],
        opacity: 0,
        index: topologyState.nodes.current.length - 2
      });
    }

    pipes.push({
      type: "circular",
      center: [200, 200], // 可选，默认为图的中心
      nodesFilter: (node: Record<string, any>) => node.group_type === "current" && i <= node.index && node.index < i + lay,
      radius: currentRadius * state.scale
    });
  }

  currentRadius += 200;
  const maxLength = Math.max(topologyState.nodes.in.length, topologyState.nodes.out.length);
  let in_out_layer = 0; // 层数
  for (let i = 0; i < maxLength; i += 20 + in_out_layer * 2, in_out_layer++, currentRadius += 100) {
    let lay = 20 + in_out_layer * 2; // 本层节点数量

    const inNodes = topologyState.nodes.in.filter(
      (node: Record<string, any>) => node.group_type === "in" && i <= node.index && node.index < i + lay
    );
    if (inNodes.length === 1) {
      // 该层只有一个节点时会定位到中心，所以加一个透明节点
      topologyState.nodes.in.push({
        id: `blank_in`,
        group_type: "in",
        agent_id: "",
        size: [1, 1],
        opacity: 0,
        index: topologyState.nodes.in.length - 1
      });
    }
    const outNodes = topologyState.nodes.out.filter(
      (node: Record<string, any>) => node.group_type === "out" && i <= node.index && node.index < i + lay
    );
    if (outNodes.length === 1) {
      // 该层只有一个节点时会定位到中心，所以加一个透明节点
      topologyState.nodes.out.push({
        id: `blank_out`,
        group_type: "out",
        agent_id: "",
        size: [1, 1],
        opacity: 0,
        index: topologyState.nodes.out.length - 1
      });
    }

    pipes.push(
      {
        type: "circular",
        center: [200, 200], // 可选，默认为图的中心
        nodesFilter: (node: Record<string, any>) => node.group_type === "in" && i <= node.index && node.index < i + lay,
        radius: currentRadius * state.scale,
        clockwise: false, // 逆时针
        startAngle: Math.PI / 2 + Math.PI / 10,
        endAngle: Math.PI / 2 + Math.PI - Math.PI / 10
      },
      {
        type: "circular",
        center: [200, 200], // 可选，默认为图的中心
        nodesFilter: (node: Record<string, any>) => node.group_type === "out" && i <= node.index && node.index < i + lay,
        radius: currentRadius * state.scale,
        startAngle: Math.PI / 2 + Math.PI + Math.PI / 10,
        endAngle: Math.PI * 2 + Math.PI / 2 - Math.PI / 10
      }
    );
  }
  if (graph) {
    const nodes = topologyState.nodes.current.concat(topologyState.nodes.in, topologyState.nodes.out);
    const edges = topologyState.edges.current.concat(topologyState.edges.in, topologyState.edges.out);
    const data: Record<string, any> = {
      nodes,
      edges
    };
    data.edges.forEach((edge: any) => {
      if (!edge.edgeType) return;
      const config = typeConfigs[edge.edgeType];
      edge = Object.assign(edge, { ...config });
    });
    graph.read(data);
  }

  return pipes;
};

const buildChart = () => {
  if (graph) graph.destroy();
  const container = document.getElementById("chart1-topology") as HTMLDivElement | null;
  const width = container?.clientWidth;
  const height = container?.clientHeight;
  const nodes = topologyState.nodes.current.concat(topologyState.nodes.in, topologyState.nodes.out);
  const edges = topologyState.edges.current.concat(topologyState.edges.in, topologyState.edges.out);
  const data: Record<string, any> = {
    nodes,
    edges
  };

  // 流量连线颜色
  data.edges.forEach((edge: any) => {
    if (!edge.edgeType) return;
    const config = typeConfigs[edge.edgeType];
    edge = Object.assign(edge, { ...config });
  });

  graph = new G6.Graph({
    container: "chart1-topology",
    width,
    height,
    // animate: true, // 全局动画
    enabledStack: true,
    fitView: true, // 图是否自适应画布
    fitViewPadding: 50, // 图自适应画布时的四周留白像素值。fitView 为 true 时生效
    fitCenter: true, // 是否平移图使其中心对齐到画布中心
    minZoom: 0.00000001, // 最小缩放比例。默认 0.02
    maxZoom: 1, // 最大放大比例
    groupByTypes: false, // 若希望在带有 combo 的图上，节点、边、combo 的层级符合常规逻辑，需要将 groupByTypes 设置为 false
    layout: {
      pipes: getPipes()
    },
    defaultNode: {
      type: "image",
      img: `/topology-img/detail-current-node.png`,
      size: [60, 60],
      style: {
        cursor: "pointer"
      },
      labelCfg: {
        style: {
          fill: "#A8B9D2"
        }
      },
      anchorPoints: [[0.5, 0.5]]
    },
    defaultEdge: {
      type: "dash-running", // 虚线动画
      style: {
        stroke: "#5D7092",
        lineWidth: 1
      }
    },
    modes: {
      default: ["drag-canvas", "zoom-canvas"]
    },
    plugins: [tooltip]
  });

  // 点击节点
  graph.on("node:click", async (e: any) => {
    const item = e.item.getModel();
    if (item.id === "current-group" || item.id === "blank_current" || item.id === "blank_in" || item.id === "blank_out") return;
    const point = graph.getCanvasByPoint(item.x, item.y); // 坐标转换，获取分组中心坐标
    if (agentDetailRef.value) {
      agentDetailRef.value.style.left = point.x + 20 + "px";
      agentDetailRef.value.style.top = point.y - 20 + "px";
      await getAgentDetail(item);
      detailVisible.value = true;
    }
  });
  // 当拖拽画布、缩放画布时，关闭详情浮窗
  graph.on("canvas:dragstart", toCloseDetail);
  graph.on("wheelzoom", toCloseDetail);

  graph.read(data);
};

// const getNodes = () => {
//   let nodes: Record<string, any> = {
//     current: [
//       {
//         id: "current-group",
//         label: state.selectedGroup.show_name,
//         style: {
//           img: `/topology-img/detail-current-group.png`,
//           cursor: false
//         },
//         labelCfg: {
//           position: "center",
//           style: {
//             fill: "#fff",
//             fontSize: 30
//           }
//         },
//         size: [200, 200],
//         x: 200,
//         y: 200
//       }
//     ],
//     in: [],
//     out: []
//   };

//   for (let i = 0; i < 30; i++) {
//     nodes.current.push({
//       id: `current_${i}`,
//       group_type: "current",
//       index: i
//     });
//   }
//   for (let i = 0; i < 20; i++) {
//     nodes.in.push({
//       id: `in_${i}`,
//       group_type: "in",
//       style: {
//         img: `/topology-img/detail-node.png`
//       },
//       index: i
//     });
//   }
//   for (let i = 0; i < 20; i++) {
//     nodes.out.push({
//       id: `out_${i}`,
//       group_type: "out",
//       style: {
//         img: `/topology-img/detail-node.png`
//       },
//       index: i
//     });
//   }
//   topologyState.nodes = nodes;
// };

const getCurrnetNodes = async () => {
  let nodes: Record<string, any>[] = [
    {
      id: "current-group",
      label: cutForByte(state.selectedGroup.show_name, 0, 6),
      group: state.selectedGroup.show_name,
      style: {
        img: `/topology-img/detail-current-group.png`,
        cursor: false
      },
      labelCfg: {
        position: "center",
        style: {
          fill: "#fff",
          fontSize: 30
        }
      },
      size: [200, 200],
      x: 200,
      y: 200
    }
  ];
  try {
    const listRes = await getGroupAgent({ urlId: state.selectedGroup.name, params: { limit: 0, q: `id!=000;daemonset_id!=0` } });
    const list = ((listRes || {}).data || {}).affected_items ?? [];
    list
      .filter((agent: Record<string, any>) => agent.ip && agent.ip !== "any")
      .forEach((agent: Record<string, any>, index: number) => {
        nodes.push({
          id: agent.ip,
          ip: agent.ip,
          group_type: "current",
          agent_id: agent.id,
          index
        });
      });
  } catch (error) {
    console.log(`当前组内负载查询错误: ${error}`);
  }
  topologyState.nodes.current = nodes;
};

const getInNodes = async () => {
  if (!state.selectInGroup) {
    topologyState.nodes.in = [];
    return;
  }
  let nodes: Record<string, any>[] = [];
  try {
    const listRes = await getGroupAgent(
      { urlId: state.selectInGroup, params: { limit: 0, q: `id!=000;daemonset_id!=0` } },
      false
    );
    const list = ((listRes || {}).data || {}).affected_items ?? [];
    list
      .filter((agent: Record<string, any>) => agent.ip && agent.ip !== "any")
      .forEach((agent: Record<string, any>, index: number) => {
        nodes.push({
          id: `in_${agent.ip}`,
          ip: agent.ip,
          group_type: "in",
          agent_id: agent.id,
          size: [40, 40],
          style: {
            img: `/topology-img/detail-node.png`
          },
          index
        });
      });
  } catch (error) {
    console.log(`访问组内负载查询错误: ${error}`);
  }
  topologyState.nodes.in = nodes;
};

const getOutNodes = async () => {
  if (!state.selectOutGroup) {
    topologyState.nodes.out = [];
    return;
  }
  let nodes: Record<string, any>[] = [];
  try {
    const listRes = await getGroupAgent(
      { urlId: state.selectOutGroup, params: { limit: 0, q: `id!=000;daemonset_id!=0` } },
      false
    );
    const list = ((listRes || {}).data || {}).affected_items ?? [];
    list
      .filter((agent: Record<string, any>) => agent.ip && agent.ip !== "any")
      .forEach((agent: Record<string, any>, index: number) => {
        nodes.push({
          id: `out_${agent.ip}`,
          ip: agent.ip,
          group_type: "out",
          agent_id: agent.id,
          size: [40, 40],
          style: {
            img: `/topology-img/detail-node.png`
          },
          index
        });
      });
  } catch (error) {
    console.log(`被访问组内负载查询错误: ${error}`);
  }
  topologyState.nodes.out = nodes;
};

const getCurrentEdges = async () => {
  let edges: Record<string, any>[] = [];
  try {
    let offset = 0;
    while (true) {
      let param = {
        group_type: "name",
        group_name: state.selectedGroup.name,
        flow_scope: "in",
        limit: 100,
        offset
      };
      const dataRes = await getTrafficFilter(param);
      const data = ((dataRes || {}).data || {}).affected_items ?? [];
      const isFinish = (dataRes || {}).message !== "continue";
      edges = edges.concat(data);
      if (isFinish) {
        break;
      }
      offset += 100;
    }
  } catch (error) {
    console.log(`组内流量查询错误: ${error}`);
  }
  topologyState.edges.current = edges;
};

const getInEdges = async () => {
  if (!state.selectInGroup) {
    topologyState.edges.in = [];
    return;
  }
  let edges: Record<string, any>[] = [];

  try {
    let offset = 0;
    while (true) {
      let params = {
        src_group: state.selectInGroup,
        dest_group: state.selectedGroup.name,
        limit: 100,
        offset
      };
      const listRes = await getChart1TopologyDetail(params);
      const list = ((listRes || {}).data || {}).affected_items ?? [];
      const isFinish = (listRes || {}).message !== "continue";
      edges = edges.concat(
        list.map((item: Record<string, any>) => {
          item.source = `in_${item.source}`;
          return item;
        })
      );
      if (isFinish) {
        break;
      }
      offset += 100;
    }
  } catch (error) {
    console.log(`访问组流量查询错误: ${error}`);
  }
  topologyState.edges.in = edges;
};

const getOutEdges = async () => {
  if (!state.selectOutGroup) {
    topologyState.edges.out = [];
    return;
  }
  let edges: Record<string, any>[] = [];
  try {
    let offset = 0;
    while (true) {
      let params = {
        src_group: state.selectedGroup.name,
        dest_group: state.selectOutGroup,
        limit: 100,
        offset
      };
      const listRes = await getChart1TopologyDetail(params);
      const list = ((listRes || {}).data || {}).affected_items ?? [];
      const isFinish = (listRes || {}).message !== "continue";
      edges = edges.concat(
        list.map((item: Record<string, any>) => {
          item.target = `out_${item.target}`;
          return item;
        })
      );
      if (isFinish) {
        break;
      }
      offset += 100;
    }
  } catch (error) {
    console.log(`被访问组流量查询错误: ${error}`);
  }
  topologyState.edges.out = edges;
};

const getAgentDetail = async (item: Record<string, any>) => {
  let detail: Record<string, any> = {
    ip: "",
    hostname: "",
    loc: "",
    org: "",
    bus: "",
    com: "",
    cpu: "",
    mem: ""
  };
  try {
    const res = await getChart1AgentDetail(item.agent_id);
    detail = (res || {}).data || {};
  } catch (error) {
    console.log(`负载详情查询错误: ${error}`);
  }
  agentDetail.value = detail;
};

const chageSize = () => {
  nextTick(() => {
    if (!graph || graph.get("destroyed")) return;
    const container = document.getElementById("chart1-topology") as HTMLDivElement | null;
    if (!container || !container.clientWidth || !container.clientHeight) return;
    graph.setAutoPaint(false);
    graph.changeSize(container.clientWidth, container.clientHeight);
    graph.paint();
    graph.setAutoPaint(true);

    graph.clear();
    const nodes = topologyState.nodes.current.concat(topologyState.nodes.in, topologyState.nodes.out);
    const edges = topologyState.edges.current.concat(topologyState.edges.in, topologyState.edges.out);
    const data: Record<string, any> = {
      nodes,
      edges
    };
    data.edges.forEach((edge: any) => {
      if (!edge.edgeType) return;
      const config = typeConfigs[edge.edgeType];
      edge = Object.assign(edge, { ...config });
    });
    graph.read(data);

    setTimeout(() => {
      graph.zoom(0.9);
      graph.focusItem("current-group", true);
    }, 0);
  });
};

const toCloseDetail = () => {
  detailVisible.value = false;
};

onUnmounted(() => {
  window.removeEventListener("resize", debounce(chageSize));
  mittBus.off("initTopology");
  mittBus.off("buildTopology");
});
</script>

<style scoped lang="scss">
#chart1-topology {
  position: relative;
  width: calc(100% - 210em);
  height: 100%;
  .agent-detail-warp {
    position: absolute;
    z-index: 10;
    width: 400em;
    height: 328em;
    padding: 20em 30em 40em 50em;
    background: url("@/assets/images/screen/chart1-agent-bg.png") no-repeat 0 0 / 100% 100%;
    .detail-warp {
      padding: 0;
    }
    .detail-row {
      margin-top: 9em;
    }
    .label-key {
      width: 45%;
    }
    .label-value {
      width: 55%;
    }
    .tag-warp {
      justify-content: flex-start;
      .detail-tag {
        margin-right: 8em;
        margin-left: 0;
      }
    }
  }
  .detail-warp {
    height: calc(100% - 45em);
    padding: 5em 0;
    overflow: auto;
  }
  .detail-row {
    display: flex;
    justify-content: flex-start;
    margin-top: 15em;
    color: #a7b3c6;
    span {
      font-size: 20em;
    }
    .grow {
      flex-grow: 1;
    }
    .detail-tag {
      max-width: 15%;
      height: 32em;
      padding: 1em 4em;
      margin-left: 8em;
      line-height: 24em;
      color: #327eac;
      border: 1em solid #327eac;
      border-radius: 4em;
      span {
        display: inline-block;
        max-width: 100%;
        overflow: hidden;
        font-size: 16em;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
    .detail-tag-row {
      max-width: 55%;
      height: 32em;
      padding: 1em 4em;
      line-height: 24em;
      color: #327eac;
      border: 1em solid #327eac;
      border-radius: 4em;
      span {
        display: inline-block;
        max-width: 100%;
        overflow: hidden;
        font-size: 16em;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
  .detail-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 45em;
    line-height: 45em;
    .detail-name {
      max-width: 70%;
      overflow: hidden;
      font-size: 20em;
      font-weight: bolder;
      color: #ffffff;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .close {
      display: inline-block;
      width: 25em;
      height: 25em;
      cursor: pointer;
      background: url("@/assets/images/screen/close-bg.png") no-repeat 0 0 / 100% 100%;
    }
  }
}
</style>

<style lang="scss">
#chart1-topology {
  .g6-component-tooltip {
    color: #b6bcc5;
    background-color: rgb(50 50 50 / 70%);
    border-color: #333333;
  }
}
</style>
