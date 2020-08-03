"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var uuid_1 = require("uuid");
var const_1 = require("./const");
var utils_1 = require("./utils");
var lodash_1 = __importDefault(require("lodash"));
var default_1 = /** @class */ (function () {
    function default_1(options) {
        var _this = this;
        this._objectStyleToInline = function (style) {
            return Object.keys(style).reduce(function (str, key) {
                return (str +=
                    _this.parseType === 'react'
                        ? utils_1.camelCaseToHyphen(key) + ": " + style[key] + ";"
                        : key + ": " + style[key] + ";");
            }, "");
        };
        var _a = options || {}, _b = _a.type, type = _b === void 0 ? 'react' : _b, _c = _a.withUuid, withUuid = _c === void 0 ? true : _c, _d = _a.ignoredTags, ignoredTags = _d === void 0 ? [] : _d, _e = _a.ignoredTagAttrs, ignoredTagAttrs = _e === void 0 ? [] : _e, onTagParsed = _a.onTagParsed;
        this.parseType = type;
        this.withUuid = withUuid;
        this.ignoredTags = ignoredTags;
        this.ignoredTagAttrs = ignoredTagAttrs;
        this.onTagParsed = onTagParsed;
    }
    default_1.getElementsByTagName = function (parent, tagName) {
        var _this = this;
        var matches = [];
        if (!parent)
            return matches;
        if (tagName == '*' || parent.name.toLowerCase() === tagName.toLowerCase()) {
            matches.push(parent);
        }
        parent.children.map(function (child) {
            matches = __spreadArrays(matches, _this.getElementsByTagName(child, tagName));
        });
        return matches;
    };
    default_1.prototype._parseFromString = function (xmlText) {
        var _this = this;
        xmlText = this._encodeCDATAValues(xmlText);
        var cleanXmlText = xmlText
            .replace(/\s{2,}/g, ' ')
            .replace(/\\t\\n\\r/g, '')
            .replace(/>/g, '>\n')
            .replace(/\]\]/g, ']]\n');
        var rawXmlData = [];
        cleanXmlText.split('\n').map(function (element) {
            element = element.trim();
            if (!element ||
                element.indexOf('?xml') > -1 ||
                element.indexOf('<!--') > -1) {
                return;
            }
            if (element.indexOf('<') == 0 && element.indexOf('CDATA') < 0) {
                var parsedTag = _this._parseTag(element);
                if (parsedTag) {
                    rawXmlData.push(parsedTag);
                    // self closing tag
                    // eg: <image />, <br />
                    if (element.match(/\/\s*>$/)) {
                        var selfClosingTag = _this._parseTag('</' + parsedTag.name + '>');
                        selfClosingTag && rawXmlData.push(selfClosingTag);
                    }
                }
            }
            else {
                rawXmlData[rawXmlData.length - 1].value += " " + _this._parseValue(element);
            }
        });
        return this._convertTagsArrayToTree(rawXmlData)[0];
    };
    default_1.prototype._encodeCDATAValues = function (xmlText) {
        var cdataRegex = new RegExp(/<!CDATA\[([^\]\]]+)\]\]/gi);
        var result = cdataRegex.exec(xmlText);
        while (result) {
            if (result.length > 1) {
                xmlText = xmlText.replace(result[1], encodeURIComponent(result[1]));
            }
            result = cdataRegex.exec(xmlText);
        }
        return xmlText;
    };
    default_1.prototype._parseTag = function (tagText) {
        var _this = this;
        var cleanTagText = tagText.match(/([^\s]*)=('([^']*?)'|"([^"]*?)")|([\/?\w\-\:]+)/g);
        if (!cleanTagText)
            return false;
        var tagName = (cleanTagText.shift() || '').replace(/\/\s*$/, '');
        if (this.ignoredTags.includes(tagName))
            return false;
        var tag = {
            name: this._getTagName(tagName),
            attributes: {},
            children: [],
            value: '',
        };
        if (this.withUuid) {
            tag.meta = {
                uuid: uuid_1.v4(),
            };
        }
        cleanTagText.map(function (attribute) {
            var attributeKeyVal = attribute.split('=');
            if (attributeKeyVal.length < 2) {
                return;
            }
            if (_this.ignoredTagAttrs.includes(attributeKeyVal[0])) {
                return;
            }
            var attributeKey = _this._getAttributeKey(attributeKeyVal[0]);
            var attributeVal = '';
            if (attributeKeyVal.length === 2) {
                attributeVal = attributeKeyVal[1];
            }
            else {
                // attributeKeyVal.length > 2
                attributeKeyVal = attributeKeyVal.slice(1);
                attributeVal = attributeKeyVal.join('=');
            }
            var sanitizedAttributeVal = attributeVal
                .replace(/^["']/g, '')
                .replace(/["']$/g, '')
                .trim();
            tag.attributes[attributeKey] =
                attributeKey === 'style'
                    ? _this._inlineStyleToObject(sanitizedAttributeVal)
                    : sanitizedAttributeVal;
        });
        return this.onTagParsed ? this.onTagParsed(tag) : tag;
    };
    default_1.prototype._inlineStyleToObject = function (styles) {
        var _this = this;
        if (!styles.endsWith(';')) {
            styles += ';';
        }
        var attributes = styles.split(';').filter(function (str) { return str; });
        var results = {};
        attributes.forEach(function (attr) {
            var _a = attr.split(':'), key = _a[0], value = _a[1];
            switch (key) {
                case 'font-size':
                    _this.parseType === 'react'
                        ? (results[utils_1.hyphenToCamelCase(key)] = parseFloat(value.trim()))
                        : results[key] = value.trim();
                    break;
                default:
                    _this.parseType === 'react'
                        ? (results[utils_1.hyphenToCamelCase(key)] = value.trim())
                        : results[key] = value.trim();
                    break;
            }
        });
        return results;
    };
    default_1.prototype._getTagName = function (tagName, invert) {
        if (invert === void 0) { invert = false; }
        var map = invert
            ? lodash_1.default.invert(const_1.ELEMENT_TAG_NAME_MAPPING)
            : const_1.ELEMENT_TAG_NAME_MAPPING;
        return this.parseType === 'react' && map[tagName] ? map[tagName] : tagName;
    };
    default_1.prototype._getAttributeKey = function (key, invert) {
        if (invert === void 0) { invert = false; }
        var map = invert ? lodash_1.default.invert(const_1.ATTRIBUTE_MAPPING) : const_1.ATTRIBUTE_MAPPING;
        return this.parseType === 'react' && map[key] ? map[key] : key;
    };
    default_1.prototype._parseValue = function (tagValue) {
        if (tagValue.indexOf('CDATA') < 0) {
            return tagValue.trim();
        }
        return tagValue.substring(tagValue.lastIndexOf('[') + 1, tagValue.indexOf(']'));
    };
    default_1.prototype._convertTagsArrayToTree = function (xml) {
        var xmlTree = [];
        while (xml.length > 0) {
            var tag = xml.shift();
            if (!tag)
                continue;
            if (tag.value.indexOf('</') > -1 || tag.name.match(/\/$/)) {
                tag.name = tag.name.replace(/\/$/, '').trim();
                tag.value = tag.value.substring(0, tag.value.indexOf('</')).trim();
                xmlTree.push(tag);
                continue;
            }
            if (tag.name.indexOf('/') == 0) {
                break;
            }
            xmlTree.push(tag);
            tag.children = this._convertTagsArrayToTree(xml);
            tag.value = decodeURIComponent(tag.value.trim());
        }
        return xmlTree;
    };
    default_1.prototype._toString = function (xml) {
        var _this = this;
        var xmlText = this._convertTagToText(xml);
        if (xml.children.length > 0) {
            xml.children.map(function (child) {
                xmlText += _this._toString(child);
            });
            xmlText +=
                this.parseType === 'react'
                    ? '</' + this._getTagName(xml.name, true) + '>'
                    : '</' + xml.name + '>';
        }
        return xmlText;
    };
    default_1.prototype._convertTagToText = function (tag) {
        var tagText = this.parseType === 'react'
            ? '<' + this._getTagName(tag.name)
            : '<' + tag.name;
        for (var attribute in tag.attributes) {
            if (attribute === 'style') {
                tagText +=
                    ' ' +
                        attribute +
                        '="' +
                        this._objectStyleToInline(tag.attributes[attribute]) +
                        '"';
            }
            else {
                tagText += ' ' + attribute + '="' + tag.attributes[attribute] + '"';
            }
        }
        if (tag.value.length > 0) {
            tagText += '>' + tag.value;
        }
        else {
            tagText += '>';
        }
        if (tag.children.length === 0) {
            tagText +=
                this.parseType === 'react'
                    ? '</' + this._getTagName(tag.name) + '>'
                    : '</' + tag.name + '>';
        }
        return tagText;
    };
    default_1.prototype.parseFromString = function (xmlText) {
        return this._parseFromString(xmlText);
    };
    default_1.prototype.toString = function (xml) {
        return this._toString(xml);
    };
    return default_1;
}());
exports.default = default_1;
//# sourceMappingURL=index.js.map