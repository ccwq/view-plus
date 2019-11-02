export default class  {
    /**
     * 定义表格列
     * 举例1 tableColumnDef("id", "编号", 50, "center", function(){})
     * 举例2 tableColumnDef("id", "编号", "center", function(){}, 50)
     * 举例3 tableColumnDef("id", "编号", {width, render})
     * @param key
     * @param title
     * @param rest
     */
    static tableColumnDef(key, title, ...rest){
        const m = this;
        let align, width, render, others;
        rest.forEach(el=>{
            if (m.isPlainObject(el)) {
                others = el;
            }else if (typeof el == "string") {
                align = el;
            }else if (typeof el == "number") {
                width = el;
            }else if (typeof el == "function") {
                render = el;
            }
        })

        return {key, title, align, width, render, ...others};
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
    static text2formItems(formConfigText, {commSett, eachSett}){
        const m = this;

        if (!formConfigText && !typeof formConfigText=="string") {
            throw "请使用有效的配置"
        }

        //trim并且删除最后多余的逗号
        formConfigText = formConfigText.trim().replace(/,$/, "");
        return formConfigText
            .split("\n")
            .map(el=>el.trim())
            .filter(el=>(el && !el.startsWith("//")))
            .map(el=>el.trim().split(/\s+/))
            .reduce((ret, [prop, type, label, value])=>{

                if (type == "number") {
                    value = parseFloat(value);
                }else if (/^bool/.test(type)) {
                    value = value !== "false";
                }else if (type == "date") {
                    value = m.parseDate(value);
                }


                let item = {prop, label, type, value};

                //如果值为单个"-"表示该项不设置
                Object.keys(item).forEach(key=>{
                    if (item[key] == "-") {
                        delete item[key]
                    }
                })

                if (commSett) {
                    item = commSett(item) || item;
                }

                let _eachSett = eachSett[prop];

                if (typeof _eachSett == "function") {
                    item = _eachSett(item) || item;
                }else if (_eachSett) {
                    item = Object.assign(item,_eachSett);
                }

                ret.push(item);
                return ret;
            }, [])
        ;
    }


    /**
     * 创建date
     * @param str
     * @returns {Date}
     */
    static parseDate(input) {

        //数字或者字符串时间戳
        if (typeof input == "number" || /^\d+$/.test(input + "")) {
            return new Date(input * 1);

            //空对象
        } else if (!input) {
            return new Date();

            //日期对象
        }else if (input.constructor == Date) {
            return input;
        }

        //日期字符串
        var parts = input.split(/[-:\sTZ\+年月日时分秒]/);
        return new Date(parts[0], parts[1] - 1, parts[2], parts[3] || 0, parts[4] || 0, parts[5] || 0);
    }

    /**
     * 纯对象
     * @param obj
     * @returns {boolean}
     */
    static isPlainObject(obj) {
        if (typeof obj !== 'object' || obj === null) return false

        let proto = obj
        while (Object.getPrototypeOf(proto) !== null) {
            proto = Object.getPrototypeOf(proto)
        }

        return Object.getPrototypeOf(obj) === proto
    }


}





