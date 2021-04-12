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
    const col = {key, title}
    rest.forEach(el=>{
        if (isPlainObject(el)) {
            Object.assign(col, others)
        }else if (typeof el == "string") {

            //解析render
            if (el.startsWith("#")) {
                col.slot = el.substr(1);

                //解析fixed
            }else if(["?left", "?right", "?center"].includes(el)) {
                col.fixed = el.substr(1);

                //解析tooltip
            }else if(el=="?tooltip"){
                col.tooltip = true;

                //解析align
            }else if(["left", "right", "center"].includes(el)) {
                col.align = el;

                //解析class
            }else if(el.startsWith(".")){
                col.className = el.substr(1);
            }else{
                console.log("未识别的配置");
            }
        }else if (typeof el == "number") {
            col.width = el;
        }else if (typeof el == "function") {
            col.render = el;
        }
    })
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