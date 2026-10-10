<template>
  <el-popover placement="bottom" :width="350" trigger="click" :teleported="false">
    <template #reference>
      <el-button>图例</el-button>
    </template>
    <div>
      <p class="filter-title">图例</p>
      <div class="filter-contain">
        <p class="mt3 mb10">容器策略状态图例</p>
        <el-row>
          <el-col :span="6">
            <img src="@/assets/topology-img/build-pod.png" width="20" alt="建设" class="legend-img" />
            <span class="legend-label">建设</span>
          </el-col>
          <el-col :span="6">
            <img src="@/assets/topology-img/test-pod.png" width="20" alt="测试" class="legend-img" />
            <span class="legend-label">测试</span>
          </el-col>
          <el-col :span="6">
            <img src="@/assets/topology-img/protect-pod.png" width="20" alt="防护" class="legend-img" />
            <span class="legend-label">防护</span>
          </el-col>
        </el-row>
        <p class="mt15 mb10">主机策略状态图例</p>
        <el-row>
          <el-col :span="6">
            <img src="@/assets/topology-img/build-agent.png" width="20" alt="建设" class="legend-img" />
            <span class="legend-label">建设</span>
          </el-col>
          <el-col :span="6">
            <img src="@/assets/topology-img/test-agent.png" width="20" alt="测试" class="legend-img" />
            <span class="legend-label">测试</span>
          </el-col>
          <el-col :span="6">
            <img src="@/assets/topology-img/protect-agent.png" width="20" alt="防护" class="legend-img" />
            <span class="legend-label">防护</span>
          </el-col>
          <el-col :span="6">
            <img src="@/assets/topology-img/disconnected-agent.png" width="20" alt="离线" class="legend-img" />
            <span class="legend-label">离线</span>
          </el-col>
        </el-row>
        <p class="mt15 mb10">工作组策略状态图例</p>
        <el-row>
          <el-col :span="8">
            <img src="@/assets/topology-img/build-group.png" width="40" alt="建设" class="legend-img" />
            <span class="legend-label">建设</span>
          </el-col>
          <el-col :span="8">
            <img src="@/assets/topology-img/test-group.png" width="40" alt="测试" class="legend-img" />
            <span class="legend-label">测试</span>
          </el-col>
          <el-col :span="8">
            <img src="@/assets/topology-img/protect-group.png" width="40" alt="防护" class="legend-img" />
            <span class="legend-label">防护</span>
          </el-col>
        </el-row>
        <p class="mt15 mb10">流量图例</p>
        <el-row>
          <el-col :span="8">
            <el-icon size="20" color="#00A846" class="legend-img"><Right /></el-icon>
            <span class="legend-label">正常</span>
          </el-col>
          <el-col :span="8">
            <el-icon size="20" color="#ff0000" class="legend-img"><Right /></el-icon>
            <span class="legend-label">异常</span>
          </el-col>
          <el-col :span="8">
            <el-icon size="20" color="#5D7092" class="legend-img"><Right /></el-icon>
            <span class="legend-label">有流量</span>
          </el-col>
        </el-row>
      </div>
    </div>
  </el-popover>
</template>

<style scoped lang="scss">
.filter-contain {
  .legend-img {
    margin-right: 10px;
    vertical-align: middle;
  }
  .legend-label {
    vertical-align: middle;
  }
}
</style>
