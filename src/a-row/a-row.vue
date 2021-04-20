<template lang="pug">
    .a-row-comp.row(
        :class="{between,around}"
    )
        slot(name="label")
            b(v-if="label") {{label}}
        .flex.fx1.content.ai-center: slot
        slot(name="end")
            b(v-if="end") {{end}}

</template>
<script>
import $ from "jquery"
import debounce from "lodash/debounce"
export default {
    name: "a-row",
    props: {
        "label":String,
        "end":String,
        "between":Boolean,
        "around":Boolean,
        "autoWidth":Boolean,
    },


    debounce: {
        calcWidth_60(){
            const m = this;

        },
        handlerResize() {
            const m = this;

        }
    },

    mounted(){
        const m = this;
        const $$parent = $(m.$el).parent();
        const ekey = ".ev-" + m._uid;

        let $el = $(m.$el);

        const calcWidth = debounce(__ => {
            $el.addClass("_anchor");
            if ($el.nextAll("._anchor").length) {
                return;
            }

            let $sibLs = $el.siblings(".a-row-comp").add(m.$el);

            if (m.$attrs.name == 445) {
                // debugger;
            }

            let labels = $sibLs.find(">b").map((i, lb)=>lb.textContent.trim()).toArray();

            let maxLeng = Math.max.apply(
                null,
                labels.map(el => {
                    return el.replace(/[\u4e00-\u9fff]/g, "ss").length
                })
            )
            maxLeng = parseInt(maxLeng / 2);
            maxLeng = maxLeng + 2;
            $sibLs.find(">b").css({
                width: maxLeng + "em"
            });
        }, 200);

        m.$watch("autoWidth", {
            immediate:true,
            handler(autoWidth) {
                m.$el.parentElement.classList.add("a-row-content");
                if (autoWidth) {
                    setTimeout(calcWidth);
                    $$parent.on("a-row-resize" + ekey, function () {
                        calcWidth();
                    });
                }else{
                    $$parent.trigger("a-row-resize");
                }
            }
        })
        m.__destroy.then(resp=>{
            $$parent.off(ekey);
        })

    }
}
</script>
<style lang="less">

.row-content-rule(){
    >.row{
        padding: 0.5em 0;

        >b{
            white-space: nowrap;
        }

        &:not(.db) {
            display: flex;
            align-items: center;
            justify-content: flex-start;
        }

        >*{
            margin-right: 0.75rem;
            &:last-child{
                margin-right: 0;
            }
        }
    }
}

.a-row-content{
    .row-content-rule;
    .a-row-comp{
        padding: 0;
        min-height: 30px;
        display: flex;
        align-items: center;
        box-sizing: border-box;
        &.between{
            .content{
                justify-content: space-between;
            }
        }
        &.around{
            .content{
                justify-content: space-around;
            }
        }

        &.lr{
            >b{
                text-align: right;
                margin-right: 0.5em;
            }
        }

        &.__narrow{
            .content{
                flex-grow: unset;
            }
        }
    }

    &.lr{
        >.a-row-comp{
            >b{
                text-align: right;
                margin-right: 0.5em;
            }
        }
    }
}
</style>
