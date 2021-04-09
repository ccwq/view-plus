<template lang="pug">
    v-box.a-table-comp(:offset-y="offset")
        template(#header=""): slot(name="header")
        template(#footer=""): slot(name="footer")
        template(#default="{height}")
            Table.__table(
                :highlight-row="selectMode"
                :columns="tColumns"
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
import _get from "lodash/get";
import {columnDef} from "../index";

export default {
    name: "a-table",
    components: {vBox},

    data() {
        return {

            //当前选中的row
            //selectRow:"",

            //是否开启选择
            selectMode: false,

            //当前选中的行
            selectIndex: -1,

            dataLs: [],

            tColumns: [],
        }
    },

    props: {

        /**
         * 行列合并的处理
         */
        spanMethod: {
            type: [Function, String],
            default: "",
        },


        /**
         * 定义同table的column配置
         */
        columns: {
            type: Array,
            default: _ => [],
        },

        /**
         * 这些列相邻单元数据相同将会合并
         */
        rowspanKeyLs: {
            default: "",
            type: [String, Array],
        },

        name: String,
        offset: {
            type: Number,
            default: 0,
        },

        data: {
            type: Array,
            default: _ => [],
        },

        selectRow: {
            type: [Array, Object, String],
            default: "-1"
        },

        //当数据切换之后，保持选中状态
        keepSelected: {
            type: Boolean,
            default: true,
        },


        /**
         * 数据的主键
         */
        mainKey: {
            type: String,
            default: "id"
        },

        defaultSelectedIndex: {
            default: -1
        }
    },

    computed: {
        attrs() {
            const m = this;

            const {spanMethod, rowspanKeyLs} = m;

            let ret = {
                ...this.$attrs,
                data: this.dataLs
            };

            if (rowspanKeyLs && rowspanKeyLs.length) {
                ret.spanMethod = m.spanMethodCallback;
            }

            if (spanMethod) {
                ret.spanMethod = spanMethod;
            }

            return ret;
        },

        listeners() {
            const m = this;
            return {
                ...this.$listeners,
                "on-current-change"(cur, old) {
                    m.$emit("on-current-change", cur, old);
                    //m.selectRow = cur || "";

                    if (cur) {
                        if (!m.mainKey in cur) {
                            m.selectIndex = m.dataLs.findIndex(el => _isEqual(el, cur));
                        } else {
                            m.selectIndex = m.dataLs.findIndex(el => el[m.mainKey] == cur[m.mainKey]);
                        }
                    } else {
                        m.selectIndex = -1;
                    }
                    m.update_selectRow(cur || "");
                }
            }
        },

        slotColumns() {
            return (this.columns || []).filter(el => el.slot);
        }
    },

    watch: {
        columns: {
            immediate: true,
            handler(columns) {
                const m = this;
                let {rowspanKeyLs} = m;
                columns = columns.map(el => {
                    if (Array.isArray(el)) {
                        return columnDef(...el);
                    } else {
                        return el;
                    }
                });

                if (rowspanKeyLs) {
                    if (typeof rowspanKeyLs == "string") {
                        rowspanKeyLs = rowspanKeyLs.trim().split(",")
                    }

                    const [colDicByKey, colIndexDicByKey] = columns.reduce((result, col, index) => {
                        const [colDicByKey, colIndexDicByKey] = result;
                        colDicByKey[col.key] = col;
                        colIndexDicByKey[col.key] = index;
                        return result;
                    }, [{}, {}]);

                    m.__rowspanCache = rowspanKeyLs

                        //去除不存在的列
                        .filter(key => colDicByKey[key])

                        //转换形象
                        .map(key => {
                                return {
                                    key,
                                    index: colIndexDicByKey[key],
                                    column: colDicByKey[key],
                                    data: "",
                                }
                            }
                        )
                    ;
                } else {
                    m.__rowspanCache;
                }

                m.tColumns = columns;
            },
        },
        data: {
            deep: true,
            immediate: true,
            handler(data) {
                const m = this;
                let ret;
                if (!data) {
                    ret = [];
                } else {
                    ret = data.map((el) => ({...el}));
                }

                if (m.__rowspanCache) {
                    m.__rowspanCache.forEach(cb => {
                        const {key, index, column} = cb;
                        let _data = Array(data.length).fill(0);
                        data.reduce((ret, row, _index) => {
                            let value = row[key];

                            if (ret.value == value) {
                                ret.count++;
                                _data[ret.point] = ret.count;
                            } else {
                                ret.count = 1;
                                ret.point = _index;
                                _data[_index] = 1;
                            }

                            ret.value = value;
                            return ret;
                        }, {count: 1, value: "", point: 0});
                        cb.data = _data;
                    });
                }

                m.dataLs = ret;

                //第一次默认选择相关
                let defSelRow = _get(data, m.defaultSelectedIndex);

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

        selectRow: {
            immediate: true,
            handler(value) {
                const m = this;
                m.selectMode = value !== "-1";
            }
        },
    },

    methods: {

        spanMethodCallback({row: r, column: c, rowIndex, columnIndex}) {
            const m = this;
            const {__rowspanCache: cache} = m;
            for (let i = 0; i < cache.length; i++) {
                let cb = cache[i];
                let {key, index, column, data} = cb;
                if (c.key == cb.key) {
                    return [data[rowIndex], 1];
                }
            }
        },


        update_selectRow(row) {
            const m = this;

            //避免无效改版
            if (_get(row, m.mainKey) != _get(m.selectRow, m.mainKey)) {
                m.$emit("update:selectRow", row);
            }
        }
    },
}
</script>
<style scoped>
.__table {
    width: 100%;
}
</style>
