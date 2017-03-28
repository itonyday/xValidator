"use strict";

/**
 * rules:
 * {
 *      name:"required",
 * 
 *      age:{
 *          required:true,
 *          number:true,
 *          // 包括max值，如果不想包括max值，即希望大于的操作，改用 max_out
 *          max:{ 
 *              value:60, 
 *              // 自定义提示消息内容
 *              msg:"年龄不得超过60岁" 
 *          },
 *          // 跟max类似, min_out
 *          min:18
 *      },
 * 
 *      password:{
 *          required:true,
 *          // 默认会去除字符串首尾空格，如果不希望这样，可以定义 trim:false
 *          trim:false,
 *      }
 *      content:{
 *          maxlength:8000,
 *          minlength:100,
 *          // 如果在规则中定义了msg，那么该条规则下其它细则没有自定义msg的，默认以此msg显示。
 *          // 细则有定义msg的，当然按细则 msg 显示。
 *          msg:"至少100个字符，最多8000个字符。"
 *      }
 * 
 *      email:{
 *          email:true
 *          // other pre-set format:
 *          // number
 *          // letter 英文字母[a-zA-Z]
 *          // Chinese.mobileNo
 *          // Chinese.IDNo
 *          // Chinese.phoneNo
 *      }
 *  
 *      phoneNo:/\d{13}/
 * 
 *      faxNo:{
 *          required:true,
 *          regex:/\d{3,4}-\d{7,8}/
 *      }
 * 
 *      // person[sex] is a group of radion button
 *      "person[sex]":{
 *          required:true,
 *          // 单独指定验证提示消息的HTML元素
 *          msgElement:$("#sexWarning"),
 *      },
 * 
 *      // hobby is a group of checkbox
 *      hobby:{
 *          custom:function(){
 *              // 随便假设一下，年龄50岁以上的，不能选择 football
 *              if(this.age > 50 && this.hobby.indexOf("football") !== -1){
 *                  return {
 *                      valid:false,
 *                      msg:"老年人，不要从事激烈运动的好~"
 *                  };
 *              }
 *              return true;
 *          }
 *      }
 * }
 * 
 */
(function ($) {
    function notInputed(value) {
        if (value === null || value === undefined) {
            return true;
        }

        if (value instanceof Array && value.length === 0) {
            return true;
        }

        return (value.toString().length === 0);
    }

    var RULES = {
        "required": {
            msg: "the field is required.",
            test: function () {
                return !notInputed(this);
            }
        },

        "number": {
            msg: "the field expects a number.",
            test: function () {
                if (notInputed(this)) {
                    return true;
                }

                var expr = /^\-?\d+(\.\d+)?$/;
                return expr.test(this);
            }
        },

        "email": {
            msg: "the field expects an email address.",
            test: function () {
                if (notInputed(this)) {
                    return true;
                }

                var expr = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
                return expr.test(this);
            }
        },

        "letter": {
            msg: "the field expects some letter.",
            test: function () {
                if (notInputed(this)) {
                    return true;
                }

                var expr = /[a-zA-Z]/;
                return expr.test(this);
            }
        },

        "Chinese.mobileNo": {},
        "Chinese.IDNo": {},
        "Chinese.phoneNo": {},

        "max": {
            msg: "the inputed number should less or equals to $value.",
            test: function ($value) {
                if (notInputed(this)) {
                    return true;
                }

                return parseFloat(this) <= $value;
            }
        },

        "max_out": {
            msg: "the inputed number should less to $value.",
            test: function ($value) {
                if (notInputed(this)) {
                    return true;
                }

                return parseFloat(this) < $value;
            }
        },

        "min": {
            msg: "the inputed number should greater or equals to $value.",
            test: function ($value) {
                if (notInputed(this)) {
                    return true;
                }

                return parseFloat(this) >= $value;
            }
        },

        "min_out": {
            msg: "the inputed number should greater to $value.",
            test: function ($value) {
                if (notInputed(this)) {
                    return true;
                }

                return parseFloat(this) > $value;
            }
        },

        "maxlength": {
            msg: "inputed text should not more than $value character(s).",
            test: function ($value) {
                if (notInputed(this)) {
                    return true;
                }

                return this.length <= $value;
            }
        },

        "minlength": {
            msg: "inputed text should not less than $value character(s).",
            test: function ($value) {
                if (notInputed(this)) {
                    return true;
                }

                return this.length >= $value;
            }
        },

        "regex": {
            msg: "inputed text should match to a regular express $value.",
            test: function ($value) {
                if (notInputed(this)) {
                    return true;
                }

                return $value.test(this);
            }
        },
    };

    /**
     * 表单元素获取值的 getter
     */
    function fnGetValue() {
        switch (this.fieldType) {
            case "text":
                if (this.trim) {
                    return $.trim(this.$node.val());
                }

                return this.$node.val();

            case "multiple-options":
            case "drop-down-list":
                return this.$node.val();

            default:
                return this.$node.filter(":checked").val();
        }
    }

    var TEXT_INPUT_TYPES = ",text,password,";
    function isTextInput(tagName, inputType) {
        if (tagName != "INPUT") {
            return false;
        }

        return TEXT_INPUT_TYPES.indexOf("," + inputType + ",") != -1;
    }

    /**
     * 找查HTML节点元素，并填充到规则对象
     * @param {jQuery Object} form 容器 
     * @param {String} name HTML节点名称
     * @param {Boolean} trim 是否去除文本内容的首尾空格
     * @return {Object} 返回节点信息（HTML元素，表单元素类型，输入的内容）
     */
    function fillNode($form, name, ruleOption) {
        var $nodes = $form.find("[name='" + name + "']");
        if ($nodes.length == 0) {
            throw new Error("cannot find html element with name of '" + name + "'.");
        }

        var fieldType;
        var tagName = $nodes.get(0).tagName;
        var inputType = $nodes.attr("type") ? $nodes.attr("type").toLowerCase() : null;

        // text, textarea
        if (isTextInput(tagName, inputType) || tagName === "TEXTAREA") {
            fieldType = "text";
        }
        // select
        else if (tagName === "SELECT" && !$nodes.prop("multiple")) {
            fieldType = "drop-down-list";
        }
        // multiple list
        else if (tagName === "SELECT" && $nodes.prop("multiple")) {
            fieldType = "multiple-options";
        }
        // checkbox group
        else if (tagName === "INPUT" && inputType === "radio") {
            fieldType = "radio";
        }
        // radio button group
        else if (tagName === "INPUT" && inputType === "checkbox") {
            fieldType = "check";
        }
        // oops
        else {
            throw new Error("unknown html element '" + tagName + "'");
        }

        Object.defineProperties(ruleOption, {
            "$node": {
                value: $nodes,
                enumerable: true
            },
            "value": {
                get: function () {
                    return fnGetValue.call(this);
                },
                enumerable: true
            },
            "fieldType": {
                value: fieldType,
                enumerable: true
            }
        });
    }

    function createMsgElement(name, $node) {
        var $msg = $("<label data-xValidator-msg-for='" + name + "' style='display:none;'>DEBUG</label>");
        $msg.click(function () {
            $node.focus();
        });

        if ($node.length > 1) {
            $node.eq($node.length - 1).after($msg);
        } else {
            $node.after($msg);
        }

        return $msg;
    }

    function setMsgElement(name, fieldRule) {
        if (fieldRule.msgElement) {
            return;
        }

        // TODO 当页面分多个表单校验组，使用一样的name时，消息元素有可能重复。
        var $msg = $("[data-xValidator-msg-for='" + name + "']");
        if (!$msg.length) {
            $msg = createMsgElement(name, fieldRule.$node);
        }

        fieldRule.msgElement = $msg;
    }

    function setValidation(fieldRule) {
        fieldRule.valid = function () {
            if (fieldRule.custom) {
                return fieldRule.custom(fieldRule.value);
            }

            if (fieldRule.required &&
                fieldRule.required.value &&
                !RULES.required.test.call(fieldRule.value)) {
                return {
                    passed: false,
                    msg: fieldRule.required.msg
                };
            }

            for (var key in fieldRule) {
                var presetRule = RULES[key];
                if (!presetRule || key === "required") {
                    continue;
                }

                var ruleItem = fieldRule[key];
                var passed = presetRule.test.call(fieldRule.value, ruleItem.value);

                if (!passed) {
                    return {
                        passed: false,
                        msg: ruleItem.msg.replace("$value", ruleItem.value)
                    };
                }
            } // end for

            return {
                passed: true,
            };
        } // end valid
    }

    function constructRules($form, options) {
        var rules = [];
        for (var name in options) {
            var item = options[name];
            fillNode($form, name, item);

            // 自定义校验规则不作消息显示的元素，由自定义规则里处理
            if (!item.custom) {
                setMsgElement(name, item);
            }

            setValidation(item);
            item.name = name;

            rules.push(item);
        }

        return rules;
    }

    var OPTION_KEYS = ",trim,msg,msgElement,";
    function isValidOptionKey(optionKey) {
        return OPTION_KEYS.indexOf("," + optionKey + ",") != -1;
    }

    /**
     * 修整单个字段的原始规则需求，返回完整的规则对象
     * @param {Object} rawOption 单个字段的规则需求
     */
    function convertRawOption(rawOption) {
        var fullOpt = {};

        for (var key in rawOption) {
            if (key === "msgElement") {
                fullOpt.msgElement = rawOption[key];
                continue;
            }

            if (key === "custom") {
                fullOpt.custom = rawOption[key];
                continue;
            }

            var validOption = isValidOptionKey(key);
            if (validOption) {
                continue;
            }

            var innerRule = RULES[key];
            if (!innerRule) {
                throw new Error("invalid key of rule requirement: " + key);
            }

            var rawValue = rawOption[key];

            if (typeof rawValue === "number" ||
                typeof rawValue === "boolean" ||
                rawValue instanceof RegExp
            ) {
                fullOpt[key] = {
                    value: rawValue,
                    trim: true,
                    msg: rawOption.msg || innerRule.msg
                };
            } else {
                fullOpt[key] = $.extend({
                    trim: true,
                    msg: rawOption.msg || innerRule.msg
                }, rawValue);
            }
        } // end for

        return fullOpt;
    }

    function isPresetRegexRule(optionName) {
        if (!optionName instanceof String) {
            return false;
        }

        return RULES[optionName] != null;
    }

    /**
     * 修整原始规则需求，返回完整的规则对象
     * @param {Object} rawOptions 整个表单的原始规则需求
     */
    function convertRawRuleOption2Full(rawOptions) {
        // if (rawOptions instanceof Function) {
        //     return rawOptions;
        // }

        var fullOptions = {};

        for (var name in rawOptions) {
            var rawOption = rawOptions[name];

            // // custom
            // if (rawOption instanceof Function) {
            //     fullOptions[name] = rawOption;
            //     continue;
            // }

            if (rawOption === "required") {
                rawOption = {
                    required: true
                };
            } else if (rawOption instanceof RegExp) {
                rawOption = {
                    regex: rawOption
                };
            } else if (isPresetRegexRule(rawOption)) {
                var presetRegexName = rawOption;
                rawOption = {};
                rawOption[presetRegexName] = true;
            } else if (rawOption instanceof Function) {
                rawOption = {
                    custom: rawOption
                };
            }

            fullOptions[name] = convertRawOption(rawOption);
        } // end for

        return fullOptions;
    }

    function showMsg(rule, validationInfo) {
        if (rule.custom) {
            return;
        }

        if (validationInfo.passed) {
            rule.msgElement.hide();
            return;
        }

        rule.msgElement.html(validationInfo.msg).show();
    }

    var methods = {
        init: function (options) {
            var fullOptions = convertRawRuleOption2Full(options);
            var rules = constructRules(this, fullOptions);

            console.log(rules);

            this.data("xValidator", rules);
            return this;
        },
        valid: function () {
            var result = true;

            var rules = this.data("xValidator");
            if (!rules || !rules.length) {
                console.log("there's no validation rules.");
                return result;
            }

            for (var i = 0; i < rules.length; ++i) {
                var rule = rules[i];
                var vInfo = rule.valid();

                if (rule.custom) {
                    if (!vInfo) {
                        result = false;
                    }
                } else {
                    showMsg(rule, vInfo);

                    if (!vInfo.passed) {
                        result = false;
                    }
                }
            } // end for

            return result;
        }
    };

    $.fn.validator = function (method) {
        if (!method) {
            return methods.valid.call(this);
        }

        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        }

        if (typeof method == "object") {
            return methods.init.call(this, method);
        }

        $.error('Method ' + method + ' does not exist on jQuery.xValidator');
    };
})(jQuery);