<template lang="pug">
    v-box.a-table-comp(:offset-y="offset")
        template(#header=""): slot(name="header")
        template(#footer=""): slot(name="footer")
        template(#default="{height}")
            Table.__table(
                :highlight-row="selectMode"
                v-bind=`
                    {
                        ...attrs,
                        height,
                    }
                `
                v-on="listeners"
            )

                template(
                    v-for="col in slotColumns"
                    v-slot:[col.slot]="{row, column, index}"
                )
                    slot(:name="col.slot" :row="row" :column="column" :index="index")



</template>
<script>
    import vBox from "vue-iplus/src/comp/v-box"
    import _isEqual from "lodash/isEqual";
    export default {
        name: "a-table",
        components: {vBox},

        data(){
            return {

                //当前选中的row
                //selectRow:"",

                //是否开启选择
                selectMode:false,

                //当前选中的行
                selectIndex:-1,

                dataLs:[],
            }
        },

        props:{
            name:String,
            offset:{
                type:Number,
                default:0,
            },

            data: {
                type:Array,
                default:_=>[],
            },

            selectRow: {
                type:[Array, Object, String],
                default:"-1"
            },

            //当数据切换之后，保持选中状态
            keepSelected:{
                type:Boolean,
                default: true,
            },


            /**
             * 数据的主键
             */
            mainKey:{
                type:String,
                default:"id"
            },

            defaultSelectedIndex: {
                default: -1
            }
        },

        computed: {
            attrs(){
                return {
                    ...this.$attrs,
                    data: this.dataLs
                }
            },

            listeners(){
                const m = this;
                return {
                    ...this.$listeners,
                    "on-current-change"(cur, old){
                        m.$emit("on-current-change", cur, old);
                        //m.selectRow = cur || "";

                        if (cur) {
                            if(!m.mainKey in cur){
                                m.selectIndex = m.dataLs.findIndex(el => _isEqual(el, cur));
                            }else{
                                m.selectIndex = m.dataLs.findIndex(el=>el[m.mainKey] == cur[m.mainKey]);
                            }
                        }else{
                            m.selectIndex = -1;
                        }
                        m.update_selectRow(cur||"");
                    }
                }
            },

            slotColumns(){
                return (this.$attrs.columns||[]).filter(el=>el.slot);
            }
        },

        watch:{
            data: {
                deep:true,
                immediate: true,
                handler(data){
                    const m = this;
                    let ret;
                    if (!data) {
                        ret = [];
                    }else{
                        ret = data.map((el) => ({...el}));
                    }

                    m.dataLs = ret;

                    //第一次默认选择相关
                    let defSelRow = data?.[m.defaultSelectedIndex];
                    //当前没有选择状态//并且默认选择有值
                    if (!m.selectRow && defSelRow) {
                        m.update_selectRow(defSelRow);
                        m.selectIndex = m.defaultSelectedIndex;
                    }

                    //保持选择
                    if (m.keepSelected && m.selectMode) {
                        let el = ret[m.selectIndex];
                        if (el) {
                            el._highlight = true;
                            m.update_selectRow(el);
                        }
                    }
                },
            },

            selectRow:{
                immediate: true,
                handler(value){
                    const m = this;
                    m.selectMode = value !== "-1";
                }
            },
        },

        methods: {
            update_selectRow(row) {
                const m = this;

                //避免无效改版
                if (_.get(row, m.mainKey) != _.get(m.selectRow, m.mainKey)) {
                    m.$emit("update:selectRow", row);
                }
            }
        },
    }
</script>
<style scoped>
    .__table{
        width: 100%;
    }
</style>
