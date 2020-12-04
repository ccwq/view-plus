import get from "lodash/get"  //保存数据的库

import {promiseMap} from "ipro/src/promise/utils";


/**
 * 用来 验证字符串长度
 * 用法:{
 *     rule:{
 *         username:[
 *             {
 *                 validator: textLength(3, 32, "用户名")
 *             }
 *         ]
 *     }
 * }
 * @param min
 * @param max
 * @param labelName
 * @returns {Function}
 */
export const textLength = function(min, max, labelName){
    return (rule, value, callback) => {
        value = trim(value);
        let errorText = undefined;
        if (!value) {
            errorText = `请输入${labelName}`
        } else if (value.length < min) {
            errorText = `${labelName}长度过短，最小需要${min}个字符`
        } else if (value.length > max) {
            errorText = `${labelName}长度过长，请删减为最多${max}字符`
        }
        callback(errorText);
    }
}

/**
 * 非空验证
 * @param fieldName
 * @returns {Function}
 */
export const notNull = function (fieldName) {
    return function (rule, value, callback) {
        if (typeof value == "number") {
            callback();
        }else if(!trim(value)){
            callback(new Error(`${fieldName}不能为空`))
            return;
        }else{
            callback();
        }
    }
}

/**
 * 重复密码验证
 * @param vm 组件实力
 * @param field 字段值
 * @param unMatchMessage 匹配失败提示文字
 * @returns {Function}
 */
export const sameAs = function(vm, field, unMatchMessage="两次输入的密码不一致"){
    return function(rule, value, callback){
        if(trim(value) !== trim(get(vm,field))){
            callback(new Error(unMatchMessage))
            return;
        }
        debugger;
        callback();
    }
}


export const sameAs2 = function(getter, unMatchMessage="两次输入的密码不一致"){
    return function(rule, value, callback){
        if(trim(value) !== getter()){
            callback(new Error(unMatchMessage))
            return;
        }
        callback();
    }
}


/**
 * 正则验证规则生成器
 * @param reg
 * @param unMatchMessage
 * @returns {Function}
 */
export const regExp = function(reg, unMatchMessage="字符不匹配"){
    return function(rule, value, callback){
        if (!reg.test(trim(value))) {
            callback(new Error(unMatchMessage))
            return;
        }
        callback();
    }
}

/**
 * 手机号码验证规则
 * @type {Function}
 */
export const phoneValidator  = regExp(
    /^(13[0-9]{9})|(18[0-9]{9})|(14[0-9]{9})|(19[0-9]{9})|(17[0-9]{9})|(15[0-9]{9})$/,
    "手机号码格式不正确"
)


/**
 * 座机验证规则
 */
export const fixedPhoneValidator  = regExp(
    /^((0\d{2,3})-?)(\d{7,8})(-(\d{3,}))?$/,
    "座机号码格式不正确"
)




/**
 * 手机或者固话验证
 * @type {v.fixedPhoneOrMobile}
 */
export const fixedPhoneOrMobile = function(label){
    let error = new Error(`不是有效的${label}`);
    return function(rule, value, next){
        value = trim(value);
        phoneValidator(rule , value, err=>{
            if (err) {
                fixedPhoneValidator(rule, value, err=>{
                    if (err) {
                        next(error)
                    }else{
                        next();
                    }
                })
            }else{
                next();
            }
        })
    }
}


/**
 * 手机号码验证规则列表
 * @type {*[]*string}
 */
export const phoneValidatorLs  = [
    {validator: notNull("手机号")},
    {validator: phoneValidator},
]


/**
 * 用户名验证规则列表
 * @type {*[]}
 */
export const useranmeValidatorLs = [
    {validator: notNull("用户名")},
    {validator: textLength(4,32, "用户名")},
]


/**
 * 密码验证规则列表
 * @type {*[]}
 */
export const passwdValidatorLs  =  [
    { validator: textLength(6, 32, "密码"), trigger: 'blur' },
    {
        validator: regExp(
            /^(?![a-zA-z]+$)(?!\d+$)(?![!@#$%^&*]+$)[a-zA-Z\d!@#$%^&*]+$/,
            "密码组合是字母+数字，字母+特殊字符，数字+特殊字符之一"
            // "密码强度不够",
        ),
    }
]



function trim(string){
    if(!string){
        return ""
    }

    if (typeof string === "number") {
        string = string+"";
    }

    if(!string.trim){
        return ""
    }

    return string.trim();
}




/**
 * 处理如下形式的ValidatorLs
 * [{validator}, {validator}]
 * @param value
 * @param iviewValidatorLs
 */
export const iviewValidatorLsRunner = function (value, iviewValidatorLs) {
    return iviewValidatorLsRunner2(value, iviewValidatorLs.map(el=>el.validator));
}


/**
 * 处理如下形式的ValidatorLs
 * [validator, validator]
 * @param value
 * @param iviewValidatorLs
 * @returns {*}
 */
export const iviewValidatorLsRunner2 = function (value, iviewValidatorLs) {
    return promiseMap(

    );
    return Promise.all(
        iviewValidatorLs.map(func=>new Promise((resolve, reject) => {
            func(null, value, error=>{
                error ? reject(error) : resolve();
            })
        }))
    )
}


/**
 * 用来生成一个验证规则列表
 * @param ls
 * @returns {{validator, trigger, message}[]}
 */
export const create = function(...ls){
    return ls.map(_validator=>{
        if (Array.isArray(_validator)) {
            let [validator, message, trigger] = _validator;
            return {validator, message, trigger};
        }else{
            return _validator;
        }
    })
}



/**
 * 验证规则对象整理你
 * @param validators
 * @returns {({validator}|*)[]|{validator: *}|*}
 */
export function transformValidator(validators){
    if (Array.isArray(validators)) {
        return validators;
    }else if (typeof validators == "function") {
        return [{
            validator: validators
        }];
    }else if(validators.validator){
        return [validators];
    }else{
        return [];
    }
}
