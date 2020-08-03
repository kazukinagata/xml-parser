export interface Tree {
  name: string
  attributes: { [x: string]: any }
  children: Tree[]
  value: string
  meta: { [x: string]: any }
}

export type ParseType = 'react' | 'dom'

export interface XmlParserOptions {
  type: ParseType
  withId: boolean
}
