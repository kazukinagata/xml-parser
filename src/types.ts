export interface Tree {
  name: string
  attributes: {
    style?: any
    [x: string]: any
  }
  children: Tree[]
  value: string
  meta?: { [x: string]: any }
}

export type ParseType = 'react' | 'dom'

export interface XmlParserOptions {
  type?: ParseType
  ignoredTags?: string[]
  ignoredTagAttrs?: string[]
  onTagParsed?: (tree: Tree) => Tree

}
