export function hyphenToCamelCase(string: string) {
  return string.replace(/-(.)/g, function (match, chr) {
    return chr.toUpperCase()
  })
}

export function camelCaseToHyphen(string: string) {
  return string.replace(/([A-Z])/g, function (s) {
    return '-' + s.charAt(0).toLowerCase()
  })
}

export function invertObject(obj: { [x: string]: string }) {
  return Object.keys(obj).reduce<{ [x: string]: string }>(
    (inverted, key) => ({ ...inverted, [inverted[key]]: key }),
    {}
  )
}
