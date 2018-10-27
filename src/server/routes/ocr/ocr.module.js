import ocrSpaceApi from 'ocr-space-api'
import { ocrSpaceCongfig } from '../../../config/config'

const passportRegex = {
  越南: /[a-z]{1}\d{7}/i // 越南
}

export const imgUrlToText = (imgUrl) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await ocrSpaceApi.parseImageFromUrl(imgUrl, ocrSpaceCongfig)
      const res = getInfoFromArc(result.parsedText)
      const text = myParsedText(result.ocrParsedResult.ParsedResults[0].TextOverlay.Lines)
      resolve(text)
    } catch (err) {
      console.log(err)
      reject(err)
    }
  })
}

export const imgLocalToText = () => {
  return new Promise(async (resolve, reject) => {
    const imgPath = 'ocr2.jpg' // root path
    try {
      const result = await ocrSpaceApi.parseImageFromLocalFile(imgPath, ocrSpaceCongfig)
      console.log(result)
      resolve(result.parsedText)
    } catch (err) {
      console.log(err)
      reject(err)
    }
  })
}


export const multiImgUrlToText = (imgUrlArr) => {
  return new Promise(async (resolve, reject) => {
    // responesArray[{ phone:..., sucImg:[], errImg:[] }]
    console.log('start')
    const responesArray = []
    let hasFirstApp = false
    let phone = null
    let img = {
      phone: '',
      sucImg: [],
      errImg: []
    }
    // let memberInfo = {
    //   name: '',
    //   country: '',
    //   arcNum: '',
    //   passNum: '',
    //   arcExpiredDate: '',
    //   phone: '',
    //   arcPhoto: ''
    // }
    let memberInfo = null
    for (const url of imgUrlArr) {
      try {
        console.log('scaning...')
        const result = await ocrSpaceApi.parseImageFromUrl(url, ocrSpaceCongfig)
        const parsedText = myParsedText(result.ocrParsedResult.ParsedResults[0].TextOverlay.Lines)
        const data = getApplicationData(parsedText)
        if (data) { // 抓到"手機號碼" or "預付卡服務申請書"，表示此為申請書
          console.log('app')
          if (hasFirstApp) { // 表示並非"第一份"申請書
            responesArray.push({
              img, memberInfo
            })
            phone = data.phoneNum
            img = {
              phone: '',
              sucImg: [],
              errImg: []
            }
            memberInfo = null
            img.phone = phone
            img.sucImg.push(url)
          } else { // 第一份申請書
            hasFirstApp = true
            phone = data.phoneNum
            img.phone = phone
            img.sucImg.push(url)
          }
        } else { // 無手機號碼，表示此為證件照
          console.log('card')
          const type = verifyCards(parsedText)
          if (type) {
            img.sucImg.push(url)
            if (type === 1) {
              const memeberData = getInfoFromArc(parsedText)
              memberInfo = memeberData
              memberInfo.phone = phone
              memberInfo.arcPhoto = url
            }
          } else {
            img.errImg.push(url)
          }
        }
      } catch (err) {
        console.log('get phone num err')
        console.log(err)
        return reject(err)
      }
    }
    responesArray.push({
      img, memberInfo
    })
    console.log('finish')
    return resolve(responesArray)
  })
}

// g = global, match all instances of the pattern in a string, not just one
// i = case-insensitive (so, for example, /a/i will match the string "a" or "A"
function getApplicationData(rawText) {
  console.log('matchiing')
  const text = rawText.replace(/[\r\n]+/g, '') // text to one line
  const isApp = text.match(/預付卡服務申請書/)
  const phoneNumObj = text.match(/09\d{8}/)
  if (!isApp) return null
  if (!phoneNumObj) { return { phoneNum: '' } }
  return { phoneNum: phoneNumObj[0] }
}

// 只要抓到中文字，代表審核通過
function verifyCards(rawText) {
  const text = rawText.replace(/[\r\n]+/g, '') // text to one line
  // const regex = /全民健康保險|中華民國居留證/
  const regex = /[\u4e00-\u9fa5]/ // 中文
  const cardTypeObj = text.match(regex)
  const isArc = text.match(/ARC/)
  if (!cardTypeObj) return null
  if (isArc) return 1
  return 2
}

// health ID card
function getHidCardData(text) {
  // const text = rawText.replace(/[\r\n]+/g, '') // text to one line
  const idNum = text.match(/[a-z]{2}\d{8}/i)[0]
  let name = text.match(new RegExp(`\r\n(.*)\r\n${idNum}`))[0]
  name = name.substring()

  return {
    idNum,
    name
  }
}

function getInfoFromArc(text) {
  console.log('arc matching')
  const res = {
    name: '',
    country: '',
    arcNum: '',
    passNum: '',
    arcExpiredDate: ''
  }
  // matching country
  const country = text.match(/越南|泰國|菲律賓/)
  if (country) {
    res.country = country[0]
    // matching passport number
    const passNum = text.match(passportRegex[res.country])
    if (passNum) res.passNum = passNum[0]
  }
  // matching arc number
  const arcNum = text.match(/[a-z]{2}\d{8}/i)
  if (arcNum) res.arcNum = arcNum[0]
  // matching arc expired date
  const arcExpiredDate = text.match(/[0-9]{4}\/[0-9]{2}\/[0-9]{2}/g)
  if (arcExpiredDate) {
    const lastIndex = arcExpiredDate.length - 1
    const currentYear = new Date().getFullYear()
    const expiredYear = new Date(arcExpiredDate[lastIndex]).getFullYear()
    if (expiredYear > currentYear) res.arcExpiredDate = arcExpiredDate[lastIndex]
  }
  // matching name
  const name = text.match(/(?<=姓名.*\r\n)(.*)(?=\r\n)/)
  if (name) res.name = name[0].replace(/[^a-z\s]/gi, '')
  // const res = text.match(/(越南|泰國|菲律賓)|([a-z]{2}\d{8})|([a-z]{1}\d{7})/ig)
  return res
}

function myParsedText(lines) {
  let parsedText = ''
  const englishRegex = /[a-z]/i
  lines.forEach((w) => {
    w.Words.forEach((t) => {
      if (t.WordText.match(englishRegex)) {
        parsedText = `${parsedText + t.WordText} `
      } else {
        parsedText += t.WordText
      }
    })
    parsedText = parsedText.trim()
    parsedText = `${parsedText}\r\n`
  })
  return parsedText
}
