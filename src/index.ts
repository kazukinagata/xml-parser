import { Tree, XmlParserOptions, ParseType } from './types'
import { ELEMENT_TAG_NAME_MAPPING, ATTRIBUTE_MAPPING } from './const'
import { hyphenToCamelCase, camelCaseToHyphen, invertObject } from './utils'

export default class {
  private parseType: ParseType
  private ignoredTags: string[]
  private ignoredTagAttrs: string[]
  private onTagParsed: ((tree: Tree) => Tree) | undefined
  onIgnoring: boolean

  constructor(options?: XmlParserOptions) {
    const {
      type = 'react',
      ignoredTags = [],
      ignoredTagAttrs = [],
      onTagParsed,
    } = options || {}
    this.parseType = type
    this.ignoredTags = ignoredTags
    this.ignoredTagAttrs = ignoredTagAttrs
    this.onTagParsed = onTagParsed
    this.onIgnoring = false
  }

  static getElementsByTagName(parent: Tree | null, tagName: string) {
    let matches: Tree[] = []
    if (!parent) return matches

    if (tagName == '*' || parent.name.toLowerCase() === tagName.toLowerCase()) {
      matches.push(parent)
    }

    parent.children.map((child) => {
      matches = [...matches, ...this.getElementsByTagName(child, tagName)]
    })

    return matches
  }

  private _parseFromString(xmlText: string) {
    xmlText = this._encodeCDATAValues(xmlText)
    const cleanXmlText = xmlText
      .replace(/\s{2,}/g, ' ')
      .replace(/\\t\\n\\r/g, '')
      .replace(/>/g, '>\n')
      .replace(/\]\]/g, ']]\n')

    const rawXmlData: Tree[] = []

    cleanXmlText.split('\n').map((element) => {
      element = element.trim()

      if (
        !element ||
        element.indexOf('?xml') > -1 ||
        element.indexOf('<!--') > -1
      ) {
        return
      }

      if (element.indexOf('<') == 0 && element.indexOf('CDATA') < 0) {
        const parsedTag = this._parseTag(element)
        if (parsedTag) {
          rawXmlData.push(parsedTag)
          // self closing tag
          // eg: <image />, <br />
          if (element.match(/\/\s*>$/)) {
            const selfClosingTag = this._parseTag('</' + parsedTag.name + '>')
            selfClosingTag && rawXmlData.push(selfClosingTag)
          }
        }
      } else {
        rawXmlData[rawXmlData.length - 1].value += ` ${this._parseValue(
          element
        )}`
      }
    })

    return this._convertTagsArrayToTree(rawXmlData).shift()
  }

  private _encodeCDATAValues(xmlText: string) {
    const cdataRegex = new RegExp(/<!CDATA\[([^\]\]]+)\]\]/gi)
    let result = cdataRegex.exec(xmlText)
    while (result) {
      if (result.length > 1) {
        xmlText = xmlText.replace(result[1], encodeURIComponent(result[1]))
      }

      result = cdataRegex.exec(xmlText)
    }

    return xmlText
  }

  private _parseTag(tagText: string) {
    const cleanTagText = tagText.match(
      /([^\s]*)=('([^']*?)'|"([^"]*?)")|([\/?\w\-\:]+)/g
    )
    if (!cleanTagText) return false

    if (this.onIgnoring) return false

    const tagName = (cleanTagText.shift() || '').replace(/\/\s*$/, '')
    if (this.ignoredTags.includes(tagName)) {
      // igonore following tags until the ignoredTag has been closed
      this.onIgnoring = !tagText.match(/\/\s*>$/)
    }

    const tag: Tree = {
      name: this._getTagName(tagName),
      attributes: {},
      children: [],
      value: '',
    }

    cleanTagText.map((attribute) => {
      let attributeKeyVal = attribute.split('=')

      if (attributeKeyVal.length < 2) {
        return
      }

      if (this.ignoredTagAttrs.includes(attributeKeyVal[0])) {
        return
      }

      const attributeKey = this._getAttributeKey(attributeKeyVal[0])
      let attributeVal = ''

      if (attributeKeyVal.length === 2) {
        attributeVal = attributeKeyVal[1]
      } else {
        // attributeKeyVal.length > 2
        attributeKeyVal = attributeKeyVal.slice(1)
        attributeVal = attributeKeyVal.join('=')
      }
      const sanitizedAttributeVal = attributeVal
        .replace(/^["']/g, '')
        .replace(/["']$/g, '')
        .trim()

      tag.attributes[attributeKey] =
        attributeKey === 'style'
          ? this._inlineStyleToObject(sanitizedAttributeVal)
          : sanitizedAttributeVal
    })

    return this.onTagParsed ? this.onTagParsed(tag) : tag
  }

  private _inlineStyleToObject(styles: string) {
    if (!styles.endsWith(';')) {
      styles += ';'
    }
    const attributes = styles.split(';').filter((str) => str)
    const results: { [x: string]: string | number } = {}
    attributes.forEach((attr: string) => {
      let [key, value] = attr.split(':')
      switch (key) {
        case 'font-size':
          this.parseType === 'react'
            ? (results[hyphenToCamelCase(key)] = parseFloat(value.trim()))
            : results[key] = value.trim()
          break

        default:
          this.parseType === 'react'
            ? (results[hyphenToCamelCase(key)] = value.trim())
            : results[key] = value.trim()
          break
      }
    })

    return results
  }
  private _objectStyleToInline = (style: { [x: string]: string }) => {
    return Object.keys(style).reduce(
      (str, key) =>
        (str +=
          this.parseType === 'react'
            ? `${camelCaseToHyphen(key)}: ${style[key]};`
            : `${key}: ${style[key]};`),
      ``
    )
  }
  private _getTagName(tagName: string, invert: boolean = false) {
    const map = invert
      ? invertObject(ELEMENT_TAG_NAME_MAPPING)
      : ELEMENT_TAG_NAME_MAPPING
    return this.parseType === 'react' && map[tagName] ? map[tagName] : tagName
  }
  private _getAttributeKey(key: string, invert: boolean = false) {
    const map = invert ? invertObject(ATTRIBUTE_MAPPING) : ATTRIBUTE_MAPPING
    return this.parseType === 'react' && map[key] ? map[key] : key
  }
  private _parseValue(tagValue: string) {
    if (tagValue.indexOf('CDATA') < 0) {
      return tagValue.trim()
    }

    return tagValue.substring(
      tagValue.lastIndexOf('[') + 1,
      tagValue.indexOf(']')
    )
  }

  private _convertTagsArrayToTree(xml: Tree[]) {
    const xmlTree: Tree[] = []

    while (xml.length > 0) {
      const tag = xml.shift()
      if (!tag) continue

      if (tag.value.indexOf('</') > -1 || tag.name.match(/\/$/)) {
        tag.name = tag.name.replace(/\/$/, '').trim()
        tag.value = tag.value.substring(0, tag.value.indexOf('</')).trim()
        xmlTree.push(tag)
        continue
      }

      if (tag.name.indexOf('/') == 0) {
        break
      }

      xmlTree.push(tag)
      tag.children = this._convertTagsArrayToTree(xml)
      tag.value = decodeURIComponent(tag.value.trim())
    }
    return xmlTree
  }

  private _toString(xml: Tree) {
    let xmlText = this._convertTagToText(xml)
    if (xml.children.length > 0) {
      xml.children.map((child) => {
        xmlText += this._toString(child)
      })

      xmlText += '</' + this._getTagName(xml.name, true) + '>'
    }

    return xmlText
  }

  private _convertTagToText(tag: Tree) {
    let tagText = '<' + this._getTagName(tag.name, true)
    for (let attribute in tag.attributes) {
      if (attribute === 'style') {
        tagText +=
          ' ' +
          this._getAttributeKey(attribute, true) +
          '="' +
          this._objectStyleToInline(tag.attributes[attribute]!) +
          '"'
      } else {
        tagText += ' ' + this._getAttributeKey(attribute, true) + '="' + tag.attributes[attribute] + '"'
      }
    }

    if (tag.value.length > 0) {
      tagText += '>' + tag.value
    } else {
      tagText += '>'
    }

    if (tag.children.length === 0) {
      tagText += '</' + this._getTagName(tag.name, true) + '>'
    }

    return tagText
  }

  parseFromString(xmlText: string) {
    return this._parseFromString(xmlText)
  }

  toString(xml: Tree) {
    return this._toString(xml)
  }
}
