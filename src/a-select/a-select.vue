<template lang="pug">
    Select.a-select-comp(
        :value="val"
        transfer
        @input="inputHandler"
        :disabled="disabled"
        v-if="!radioMode"
        v-bind="attrs"
    )
        Option(
            v-for="el, index in ls"
            :key="index"
            :value="el.value + ''"
        ) {{el.name}}
    .dd-select-comp.flex(v-else)
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

</template>
<script>

const propOfOptions = {
    type: [Array, String, Function],
    default: ""
};

import compact from "lodash/compact"

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
        },

        value:{
            // type:[String, Number],
            default:"",
            validator(v){
                if (/string|number/.test(typeof v)) {
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
            default: _=>/\s/
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
    },

    watch:{
        optionsList:{
            immediate: true,
            async handler(ls){
                this.parseOptions(ls);
            }
        },
        ls:{
            handler(ls) {
                const m = this;

                //寻找当前值的选项
                let valueOption = ls.find(el => el.value == m.val);

                //没有找到当前值对应的选项
                if (!valueOption) {
                    if (m.backupValue) {

                        valueOption = ls.find(el => m.value == m.backupValue);
                        if (valueOption) {
                            m.val = m.backupValue;

                            //派发值修改事件
                            if (m.backupValueEmitValue) {
                                m.$emit("input", m.backupValue);
                            }
                        }else{
                            m.val = ls[0].value;
                        }
                    }
                }
            }
        },

        value:{
            immediate: true,
            handler(){
                const m = this;

                let value = m.value;

                //如果value是空，就使用空替代来设置内部value
                if (!value && m.blankValueReplacer) {
                    value = m.blankValueReplacer;
                }

                let valueOption = m.ls.find(el => el.value == value);
                if (!valueOption) {

                    //对后选值的处理
                    if (m.backupValue) {
                        m.val = m.backupValue;
                        if (m.backupValueEmitValue) {
                            m.$emit("input", m.backupValue);
                        }
                    }else{
                        m.val = value + "";
                    }
                }else{
                    m.val = value + "";
                }
            }
        },
    },

    methods: {

        async parseOptions(options){
            const m = this;

            let ls;

            //数组解析
            //是函数
            if (typeof options == "function") {
                ls = await options();

            //字符串的形式
            }if (typeof options == "string") {
                ls = options.split(m.stringElSplit);

            //是数组
            }else if(Array.isArray(options)){
                ls = options;

            //其他类型
            }else{
                if (Array.isArray(m.$options.defaultLs)) {
                    ls = m.$options.defaultLs
                }else if(typeof m.$options.defaultLs == "function"){
                    ls = await m.$options.defaultLs();
                }else{
                    ls = [{
                        name:"请通过optionLs传入数组或者异步函数",
                        value:-1,
                    }]
                }
            }

            //处理formater
            if (typeof m.elFormatter == "function") {
                ls = ls.map((el)=>{
                    let [value, name] = m.elFormatter(el, {
                        valueField: m.valueField,
                        nameField : m.nameField,
                    }, getValue);
                    return {value, name};
                });
            }


            let _ls = compact(ls);

            if (_ls.length != ls.length) {
                console.warn("options中存在空选项", ls);
            }

            ls = _ls;


            //以数组为参数
            ls = ls.map(el=>{

                const _el = el;

                //切割字符串
                if (typeof el == "string" || typeof el =="number") {
                    el = (el+"").split(m.stringValueNameSplit);
                }

                if (Array.isArray(el)) {
                    let [value, name] = el;
                    if (name === undefined) {
                        name = value;
                    }
                    return {value, name};
                }else if(!el){
                    return {
                        name:"无效options",
                        value:"-",
                    }
                }else{
                    return {
                        name: getValue(el, m.nameField),
                        value: getValue(el, m.valueField)
                    }
                }
            })
            m.ls = ls;
        },

        inputHandler(value) {
            const m = this;

            //radio模式，取消选择无效
            if(m.radioMode && !value){
                return;
            }

            m.val = value;
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
                m.$emit("input", _value);
            }
        }
    },

    created() {
        const m = this;
    }
}


function getValue(object, keyLs){
    if (typeof keyLs === "string") {
        keyLs = keyLs.split(",")
    }

    if (!Array.isArray(keyLs)) {
        return ;
    }


    for (let i = 0; i < keyLs.length; i++) {
        let key = keyLs[i];

        if(object[key]){
            return object[key];
        }
    }

    return object[keyLs[keyLs.length - 1]];
}
</script>
<style scoped lang="less">
.a-select-comp {
    >label{
        padding-right: 0.5em;
    }
}
</style>
