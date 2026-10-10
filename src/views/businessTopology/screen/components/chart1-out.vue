<template>
  <div class="chart1-out-warp">
    <div id="chart1-out" />
    <div class="detail-warp" v-show="detailVisible" ref="detailRef">
      <div class="detail-title">
        <div class="detail-name" :title="groupDetail.show_name">{{ groupDetail.show_name }}</div>
        <div class="detail-tag" :title="groupDetail.loc ?? '无'">
          <span>{{ groupDetail.loc ?? "无" }}</span>
        </div>
        <div class="detail-tag" :title="groupDetail.org ?? '无'">
          <span>{{ groupDetail.org ?? "无" }}</span>
        </div>
        <div class="detail-tag" :title="groupDetail.business ?? '无'">
          <span>{{ groupDetail.business ?? "无" }}</span>
        </div>
        <div class="grow" />
        <span class="close" @click="toCloseDetail" />
      </div>
      <div class="detail-row">
        <span>活跃负载数：</span><span class="color1">{{ groupDetail.allactive }}</span>
      </div>
      <div class="detail-row">
        <span>正常访问数：</span><span class="color2">{{ groupDetail.normal }}</span>
      </div>
      <div class="detail-row">
        <span>异常访问数：</span><span class="color3">{{ groupDetail.abnormal }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="chart1-out">
import { onMounted, onUnmounted, nextTick, ref } from "vue";
import { debounce } from "@/utils";
import { getGroupList } from "@/api/modules/assets";
import { getChart1TopologyGroup, getChart1GroupDetail } from "@/api/modules/screen";
import G6 from "@antv/g6";
import { state } from "../state";

let graph: any = null;
const detailVisible = ref(false);
const groupDetail = ref<Record<string, any>>({
  show_name: "",
  loc: "",
  org: "",
  business: "",
  allactive: 0,
  normal: 0,
  abnormal: 0
});
const detailRef = ref<HTMLElement | null>(null);

const topologyState: Record<string, any> = {
  nodes: [],
  edges: []
};

onMounted(async () => {
  Promise.all([getGroups(), getEdges()]).then(() => {
    buildChart();
    chageSize();
    window.addEventListener("resize", debounce(chageSize));
  });
});

const getGroups = async () => {
  try {
    const groups = await getGroupList({ limit: 0 });
    let nodes: Record<string, any>[] = [];
    let groupList = ((groups || {}).data || {}).affected_items;
    state.groupList = groupList;

    nodes = groupList.map((k: Record<string, string>) => ({
      id: k.name,
      sort: "0",
      style: {
        img: `/topology-img/screen-group.png`
      },
      label: k.show_name ? k.show_name : k.name
    }));
    nodes.push(
      {
        id: `address`,
        label: "地址表",
        sort: "1",
        style: {
          img: `/topology-img/screen-address.png`
        }
      },
      {
        id: `internet`,
        label: "外网",
        sort: "1",
        style: {
          img: `/topology-img/screen-internet.png`
        }
      }
    );
    topologyState.nodes = nodes;
  } catch (error) {
    console.log(`分组列表错误: ${error}`);
  }
};

const getEdges = async () => {
  try {
    const res = await getChart1TopologyGroup();
    let edges: Record<string, any>[] = [];
    const affected_items = ((res || {}).data || {}).affected_items ?? [];
    affected_items.forEach((l: Record<string, any>) => {
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
        edges.push(item);
      });
      // 异常流量
      const dropIpArr = l.in_drop && l.in_drop !== "empty" ? l.in_drop.split(",").map((i: String) => i.split(":")[0]) : [];
      dropIpArr.forEach((group: String) => {
        const item = {
          source: group,
          target: l.group_name,
          edgeType: "red",
          curveOffset: 40
        };
        edges.push(item);
      });
      // 地址表与外网
      if (l.address_packet !== 0) {
        // 地址表流量
        edges.push({
          source: `address`,
          target: l.group_name
        });
      }
      if (l.internet_packet !== 0) {
        // 外网流量
        edges.push({
          source: `internet`,
          target: l.group_name
        });
      }
    });
    topologyState.edges = edges;
  } catch (error) {
    console.log(`组间流量错误: ${error}`);
  }
};

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

const buildChart = () => {
  if (graph) graph.destroy();
  const container = document.getElementById("chart1-out") as HTMLDivElement | null;
  const width = container?.clientWidth;
  const height = container?.clientHeight;
  const data: Record<string, any> = {
    nodes: JSON.parse(JSON.stringify(topologyState.nodes)),
    edges: topologyState.edges
  };

  // 流量连线颜色
  data.edges.forEach((edge: any) => {
    if (!edge.edgeType) return;
    const config = typeConfigs[edge.edgeType];
    edge = Object.assign(edge, { ...config });
  });

  graph = new G6.Graph({
    container: "chart1-out",
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
      type: "grid",
      preventOverlap: true,
      nodeSize: 80,
      sortBy: "sort"
    },
    defaultNode: {
      type: "image",
      img: `/topology-img/screen-group.png`,
      size: [52, 65],
      style: {
        cursor: "pointer"
      },
      labelCfg: {
        style: {
          fill: "#A8B9D2"
        }
      }
    },
    defaultEdge: {
      // type: "quadratic", // 弧线
      // type: "circle-running", // 圆形动画
      // type: "arrow-running", // 箭头动画
      type: "dash-running", // 虚线动画
      style: {
        stroke: "#5D7092",
        endArrow: true,
        lineWidth: 2
      }
    },
    modes: {
      default: ["drag-node", "drag-canvas", "zoom-canvas"]
    }
  });

  // 点击节点
  let groupClickValid = "none";
  graph.on("node:click", (e: any) => {
    const item = e.item.getModel();
    if (item.id === "address" || item.id === "internet") return;
    if (groupClickValid !== "none") {
      //400ms内点击过
      groupClickValid = "secound";
      return false;
    }
    // 第一次点击
    groupClickValid = "first";
    let timer = setTimeout(async () => {
      clearTimeout(timer);
      if (groupClickValid === "first") {
        // 单机，展示详情浮窗
        const point = graph.getCanvasByPoint(item.x, item.y); // 坐标转换，获取分组中心坐标
        if (detailRef.value) {
          detailRef.value.style.left = point.x + 20 + "px";
          detailRef.value.style.top = point.y - 20 + "px";
          await getGroupDetail(item);
          detailVisible.value = true;
        }
      } else {
        // 双击，展示组内详情
        detailVisible.value = false;
        state.selectedGroup = {
          name: item.id,
          show_name: item.label
        };
        state.chartType = "in";
      }
      groupClickValid = "none";
    }, 400);
  });
  // 当拖拽画布、缩放画布、拖拽节点时，关闭详情浮窗
  graph.on("canvas:dragstart", toCloseDetail);
  graph.on("wheelzoom", toCloseDetail);
  graph.on("node:dragstart", toCloseDetail);

  graph.read(data);
};

const getGroupDetail = async (item: Record<string, any>) => {
  let detail: Record<string, any> = {
    show_name: "",
    loc: "",
    org: "",
    business: "",
    allactive: 0,
    normal: 0,
    abnormal: 0
  };
  try {
    const res = await getChart1GroupDetail(item.id);
    detail = (res || {}).data || {};
    detail.show_name = item.label;
  } catch (error) {
    console.log(`chart1数量统计错误: ${error}`);
  }
  groupDetail.value = detail;
};

const chageSize = () => {
  nextTick(() => {
    if (!graph || graph.get("destroyed")) return;
    const container = document.getElementById("chart1-out") as HTMLDivElement | null;
    if (!container || !container.clientWidth || !container.clientHeight) return;
    graph.setAutoPaint(false);
    graph.changeSize(container.clientWidth, container.clientHeight);
    graph.paint();
    graph.setAutoPaint(true);

    graph.clear();
    const data: Record<string, any> = {
      nodes: JSON.parse(JSON.stringify(topologyState.nodes)),
      edges: topologyState.edges
    };
    data.edges.forEach((edge: any) => {
      if (!edge.edgeType) return;
      const config = typeConfigs[edge.edgeType];
      edge = Object.assign(edge, { ...config });
    });
    graph.read(data);
  });
};

const toCloseDetail = () => {
  detailVisible.value = false;
};

onUnmounted(() => {
  window.removeEventListener("resize", debounce(chageSize));
});
</script>

<style scoped lang="scss">
.chart1-out-warp {
  position: relative;
  width: 100%;
  height: calc(100% - 105em);
  background: url("@/assets/images/screen/chart1-out-bg.png") no-repeat 0 0 / 100% 100%;
  #chart1-out {
    width: 100%;
    height: 100%;
  }
  .detail-warp {
    position: absolute;
    top: 200em;
    left: 200em;
    z-index: 10;
    width: 400em;
    height: 233em;
    padding: 20em 30em 40em 50em;
    background: url("@/assets/images/screen/chart1-group-bg.png") no-repeat 0 0 / 100% 100%;
  }
  .detail-title {
    display: flex;
    align-items: center;
    height: 45em;
    margin-bottom: 20em;
    line-height: 45em;
    .detail-name {
      max-width: 25%;
      overflow: hidden;
      font-size: 20em;
      font-weight: bolder;
      color: #ffffff;
      text-overflow: ellipsis;
      white-space: nowrap;
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
    .grow {
      flex-grow: 1;
    }
    .close {
      display: inline-block;
      width: 25em;
      height: 25em;
      cursor: pointer;
      background: url("@/assets/images/screen/close-bg.png") no-repeat 0 0 / 100% 100%;
    }
  }
  .detail-row {
    margin-bottom: 15em;
    color: #a7b3c6;
    span {
      font-size: 20em;
    }
    .color1 {
      color: #0dc59f;
    }
    .color2 {
      color: #28cfff;
    }
    .color3 {
      color: #ffa336;
    }
  }
}
</style>
