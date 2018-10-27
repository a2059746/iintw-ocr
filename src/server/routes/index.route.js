import express from 'express'
import { config } from '../../config/config'
import ocr from './ocr/ocr.route'

const router = express.Router()

/* GET localhost:[port]/api page. */
router.get('/', (req, res) => {
  res.send(`此路徑是: localhost:${config.port}/api`)
})

router.use('/ocr', ocr)

export default router
