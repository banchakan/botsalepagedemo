
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const port = process.env.PORT || 4000
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.post('/webhook', (req, res) => {
    // let reply_token = req.body.events[0].replyToken
    replyMessage(req.body)
    //reply(reply_token, req.body.events[0].message)
    //res.sendStatus(200)
    res.json(200)
})
app.listen(port)

function replyMessage(body){
    let reply_token = body.events[0].replyToken
    let msg =  body.events[0].message

    createMessage(reply_token, msg).then(result => {
        let headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer {XdnwLY7GgF/eWd1Uy8nPCThmPtS9DfxU9wJU/MErEz3NwmCJ8TGX6Op35C4CczUTEHY1rlrTEzaiETLiqevZgdgiYk9Ds04TeYPEWXs2TqEqfKiGb3GqsOC+ovynf4mXVFFVbCLftNUC35+SgEuMdQdB04t89/1O/w1cDnyilFU=}'
        }

        request.post({
            url: 'https://api.line.me/v2/bot/message/reply',
            headers: headers,
            body: result
        }, (err, res, body) => {
            console.log('status = ' + res.statusCode);
        });
    })
}

function createMessage(reply_token, mes) {
    return new Promise((resolve,reject) => {
        let body = null
        if(mes.type === 'text'){
            if(mes.text.includes('NewOrder')){
                notifyMessage(mes.text).then(res_body => {
                    if(res_body.status === 200){
                        body = JSON.stringify({
                            replyToken: reply_token,
                            messages: [
                                {
                                    type: 'text',
                                    text: 'กรุณาแชร์ตำแหน่งที่ตั้ง (Location) เพื่อยืนยันออเดอร์'
                                }
                            ]
                        })
                        resolve(body)
                    }else{
                        body = JSON.stringify({
                            replyToken: reply_token,
                            messages: [
                                {
                                    type: 'text',
                                    text: 'เกิดข้อผิดพลาดในการสั่งซื้อ..'
                                }
                            ]
                        })
                        resolve(body)
                    }
                })
            }else{
                body = JSON.stringify({
                    replyToken: reply_token,
                    messages: [
                        {
                            type: 'text',
                            text: 'หนูเป็น bot หนูตอบไม่ได้..'
                        }
                    ]
                })
                resolve(body)
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
            resolve(body)
        }
    })
    //else{
        // body = JSON.stringify({
        //     replyToken: reply_token,
        //     messages: [
        //         {
        //             type: 'text',
        //             text: `หนูเป็น bot หนูตอบไม่ได้..`
        //         }
        //     ]
        // })
    //}   
}

function notifyMessage(text){
    return new Promise((resolve,reject) => {
        request({
            method: 'POST',
            uri: 'https://notify-api.line.me/api/notify',
            header: {'Content-Type': 'application/x-www-form-urlencoded'},
            auth: {bearer: '3iEMFExWiRAUpKfW8ZAA59KR44BEDdVpG18SYCVSZMj'},
            form: {message: text,},
        }, (err, httpResponse, body) => {
            if (err) {
                reject(null)
            } else {
                resolve(JSON.parse(body))
            }
        })
    })
}