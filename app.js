const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const port = process.env.PORT || 4000
const api = require('./config/createInstance')
const url = require('url')

const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message/reply'
const HEADERS = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer {pHMfirGFEJjHv7rmWBhjz1W4AUq+gSoIigl1+9cWPquVQKkMRiYTfmF4phnPY55VJgoT2oGO8fvsDznQTnfdwLKL0PefmSFNq48zpHsWki2LQPVBuPLH/Zlpf5mX0X+9D4b01Qm4YKWBUijLwMhE3gdB04t89/1O/w1cDnyilFU=}'
}

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.post('/:shop', (req, res) => {
    request.post({
        url: LINE_MESSAGING_API,
        headers: HEADERS,
        body: JSON.stringify({
            replyToken: req.body.events[0].replyToken,
            messages: [
                {
                    type: 'text',
                    text: JSON.stringify(req.body)
                }
            ]
        })
    }, (err, res, body) => {
        console.log('status = ' + res.statusCode);
        res.json(200)
    });
})