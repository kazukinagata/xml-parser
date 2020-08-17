import XMLParser from './index'

const sampleSVG = `
<svg version="1.1" id="レイヤー_1" xmlns="http://www.w3.org/2000/svg" x="0" y="0" viewBox="0 0 258 155.9" xml:space="preserve">
  <style>.st0{enable-background:new}.st1{fill:#231815}.st2{font-family:&apos;KozGoPr6N-Regular-83pv-RKSJ-H&apos;}.st3{font-size:13px}.st4{font-family:&apos;ArialMT&apos;}.st5{fill:#5d5959}.st6{font-size:5.5px}.st8{font-family:&apos;SourceHanSans-Bold-83pv-RKSJ-H&apos;}.st9{font-size:5px}</style>
  <font horiz-adv-x="2048">
    <font-face font-family="ArialMT" units-per-em="2048" underline-position="-217" underline-thickness="150" />
    <glyph horiz-adv-x="569" />
    <glyph unicode="!" horiz-adv-x="569" d="M231 364l-55 777v325h223v-325l-52-777M184 0v205h207V0z" />
    <glyph unicode="&quot;" horiz-adv-x="727" d="M144 947l-50 279v240h205v-240l-45-279m221 0l-49 279v240h205v-240l-48-279z" />
    <glyph unicode="#" horiz-adv-x="1139" d="M103-25l87 426H21v149h199l74 363H21v149h303l87 429h150l-87-429h315l87 429h151l-87-429h173V913H910l-75-363h278V401H805L718-25H568l86 426H340L253-25m117 575h314l75 363H444z" />
  </font>
  <g>
    <text transform="translate(17.007 53.95)" class="st0" font-size="16">
      <tspan x="0" y="0" class="st1 st2 st3">夏目</tspan>
      <tspan x="28" y="0" class="st1 st4 st3"></tspan>
      <tspan x="32.6" y="0" class="st1 st2 st3">漱石</tspan>
    </text>
    <path fill="none" d="M149.2 117.3h100v22.8h-100z" />
  </g>
</svg>
`

test('parseFromString return array tree', () => {
  const parser = new XMLParser()
  const tree = parser.parseFromString(sampleSVG)
  expect(tree?.name).toBe('svg')
  expect(tree?.children.length).toBe(3)
  // convert attribute for jsx
  const texts = XMLParser.getElementsByTagName(tree!, 'text')
  expect(texts[0].attributes.fontSize).toBeTruthy()
  // convert tagName for jsx
  const fontFaces = XMLParser.getElementsByTagName(tree!, 'fontFace')
  expect(fontFaces.length).toBe(1)
})

test('toString revert to origin xml', () => {
  const parser = new XMLParser()
  const tree = parser.parseFromString(sampleSVG)
  const reverted = parser.toString(tree!)
  expect(parser.parseFromString(reverted)).toEqual(tree)
})

test('options.ignoredTags ignore the tag end children when parse string', () => {
  const parser = new XMLParser({ignoredTags: ['font']})
  const tree = parser.parseFromString(sampleSVG)
  expect(tree?.children.length).toBe(2)
})

test('options.ignoredTagAttrs ignore the tag attribute when parse string', () => {
  const parser = new XMLParser({ignoredTagAttrs: ['viewBox']})
  const tree = parser.parseFromString(sampleSVG)
  expect(tree?.attributes.viewBox).toBeUndefined()
})

test('options.ignoredTagAttrs ignore the tag attribute when parse string', () => {
  const parser = new XMLParser({ignoredTagAttrs: ['viewBox']})
  const tree = parser.parseFromString(sampleSVG)
  expect(tree?.attributes.viewBox).toBeUndefined()
})

test('options.onTagParsed run correctly', () => {
  const parser = new XMLParser({onTagParsed: (tag) => {
    tag.meta = tag.meta || {}
    tag.meta.id = 'testId'
    return tag
  }})
  const tree = parser.parseFromString(sampleSVG)
  expect(tree?.meta?.id).toBe('testId')
})

test('options.type === "dom" return without converting tag and attributes for jsx', () => {
  const parser = new XMLParser({type: 'dom'})
  const tree = parser.parseFromString(sampleSVG)
  // Don't convert attribute for jsx
  const texts = XMLParser.getElementsByTagName(tree!, 'text')
  expect(texts[0].attributes.fontSize).toBeFalsy()
  expect(texts[0].attributes['font-size']).toBeTruthy()
  // Don't convert tagName for jsx
  const jsxFontFaces = XMLParser.getElementsByTagName(tree!, 'fontFace')
  expect(jsxFontFaces.length).toBe(0)
  const fontFaces = XMLParser.getElementsByTagName(tree!, 'font-face')
  expect(fontFaces.length).toBe(1)

})
