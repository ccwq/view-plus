<template lang="pug">
    Modal.a-modal-comp(
        v-bind="modalOptions"
        v-on="modalListeners"
        ref="modal"
        :class="{'protect-content':protectContent, disabled}"
    )
        slot(name="header" slot="header")
        slot
        template( slot="footer" )
            slot(
                name="footer"
                :cancel-handler="cancelHandler"
                :confirm-handler="confirmHandler"
            )
                slot(name="footer-before")
                Button(type="warning" @click="cancelHandler" v-if="!noCancel") 取消
                Button(type="primary" @click="confirmHandler" v-if="!noOk") 确定
                slot(name="footer-after")
</template>
<script>
    export default {
        name: "a-modal",

        data() {
            return {
                visible: false,
                loading:false,
            }
        },

        props:{
            beforeOpen:{
                type:[Function],
                default:next=>next(),
            },

            beforeClose:{
                type:[Function],
                default:next=>next(),
            },
            noOk:{
                default:false,
                type:Boolean,
            },

            noCancel:{
                default:false,
                type:Boolean,
            },

            value: {
                type:Boolean,
                default:false,
            },

            /**
             * @type Function
             * @param isCancel  如果有值，说明是取消
             * @param next      执行该函数以关闭
             */
            handler: {
                type: [Function, String],
                default:"",
            },


            //保护内容避免被单击
            protectContent:{
                default:false,
                type:Boolean,
            },

            disabled:{
                default:false,
                type:Boolean,
            },
        },
        computed: {
            modalOptions() {
                const m = this;
                return {
                    ...m.$attrs,
                    value: m.visible,
                }
            },

            modalListeners() {
                const m = this;
                return {
                    ...m.$listeners,
                    "on-cancel":m.cancelHandler,
                }
            }
        },

        watch:{
            value: {
                immediate:true,
                handler(value) {
                    const m = this;
                    if (value) {
                        m.beforeOpen( _=> m.visible = true);
                    }else{
                        m.beforeClose(_=> m.visible = false);
                    }
                }
            }
        },



        methods: {

            /**
             * 关闭的实际操作
             * @private
             */
            __handlerNext() {
                const m = this;
                m.visible=false;
                m.$emit("input", false);
            },

            /**
             * 确认的处理。支持传入参数到handler
             * @param params
             */
            confirmHandler(...params) {
                const m = this;
                if (m.handler) {
                    m.handler(null, m.__handlerNext, ...params);
                }else{
                    m.__handlerNext();
                }
            },

            /**
             * 取消的吹，支持传递多余的cancel
             * @param params
             */
            cancelHandler(...params) {
                const m = this;
                if (m.handler) {
                    m.handler(1, m.__handlerNext, ...params);
                }else{
                    m.__handlerNext();
                }
            }
        },

        mounted() {
            const m = this;
            m.$refs.modal.close = function(){
                m.cancelHandler();
            }
        }

    }
</script>
<style lang="less">
    .a-modal-comp{
        &.disabled{
            .ivu-modal-content{
                pointer-events: none;
            }
        }
    }
</style>
