import { v4 as uuidv4 } from 'uuid';
import { Tree, XmlParserOptions, ParseType } from './types'

export default class {
  private parseType: ParseType
  private withId: boolean
  static getElementsByTagName(parent: Tree, tagName: string) {
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

  constructor(options?: XmlParserOptions) {
    const { type = 'react', withId = true } = options || {}
    this.parseType = type
    this.withId = withId
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

    return this._convertTagsArrayToTree(rawXmlData)[0]
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

    const tag: Tree = {
      name: (cleanTagText.shift() || '').replace(/\/\s*$/, ''),
      attributes: {},
      children: [],
      value: '',
      meta: {
        uuid: uuidv4(),
      },
    }

    cleanTagText.map((attribute) => {
      let attributeKeyVal = attribute.split('=')

      if (attributeKeyVal.length < 2) {
        return
      }

      const attributeKey = attributeKeyVal[0]
      let attributeVal = ''

      if (attributeKeyVal.length === 2) {
        attributeVal = attributeKeyVal[1]
      } else {
        attributeKeyVal = attributeKeyVal.slice(1)
        attributeVal = attributeKeyVal.join('=')
      }

      tag.attributes[attributeKey] =
        'string' === typeof attributeVal
          ? attributeVal
              .replace(/^"/g, '')
              .replace(/^'/g, '')
              .replace(/"$/g, '')
              .replace(/'$/g, '')
              .trim()
          : attributeVal
    })

    return tag
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

      xmlText += '</' + xml.name + '>'
    }

    return xmlText
  }

  private _convertTagToText(tag: Tree) {
    let tagText = '<' + tag.name

    for (let attribute in tag.attributes) {
      tagText += ' ' + attribute + '="' + tag.attributes[attribute] + '"'
    }

    if (tag.value.length > 0) {
      tagText += '>' + tag.value
    } else {
      tagText += '>'
    }

    if (tag.children.length === 0) {
      tagText += '</' + tag.name + '>'
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
