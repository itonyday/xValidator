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
        if (typeof value == "number" && value === 0) {
            return true;
        }

        if (value instanceof Array && value.length === 0) {
            return true;
        }

        return (value === null || value === undefined || value.length === 0);
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

                return this.length < $value;
            }
        },

        "minlength": {
            msg: "inputed text should not less than $value character(s).",
            test: function ($value) {
                if (notInputed(this)) {
                    return true;
                }

                return this.length > $value;
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
                return this.$node.filter(":checked").length;
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
     * 查找节点
     * @param {jQuery Object} form 容器 
     * @param {String} name HTML节点名称
     * @param {Boolean} trim 是否去除文本内容的首尾空格
     * @return {Object} 返回节点信息（HTML元素，表单元素类型，输入的内容）
     */
    function findNode($form, name, trim) {
        var $nodes = $form.find("[name='" + name + "']");
        if ($nodes.length == 0) {
            return null;
        }

        var element = {
            $node: $nodes,
            trim: trim,
            get value() {
                return fnGetValue.call(this);
            },
            set value(v) { throw new Error("setter is disabled.") }
        };
        var tagName = $nodes.get(0).tagName;
        var inputType = $nodes.attr("type") ? $nodes.attr("type").toLowerCase() : null;

        // text, textarea
        if (isTextInput(tagName, inputType) || tagName === "TEXTAREA") {
            element.fieldType = "text";
        }
        // select
        else if (tagName === "SELECT" && !$nodes.prop("multiple")) {
            element.fieldType = "drop-down-list";
        }
        // multiple list
        else if (tagName === "SELECT" && $nodes.prop("multiple")) {
            element.fieldType = "multiple-options";
        }
        // checkbox group
        else if (tagName === "INPUT" && inputType === "radio") {
            element.fieldType = "radio";
        }
        // radio button group
        else if (tagName === "INPUT" && inputType === "checkbox") {
            element.fieldType = "check";
        }
        // oops
        else {
            throw new Error("unknown html element '" + tagName + "'");
        }

        return element;
    }

    function createMsgElement($node, name) {
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

    function setMsgElement(formElement, name, ruleOption) {
        if (ruleOption.msgElement) {
            formElement.msgElement = ruleOption.msgElement;
        } else {
            var $msg = $("[data-xValidator-msg-for='" + name + "']");
            if ($msg.length === 0) {
                $msg = createMsgElement(formElement.$node, name);
            }

            formElement.msgElement = $msg;
        }
    }

    function setValidation(formElement) {
        formElement.valid = function () {
            if (formElement.required &&
                formElement.required.value &&
                !RULES.required.test.call(formElement.value)) {
                formElement.sysMsg = RULES.required.msg;
                return false;
            }

            for (var key in formElement) {
                var presetRule = RULES[key];
                if (!presetRule) {
                    continue;
                }

                var rule = formElement[key];
                var passed = presetRule.test.call(formElement.value, rule.value);

                if (!passed) {
                    formElement.sysMsg = presetRule.msg;
                    return false;
                }
            } // end for

            return true;
        } // end valid

    }

    function constructRules($form, options) {
        var rules = [];

        for (var name in options) {
            var item = options[name];
            var element = findNode($form, name, item.trim);

            if (!element) {
                throw new Error("cannot find html element with name of '" + name + "'.");
            }

            element.name = name;
            setMsgElement(element, name, item);
            setValidation(element);
            var rule = $.extend(element, item);

            console.log(rule);

            rules.push(rule);
        }

        return rules;
    }

    /**
     * 有效的校验规则名称
     */
    var RULE_KEYS = ",required,number,email,max,min,max_out,min_out,maxlength,minlength,regex,custom,";
    /**
     * 有效的规则选项
     */
    var OPTION_KEYS = ",trim,msg,msgElement,";

    function validateRuleOption(option) {
        for (var key in option) {
            var ruleMatched = RULE_KEYS.indexOf("," + key + ",") === -1;
            var optionMatched = OPTION_KEYS.indexOf("," + key + ",") === -1;

            if (!ruleMatched && !optionMatched) {
                throw new Error("invalid rule option/rule: " + key);
            }
        }
    }

    function fixRuleOption(rule) {
        for (var key in rule) {
            if (RULE_KEYS.indexOf("," + key + ",") === -1) {
                continue;
            }

            var ruleItem = rule[key];

            if (typeof ruleItem === "number" ||
                typeof ruleItem === "boolean" ||
                ruleItem instanceof RegExp
            ) {
                rule[key] = {
                    value: ruleItem
                };
            }
        }
    }

    /**
     * 修整原始规则需求，返回完整的规则对象数组
     * @param {Object} rawOptions 
     */
    function fixRawRequires(rawOptions) {
        var options = {};

        for (var key in rawOptions) {
            var newItem = null;
            var rawOption = rawOptions[key];

            if (rawOption === "required") {
                newItem = {
                    required: true,
                    trim: true
                };
            }
            else {
                newItem = $.extend({
                    trim: true
                }, rawOption);
            }

            console.log(newItem);
            validateRuleOption(newItem);
            fixRuleOption(newItem);
            options[key] = newItem;
        }

        return options;
    }

    function showMsg(rule, passed) {
        if (passed) {
            rule.msgElement.hide();
            return;
        }

        if (rule.msg) {
            rule.msgElement.html(rule.msg);
        } else {
            rule.msgElement.html(rule.sysMsg);
        }

        rule.msgElement.show();
    }

    var methods = {
        init: function (options) {
            console.log("init");

            var rules = constructRules(this, fixRawRequires(options));
            this.data("xValidator", rules);
            return rules;
        },
        setData: function () {
            this.data("xValidator", { name: "tonyday" });
        },
        valid: function () {
            console.log("valid");
            var rules = this.data("xValidator");
            if (!rules || !rules.length) {
                console.log("there's not validation rules.");
                return true;
            }

            for (var i = 0; i < rules.length; ++i) {
                var rule = rules[i];
                var passed = rule.valid();
                console.log(rule.name + ": " + passed);
                showMsg(rule, passed);
            }
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