<template>
    <collapse-transition :appear="appear">
        <ul :class="classes" :deepth="deepth">
            <li>
                <div class="node-el-wrapper"  @click="handleSelect();">
                    <Checkbox
                        v-if="showCheckbox"
                        :value="data.checked"
                        :indeterminate="data.indeterminate"
                        :disabled="data.disabled || data.disableCheckbox"
                        @click.native.prevent.stop="handleCheck"
                    ></Checkbox>
                    <Render v-if="data.render" :render="data.render" :data="data" :node="node"></Render>
                    <Render v-else-if="isParentRender" :render="parentRender" :data="data" :node="node"></Render>
                    <span v-else :class="titleClasses" v-html="data.title"></span>

                    <span :class="arrowClasses" @click.stop="handleExpand">
                    <Icon v-if="showArrow" :type="arrowType" :custom="customArrowType" :size="arrowSize" />
                    <Icon v-if="showLoading" type="ios-loading" class="ivu-load-loop" />
                </span>
                </div>
                <Tree-node
                        v-show="data.expand"
                        :appear="appearByClickArrow"
                        v-for="(item, i) in children"
                        :key="i"
                        :data="item"
                        :multiple="multiple"
                        :show-checkbox="showCheckbox"
                        :children-key="childrenKey">
                </Tree-node>
            </li>
        </ul>
    </collapse-transition>
</template>
<script>
    import Checkbox from 'iview/src/components/checkbox/checkbox.vue';
    import Icon from 'iview/src/components/icon/icon.vue';
    import Render from './render';
    import CollapseTransition from 'iview/src/components/base/collapse-transition';
    import Emitter from 'iview/src/mixins/emitter';
    import { findComponentUpward } from 'iview/src/utils/assist';
    import crawl from "tree-crawl";
    import get from "lodash/get";

    const prefixCls = 'ivu-tree';

    export default {
        name: 'TreeNode',
        mixins: [ Emitter ],
        inject: ['TreeInstance'],
        components: { Checkbox, Icon, CollapseTransition, Render },
        props: {
            data: {
                type: Object,
                default () {
                    return {};
                }
            },
            multiple: {
                type: Boolean,
                default: false
            },
            childrenKey: {
                type: String,
                default: 'children'
            },
            showCheckbox: {
                type: Boolean,
                default: false
            },
            appear: {
                type: Boolean,
                default: false
            }
        },
        data () {
            return {
                prefixCls: prefixCls,
                appearByClickArrow: false
            };
        },
        computed: {


            /**
             * 扁平化的子节点数组
             */
            flatChildren() {
                const m = this;
                let ret = []
                crawl(
                    m.data,
                    (node, ctx)=>{
                        if (node !==m.data) {
                            ret.push(node);
                        }
                    },
                    {
                        getChildren(node) {
                            return node.children;
                        }
                    }
                )
                return ret;
            },

            /**
             * 子节点中是否存在selected元素
             */
            hasSelectedChild() {
                return this.flatChildren.findIndex(el => el.selected) !== -1;
            },

            id() {
                return this.data.id;
            },
            classes () {
                const m = this;
                return [
                    `${prefixCls}-children`,
                    "node",
                    {
                        hasSelectedChild: m.hasSelectedChild,
                        "has-checked": m.data.checked || m.data.indeterminate,
                        "is-leaf" : !m.showArrow,
                        "is-selected":m.data.selected,
                    }
                ];
            },
            selectedCls () {
                return [
                    {
                        [`${prefixCls}-node-selected`]: this.data.selected
                    }
                ];
            },
            arrowClasses () {
                return [
                    `${prefixCls}-arrow`,
                    {
                        [`${prefixCls}-arrow-disabled`]: this.data.disabled,
                        [`${prefixCls}-arrow-open`]: this.data.expand
                    }
                ];
            },
            titleClasses () {
                return [
                    `${prefixCls}-title`,
                    {
                        [`${prefixCls}-title-selected`]: this.data.selected
                    }
                ];
            },
            showArrow () {
                return (this.data[this.childrenKey] && this.data[this.childrenKey].length) || ('loading' in this.data && !this.data.loading);
            },
            showLoading () {
                return 'loading' in this.data && this.data.loading;
            },
            isParentRender () {
                const Tree = findComponentUpward(this, 'Tree');
                return Tree && Tree.render;
            },
            parentRender () {
                const Tree = findComponentUpward(this, 'Tree');
                if (Tree && Tree.render) {
                    return Tree.render;
                } else {
                    return null;
                }
            },
            node () {
                const Tree = findComponentUpward(this, 'Tree');
                if (Tree) {
                    // 将所有的 node（即flatState）和当前 node 都传递
                    return [Tree.flatState, Tree.flatState.find(item => item.nodeKey === this.data.nodeKey)];
                } else {
                    return [];
                }
            },
            children () {
                return this.data[this.childrenKey];
            },
            // 3.4.0, global setting customArrow 有值时，arrow 赋值空
            arrowType () {
                let type = 'ios-arrow-forward';

                if (this.$IVIEW) {
                    if (this.$IVIEW.tree.customArrow) {
                        type = '';
                    } else if (this.$IVIEW.tree.arrow) {
                        type = this.$IVIEW.tree.arrow;
                    }
                }
                return type;
            },
            // 3.4.0, global setting
            customArrowType () {
                let type = '';

                if (this.$IVIEW) {
                    if (this.$IVIEW.tree.customArrow) {
                        type = this.$IVIEW.tree.customArrow;
                    }
                }
                return type;
            },
            // 3.4.0, global setting
            arrowSize () {
                let size = '';

                if (this.$IVIEW) {
                    if (this.$IVIEW.tree.arrowSize) {
                        size = this.$IVIEW.tree.arrowSize;
                    }
                }
                return size;
            },

            /**
             * 节点深度
             * @returns {number}
             */
            deepth() {
                let parent = this;
                let deepth = 0;
                while (parent.$options.name === "TreeNode"){
                    deepth ++ ;
                    if (deepth > 10) {
                        deepth = 9999;
                        return deepth
                    }
                    parent = parent.$parent;
                }
                return deepth;
            },

        },
        methods: {
            handleExpand () {
                const item = this.data;
                if (item.disabled) return;

                // Vue.js 2.6.9 对 transition 的 appear 进行了调整，导致 iView 初始化时无动画，加此方法来判断通过点击箭头展开时，加 appear，否则初始渲染时 appear 为 false
                this.appearByClickArrow = true;

                // async loading


                if (get(item, [this.childrenKey, "0"])) {
                    const tree = findComponentUpward(this, 'Tree');
                    if (tree && tree.loadData) {
                        this.$set(this.data, 'loading', true);
                        tree.loadData(item, children => {
                            this.$set(this.data, 'loading', false);
                            if (children.length) {
                                this.$set(this.data, this.childrenKey, children);
                                this.$nextTick(() => this.handleExpand());
                            }
                        });
                        return;
                    }
                }

                if (get(item, [this.childrenKey, "length"])) {
                    this.$set(this.data, 'expand', !this.data.expand);
                    this.dispatch('Tree', 'toggle-expand', this.data);
                }
            },
            handleSelect () {
                if (this.data.disabled) return;

                //如果使用checkbox，并且直接check。则check，否则选择
                // if (this.TreeInstance.showCheckbox && this.TreeInstance.checkDirectly) {
                //     this.handleCheck();
                // } else {
                //     this.dispatch('Tree', 'on-selected', this.data.nodeKey);
                // }


                //如果不是叶子，切换展开，否则切换选择
                if (!this.data.isLeaf) {
                    this.handleExpand();
                }else{
                    //已经选中的再次单击不能取消选中
                    if (!this.data.selected) {
                        this.dispatch('Tree', 'on-selected', this.data.nodeKey);
                    }
                }
            },
            handleCheck () {
                if (this.data.disabled) return;
                this.setCheck(!this.data.checked && !this.data.indeterminate);
            },

            setCheck(checked) {
                const m = this;
                this.dispatch('Tree', 'on-check', {
                    checked,
                    nodeKey: this.data.nodeKey
                });
            }
        }
    };
</script>
