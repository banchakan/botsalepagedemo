
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const port = process.env.PORT || 4000

const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message/reply';
const LINE_HEADER = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer {XdnwLY7GgF/eWd1Uy8nPCThmPtS9DfxU9wJU/MErEz3NwmCJ8TGX6Op35C4CczUTEHY1rlrTEzaiETLiqevZgdgiYk9Ds04TeYPEWXs2TqEqfKiGb3GqsOC+ovynf4mXVFFVbCLftNUC35+SgEuMdQdB04t89/1O/w1cDnyilFU=}'
}

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.post('/webhook', (req, res) => {
    sendMessage(req.body)
    res.json(200)
})
app.listen(port)

function sendMessage(bodyResponse){
    request.post({
        url: LINE_MESSAGING_API,
        headers: LINE_HEADER,
        body: JSON.stringify({
                replyToken: bodyResponse.events[0].replyToken,
                messages: [{
                    type: `text`,
                    text: JSON.stringify(bodyResponse)
                }]
            })
    }, (err, res, body) => {
        console.log('status = ', res.statusCode);
    });
}


