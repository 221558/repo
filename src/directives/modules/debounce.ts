/**
 * v-debounce
 * 防抖指令，使用时用 arg 区分监听事件，如 v-debounce:input 或 v-debounce:click 等。默认监听 click 事件
 * 接收参数：function 类型
 */
import type { Directive, DirectiveBinding } from "vue";
interface ElType extends HTMLElement {
  __handle__: () => any;
}
const debounce: Directive = {
  mounted(el: ElType, binding: DirectiveBinding) {
    if (typeof binding.value !== "function") {
      throw "callback must be a function";
    }
    let timer: NodeJS.Timeout | null = null;
    el.__handle__ = function () {
      if (timer) {
        clearInterval(timer);
      }
      timer = setTimeout(() => {
        binding.value();
      }, 500);
    };
    el.addEventListener(binding.arg ?? "click", el.__handle__);
  },
  beforeUnmount(el: ElType, binding: DirectiveBinding) {
    el.removeEventListener(binding.arg ?? "click", el.__handle__);
  }
};

export default debounce;
