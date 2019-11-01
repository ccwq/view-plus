import coForm from "./co-form.vue";
export default coForm;


/**
 * 允许使用如下语法进行表单创建
 `
     name            text        名称,
     pid             select      项目
     facilityType    select      设备类型
 `
 * @param formConfigText
 * @param eachSetting 附加字段，以prop为key
 * @param commSetting 附加字段，为所有增加同样的配置
 */
export const text2formItems = function(formConfigText, {commSetting, eachSetting}){
    if (!formConfigText && !typeof formConfigText=="string") {
        throw "请使用有效的配置"
    }

    //trim并且删除最后多余的逗号
    formConfigText = formConfigText.trim().replace(/,$/, "");
    return formConfigText
        .split(",\n")
        .filter(el=>el)
        .map(el=>el.trim().split(/\s+/))
        .reduce((ret, [prop, type, label])=>{

            let item = {prop, label, type};

            if (commSetting) {
                item = commSetting(item) || item;
            }

            let _eachSett = eachSetting[prop];

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