import aTable from "./a-table";
import coFrom from "./co-form"
import isPlainObject from "lodash/isPlainObject"

export default {
    install(Vue, options = {}) {
        const {} = options;
        Vue.mixin({
            components: {
                coFrom,
                aTable,
            },
        })
    }
};


/**
 * 定义table的column
 * @param key 定义key
 * @param title 定义title
 * @param rest 传入数字为宽度/函数为render/#开头字符串为slot
 */
export const columnDef = function(key, title, ...rest){
    const m = this;
    let align, width, render, others, slot;
    rest.forEach(el=>{
        if (m.isPlainObject(el)) {
            others = el;
        }else if (typeof el == "string") {
            if (el.startsWith("#")) {
                slot = el.substr(1);
            }else{
                align = el;
            }
        }else if (typeof el == "number") {
            width = el;
        }else if (typeof el == "function") {
            render = el;
        }
    })

    let col = {key, title, align, width, render, ...others};
    if (slot) {
        col.slot = slot;
    }
    return col;
}


/**
 * rander 用来修改文本
 * @param template
 * @param formater
 * @return {function(*, {row: *, column: {key?: *}, index?: *}): *}
 */
export const renderTpl = function (template = "[value]", formater=(value, key, index)=>_) {
    const _tpl = template;
    return function (h, {row, column: {key}, index}) {
        let value = row[key];
        const attrs = {value, key, index, row};
        template = _tpl;
        template = template.replace(/\[value]/g, formater(value, key, index));
        template = template.replace(/\[(.+)]/g, function(attTpl, key){
            let [_key, _keys] = key.split(",");
            let ret;
            ret = attrs[_key];
            if (_keys) {
                _keys = _keys.split(" ");
                if (_keys && _keys.length) {
                    ret = _keys[ret];
                }
            }
            return ret;
        });
        return h("span", template);
    }
};