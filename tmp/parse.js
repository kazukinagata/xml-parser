const fs = require('fs')
const XMLParser = require('../xmlParser')
const xmlParser = new XMLParser()

const buf = fs.readFileSync('./demo.svg')
const tree = xmlParser.parseFromString(buf.toString())
console.log(tree)
