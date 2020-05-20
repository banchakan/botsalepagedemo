const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const axios = require('axios')
const app = express()
const port = process.env.PORT || 4000

const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message/reply'
const LINE_HEADER = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer {XdnwLY7GgF/eWd1Uy8nPCThmPtS9DfxU9wJU/MErEz3NwmCJ8TGX6Op35C4CczUTEHY1rlrTEzaiETLiqevZgdgiYk9Ds04TeYPEWXs2TqEqfKiGb3GqsOC+ovynf4mXVFFVbCLftNUC35+SgEuMdQdB04t89/1O/w1cDnyilFU=}`
}

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.post('/webhook', (req, res) => {
    if(req.body.events[0].message.type === 'image'){
        getContent(req.body.events[0].replyToken, req.body.events[0].message.id)
    }else{
        let model = {
            type: 'text',
            text: 'กรุณาส่งรูปภาพเท่านั้น'
        }
        replyMessage(req.body.events[0].replyToken, model)
    }
    
    res.json(200)
})

app.listen(port)

function replyMessage(replyToken, jsonMessage){
    request.post({
        url: `${LINE_MESSAGING_API}/reply`,
        headers: LINE_HEADER,
        body: JSON.stringify({
            replyToken: replyToken,
            messages: [jsonMessage]
        })
    }, (err, res, body) => {
        console.log('status = ' + res.statusCode);
    });
}

async  function getContent(replyToken , messageId){
    const config = {
        method: 'get',
        url: `https://api.line.me/v2/bot/message/${messageId}/content`,
        headers: {
            'Authorization': 'Bearer {XdnwLY7GgF/eWd1Uy8nPCThmPtS9DfxU9wJU/MErEz3NwmCJ8TGX6Op35C4CczUTEHY1rlrTEzaiETLiqevZgdgiYk9Ds04TeYPEWXs2TqEqfKiGb3GqsOC+ovynf4mXVFFVbCLftNUC35+SgEuMdQdB04t89/1O/w1cDnyilFU=}'
        }
    }

    let res = await axios(config)

    let model = {
        type: 'text',
        text: `${res.data}`
    }
    replyMessage(replyToken, model)

    console.log("DATA CONTENT >>> " , res);
}