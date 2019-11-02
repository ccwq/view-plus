<template lang="pug">
    .auto-height-comp
        .protect
            slot

</template>
<script>
    export default {
        name: "auto-height",

        props: {
            offset:{
                type:Number,
                default:0,
            }
        },

        debounce: {
            resizeHandler_180() {
                this.$emit("input", this.$el.offsetHeight + this.offset);
            }
        },

        mounted() {
            window.addEventListener("resize", this.resizeHandler);
            this.resizeHandler();
        },

        beforeDestroy() {
            window.removeEventListener("resize", this.resizeHandler);
        }

    }
</script>
<style scoped lang="less">
    .auto-height-comp {
        position: relative;
        box-sizing: border-box;
        height: 100%;
        .protect{
            position: absolute;
            width: 100%;
            height: 100%;
        }
    }
</style>
