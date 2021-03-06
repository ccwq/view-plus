import {all2date} from "ipro/src/date/DateUtils";
import {columnDef} from "./index";

export {all2date} from "ipro/src/date/DateUtils";
export {columnDef} from "./index";



import isPlainObject from "lodash/isPlainObject";

export const text2formItems = function(
    formConfigText,
    {
        commSett=_=>_,
        eachSett={}
    }
){

    if (!formConfigText && !typeof formConfigText=="string") {
        throw "请使用有效的配置"
    }


    //设置是函数的形式
    if(typeof eachSett == "function"){
        eachSett = eachSett() || {};
    }

    //trim并且删除最后多余的逗号
    formConfigText = formConfigText.trim().replace(/,$/, "");
    return formConfigText
        .split("\n")
        .map(el => el.trim())
        .filter(el => (el && !el.startsWith("//")))
        .map(el => el.trim().split(/\s+/))
        .reduce((ret, [prop, type = "", label = "", value = ""]) => {
            let [_type, ...itemClass] = type.split(".");
            type = _type;

            let [_prop, ...formItemClass] = prop.split(".");
            prop = _prop;

            if (type == "number") {
                value = parseFloat(value);
            } else if (/^bool/.test(type)) {
                // value = value !== "false";
            } else if (type == "date") {
                value = all2date(value);
            }

            let item = {prop, label, type, value, itemClass, formItemClass};

            //如果值为单个"-"表示该项不设置
            Object.keys(item).forEach(key => {
                if (item[key] == "-") {
                    delete item[key]
                }
            })

            if (commSett) {
                item = {
                    ...commSett(item),
                    ...item
                };
            }

            let _eachSett = eachSett[prop];

            if (typeof _eachSett == "function") {
                item = _eachSett(item) || item;
            } else if (_eachSett) {
                item = Object.assign(item, _eachSett);
            }


            //下拉选项类型处理
            if (Array.isArray(item.options)) {
                item.options = item.options.map(el => {
                    if (Array.isArray(el)) {
                        let [value, name] = el;
                        return {value, name}
                    }
                    return el;
                })
            }
            ret.push(item);
            return ret;
        }, [])
        ;
}

export default class {
    /**
     * 定义表格列, #开头的字符串表示slot
     * 举例1 tableColumnDef("id", "编号", 50, "center", function(){})
     * 举例2 tableColumnDef("id", "编号", "center", function(){}, 50)
     * 举例3 tableColumnDef("id", "编号", {width, render})
     * @param key
     * @param title
     * @param rest
     */
    static tableColumnDef(key, title, ...rest){
        return columnDef(key, title, ...rest);
    }


    /**
     * 日期格式化的render
     * @param formater
     * @returns {Function}
     */
    static tableColumnRenderDateFormat(formater="%F %T"){
        return function(h, {row, column}){
            let value = row[column.key];
            return h("span", $D(value).format(formater))
        }
    }


    /**
     * 允许使用如下语法进行表单创建
     `
     name            text        名称,
     pid             select      项目
     facilityType    select      设备类型
     `
     * @param formConfigText
     * @param eachSett 附加字段，以prop为key
     * @param commSett 附加字段，为所有增加同样的配置
     */
    static text2formItems(...rest){
        return text2formItems(...rest);
    }


    /**
     * 创建date
     * @param str
     * @returns {Date}
     */
    static parseDate(input) {
        return all2date(input);
    }

    /**
     * 纯对象
     * @param obj
     * @returns {boolean}
     */
    static isPlainObject(obj) {
        return isPlainObject(obj);
    }
}






