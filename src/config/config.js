/* config.js */
// require and configure dotenv, will load vars in .env in PROCESS.ENV

require('dotenv').config()

export const config = {
  version: process.env.version,
  env: process.env.NODE_ENV,
  port: process.env.port
}

export const ocrSpaceCongfig = {
  apikey: '519488f9a488957',
  language: 'cht',
  isOverlayRequired: true
}
