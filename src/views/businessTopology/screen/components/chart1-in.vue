<template>
  <div class="chart1-in-warp">
    <div class="chart1-in-title">
      <div class="go-back">
        <span @click="toGoBack">
          <el-icon><ArrowLeft /></el-icon>返回
        </span>
      </div>
      <div class="group-name">{{ selectedGroup.groupName }}</div>
      <div />
    </div>
    <div id="chart1-in">
      <div v-show="dialogType === 'agent'" class="agent-detail-warp" ref="agentDetailRef">
        <div class="detail-title">
          <div class="detail-name">{{ agentDetail.ip }}</div>
          <span class="close" @click="toCloseDetail" />
        </div>
        <div class="detail-warp p0">
          <div class="detail-row">
            <span class="label-key">主机名：</span>
            <div class="label-value">
              <span>{{ agentDetail.name }}</span>
            </div>
          </div>
          <div class="detail-row">
            <span class="label-key">IP：</span>
            <div class="label-value">
              <span>{{ agentDetail.ip }}</span>
            </div>
          </div>
          <div class="detail-row tag-warp">
            <span class="label-key">工作环境：</span>
            <div class="detail-tag">
              <span>{{ agentDetail.loc_text }}</span>
            </div>
            <div class="detail-tag">
              <span>{{ agentDetail.org_text }}</span>
            </div>
            <div class="detail-tag">
              <span>{{ agentDetail.bussiness_text }}</span>
            </div>
          </div>
          <div class="detail-row">
            <span class="label-key">组件标签：</span>
            <div class="label-value">
              <span>{{ agentDetail.component_text }}</span>
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
    <div class="groups-warp visit-warp" @click="openDetail('visit')" />
    <div class="groups-warp beVisited-warp" @click="openDetail('beVisited')" />
    <div
      v-show="dialogType === 'visit' || dialogType === 'beVisited'"
      class="groups-detail-warp"
      :class="{ 'visit-dialog': dialogType === 'visit', 'beVisited-dialog': dialogType === 'beVisited' }"
    >
      <div class="detail-title">
        <div class="detail-name">{{ groupDetail.title }}</div>
        <span class="close" @click="toCloseDetail" />
      </div>
      <div class="detail-warp">
        <div v-for="(item, index) in groupDetail.list" :key="`list_${index}`" class="detail-row">
          <span>{{ item.groupName }}</span>
          <span class="grow" />
          <div class="detail-tag">
            <span>{{ item.loc_text }}</span>
          </div>
          <div class="detail-tag">
            <span>{{ item.org_text }}</span>
          </div>
          <div class="detail-tag">
            <span>{{ item.bussiness_text }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="chart1-in">
import { onMounted, onUnmounted, nextTick, ref } from "vue";
import G6 from "@antv/g6";

defineProps<{ selectedGroup: Record<string, any> }>();

let graph: any = null;
const dialogType = ref("");
const groupDetail = ref<Record<string, any>>({
  title: "被访问组",
  list: [
    { groupName: "默认组", loc_text: "安全", org_text: "部门", bussiness_text: "对外" },
    { groupName: "研发组", loc_text: "创新", org_text: "部门", bussiness_text: "对外" },
    { groupName: "销售组", loc_text: "创新", org_text: "部门", bussiness_text: "对外" },
    { groupName: "调研组", loc_text: "安全", org_text: "组织", bussiness_text: "对内" },
    { groupName: "后勤组", loc_text: "安全", org_text: "部门", bussiness_text: "对内" }
  ]
});
const agentDetail = ref<Record<string, any>>({
  ip: "192.168.0.36",
  name: "100.8",
  loc_text: "安全",
  org_text: "部门",
  bussiness_text: "对外",
  component_text: "g1",
  cpu: "5%",
  mem: "7%"
});
const agentDetailRef = ref<HTMLElement | null>(null);
const topologyState = {
  nodes: [
    {
      id: "1",
      label: "",
      style: {
        img: `/topology-img/screen-contain.png`
      }
    },
    {
      id: "2",
      label: "",
      style: {
        img: `/topology-img/screen-agent.png`
      }
    },
    {
      id: "3",
      label: "",
      style: {
        img: `/topology-img/screen-contain.png`
      }
    },
    {
      id: "4",
      label: "",
      style: {
        img: `/topology-img/screen-agent.png`
      }
    },
    {
      id: "5",
      label: "",
      style: {
        img: `/topology-img/screen-contain.png`
      }
    },
    {
      id: "6",
      label: "",
      style: {
        img: `/topology-img/screen-agent.png`
      }
    },
    {
      id: "7",
      label: "",
      style: {
        img: `/topology-img/screen-contain.png`
      }
    },
    {
      id: "8",
      label: "",
      style: {
        img: `/topology-img/screen-agent.png`
      }
    },
    {
      id: "9",
      label: "",
      style: {
        img: `/topology-img/screen-contain.png`
      }
    },
    {
      id: "10",
      label: "",
      style: {
        img: `/topology-img/screen-agent.png`
      }
    }
  ],
  edges: [
    {
      source: "1",
      target: "2",
      edgeType: "green"
    },
    {
      source: "3",
      target: "5",
      edgeType: "red"
    },
    {
      source: "3",
      target: "5",
      edgeType: "green"
    },
    {
      source: "3",
      target: "4",
      edgeType: "green"
    },
    {
      source: "2",
      target: "6",
      edgeType: "green"
    },
    {
      source: "1",
      target: "6",
      edgeType: "green"
    },
    {
      source: "6",
      target: "9",
      edgeType: "green"
    },
    {
      source: "9",
      target: "1",
      edgeType: "green"
    },
    {
      source: "4",
      target: "10",
      edgeType: "green"
    },
    {
      source: "4",
      target: "10",
      edgeType: "red"
    },
    {
      source: "2",
      target: "5",
      edgeType: "red"
    }
  ]
};

const $emit = defineEmits(["changeType"]);

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

onMounted(() => {
  buildChart();
  chageSize();
  window.addEventListener("resize", chageSize);
});

const buildChart = () => {
  if (graph) graph.destroy();
  const container = document.getElementById("chart1-in") as HTMLDivElement | null;
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
    container: "chart1-in",
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
      nodeSize: 30
    },
    defaultNode: {
      type: "image",
      size: 30,
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
        lineWidth: 1
      }
    },
    modes: {
      default: ["drag-node", "drag-canvas", "zoom-canvas"]
    }
  });

  // 点击节点
  graph.on("node:click", (e: any) => {
    const item = e.item.getModel();
    const point = graph.getCanvasByPoint(item.x, item.y); // 坐标转换，获取分组中心坐标
    console.log(point.x, point.y);
    if (agentDetailRef.value) {
      agentDetailRef.value.style.left = point.x + 20 + "px";
      agentDetailRef.value.style.top = point.y - 20 + "px";
      dialogType.value = "agent";
    }
  });

  graph.read(data);
};

const chageSize = () => {
  nextTick(() => {
    if (!graph || graph.get("destroyed")) return;
    const container = document.getElementById("chart1-in") as HTMLDivElement | null;
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

const toGoBack = () => {
  $emit("changeType", {
    type: "out",
    selectedGroup: {}
  });
};

const openDetail = (type: string) => {
  dialogType.value = type;
};

const toCloseDetail = () => {
  dialogType.value = "";
};

onUnmounted(() => {
  window.removeEventListener("resize", chageSize);
});
</script>

<style scoped lang="scss">
.chart1-in-warp {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: calc(100% - 105em);
  background: url("@/assets/images/screen/chart1-in-bg.png") no-repeat 0 0 / 100% 100%;
  .chart1-in-title {
    display: flex;
    justify-content: space-between;
    width: 100%;
    height: 70em;
    line-height: 70em;
    > div {
      width: 30%;
      height: 100%;
    }
    .go-back {
      font-size: 18em;
      color: #b6bac2;
      span {
        cursor: pointer;
      }
    }
    .group-name {
      overflow: hidden;
      font-size: 30em;
      color: #ffffff;
      text-align: center;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  #chart1-in {
    position: relative;
    width: 100%;
    height: 55%;
  }
  .groups-warp {
    position: absolute;
    top: 90em;
    width: 80em;
    height: 80em;
    cursor: pointer;
    border-radius: 50%;
  }
  .visit-warp {
    left: 150em;
  }
  .beVisited-warp {
    left: 725em;
  }
  .groups-detail-warp {
    position: absolute;
    top: 90em;
    z-index: 1;
    width: 410em;
    height: 398em;
    padding: 20em 30em 40em 50em;
    background: url("@/assets/images/screen/chart1-groups-bg.png") no-repeat 0 0 / 100% 100%;
  }
  .detail-warp {
    height: calc(100% - 45em);
    padding: 5em 0;
    overflow: auto;
  }
  .visit-dialog {
    left: 225em;
  }
  .beVisited-dialog {
    left: 800em;
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
  .detail-row {
    display: flex;
    justify-content: space-between;
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
  }
  .agent-detail-warp {
    position: absolute;
    z-index: 1;
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
}
</style>
