export interface Tree {
    name: string;
    attributes: {
        style?: {
            [x: string]: string;
        };
        [x: string]: any;
    };
    children: Tree[];
    value: string;
    meta?: {
        [x: string]: any;
    };
}
export declare type ParseType = 'react' | 'dom';
export interface XmlParserOptions {
    type?: ParseType;
    withUuid?: boolean;
    ignoredTags?: string[];
    ignoredTagAttrs?: string[];
    onTagParsed?: (tree: Tree) => Tree;
}
