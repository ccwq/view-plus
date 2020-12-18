<template lang="pug">
    .a-switch-comp
        span.pr05(v-if="!labelRight")
            b(v-text="title")
            slot
        i-switch(v-bind="attrs" @input="$emit('input', $event); data=$event")
            span.__label(slot="open")   {{onLabel}}
            span.__label(slot="close")  {{offLabel}}
        span.pl05(v-if="labelRight")
            b(v-text="title")
            slot
</template>
<script>
export default {
    name: "a-switch",

    data() {
        return {
            data: this.value
        }
    },

    props: {
        labelRight:{
            type:Boolean,
            default: false,
        },

        labels:{
            type:[String, Array],
            default:"开,关"
        },

        title: {
            type:String,
            default:"",
        },
        value: {}
    },


    computed:{

        lableLs(){
            const m = this;
            if (typeof m.labels == "string") {
                return m.labels.split(",")
            }else{
                return m.labels;
            }
        },

        attrs(){
            return {
                ...this.$attrs,
                value:this.data,
            }
        },

        onLabel(){
            return this.lableLs[0] || "开";
        },

        offLabel(){
            return this.lableLs[1] || "关"
        },
    },

    watch: {
        value(){
            this.data = this.value;

        }
    },
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
