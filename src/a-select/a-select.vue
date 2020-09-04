<template lang="pug">
    Select.a-select-comp(
        :value="val"
        transfer
        @input="inputHandler"
        :disabled="disabled"
        v-if="!radioMode"
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

            //自定义数据
            optionLs: {
                type:[Array, String, Function],
                default:""
            },

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
            disabled: {}
        },

        watch:{
            optionLs:{
                immediate: true,
                async handler(opt){
                    const m = this;
                    let ls;

                    //是函数
                    if (typeof m.optionLs == "function") {
                        ls = await m.optionLs();

                    //是数组
                    }else if(Array.isArray(m.optionLs)){
                        ls = m.optionLs;
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

                    if (typeof m.elFormatter == "function") {
                        m.ls = ls.map((el)=>{
                            let [value, name] = m.elFormatter(el, {
                                valueField: m.valueField,
                                nameField: m.nameField
                            }, getValue);
                            return {value, name};
                        });
                    }else{
                        m.ls = ls.map(el => ({name: getValue(el, m.nameField), value: getValue(el, m.valueField)}));
                    }

                }
            },
            ls:{
                handler(ls) {
                    const m = this;
                    let valueOption = ls?.find?.(el => el.value == m.val);

                    //没有找到当前值对应的选项
                    if (!valueOption) {
                        if (m.backupValue) {

                            valueOption = ls?.find?.(el => m.value == m.backupValue);
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
                    let valueOption = m?.ls?.find?.(el => el.value == m.val);
                    if (!valueOption) {

                        //对后选值的处理
                        if (m.backupValue) {
                            m.val = m.backupValue;
                            if (m.backupValueEmitValue) {
                                m.$emit("input", m.backupValue);
                            }
                        }else{
                            m.val = m.value + "";
                        }
                    }else{
                        m.val = m.value + "";
                    }
                }
            },
        },

        methods: {
            inputHandler(value) {
                const m = this;

                //radio模式，取消选择无效
                if(m.radioMode && !value){
                    return;
                }

                m.val = value;
                if (value !== void 0) {
                    m.$emit("input", value);
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
<style scoped>
    .a-select-comp {
        >label{
            padding-right: 0.5em;
        }
    }
</style>
