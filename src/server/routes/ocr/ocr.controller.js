import * as ocrModule from './ocr.module'

const getOcrDataFromUrl = async (req, res) => {
  const imgUrl = req.body.imgUrl
  try {
    const result = await ocrModule.imgUrlToText(imgUrl)
    return res.json({
      error: false,
      result
    })
  } catch (err) {
    return res.json({
      error: true
    })
  }
}

const getOcrDataFromLocal = async (req, res) => {
  try {
    const result = await ocrModule.imgLocalToText()
    return res.json({
      error: false,
      result
    })
  } catch (err) {
    return res.json({
      error: true
    })
  }
}

const sortApplicationPhoto = async (req, res) => {
  const imgUrlArr = req.body
  try {
    const result = await ocrModule.multiImgUrlToText(imgUrlArr)
    return res.json({
      error: false,
      result
    })
  } catch (err) {
    return res.json({
      error: true
    })
  }
}

export default {
  getOcrDataFromUrl,
  getOcrDataFromLocal,
  sortApplicationPhoto
}
