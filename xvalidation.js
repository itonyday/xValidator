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
        return (value === null || value === undefined || value.length === 0);
    }

    var rules = {
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

    function findNode($form, name) {
        return $form.find("[name='" + name + "']");
    }

    function constructRules($form, options) {
        for (var key in options) {
            var $element = findNode($form, key);
            if ($element.length == 0) {
                throw new Error("cannot find html element '" + key + "'.");
            }

            
        }
    }

    var methods = {
        init: function (options) {
            console.log("init");
            console.log(this);

            //var data = this.data("xValidator");
            constructRules(this, options);
            return console.log(options);
        },
        setData: function () {
            this.data("xValidator", { name: "tonyday" });
        },
        valid: function () {
            console.log("valid");
            console.log(this);
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