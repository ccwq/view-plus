<template lang="pug">
    Form(
        ref="form"
        :model="form"
        :rules="rules"
        :label-width="labelWidth"
        :class="{readonly, disabled}"
    ).co-form-comp
        template(v-for="item, index in items_clone_filtered")

            span.hide.form-item-placeholder(
                v-show="item.hideWhen(form)"
                :class="[ 'item-prop-placeholder-' + item.prop]"
            )

            //自定义表单内容


            //虚拟的值增加字段，没有显示
            template(v-if="item.virtual")
                //虚拟的
            template(v-else-if="item.render")
                render(
                    :render="item.render"
                    :item="item"
                    :items="items_clone"
                    :form="form"
                    :disabled="disabled"
                    :readonly="readonly"
                )

            //不使用formItem包裹(无法使用验证)
            template(v-else-if="item.noFormItem")
                slot(
                    :disabled="disabled"
                    :readonly="readonly"
                    :name="item.type"
                    :item="item"
                    :form="form"
                    :all-items="items_clone"
                    :formChangeHandler="formChangeHandler.bind(null, item)"
                )
            FormItem(
                v-else
                :prop="item.prop"
                :label="item.label"
                v-show="!item.hideWhen(form)"
                :class="item.formItemClass"
            )
                template(v-if="item.type=='label'")
                    span(v-bind="item.attrs") {{form[item.prop]}}
                template(v-if="/^(text|textarea|password|)$/.test(item.type)")
                    Input(
                        :type="item.type"
                        :value="form[item.prop]"
                        @input="formChangeHandler(item, $event)"
                        @keydown.native.13="handlerEnter($event, item, index)"
                        v-bind="item.attrs"
                        :placeholder="item.placeholder"
                        :class="item.itemClass"
                        :size="itemSize"
                    )
                template(v-if="/^(date)$/.test(item.type)")
                    DatePicker(
                        transfer
                        :value="_dateTransform(form[item.prop])"
                        @input="formChangeHandler(item, $event)"
                        v-bind="item.attrs"
                        :placeholder="item.placeholder"
                        :class="item.itemClass"
                        :readonly="readonly"
                        :size="itemSize"
                    )
                template(v-if="/^(number|int)$/.test(item.type)")
                    InputNumber(
                        :readonly="readonly"
                        :value="_numberTransform(form[item.prop])"
                        @input="formChangeHandler(item, $event)"
                        v-bind="item.attrs"
                        :placeholder="item.placeholder"
                        :class="item.itemClass"
                        @keydown.native.13="handlerEnter($event, item, index)"
                        :size="itemSize"
                    )

                template(v-else-if="item.type==='select'")
                    a-select(
                        :value="form[item.prop]"
                        @input="formChangeHandler(item, $event)"
                        v-bind="item.attrs"
                        transfer
                        :class="item.itemClass"
                        :size="itemSize"
                        :options="item.options"
                    )


                //布尔
                x-define(
                    v-if=`/^(bool|boolean)$/.test(item.type)`
                    :val="form[item.prop] + ''"
                    :attrs="item.attrs"
                ): template(
                    #default="{val, attrs}"
                )
                    Checkbox(
                        :disabled="disabled"
                        :readonly="readonly"
                        v-bind="attrs"
                        :value='val==attrs.trueValue?val:attrs.falseValue'
                        @input="formChangeHandler(item, $event)"
                        :class="item.itemClass"
                        :size="itemSize"
                    ): span {{booleanCheckLabelTransf(item, form[item.prop])}}

                template(v-else)
                    slot(
                        :disabled="disabled"
                        :readonly="readonly"
                        :name="item.type"
                        :item="item"
                        :form="form"
                        :all-items="items_clone"
                        :formChangeHandler="formChangeHandler.bind(null, item)"
                        :size="itemSize"
                    )
</template>
<script>
import Utils from "../Utils";
import get from "lodash/get";
import isPlainObject from "lodash/isPlainObject";
import {all2date as parseDate} from "ipro/src/date"
import {all2valueName as parseOptions} from "ipro/src/baseUtil";

/**
 * 文本宽度计算
 * @type {function(*, *=): number}
 */
const getTextWidth = (_=>{
    let div = document.createElement("div");
    div.innerHTML = `
            <div
                class="text-length-compute-comp"
                style ="position: fixed; top: -100%; left: -100%; width: 0; height: 0; overflow: hidden;"
            >
                <span style="display: inline-block; white-space: nowrap" ></span>
            </div>
        `;

    div = div.firstElementChild;
    document.body.appendChild(div);

    return function(text, targetDom){
        let el = div.firstElementChild;
        el.style.fnotSize = getComputedStyle(targetDom).fontSize;
        el.innerText = text;
        return el.offsetWidth;
    }
})();

import xDefine from "vue-iplus/src/comp/x-define"

export default {
    name: "co-form",
    components:{
        xDefine,
        render:{
            name: 'RenderCell',
            functional: true,
            props: {
                render: Function
            },
            render: (h, ctx) => {
                return ctx.props.render(h, ctx.data.attrs);
            }
        }
    },
    data() {
        const m = this;
        return {

            // form,
            labelWidth: 80,

            form:{},

            items_clone:[],
        }
    },
    props: {
        itemSize:{
            default:"default",
        },

        //宽度修正
        labelWidthOffset:{
            type:Number,
            default:20,
        },

        //强制表单项宽度
        forceLabelWidth:{
            type:Number,
            default:0,
        },

        //最大表单名称宽度
        maxLabelWidth: {
            type:Number,
            default:9999,
        },

        //表单项
        items:{
            type:[Array, Promise, Function],
            default(){
                return [
                    {
                        value:"",
                        prop:"username",
                        label:"用户名",
                        placeholder:"请输入用户名",
                        validators:[],
                        type:"",
                        options: []
                    }
                ];
            }
        },


        //用来填充表格//编辑时用
        value:{
            type:[Object, String],
            default:""
        },



        //禁用所有表单元素
        disabled: {
            type: Boolean,
            default: false,
            validator(val){
                if (typeof val == "string" && val) {
                    return false;
                }else{
                    return true;
                }
            }
        },

        //禁用所有表单元素
        readonly: {
            type: Boolean,
            default: false,
        },
    },
    computed: {

        items_clone_filtered() {
            const m = this;

            return m.items_clone.filter(item=>{
                //当form变化时候，隐藏或者展示某些项目
                if (item.hideHook) {
                    let hide = item.hideHook(m.form);
                    return !hide;
                }else{
                    return true;
                }
            })
        },


        //所有的表单验证规则
        rules() {
            const m = this;
            let ret = {};
            m.items_clone.forEach(item=>{
                if (item.validators) {
                    ret[item.prop] = transformValidator.call(m, item.validators );
                }

                /**
                 * 自定义验证
                 * {
                 *     customValidators:{
                 *         foo:[
                 *             {
                 *                 validator(rule, value, next, form){
                 *
                 *                 }
                 *             }
                 *         ]
                 *     }
                 * }
                 */
                if (item.customValidators) {
                    Object.keys(item.customValidators).forEach(key=>{
                        if (ret[key]) {
                            console.warn("validator be overwrite:", ret[key]);
                        }
                        ret[key] = transformValidator.call(m, item.customValidators[key] );
                    })
                }
            })
            return ret;
        },

        //扁平的表单
        //表单项支持定义复合表单域
        plainForm(){
            const m = this;
            let form = {...m.form};
            m.items_clone.filter(item=>item.originProp).forEach(item=>{
                delete form[item.prop]
            })
            return form;
        }
    },
    watch:{

        //填充表单
        value:{
            immediate: true,
            async handler(model) {
                const m = this;

                if (!model) {
                    model = {};
                }

                await m.$nextTick();

                //复制一个
                let form = Object.assign({}, m.form);

                m.items_clone.forEach(item=>{
                    const {prop, type, attrs} = item;
                    let key = prop;

                    //多字段表单项
                    if (item.originProp) {
                        key = item.key;
                        form[key] = item.originProp.reduce((v, skey) => {
                            if (typeof model[skey] != "undefined") {
                                v[skey] = model[skey];
                            }
                            return v;
                        }, {});
                    }else{

                        //原先的数据
                        const oval = model[key];

                        //是数字或者bool的时候，oval等于0
                        if (oval==="" && (type.startsWith("bool") || type == "number" || type == "select")) {
                            form[prop] = getDefaultValueByFormItemOption(item);

                        //日期格式，并且没有设置有效值
                        }else if(!oval && type == "date"){
                            form[prop] = getDefaultValueByFormItemOption(item);

                        //值未设置
                        }else if(typeof oval == "undefined"){
                            form[prop] = getDefaultValueByFormItemOption(item);

                        //设置当前值
                        }else{
                            form[prop] = model[prop];
                        }

                    }
                })

                m.setForm(form);
            }
        },


        //输出
        // form: {
        //     deep:true,
        //     handler(form, _form) {
        //         this.$emit("input", form);
        //     }
        // },

        //为form赋值
        items:{
            immediate: true,
            async handler(items){
                const m = this;
                let __items = items;

                if (!__items) {
                    return console.warn("表单配置不能为空");
                }

                if (typeof __items == "function") {
                    __items = __items(m);
                }

                if (!__items) {
                    return console.warn("表单配置不能为空");
                }

                if (__items.then) {
                    __items = await __items;
                }

                if (!__items) {
                    return console.warn("表单配置不能为空");
                }

                if (!Array.isArray(__items)) {
                    return console.warn("表单配置需要为数组");
                }


                items = __items;

                //设置默认text，并且进行复制
                items.forEach((item,index)=>{
                    item.type = item.type || "text";
                    item.hideWhen = _=>false;
                    let defItemClass = `co-form-input co-input-type-${item.type} co-input-prop-${item.prop}`;

                    if (item.itemClass) {
                        item.itemClass += ` ${defItemClass}` ;
                    }else{
                        item.itemClass = defItemClass;
                    }

                    //2的倍数
                    let mult2Str = !(index % 2) ? " mult-2" : "";

                    //3的倍数
                    let mult3Str = !(index % 3) ? " mult-3" : "";

                    let defFormItemClass =`co-item co-item-prop-${item.prop} co-item-type-${item.type} co-item-index-${index}${mult2Str}${mult3Str}`;

                    if (item.formItemClass) {
                        item.formItemClass += ` ${defFormItemClass}` ;
                    }else{
                        item.formItemClass = defFormItemClass;
                    }

                    setDefaultItemValue(item);
                })

                //设置form键和值
                let _form = items.reduce((form, item)=>{
                    if(item.prop){
                        resetFormValueByItem(form, item);
                        form[item.prop] = item.value;
                    }

                    //表单初始化时候执行
                    if (item.formInitHook) {
                        item.formInitHook.call(m, form, item);
                    }

                    return form;
                }, {});
                m.setForm(_form);

                //赋值，浅克隆
                m.items_clone = [...items];

                await m.$nextTick();

                //计算最大宽度
                m.labelWidth = m.calcLabelWidth();
            }
        },
    },

    methods: {

        //回车
        handlerEnter(e, item, index){
            const m = this;
            m.$emit("enter", index);
        },

        formChangeHandler(item,value) {
            const m = this;
            const {prop, formater: dateFormater, type} = item;
            let _value = value;
            const oldValue = m.form[prop];
            if (item.originProp) {
                item.originProp.forEach(key=>{
                    if (key in value) {
                        m.form[key] = value[key];
                    }
                })
            }

            //日期类型特殊处理
            if (type.startsWith("date")) {

                const tmp = parseDate(value);
                let formater = "Y-m-d";

                //设置了日期格式
                if (dateFormater) {
                    _value = tmp.format(dateFormater);
                }else if (oldValue instanceof Date) {
                    _value = tmp;
                }else if (typeof oldValue == "number") {
                    _value = tmp * 1;
                }else if(!oldValue){
                    _value = tmp.format("%s");
                }else if (typeof oldValue == "string") {
                    let leng = oldValue.trim().split(/[\s\:\-]/);
                    if (leng == 2) {
                        formater = "Y-m";
                    }else if (leng == 3) {
                        formater = "Y-m-d";
                    }else if(leng == 7){
                        formater = "Y-m-d h:i:s";
                    }else if (length == 8) {
                        formater = "%Y-%m-%d %H:%M:%S:%N"
                    }
                    _value = tmp.format(formater);
                }
            }

            if (oldValue === _value) {
                return;
            }

            m.form[prop] = _value;

            //派发表单改变
            m.$emit("input", m.plainForm);
        },

        //计算最大表单label的宽度
        calcLabelWidth(){
            const m = this;
            if (m.forceLabelWidth) {
                return m.forceLabelWidth;
            }

            let maxLength = 0;
            m.items_clone.map(item=>{
                let width = getTextWidth(item.label, m.$refs.form.$el);
                if (width > maxLength) {
                    maxLength = width;
                }
            });

            maxLength = Math.min(maxLength, m.maxLabelWidth);
            return maxLength + m.labelWidthOffset;
        },


        /**
         * 获取数据
         * @returns {Promise<any>}
         */
        getData(){
            const m = this;
            return new Promise((resolve, reject) => {
                m.$refs.form.validate(valid=>{
                    if (!valid) {
                        reject("");
                    }
                    resolve(m.plainForm);
                })
            })
        },

        /**
         * 重置
         */
        resetForm(delay=12){
            return new Promise((resolve, reject) => {
                setTimeout(__ => {
                    this.resetValues();
                    this.$refs.form.resetFields();
                    resolve();
                }, delay);
            })
        },

        reset() {
            return this.resetForm();
        },

        //重置为默认值
        resetValues() {
            const m = this;
            let form = {...m.form};
            m.items_clone.filter(el => el.prop).forEach((item) => {
                resetFormValueByItem(form, item);
            });
            m.setForm(form);
        },

        //仅重置验证
        resetValidator() {
            this.$refs.form.resetFields();
        },

        /**
         * 各种日期转换为目标格式
         * @param input
         * @param outputType "Date|Number|格式化字符串"
         */
        _dateTransform(input, outputType="Date") {
            let date = parseDate(input);
            if (outputType == "Date") {
                return date;
            }else if (outputType == "Number") {
                return date * 1;
            }else{
                return dateFormat(date, outputType);
            }
        },

        /**
         * 接收各种数字
         * @private
         */
        _numberTransform(input) {
            if (typeof input == "number") {
                return input;
            }
            let out = parseFloat(input);

            if (isNaN(out)) {
                return 0;
            }else{
                return out;
            }
        },

        /**
         * 布尔选择的label转换
         * @param item
         * @param value
         */
        booleanCheckLabelTransf(item, value) {
            const {attrs} = item;
            if (typeof item.checkboxLabel == "undefined") {
                return ""
            }else if (Array.isArray(item.checkboxLabel)) {
                let retIndex = value === attrs.trueValue ? 0 : 1;
                return item.checkboxLabel[retIndex];
            }else{
                return item.checkboxLabel;
            }
        },


        setForm(form){
            const m = this;
            if (!form) {
                debugger;
            }
            m.form = form;
        },
    },

    mounted() {
        const m = this;

    }
}


/**
 * 验证规则对象整理你
 * @param validators
 * @returns {({validator}|*)[]|{validator: *}|*}
 */
function transformValidator(validators){
    var vm = this;
    //使用vm注入也会传入数组，根据第一个参数是否为字符串进行区分
    if (Array.isArray(validators) && typeof validators[0] == 'string') {
        let [injectType, validator] = validators;
        validators = {injectType, validator}
    }

    if (!Array.isArray(validators)) {
        validators = [validators];
    }

    return validators.map(validator => {
        //数组元素是函数，需要单独封装
        if (typeof validator == "function") {
            return {validator}
        } else if (isPlainObject(validator)) {
            let {injectType, validator: va} = validator;
            if (injectType == "vm") {
                return va(vm);
            } else {
                console.warn("未开放注入类型:" + injectType);
            }
        }
        return validator;
    });
}


/**
 * 设置item的默认属性
 */
function setDefaultItemValue(item){
    const {
        type,
        attrs = {},
        disabled
    } = item;
    if (/^(bool|boolean)$/.test(type)) {
        item.checkboxLabel = item.checkboxLabel || "";

        if (typeof item.trueValue != "undefined") {
            attrs.trueValue = item.trueValue;
        }
        if (typeof item.falseValue != "undefined") {
            attrs.falseValue = item.falseValue;
        }

        if (typeof attrs.trueValue == "undefined") {
            attrs.trueValue = true;
        }

        if (typeof attrs.falseValue == "undefined") {
            attrs.falseValue = false;
        }
        //增加默认属性
    } else if (/^(text|textarea|password)$/.test(item.type)) {

    }

    //对disabled的单独处理
    if (typeof disabled != "undefined") {
        attrs.disabled = disabled;
        item.attrs = attrs;
    }


    item.attrs = attrs;
}


/**
 * 获取默认值
 * @param item
 */
function getDefaultValueByFormItemOption(item){
    let value = item.value;
    const {type, props, attrs, prop, options} = item;
    const {trueValue, falseValue, max, min} = attrs || {};

    if (/^bool/.test(type)) {
        if (value != trueValue) {
            value = falseValue;
        }
    }else if (type == "number") {
        if (typeof value != "number") {
            value = 0;
        }
        if (typeof max == "number") {
            if (value > max) {
                value = max;
            }
        }else if (typeof min == "number") {
            if (value < min) {
                value = min;
            }
        }
    }else if(type=="select"){
        let _options = parseOptions(options);
        if (_options.then) {
            console.warn("options为promise无法设置默认值");
            value = "";
        }else{

            if (_options.find) {
                const valIndex = _options.find(el => el.value == value);
                if (valIndex == -1) {
                    value = get(item, "_options.0.value");
                }
            }
        }

    //日期类型
    }else if(type == "date"){
        value = new Date;
    }
    return value;
}


/**
 *
 * @param item
 * @param form
 */
function resetFormValueByItem(form, item){

    //prop是数组的情况
    if(Array.isArray(item.prop)){

        _temp(item.value, item.prop, form);

        item.originProp = item.prop;
        item.prop = item.originProp.join(",");

        //合并的form值，主要用来进行规则验证
        form[item.prop] = item.originProp.reduce((ret, key, index)=>{
            if(Array.isArray(item.value)){
                ret[key] = item.value[index];
            }else if(isPlainObject(item.value)){
                ret[key] = item.value[key];
            }else{
                ret[key] = "";
            }
            return ret;
        }, {})

        //拥有原始props的情况
    }else if(item.originProp){
        _temp(item.value, item.originProp, form);

        //普通情况
    } else{
        let value = getDefaultValueByFormItemOption(item);
        form[item.prop] = value;
    }


    function _temp(value, propLs, form){
        propLs.forEach((key, index)=>{
            let _value;
            if (Array.isArray(value)) {
                _value = value[index]
            }else if (isPlainObject(value)){
                _value = value[key];
            }else{
                _value = "";
                console.warn("表单项初值无效", propLs);
            }
            form[key] = _value;
        })
    }
}
</script>
<style lang="less">
.co-form-comp {
    position: relative;
    .error_layer{
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: fade(#fff, 66);
        z-index: 2;

        .ivu-alert{
            margin-top: -4em;
        }
    }

    .ivu-checkbox{
        +span{
            &:after{
                content:"";
                display: inline-block;
            }
        }
    }


    &.ivu-form{
        .ivu-input-wrapper, .ivu-select{
            width: auto;
        }
    }


    //样式定制
    &.min-gap{
        .ivu-form-item{
            margin-bottom: 15px;
        }

        .ivu-form-item-error-tip{
            font-size: 12px;
            padding-top: 2px;
        }

        //最小宽度
        .ivu-input-wrapper, .ivu-select {
            //min-width: 21em;
        }
    }

    &.__form_item_inline_flex{
        .ivu-form-item{
            display: inline-flex;
        }
    }
    &.__form_item_flex{
        .ivu-form-item{
            display: flex;
        }
    }


    .ivu-input-wrapper, .ivu-select {
        width: auto;
    }
}
</style>
