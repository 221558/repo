// ? Element 常用表单校验规则

/**
 *  @description 检验手机号
 */
export const checkPhoneNumber = (rule: any, value: any, callback: any) => {
  const regexp = /^(((13[0-9]{1})|(15[0-9]{1})|(16[0-9]{1})|(17[3-8]{1})|(18[0-9]{1})|(19[0-9]{1})|(14[5-7]{1}))+\d{8})$/;
  if (value === "") callback("请输入手机号码");
  if (!regexp.test(value)) {
    callback(new Error("请输入正确的手机号码"));
  } else {
    return callback();
  }
};

/**
 *  @description 检验邮箱
 */
export const checkEmail = (rule: any, value: any, callback: any) => {
  const reg = /^([a-zA-Z]|[0-9])(\w|\-)+@[a-zA-Z0-9]+\.([a-zA-Z]{2,4})$/;
  if (!value || reg.test(value)) {
    callback();
  } else {
    callback(new Error("邮箱格式不合法"));
  }
};

/**
 * @description 检验IP
 * @param {Boolean} isSingle 校验单条还是英文逗号分隔的多条
 */
export const checkIp = (rule: any, value: any, callback: any, isSingle: boolean = true) => {
  const reg = isSingle
    ? /^((2((5[0-5])|([0-4]\d)))|([0-1]?\d{1,2}))(\.((2((5[0-5])|([0-4]\d)))|([0-1]?\d{1,2}))){3}$/
    : /^(?:(?:^|,)((2((5[0-5])|([0-4]\d)))|([0-1]?\d{1,2}))(\.((2((5[0-5])|([0-4]\d)))|([0-1]?\d{1,2}))){3})+$/;
  if (!value || reg.test(value)) {
    callback();
  } else {
    callback(new Error("IP格式不合法"));
  }
};

/**
 * @description 检验端口
 * @param {Boolean} isAny 是否允许输入any
 */
export const checkPort = (rule: any, value: any, callback: any, isAny: boolean = false) => {
  if (isAny && value === "any") {
    callback();
  } else {
    let reg = /^([1-9]\d{0,3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$/;
    if (!value || reg.test(value)) {
      callback();
    } else {
      callback(new Error("端口格式不合法"));
    }
  }
};

/**
 * @description 检验英文数字
 */
export const checkLettertNumber = (rule: any, value: any, callback: any) => {
  let reg = /^[a-zA-Z0-9]*$/;
  if (!value || reg.test(value)) {
    callback();
  } else {
    callback(new Error("不可输入中文、特殊字符、空格"));
  }
};

/**
 * @description 检验字母数字下划线点号破折号或空格，用于主机名校验
 */
export const checkAgentName = (rule: any, value: any, callback: any) => {
  const reg = /^[\w\.\- ]+$/;
  if (!value || reg.test(value)) {
    callback();
  } else {
    callback(new Error("只能输入字母数字下划线点号破折号或空格"));
  }
};

/**
 * @description 检验正整数
 */
export const checkNumber = (rule: any, value: any, callback: any) => {
  const reg = /^[0-9]+$/;
  if (!value || reg.test(value)) {
    callback();
  } else {
    callback(new Error("请填写正整数"));
  }
};

/**
 * @description 检验中文数字字母
 */
export const checkChineseLettertNumber = (rule: any, value: any, callback: any) => {
  let reg = /^[A-Za-z0-9\u4e00-\u9fa5]+$/g;
  if (!value || reg.test(value)) {
    callback();
  } else {
    callback(new Error("不可输入特殊字符、空格!"));
  }
};
