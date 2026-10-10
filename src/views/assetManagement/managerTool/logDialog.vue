<template>
  <el-dialog
    :model-value="visible"
    :fullscreen="true"
    title="运行日志"
    @closed="closedDialog"
    :close-on-press-escape="false"
    :close-on-click-modal="false"
  >
    <div class="cli mt20 codeWarp">
      <code>
        {{ log }}
      </code>
    </div>
  </el-dialog>
</template>

<script lang="ts" setup name="managerToolInstallDialog">
interface ListType {
  visible?: boolean;
  log?: string;
}
withDefaults(defineProps<ListType>(), {
  visible: false,
  log: ""
});
let $emit = defineEmits(["closedDialog"]);
const closedDialog = () => {
  $emit("closedDialog", {
    visible: false
  });
};
</script>
<style scoped>
.codeWarp {
  word-break: break-all;
  white-space: pre-wrap;
}
.el-button--text {
  margin-right: 15px;
}
</style>
