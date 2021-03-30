<template lang="pug">
    span.a-datepicker-comp
        DatePicker(
            :value="avalue"
            @input="handlerInput"
            v-bind="attrs"
        )
</template>
<script>
import {all2date}  from "ipro/dist/date/DateUtils";
const now = new Date();
export default {
    name: "a-datepicker",

    data() {
        return {
            avalue: now
        }
    },

    props:{
        /**
         * 如果输入为空，则使用内置默认值派发
         */
        emitValueWhenBlank:{
            type:Boolean,
            defualt:false,
        },

        value:{
            default: __=>now,
            type:[Date, String, Number],
        },

        /**
         * 输出格式化
         * 设置为-ts-,timestamp会输出时间戳类型
         */
        outputFormater:{
            type:[String, Function],

            //%Y %d %m %H %M %S
            default:"",
        },
    },

    computed:{
        attrs(){
            const m = this;
            return {
                ...m.$attrs
            };
        },
    },


    watch:{
        value:{
            immediate: true,
            handler(input){
                const m = this;
                const {emitValueWhenBlank} = m;
                if (!input && emitValueWhenBlank) {
                    m.handlerInput(now);
                }
                m.avalue = all2date(input || now);
            }
        },
    },

    methods: {
        handlerInput(date) {
            const m = this;
            let ret = all2date(date);
            const {outputFormater} = m;
            //格式化
            if (m.outputFormater) {
                if (typeof m.outputFormater == "string") {
                    if (["timestamp", "-ts-"].includes(m.outputFormater)) {
                        ret = date * 1;
                    } else {
                        ret = date.format(outputFormater);
                    }
                } else {
                    ret = outputFormater(date);
                }
            }
            m.$emit("input", ret);
        }
    },

}
</script>
<style scoped lang="less">
.a-datepicker-comp {

}
</style>
