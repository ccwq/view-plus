<template lang="pug">
    .a-switch-comp(:class="{sleep:sleeping, disabled}" @click="handlerClick")
        slot(name="start" :title="title")
            span.pr05(v-if="title"): b(v-text="title")

        Checkbox(
            ref="switcher"
            v-if="checkbox"
            v-bind="attrs"
            @input="handlerChange($event)"
            @click.native.stop="noop"
        ): slot
        template(v-else): i-switch(
            ref="switcher"
            v-if="attrs"
            v-bind="attrs"
            @input="handlerChange"
            @click.native.stop="noop"
        ).mr05
            span.__label(slot="open")   {{onLabel}}
            span.__label(slot="close")  {{offLabel}}
        slot(name="end" :title="title")
        slot(v-if="!checkbox")
</template>
<script>

const noop = _=>_;

const labelValueParser = function(origin){
    if (!origin) {
        return [];
    }
    let label;
    if(Array.isArray(origin)){
        label = origin.map(l=>l+"");
    }else{
        label = (origin + "").split(",");
    }
    if (label.length >= 2) {
        return label;
    } else {
        return [label, label].flat()
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

        disabled:{
            type:Boolean,
            default:false,
        },

        checkbox:{
            type:Boolean,
            default:false,
        },

        disableLabelClick:{
            type:Boolean,
            default: false,
        },

        sleepWhenOn:{
            type:Boolean,
            default: false,
        },
        sleepWhenOff:{
            type:Boolean,
            default: false,
        },

        //单击无效
        sleep:{
            type:Boolean,
            default: false,
        },

        //开关上面的字
        labels:{
            type:[String, Array],
            default:"开,关"
        },

        //定义选中或者非选中状态的值
        values:{
            type:[String, Array],
            default:"",
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
        sleeping(){
            const m = this;
            const {sleepWhenOn, sleepWhenOff, sleep, disabled, on, off} = m;

            if (sleepWhenOn) {
                return on;
            }

            if (sleepWhenOff) {
                return off;
            }

            return sleep || disabled;
        },

        valueLs(){
            let [trueValue = "true", falseValue = "false"] = labelValueParser(this.values);
            return [trueValue, falseValue];
        },

        lableLs(){
            let [on = "开", off = "关"] = labelValueParser(this.labels);
            return [on, off];
        },

        attrs(){
            if (this.data == VALUE_BLANK) {
                return "";
            }
            let [trueValue, falseValue] = this.valueLs;


            const value = this.data + "";
            return {
                ...this.$attrs,
                value,
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


        on(){
            const {data} = this;
            let [trueValue = true, falseValue = false] = labelValueParser(this.values);
            return data == trueValue;
        },

        off(){
            const {data} = this;
            let [trueValue = true, falseValue = false] = labelValueParser(this.values);
            return data == falseValue;
        },
    },
    methods: {
        noop,
        /**
         * 状态改变进入,
         * @param value 改变的值switch模式为true false,checkbox模式为trueValue, falseValue
         */
        handlerChange(value){
            const m = this;
            const {checkbox, on, off, valueLs: [trueValue, falseValue]} = m;

            let ret;

            if (value === "true") {
                ret = true;
            }else if (value === "false") {
                ret = false;
            }else{
                ret = value;
            }

            m.$emit('input', ret);
            m.data = ret;
        },

        handlerClick() {
            if (this.disableLabelClick) {
                return;
            }
            this.$refs.switcher.$el.click();
        }
    },

    mounted() {
        const m = this;
        m.$watch("value", {
            immediate: true,
            handler(value) {
                value = value + "";
                let values = m.valueLs;
                if (values.includes(value)) {
                    m.data = m.value ;
                } else {
                    m.data = values[1];
                }
            },
        });
    }
}
</script>
<style lang="less">
.a-switch-comp {
    display: inline-block;
    min-width: 5em;
    .__label{
        white-space: nowrap;
        cursor: default;
    }
    &.sleep{
        pointer-events: none;
        .ivu-switch{

        }
    }


    &.disabled{
        opacity: 0.4;
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
