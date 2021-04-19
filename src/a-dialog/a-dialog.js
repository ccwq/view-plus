import {Modal} from "view-design";

/**
 * 确认对话框
 * @param content
 * @param okText
 * @param cancelText
 * @returns {Promise<boolean>}
 */
const __confirm = function (rejectMode, content, okText = "确定", cancelText = "取消") {
    return new Promise((resolve, reject) => {
        Modal.confirm({
            title: '请确认',
            content,
            okText,
            cancelText,
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

export const $confirm = __confirm.bind(null, true);
export const $confirm2 = __confirm.bind(null, false);