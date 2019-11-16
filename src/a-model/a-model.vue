<template lang="pug">
    Modal.a-modal-comp(
        v-bind="modalOptions"
        v-on="modalListeners"
        ref="modal"
    )
        slot
        template( slot="footer" )
            slot(
                name="footer"
                :cancel-handler="cancelHandler"
                :confirm-handler="confirmHandler"
            )
                Button(type="warning" @click="cancelHandler" v-if="!noCancel") 取消
                Button(type="primary" @click="confirmHandler" v-if="!noOk") 确定
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
            }
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
            __handlerNext() {
                const m = this;
                m.visible=false;
                m.$emit("input", false);
            },

            confirmHandler() {
                const m = this;
                if (m.handler) {
                    m.handler(null, m.__handlerNext);
                }else{
                    m.__handlerNext();
                }
            },

            cancelHandler() {
                const m = this;
                if (m.handler) {
                    m.handler(1, m.__handlerNext);
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
<style scoped lang="less"></style>
