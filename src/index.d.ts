import { Tree, XmlParserOptions } from './types';
export default class {
    private parseType;
    private withUuid;
    private ignoredTags;
    private ignoredTagAttrs;
    onTagParsed: ((tree: Tree) => Tree) | undefined;
    constructor(options?: XmlParserOptions);
    static getElementsByTagName(parent: Tree, tagName: string): Tree[];
    private _parseFromString;
    private _encodeCDATAValues;
    private _parseTag;
    private _inlineStyleToObject;
    private _objectStyleToInline;
    private _getTagName;
    private _getAttributeKey;
    private _parseValue;
    private _convertTagsArrayToTree;
    private _toString;
    private _convertTagToText;
    parseFromString(xmlText: string): Tree;
    toString(xml: Tree): string;
}
