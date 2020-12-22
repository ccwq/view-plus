<template lang="pug">
    .a-switch-comp
        span.pr05(v-if="!labelRight")
            b(v-text="title")
            slot
        i-switch(
            v-if="attrs"
            v-bind="attrs"
            @input="$emit('input', $event); data=$event"
        )
            span.__label(slot="open")   {{onLabel}}
            span.__label(slot="close")  {{offLabel}}
        span.pl05(v-if="labelRight")
            b(v-text="title")
            slot
</template>
<script>

const labelValueParser = function(origin){
    if (!origin) {
        return [];
    }
    let label;
    if (typeof origin == "string") {
        label = origin.split(",");
    }else if(Array.isArray(origin)){
        label = origin;
    }
    if (label.length >= 2) {
        return label;
    } else {
        return [label, label].flat();
    }
}

const VALUE_BLANK = "value-blank-lKsUrwpj";


export default {
    name: "a-switch",

    data() {
        return {
            data: VALUE_BLANK,
        }
    },

    props: {

        //标题在右边
        labelRight:{
            type:Boolean,
            default: false,
        },

        //开关上面的字
        labels:{
            type:[String, Array],
            default:""
        },

        //定义选中或者非选中状态的值
        values:{
            type:[String, Array],
            default:"开,关"
        },

        //左边的标题
        title: {
            type:String,
            default:"",
        },

        //值
        value: {},
    },


    computed:{

        valueLs(){
            let [trueValue = true, falseValue = false] = labelValueParser(this.values);
            return [trueValue, falseValue];
        },

        lableLs(){
            let [on = "开", off = "关"] = labelValueParser(this.labels);
            return [on, off];
        },

        attrs(){
            let [trueValue = true, falseValue = false] = this.valueLs;
            if (this.data == VALUE_BLANK) {
                return "";
            }
            return {
                ...this.$attrs,
                value:this.data,
                trueValue,
                falseValue,
            }
        },

        onLabel(){
            return this.lableLs[0] || "开";
        },

        offLabel(){
            return this.lableLs[1] || "关"
        },
    },

    mounted() {
        const m = this;
        m.$watch("value", {
            immediate: true,
            handler(value) {
                let values = m.valueLs;
                if (values.includes(value)) {
                    m.data = m.value;
                } else {
                    m.data = values[0];
                }
            },
        });
    }
}
</script>
<style lang="less">
.a-switch-comp {
    .__label{
        white-space: nowrap;
    }
    .ivu-switch{
        width: auto;
        &:after {
            transition: all 0.45s;
            left: 0;
            transform: translate(0, 0%);
            margin-left: 2px;
        }

        .ivu-switch-inner{
            transition: all 0.45s;
            position: relative;
            left: 0;
            margin-left: 2.2em;
            margin-right: 0.5em;
        }
        &-checked{
            &:after {
                left: 100%;
                transform: translate(-100%);
                margin-left: -2px;
            }
            .ivu-switch-inner{
                margin-left: 0.5em;
                margin-right: 2.2em;
            }
        }
    }

    .ivu-switch-checked:after{
    }
}
</style>
