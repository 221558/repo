<template>
  <div class="query-form pb20" v-if="props.isSearch">
    <el-input
      ref="inputRef"
      v-model="state.input"
      clearable
      placeholder="过滤"
      :prefix-icon="Search"
      v-debounce:input="filterInput"
      @clear="filterInput"
    />
  </div>
  <slot name="btn-warp"></slot>
  <el-table
    ref="tableRef"
    :data="state.list"
    :border="props.border"
    scrollbar-always-on
    @selection-change="selectionChange"
    v-loading="isLoading"
  >
    <el-table-column type="selection" width="55" v-if="props.isSelect || props.isSingleChoice" />
    <el-table-column
      v-for="(column, index) in columns"
      :key="`address_${index}`"
      :prop="column.field"
      :label="column.name"
      :width="column.width"
      :show-overflow-tooltip="column.showOverflowTooltip"
    >
      <template #default="scope">
        <component :is="column.render" v-bind="scope.row" v-if="column.render" />
        <span v-else>{{ scope.row[column.field] ?? "-" }}</span>
      </template>
    </el-table-column>
    <el-table-column fixed="right" label="操作" v-if="props.isEdit || props.isDel" :width="props.operWidth ?? '120'">
      <template #default="scope">
        <el-tooltip
          v-for="(item, index) in extraOper"
          :key="`extraOper_${index}`"
          effect="dark"
          :content="item.text ?? ''"
          placement="top"
        >
          <el-button
            link
            type="primary"
            size="small"
            @click="item.clickFn(scope.row)"
            v-if="item.isShow ? item.isShow(scope.row) : true"
          >
            <el-icon><component :is="item.icon" /></el-icon>
          </el-button>
        </el-tooltip>

        <el-tooltip
          effect="dark"
          :content="`${disabledEdit(scope.row) ? disabledEditMsg(scope.row) ?? '不可编辑' : '编辑数据'}`"
          placement="top"
          v-if="props.isEdit"
        >
          <el-button link type="primary" size="small" @click="edit(scope.row)" :disabled="disabledEdit(scope.row)">
            <el-icon><Edit /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip
          effect="dark"
          :content="`${disabledDel(scope.row) ? disabledDelMsg(scope.row) ?? '不可删除' : '删除数据'}`"
          placement="top"
          v-if="props.isDel"
        >
          <el-button link type="primary" size="small" @click="remove(scope.row)" :disabled="disabledDel(scope.row)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </el-tooltip>
      </template>
    </el-table-column>
    <!-- 无数据 -->
    <template #empty>
      <div class="table-empty">
        <slot name="empty">
          <img src="@/assets/images/notData.png" alt="notData" />
          <div>暂无数据</div>
        </slot>
      </div>
    </template>
  </el-table>
  <el-pagination
    v-if="state.list.length !== 0"
    v-model:current-page="state.currentPage"
    v-model:page-size="state.pageSize"
    :page-sizes="[10, 20, 50, 100]"
    :background="true"
    layout="total, sizes, prev, pager, next, jumper"
    :total="state.total"
    @size-change="handleSizeChange"
    @current-change="handleCurrentChange"
  />
</template>

<script setup lang="ts" name="PageTable">
import { ref, watch } from "vue";
import { Search, Delete, Edit } from "@element-plus/icons-vue";
import { getProperty } from "@/utils";
import { PageTableProps } from "@/components/PageTable/interface";

// 接受父组件参数，配置默认值
const props = withDefaults(defineProps<PageTableProps>(), {
  columns: () => [],
  data: () => [],
  border: true,
  isSearch: true,
  isEdit: true,
  isDel: true,
  isSelect: false,
  isSingleChoice: false,
  extraOper: () => [],
  isLoading: false
});

const state = ref<Record<string, any>>({
  list: [],
  currentPage: 1,
  pageSize: 10,
  total: 0,
  input: ""
});
const tableRef = ref();
const inputRef = ref();

const edit = (item: Record<string, any>) => props.onEdit && props.onEdit(item);
const remove = (item: Record<string, any>) => props.onDel && props.onDel(item);
const disabledEdit = (item: Record<string, any>) => props.disabledEdit && props.disabledEdit(item);
const disabledDel = (item: Record<string, any>) => props.disabledDel && props.disabledDel(item);
const disabledEditMsg = (item: Record<string, any>) => props.disabledEditMsg && props.disabledEditMsg(item);
const disabledDelMsg = (item: Record<string, any>) => props.disabledDelMsg && props.disabledDelMsg(item);
const selectionChange = (selection: Record<string, any>[]) => {
  if (props.isSingleChoice && selection.length > 1) {
    tableRef.value.clearSelection();
    tableRef.value.toggleRowSelection(selection[selection.length - 1], true);
    // 修改选中状态会自动执行selectionChange函数，执行else逻辑
  } else {
    props.onSelectionChange && props.onSelectionChange(selection);
  }
};

watch(
  () => props.data,
  () => filterData()
);

const filterData = () => {
  const columsKey = props.columns.map((item: Record<string, any>) => item.field);
  const arr = props.data.filter((item: Record<string, any>) => {
    let valuesArr: any[] = [];
    for (let i = 0, length = columsKey.length; i < length; i++) {
      const key: string = columsKey[i];
      valuesArr.push(getProperty(item, key));
    }
    return !state.value.input || valuesArr.some((value: any) => String(value).includes(state.value.input));
  });
  const begin = (state.value.currentPage - 1) * state.value.pageSize;
  const end = begin + state.value.pageSize;
  state.value.list = arr.slice(begin, end);
  state.value.total = arr.length;
};

const filterInput = () => {
  state.value.currentPage = 1;
  filterData();
};

const handleSizeChange = (val: number) => {
  state.value.pageSize = val;
  state.value.currentPage = 1;
  filterData();
};

const handleCurrentChange = (val: number) => {
  state.value.currentPage = val;
  filterData();
};

const reset = () => {
  state.value.input = "";
};

// 暴露给父组件的参数和方法 (外部需要什么，都可以从这里暴露出去)
defineExpose({
  tableElement: tableRef,
  inputElement: inputRef,
  reset
});
</script>

<style scoped lang="scss">
.query-form {
  width: 40%;
}
</style>
