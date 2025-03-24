 // 删除成对的中英文括号及其内容
 function removeDoubleParentheses(text) {
    return text.replace(/\(.*?\)|（.*?）/g, '').trim();
}
//生成guid
function guid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}