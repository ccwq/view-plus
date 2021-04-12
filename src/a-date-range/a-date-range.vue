<template lang="pug">

    //时间类型选择
    mixin typeSelect
        RadioGroup(
            :value="date.type"
            @input=`date.type=$event, handlerChange()`
            v-show="!hideTypeSelect"
            v-if="!modeTypeUseSelect"
        )
            Radio(:label="a[0]" v-for="a in modeLs" :key="a[0]") {{a[1]}}
        .dib: a-select(
            :options="modeLs"
            :value="date.type"
            @input=`date.type=$event, handlerChange()`
            v-show="!hideTypeSelect"
            size="small"
        )

    //- 时间条
    //- 正式内容
    .date-filter-bar-comp.flex
        slot(name="label"): b.pr05 {{title}}

        //时间模式
        template(v-if="modeLsFront")
            +typeSelect
            span.w10
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
            @on-change="datePickerValue=$event, handlerChange()"
            v-bind="datePickerAttrs"
        )

        //- 时间模式
        template(v-if="!modeLsFront")
            span.w10
            +typeSelect

        //- 快速选择
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
import aSelect from "../a-select"
import ipro from "ipro";

const now = new Date;
import {all2date} from "ipro/src/date/DateUtils"
import isPlainObject from "lodash/isPlainObject"

const modeLs = [
    ["daterange", "自由选择"],
    ["year", "年"],
    ["month", "月"],
    ["date", "日"],
];

const inputWidthByType = {
    daterange: 200,
    year: 85,
    month: 110,
    date: 120,
}

export default {
    name: "a-date-range",
    components: {
        aSelect,
    },
    data() {
        const m = this;
        return {
            inputWidthByType,
            date: {
                type: "daterange",
                start: m.defaultDateRange.start,
                end: m.defaultDateRange.end,
            },
        }
    },

    props: {

        /**
         * 输出格式化
         * 设置为-ts-,timestamp会输出时间戳类型
         */
        outputFormater:{
            type:[String, Function],

            //%Y %d %m %H %M %S
            default:"",
        },

        /**
         * 如果输入为空，则使用内置默认值派发
         */
        emitValueWhenBlank:{
            type:Boolean,
            defualt:false,
        },

        /**
         * 模式切换位置靠前
         */
        modeLsFront: {
            default: false,
            type: Boolean,
        },

        /**
         * 年月日选择使用select
         */
        modeTypeUseSelect: {
            default: false,
            type: Boolean,
        },

        /**
         * 用来隐藏特定的type模式
         */
        modeTypeExcluedLs: {
            default: "",
            type: [Array, String]
        },

        datePickerAttrs: {
            default: _ => ({}),
            type: Object,
        },

        placement: String,

        size: {
            validator(v) {

                //小中大
                return ["large", "", "default", "small"].includes(v);
            },

            //或者是large
            default: "small"
        },

        /**
         * 隐藏快速选择
         * 本月，本半年，本年等
         */
        hideQuicklySelect: {
            type: Boolean,
            default: false
        },

        /**
         * biaoti
         */
        title: {
            default: ""
        },

        /**
         * 隐藏时间范围类型选择
         */
        hideTypeSelect: {
            type: Boolean,
            default: false
        },

        /**
         * 固定显示模式
         */
        mode: {
            type: String,
            default: "daterange",
            validator(v) {
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
        defaultDateRange: {
            type: Object,
            default: _ => {
                return {
                    start: now.clone().add(-1, "month"),
                    end: now.clone()
                }
            }
        },


        /**
         * 传入起始时间的初始值
         * 合法输入
         * ["2015",  date//2016],
         * {start:date//201808, end:"20150910"}
         */
        value: {
            type: [Array, Object, String],
            default() {
                const m = this;
                return m.defaultDateRange;
            }
        },
    },

    computed: {
        modeLs() {
            const m = this;
            let typeExLs = m.modeTypeExcluedLs;
            if (typeof m.modeTypeExcluedLs == "string") {
                typeExLs = m.modeTypeExcluedLs.split(",");
            }
            const typeExDic = typeExLs.reduce((ret, type) => {
                ret[type] = 1;
                return ret;
            }, {});
            return modeLs.filter(type => !typeExDic[type[0]])
        },



        datePickerValue: {
            get() {
                const m = this;
                if (m.date.type == "daterange") {
                    return [
                        m.date.start,
                        m.date.end,
                    ]
                } else {
                    return m.date.end
                }
            },
            set(value) {
                const m = this;
                if (Array.isArray(value)) {
                    m.date.start = all2date(value[0]);
                    m.date.end = all2date(value[1]);
                } else {
                    m.date.start = all2date(value);
                    m.date.end = all2date(value);
                }
            },
        },
    },

    watch: {
        value: {
            immediate: true,
            handler(value) {
                const m = this;

                let hasInputBlank = false;

                let {start, end} = m.defaultDateRange;
                let _start, _end;

                if (Array.isArray(value)) {
                    [_start, _end] = value;
                } else if (isPlainObject(value)) {
                    _start = value.start;
                    _end = value.end;
                } else {

                    //字符串什么的不处理
                    hasInputBlank = true;
                    _start = start;
                    _end = end;
                }

                if (!_start || !_end) {
                    hasInputBlank = true;
                    if (!_start) {
                        _start = start;
                    }

                    if (!_end) {
                        _end = end;
                    }
                }

                m.date.start = all2date(_start);
                m.date.end = all2date(_end);


                //如果配置空置自动派发默认值，并且又空值
                if (m.emitValueWhenBlank && hasInputBlank) {
                    m.handlerChange();
                }
            }
        },
        mode: {
            immediate: true,
            handler(v) {
                this.date.type = v;
            }
        },
    },

    methods: {

        /**
         * 内部时间改变时进入
         */
        handlerChange(){
            const m = this;
            const type = m.date.type;
            const date = m.date.end.clone();
            let start, end;
            if (type === "daterange") {
                start = m.date.start;
                end = m.date.end;
            } else if (type == "year") {
                start = date.clone().setToYearStart();
                end = date.clone().setToYearEnd();
            } else if (type == "month") {
                start = date.clone().setToMonthStart();
                end = date.clone().setToMonthEnd();
            } else if (type == "date") {
                start = date.clone().setToDayStart();
                end = date.clone().setToDayEnd();
            }


            //格式化
            if (m.outputFormater) {
                if (typeof m.outputFormater == "string") {
                    if (["timestamp", "-ts-"].includes(m.outputFormater)) {
                        start = start * 1;
                        end = end * 1;
                    }else{
                        start = start.format(m.outputFormater);
                        end = end.format(m.outputFormater);
                    }

                }else{
                    start = m.outputFormater(start);
                    end = m.outputFormater(end);
                }
            }

            let ret;
            if (Array.isArray(m.value)) {
                ret = [start, end];
            } else {
                ret = {start, end};
            }

            m.$emit("input", ret);
        },
        selectShortcutHandler(monthNum) {
            const m = this;
            let d = new Date;
            d.setToDayEnd();
            m.date.end = d;

            //自带单位
            if (Array.isArray(monthNum)) {
                d = d.clone().add(...monthNum);
            } else {
                d = d.clone().add(-monthNum, "month");
            }
            d.setToDayStart();
            m.date.start = d;
            m.date.type = "daterange"
            m.handlerChange();
        }
    },
}

</script>
<style scoped lang="less">

</style>
