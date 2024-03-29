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
import isPlainObject from "lodash/isPlainObject";
import _get from "lodash/get";
import {columnDef} from "../index";


/**
 *
 * @param colDefineLs
 * @param prevRow
 * @param row
 * @param currentDef
 * @param simpleMerge
 * @returns {boolean|*}
 */
const judgeCellMergeHelper1 = function(colDefineLs, prevRow, row, currentDef, simpleMerge=true){
    const {key, index, column} = currentDef;
    if (simpleMerge) {
        return prevRow[key] == row[key];
    }else{
        let _tempLs = colDefineLs.slice(0, index + 1);
        return _tempLs.reduce((result, {key})=>{
            if (_get(prevRow, key) != _get(row, key)) {
                result = false;
            }
            return result;
        }, true);
    }
}
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

        /**
         * 单元格合并策略
         * simple合并策略是只要纵向相邻单元格值相同，就执行合并
         * strict合并策略会考虑前置单元格的值是否都相同，只有都相同才会合并自身
         * simple和strict
         */
        rowspanMergePolicy:{
            default:"simple",
            validator(value) {
                return ["simple", "strict"].includes(value)
            }
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
                    m.updateSelectRow(cur || "");
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
                        data.reduce((prevToken, row, _index) => {
                            let value = row[key];
                            const willMerge = judgeCellMergeHelper1(m.__rowspanCache, prevToken.row, row, cb, "strict"!=m.rowspanMergePolicy);
                            if (willMerge) {
                                prevToken.count++;
                                _data[prevToken.point] = prevToken.count;
                            } else {
                                prevToken.count = 1;
                                prevToken.point = _index;
                                _data[_index] = 1;
                            }

                            prevToken.value = value;
                            prevToken.row = row;
                            return prevToken;
                        }, {count: 1, value: "", point: 0, row:""});
                        cb.data = _data;
                    });
                }

                let oldDataLs = m.dataLs;
                m.dataLs = ret;

                //第一次默认选择相关
                let defSelRow = _get(data, m.defaultSelectedIndex);
                if (m.selectRow==-1) {
                    //并且默认选择有值
                    if (defSelRow) {
                        m.updateSelectRow(defSelRow);
                    m.selectIndex = m.defaultSelectedIndex;
                }
                }else{
                    let sindex = m.getSelectRowIndex();
                    if (sindex == -1) {
                        sindex = m.selectIndex;
                    }
                    if (sindex == -1) {
                        sindex == m.defaultSelectedIndex;
                    }
                //保持选择
                    if (m.keepSelected) {
                        let el = ret[sindex];
                    if (el) {
                        el._highlight = true;
                            m.updateSelectRow(el);
                        }
                    }
                }
            },
        },

        selectRow: {
            immediate: true,
            handler(value) {
                const m = this;
                m.selectMode = value !== "-1";
                const rowIndex = m.dataLs.findIndex(el => {
                    let targetId
                    if (typeof value == "number" || typeof value == "string") {
                        targetId = value;
                    } else {
                        targetId = _get(value, m.mainKey);
                    }
                    return el[m.mainKey] == targetId;
                });
                if (rowIndex!=-1) {
                    const row = m.dataLs[rowIndex];
                    const lastSelectRowIndex = m.dataLs.findIndex(el => el._highlight);
                    if (lastSelectRowIndex != -1) {
                        m.dataLs.splice(lastSelectRowIndex, 1, {
                            ...m.dataLs[lastSelectRowIndex],
                            _highlight:false
                        });
                    }
                    m.dataLs.splice(rowIndex, 1, {
                        ...row,
                        _highlight:true,
                    })
                }
            }
        },
    },

    methods: {
        getSelectRowIndex(list) {
            const m = this;
            const {selectRow} = m;
            if (!list) {
                list = m.dataLs;
            }
            let id;
            if (selectRow == -1) {
                return -1;
            }else if(isPlainObject(selectRow)){
                id = selectRow[m.mainKey];
            //string or number
            }else{
                id = selectRow;
            }
            return list.findIndex(el => el[m.mainKey] == id);
        },

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
        updateSelectRow(row) {
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
