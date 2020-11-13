<template lang="pug">
    .a-date-range-comp.flex
        slot(name="label" v-if="!hideLabel"): b.pr05 统计时间范围:
        DatePicker(
            :placement="placement"
            transfer
            :size="size || 'default'"
            :editable="false"
            :style=`{
                width:inputWidthByType[date.type] + 'px'
            }`
            :type="date.type"
            :start-date="date.start"
            :value="datePickerValue"
            @on-change="datePickerValue=$event"
            v-bind="datePickerAttrs"
        )
        RadioGroup(v-model="date.type" v-show="!hideTypeSelect").ml18
            Radio(label="daterange") 自由选择
            Radio(label="year") 年
            Radio(label="month") 月
            Radio(label="date") 日
        template(v-if="!hideQuicklySelect").ml-auto
            b 快速选择:
            Button.cl-blue800-i(
                v-for=`item in [
                        ['一天内', [0, "day"]],
                        ['一周内', [-1, "week"]],
                        ['一月内', 1],
                        ['一季度内', 3],
                        ['半年内', 6],
                        ['一年内',  12]
                    ]`
                size="small"
                type="text"
                :key="item[0]"
                @click="selectShortcutHandler(item[1])"
            ) {{item[0]}}

</template>
<script>

import ipro from "ipro";
const now = new Date;

const inputWidthByType = {
    daterange: 200,
    year:85,
    month:110,
    date:120,
}

export default {
    name: "a-date-range",
    data() {
        const m = this;
        return {
            inputWidthByType,
            date:{
                type    :   "daterange",
                start   :   m.defaultDateRange.start,
                end     :   m.defaultDateRange.end,
            },
        }
    },

    props:{

        datePickerAttrs:{
            default:_=>({}),
            type:Object,
        },

        placement:String,

        size:{
            validator(v){

                //小中大
                return ["large", "", "default" , "small"].includes(v);
            },

            //或者是large
            default:"small"
        },

        /**
         * 隐藏快速选择
         * 本月，本半年，本年等
         */
        hideQuicklySelect:{
            type:Boolean,
            default:false
        },

        /**
         * 隐藏标签
         */
        hideLabel:{
            type:Boolean,
            default:false
        },

        /**
         * 隐藏时间范围类型选择
         */
        hideTypeSelect: {
            type:Boolean,
            default:false
        },

        /**
         * 固定显示模式
         */
        mode:{
            type:String,
            default:"daterange",
            validator(v){
                return [
                    "date",
                    "month",
                    "year",
                    "daterange",
                ].includes(v)
            }
        },

        /**
         * 默认时间范围
         */
        defaultDateRange:{
            type: Object,
            default: _=>{
                return {
                    start   :   now.clone().add(-1, "month"),
                    end     :   now.clone()
                }
            }
        },


        value:{
            type:Object,
            default(){

                const m = this;
                return m.defaultDateRange;
                //
                // return {
                //     start   :   now.clone().add(-1, "month"),
                //     end     :   now.clone()
                // }
            }
        },
    },

    computed: {

        /**
         * 当前选择的时间范围
         * @returns {{start: *, end: *}}
         */
        resultDate(){
            const m = this;
            const type = m.date.type;
            const date = m.date.end.clone();
            let start, end;
            if (type === "daterange") {
                start = m.date.start;
                end = m.date.end;
            }else if(type == "year"){
                start = date.clone().setToYearStart();
                end = date.clone().setToYearEnd();
            }else if(type == "month"){
                start = date.clone().setToMonthStart();
                end = date.clone().setToMonthEnd();
            }else if(type == "date"){
                start = date.clone().setToDayStart();
                end = date.clone().setToDayEnd();
            }
            return {start, end};
        },


        datePickerValue:{
            get(){
                const m = this;
                if (m.date.type == "daterange") {
                    return [
                        m.date.start,
                        m.date.end,
                    ]
                }else{
                    return m.date.end
                }
            },
            set(value){
                const m = this;
                if (Array.isArray(value)) {
                    m.date.start = ipro.DateUtils.parse2date(value[0]);
                    m.date.end = ipro.DateUtils.parse2date(value[1]);
                }else{
                    m.date.start = ipro.DateUtils.parse2date(value);
                    m.date.end = ipro.DateUtils.parse2date(value);
                }
            },
        },
    },

    watch:{
        value:{
            immediate:true,
            async handler(value){
                const m = this;
                let {start, end} = m.defaultDateRange;
                if (value) {
                    start   = value.start;
                    end     = value.end;
                }
                m.date.start = start;
                m.date.end = end;
            }
        },
        mode:{
            immediate:true,
            handler(v){
                this.date.type = v;
            }
        },
        resultDate:{
            immediate: false,
            handler(data){
                const m = this;
                m.$emit("input", data);
            },
        },
    },

    methods: {
        selectShortcutHandler(monthNum) {
            const m = this;
            let d = new Date;
            d.setToDayEnd();
            m.date.end = d;

            //自带单位
            if (Array.isArray(monthNum)) {
                d = d.clone()   .add(...monthNum);
            }else{
                d = d.clone().add(-monthNum, "month");
            }
            d.setToDayStart();
            m.date.start = d ;
            m.date.type = "daterange"
        }
    },

}
</script>
<style scoped lang="less">

</style>
