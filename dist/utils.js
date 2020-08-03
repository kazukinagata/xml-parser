"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.camelCaseToHyphen = exports.hyphenToCamelCase = void 0;
function hyphenToCamelCase(string) {
    return string.replace(/-(.)/g, function (match, chr) {
        return chr.toUpperCase();
    });
}
exports.hyphenToCamelCase = hyphenToCamelCase;
function camelCaseToHyphen(string) {
    return string.replace(/([A-Z])/g, function (s) {
        return '-' + s.charAt(0).toLowerCase();
    });
}
exports.camelCaseToHyphen = camelCaseToHyphen;
//# sourceMappingURL=utils.js.map