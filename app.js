
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const port = process.env.PORT || 4000
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.post('/webhook', (req, res) => {
    let reply_token = req.body.events[0].replyToken
    //reply(reply_token, req.body.events[0].message)
    //res.sendStatus(200)
    res.json(req.body.events)
})
app.listen(port)

function reply(reply_token, mes) {
    let headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer {XdnwLY7GgF/eWd1Uy8nPCThmPtS9DfxU9wJU/MErEz3NwmCJ8TGX6Op35C4CczUTEHY1rlrTEzaiETLiqevZgdgiYk9Ds04TeYPEWXs2TqEqfKiGb3GqsOC+ovynf4mXVFFVbCLftNUC35+SgEuMdQdB04t89/1O/w1cDnyilFU=}'
    }

    let body = null
    if(mes.type === 'text'){
        if(mes.text.includes('NewOrder')){
            body = JSON.stringify({
                replyToken: reply_token,
                messages: [
                    {
                        type: 'text',
                        text: 'กรุณาแชร์ตำแหน่งที่ตั้ง (Location) เพื่อยืนยันออเดอร์'
                    }
                ]
            })
        }else{
            body = JSON.stringify({
                replyToken: reply_token,
                messages: [
                    {
                        type: 'text',
                        text: 'กรุณารอสักครู่ Admin กำลังตรวจสอบ..'
                    }
                ]
            })
        }
    }else if(mes.type === 'location'){
        body = JSON.stringify({
            replyToken: reply_token,
            messages: [
                {
                    type: 'text',
                    text: `คุณได้สั่งออเดอร์แล้ว โปรดรอการจัดส่ง`
                }
            ]
        })
    }else{
        body = JSON.stringify({
            replyToken: reply_token,
            messages: [
                {
                    type: 'text',
                    text: `ชนิดข้อความ > ${mes.type}`
                }
            ]
        })
    }
    
    request.post({
        url: 'https://api.line.me/v2/bot/message/reply',
        headers: headers,
        body: body
    }, (err, res, body) => {
        console.log('status = ' + res.statusCode);
    });
}