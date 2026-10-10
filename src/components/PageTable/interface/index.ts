export interface ColumnProps {
  field: string; // 列字段
  name: string; // 列名
  width?: string; // 列宽
  showOverflowTooltip?: boolean; // 是否隐藏额外内容并在单元格悬停时使用 Tooltip 显示它们，默认 false
  render?: (data: any) => any; // 列渲染函数
}

export interface operProps {
  text: string; // 悬浮文字
  icon: string; // 按钮icon
  clickFn: (data: any) => any; // 点击执行函数
  isShow?: (data: any) => boolean; // 是否显示按钮
}

export interface PageTableProps {
  columns: ColumnProps[]; // 列配置项
  data: any[]; // table data 数据
  border?: boolean; // 是否带有纵向边框，默认true
  isSearch?: boolean; // 是否显示模糊搜索输入框，默认true
  isEdit?: boolean; // 列是否有编辑操作，默认true
  onEdit?: (data: any) => any; // 操作数据的回调函数
  isDel?: boolean; // 列是否有删除操作，默认true
  onDel?: (data: any) => any; // 删除数据的回调函数
  isSelect?: boolean; // 是否可选，默认false
  isSingleChoice?: boolean; // 是否可单选，默认false
  onSelectionChange?: (data: any) => any; // 选择项发生变化的回调函数
  disabledEdit?: (data: any) => any; // 是否禁用编辑按钮的回调函数
  disabledDel?: (data: any) => any; // 是否禁用删除按钮的回调函数
  disabledDelMsg?: (data: any) => any; // 禁用删除按钮的提示
  disabledEditMsg?: (data: any) => any; // 禁用编辑按钮的提示
  extraOper?: operProps[]; // 除编辑删除外，额外操作
  isLoading?: boolean; // 表格loading状态
  operWidth?: string; // 表格列宽度
}
