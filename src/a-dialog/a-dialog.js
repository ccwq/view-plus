import isPlainObject from "lodash/isPlainObject"
let _Modal, _globalTitle;
/**
 * 确认对话框
 * @param content
 * @param okText
 * @param cancelText
 * @returns {Promise<boolean>}
 */
const __confirm = function (rejectMode, content, titleOrConfig, okText = "确定", cancelText = "取消") {
    if (!_Modal) {
        throw new Error("请先执行aDialogConfig(Modal, title)来初始化a-dialog");
    }
    let config, title;
    if (isPlainObject(titleOrConfig)) {
        config = titleOrConfig;
        title = "";
    }else{
        title = titleOrConfig;
        config = {};
    }

    return new Promise((resolve, reject) => {
        _Modal.confirm({
            title: title || _globalTitle,
            content,
            okText,
            cancelText,
            ...config,
            onOk: function () {
                if (rejectMode) {
                    resolve();
                } else {
                    resolve(true);
                }
            },
            onCancel: _ => {
                if (rejectMode) {
                    reject("");
                } else {
                    resolve(false);
                }
            },
        })
    })
};


/**
 * 进行Modal初始化
 * @param $Modal
 */
export const aDialogConfig = function(Modal, globalTitle="请确认"){
    _Modal = Modal;
    _globalTitle = globalTitle;
}

export const $confirm = __confirm.bind(null, true);
export const $confirm2 = __confirm.bind(null, false);
