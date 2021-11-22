<template lang="pug">

    //
    .text(v-if="textMode") {{displayValue}}

    .dd-select-comp.flex(v-else-if="radioMode")
        template( v-for="el, index in ls" )
            Radio(
                v-if="!el.slot"
                :value="el.value == val"
                @input=`$event?inputHandler(el.value):''`
            ) {{el.name}}
            slot(
                :name="el.slot"
                :selected="el.value == val"
                :handler="selected=>selected?inputHandler(el,value):(_=>_)"
            )


    //普通的select
    select.a-select-comp(
        :value="val"
        @input="inputHandler"
        :disabled="disabled"
        :transfer="transfer"
        v-else-if="useNativeSelect"
        v-bind="attrs"
    )
        option(
            v-for="el, index in ls"
            :key="index"
            :value="el.value + ''"
        ) {{el.name}}

    //view-design的Select
    Select.a-select-comp(
        :value="val"
        @input="inputHandler"
        :disabled="disabled"
        :transfer="transfer"
        v-else="useNativeSelect"
        v-bind="attrs"
    )
        Option(
            v-for="el, index in ls"
            :key="index"
            :value="el.value + ''"
        ) {{el.name}}
</template>
<script>

const propOfOptions = {
    type: [Array, String, Function],
    default: ""
};

import {getValue} from "ipro/src/object/ObjectUtils";
import {all2valueName as parseOptions} from "ipro/src/baseUtil";

export default {
    name: "a-select",

    data() {
        return {
            val: "",
            ls:[],
        }
    },

    //用来通过简单继承实现修改默认值
    defaultLs:"",

    props:{


        useNativeSelect:{
            type:Boolean,

            //由于view-design存在的一个bug,在option内容更新之后，
            // 选择当前已经选中的列表之后,竟然显示上一次option数据变更之前的展示值
            //使用该选项规避
            defualt:false,
        },

        //内置属性设置
        selectorAttrs:{
            type:Object,
            default:_=>({}),
        },


        //value匹配该值时$emit('input', '')
        blankValueReplacer:{
            type:[String, RegExp],
            default:"-",
        },

        //使用radio模式
        radioMode: {
            default:false,
            type:Boolean
        },


        //文本模式，用来回显
        textMode:{
            default:false,
            type:Boolean
        },

        transfer:{
            default:true,
            type:Boolean
        },

        //文本模式下，如果value匹配不到option，显示该值
        textModePlactholder:{
            default:"",
        },

        value:{
            // type:[String, Number],
            default:"",
            validator(v){
                if (/string|number|boolean|/.test(typeof v)) {
                    return true;
                }else{
                    console.warn("dd-select接受到了非法类型:", v);
                    return true;
                }
            }
        },

        /**
         * 备用value
         * 当前value在select中找不到时
         */
        backupValue: {
            default:"",
        },


        /**
         * 当backupValue生效时，是否派发修改控件值的事件
         */
        backupValueEmitValue: {
            type:Boolean,
            default:false,
        },

        //选项数据自定义数据
        options:propOfOptions,
        optionsLs:propOfOptions,
        optionLs: propOfOptions,

        valueField:{
            type:[String, Array],
            default:"value"
        },

        nameField:{
            type:[String, Array],
            default:"name",
        },

        //自定义格式化函数
        //(el, { valueField, nameField}, getValueFunction)=>[value, name]
        elFormatter: {
            type:[Function, String],
            default:"",
        },


        //禁用状态
        disabled: {
            type:Boolean,
            default: false,
        },

        /**
         * 选项以字符串形式输入,选项和选项之间的分割字符
         */
        stringElSplit:{
            type:[String, RegExp],
            default: _=>/\s+/
        },

        /**
         * 选项的项目以字符串形式输入，value和name的分割方式
         */
        stringValueNameSplit:{
            type:[String, RegExp],
            default:","
        }
    },

    computed:{
        attrs(){
            const m = this;
            return {
                ...m.$attrs,
                ...m.selectorAttrs
            }
        },

        optionsList(){
            return this.optionLs || this.options || this.optionsLs;
        },


        displayValue(){
            const m = this;
            const {ls, value, textModePlactholder} = m;

            if (!ls) {
                return "";
            }

            let ret = ls.find(el => el.value == value);

            if (!ret) {
                return textModePlactholder;
            }

            return ret.name ;
        },
    },

    watch:{
        optionsList:{
            immediate: true,
            async handler(ls){
                const m = this;
                let _ls = await parseOptions(
                    ls,
                    m.stringElSplit,
                    m.$options.defaultLs,
                    m.elFormatter,
                    m.stringValueNameSplit,
                    m.nameField,
                    m.valueField,
                    typeof ls == "string"
                );
                m.ls = _ls;
                m.setValue(m.value, true);
            }
        },


        value:{
            immediate: true,
            handler(){
                const m = this;
                m.setValue(m.value)
            }
        },
    },

    methods: {
        setValue(value, formLsChange){
            const m = this;
            const {ls} = m;

            //记录值的类型
            m.__valueType == typeof value;
            value = value + "";

            //寻找当前值的选项
            let valueOption = ls.find(el => el.value == value);

            //没有找到当前值对应的选项
            if (!valueOption) {

                //设置备选值
                if (m.backupValue) {

                    //备选值的option
                    valueOption = ls.find(el => m.value == m.backupValue);

                    //备选值存在option
                    if (valueOption) {
                        m.val = m.backupValue;

                        //派发备选值
                        if (m.backupValueEmitValue && !formLsChange) {
                            m.$emit("input", m.backupValue);
                        }

                    //备选值不存在option
                    }else{
                        m.val = ls[0].value;
                    }
                }

                //空值option获取
                valueOption = ls.find(el => el.value == m.blankValueReplacer);

                if (
                    value===undefined ||
                    value===null ||
                    value === "" &&
                    valueOption
                ) {
                    m.val = m.blankValueReplacer;
                }
            }else{
                m.val = value;
            }
        },

        inputHandler(value) {
            const m = this;
            value = _.get(value, "target.value", value);

            //radio模式，取消选择无效
            if(m.radioMode && !value){
                return;
            }

            if (value !== void 0) {

                let _value = value;
                if (typeof m.blankValueReplacer == "string") {
                    if (m.blankValueReplacer == _value) {
                        _value = "";
                    }
                }else if(m.blankValueReplacer instanceof RegExp){
                    if (m.blankValueReplacer.test(_value)) {
                        _value = "";
                    }
                }

                if (m.__valueType == "boolean") {
                    _value = _value == "false" ? false : true;
                }

                m.$emit("input", _value);
                m.val = value;
            }
        }
    },

    created() {
        const m = this;
    }
}

</script>
<style scoped lang="less">
.a-select-comp {
    >label{
        padding-right: 0.5em;
    }
}
</style>
