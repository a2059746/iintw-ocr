import exrpress from 'express'
import ocrCtrl from './ocr.controller'

const router = exrpress.Router()

router.route('/url').post(ocrCtrl.getOcrDataFromUrl)
router.route('/local').get(ocrCtrl.getOcrDataFromLocal)
router.route('/multiUrl').post(ocrCtrl.sortApplicationPhoto)

export default router
