<template lang="pug">
    Form(
        ref="form"
        :model="form"
        :rules="rules"
        :label-width="labelWidth"
    ).co-form-comp
        template(v-for="item, index in items_clone_filtered")

            //自定义表单内容
            template(v-if="item.render")
                render(:render="item.render" :item="item" :items="items_clone" :form="form")

            FormItem(
                v-else
                :prop="item.prop"
                :label="item.label"
            )
                template(v-if="/^(text|textarea|password|)$/.test(item.type)")
                    Input(
                        :type="item.type"
                        v-model="form[item.prop]"
                        v-bind="item.attrs"
                        :placeholder="item.placeholder"
                    )
                template(v-if="/^(date)$/.test(item.type)")
                    DatePicker(
                        transfer
                        :value="_dateTransform(form[item.prop])"
                        @input="form[item.prop] = _dateTransform($event, 'Number')"
                        v-bind="item.attrs"
                        :placeholder="item.placeholder"
                    )
                template(v-if="/^(number|int)$/.test(item.type)")
                    InputNumber(
                        :value="_numberTransform(form[item.prop])"
                        @input="form[item.prop]=$event"
                        v-bind="item.attrs"
                        :placeholder="item.placeholder"
                    )
                template(v-else-if="item.type==='select'")
                    Select(v-model="form[item.prop]" v-bind="item.attrs" transfer)
                        Option(
                            v-for="opt,index in item.options"
                            :key="index"
                            :value="opt.value"
                        )   {{opt.name || opt.label || opt.title}}

                //布尔
                template(v-if="/^(bool|boolean)$/.test(item.type)")
                    Checkbox(
                        v-bind="item.attrs"
                        :true-value="item.trueValue"
                        :false-value="item.falseValue"
                        v-model="form[item.prop]"
                    ) {{booleanCheckLabelTransf(item, form[item.prop])}}

                template(v-else)
                    slot(
                        :name="item.type"
                        :item="item"
                        :form="form"
                        :all-items="items_clone"
                    )
</template>
<script>
    import Vue from "vue";

    let div = document.createElement("div");
    document.body.appendChild(div);
    var tl = new Vue({
        name: "text-length-compute",
        methods: {

            /**
             * 获取某段文字在特定容器下的大小
             * @param text
             * @param targetDom
             */
            get(text, targetDom) {
                const m = this;
                let elel = m.$refs.elel;
                elel.style.fnotSize = getComputedStyle(targetDom).fontSize;
                elel.innerText = text;
                return elel.offsetWidth;
            }
        },
        render(h){
            return h(
                "div",
                {
                    class:"text-length-compute-comp",
                    style: ` position: fixed; top: -100%; left: -100%; width: 0; height: 0; overflow: hidden; `
                },
                [
                    h(
                        "span",
                        {
                            ref: "elel",
                            style: `display: inline-block; white-space: nowrap`
                        }
                    )
                ]
            )
        }
    }).$mount(div);


    export default {
        name: "co-form",
        components:{
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
                type:Array,
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
                m.items.forEach(item=>{
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
        },
        watch:{

            //填充表单
            value(model) {
                const m = this;
                if (model) {
                    let form = Object.assign({}, m.form);
                    Object.keys(model).forEach(key=>{
                        form[key] = model[key];
                    })
                    m.form = form;
                }
            },


            //输出
            form: {
                deep:true,
                handler(form, _form) {
                    //console.log(form, _form);



                    this.$emit("input", form);
                }
            },


            //为form赋值
            items:{
                immediate: true,
                async handler(items){

                    const m = this;

                    //设置默认text，并且进行复制
                    items.forEach(item=>{
                        item.type = item.type || "text";

                        //增加默认属性
                        if (/^(text|textarea|password)$/.test(item.type)) {

                        }
                    })

                    //设置form键和值
                    m.form = items.reduce((form, item)=>{
                        if(item.prop){
                            setDefaultItemValue(item);
                            form[item.prop] = getDefaultValueByFormItemOption(item);
                        }

                        //表单初始化时候执行
                        if (item.formInitHook) {
                            item.formInitHook.call(m, form, item);
                        }

                        return form;
                    }, {});

                    //赋值，浅克隆
                    m.items_clone = [...items];

                    await m.$nextTick();

                    //计算最大宽度
                    m.labelWidth = m.calcLabelWidth();
                }
            },
        },

        methods: {

            //计算最大表单label的宽度
            calcLabelWidth(){
                const m = this;

                if (m.forceLabelWidth) {
                    return m.forceLabelWidth;
                }

                let maxLength = 0;
                m.items_clone.map(item=>{
                    let width = tl.get(item.label, m.$refs.form.$el);
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
                        resolve(m.form);
                    })
                })
            },

            /**
             * 重置
             */
            resetForm(){
                this.resetValues();
                this.$refs.form.resetFields();
            },

            reset() {
                this.resetForm();
            },

            //重置为默认值
            resetValues() {
                const m = this;
                m.items.forEach((el)=>{
                    m.form[el.prop] = getDefaultValueByFormItemOption(el);
                })
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
                if (typeof item.checkboxLabel == "undefined") {
                    return ""
                }else if (typeof Array.isArray(item.checkboxLabel)) {
                    let retIndex = value === item.trueValue ? 0 : 1;
                    return item.checkboxLabel[retIndex];
                }else{
                    return item.checkboxLabel;
                }
            }
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
        if (Array.isArray(validators)) {
            return validators.map(validator=>{
                //数组元素是函数，需要单独封装
                if (typeof validator == "function") {
                    return {validator}
                }else{
                    return validator;
                }
            })
        }else if (typeof validators == "function") {
            /**
             * 使用具名函数，名称以$开头,则为生成器
             * function $(vm){} 会被当做验证器的生成器
             * function (){}   会被直接当成验证器，函数是否按规则具名来区分
             */
            if (/^\$/.test(validators.name)) {
                return transformValidator.call(vm, validators(vm));
            }else{
                return [{validator: validators}];
            }
        }else if(validators.validator){
            return [validators];
        }else{
            return [];
        }
    }



    /**
     * 创建date
     * @param str
     * @returns {Date}
     */
    function parseDate(input) {

        //数字或者字符串时间戳
        if (typeof input == "number" || /^\d+$/.test(input + "")) {
            return new Date(input * 1);

        //空对象
        } else if (!input) {
            return new Date();

        //日期对象
        }else if (input.constructor == Date) {
            return input;
        }

        //日期字符串
        var parts = input.split(/[-:\sTZ\+年月日时分秒]/);
        return new Date(parts[0], parts[1] - 1, parts[2], parts[3] || 0, parts[4] || 0, parts[5] || 0);
    }




    /**
     * 设置item的默认属性
     */
    function setDefaultItemValue(item){
        if (/^(bool|boolean)$/.test(item.type)) {
            item.checkboxLabel = item.checkboxLabel || "";
            if (typeof item.trueValue == "undefined") {
                item.trueValue = true;
            }

            if (typeof item.falseValue == "undefined") {
                item.falseValue = false;
            }
        }
    }

    /**
     * 获取默认值
     * @param item
     */
    function getDefaultValueByFormItemOption(item){
        let value = item.value;

        //设置默认值
        if (typeof value == "undefined") {
            if (/^(bool|boolean)$/.test(item.type)) {
                value = item.falseValue;
            }else if (item.type == "number") {
                value = 0;
            }else if(item.type=="select" && item.options && item.options.length){
                value = item.options[0].value;
            }else{
                value = "";
            }
        }

        return value;
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
                min-width: 21em;
            }
        }



        .ivu-input-wrapper, .ivu-select {
            width: auto;
        }
    }
</style>
