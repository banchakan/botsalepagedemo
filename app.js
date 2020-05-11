
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const port = process.env.PORT || 4000
const api = require('./config/createInstance');

const TOKEN_GROUP_ADMIN = '3iEMFExWiRAUpKfW8ZAA59KR44BEDdVpG18SYCVSZMj'
const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message/reply';
const LINE_HEADER = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer {XdnwLY7GgF/eWd1Uy8nPCThmPtS9DfxU9wJU/MErEz3NwmCJ8TGX6Op35C4CczUTEHY1rlrTEzaiETLiqevZgdgiYk9Ds04TeYPEWXs2TqEqfKiGb3GqsOC+ovynf4mXVFFVbCLftNUC35+SgEuMdQdB04t89/1O/w1cDnyilFU=}'
}

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.post('/webhook', (req, res) => {
    //testMessage(req.body.events[0].message, req.body.events[0].replyToken)
    replyMessage(req.body)
    //checkMessage(req.body.data).then(data => {
    //     res.json(data)  
    // }).catch(text => {
    //     res.json(text) 
    // })
    res.json(200)  
     
})
app.post('/social', (req, res) => {
    let message = req.body.data
    notifyMessageSocial(message).then(() => {
        res.json(true)
    }).catch(err => {
        res.json(false)
    })
    
})
app.listen(port)

function replyMessage(body){
    let msg = body.events[0].message
    let replyToken = body.events[0].replyToken

    checkMessage(msg).then(id => {
        notifyMessageLine(msg.text).then(() => {
            //ส่งข้อความให้ Admin สำเร็จ 
            request.post({
                url: LINE_MESSAGING_API,
                headers: LINE_HEADER,
                body: JSON.stringify({
                    replyToken: replyToken,
                    messages: [
                        {
                            type: 'text',
                            text: 'คุณได้สั่งออเดอร์แล้ว โปรดรอการจัดส่ง'
                        },
                        {
                            type: 'text',
                            text: 'ขอบคุณที่ใช้บริการ ' + id
                        }
                    ]
                })
            }, (err, res, body) => {
                console.log('status = ' + res.statusCode);
            });
        }).catch(err => {
            //การส่งข้อความไปยังกลุ่ม Admin ผิดพลาด
            testMessage('การส่งข้อความไปยังกลุ่ม Admin ผิดพลาด',replyToken)
        })
    }).catch(text => {
        //err ดูในเมธอด checkMessage => reject
        testMessage(text,replyToken)
    })
}

function testMessage(text,replyToken){
    request.post({
        url: LINE_MESSAGING_API,
        headers: LINE_HEADER,
        body: JSON.stringify({
            replyToken: replyToken,
            messages: [
                {
                    type: 'text',
                    text: text
                }
            ]
        })
    }, (err, res, body) => {
        console.log('status = ' + res.statusCode);
    });
}

function checkMessage(msg){
    return new Promise((resolve,reject) => {
        if(msg.type === 'text'){
            if(msg.text.includes('New Order No.')){
                getPomasterId(msg.text).then(poId => {
                    api.get(`/pomaster/pomaster?id=6`).then(opj_pomaster => {
                        if(opj_pomaster.data.poStatus.id === 1){
                            //พบรายการสั่งซื้อใหม่
                            resolve(poId)
                        }else{
                            //พบการสั่งซื้อแต่สถานะ ไม่ใช่ ออเดอร์ใหม่
                            reject('พบการสั่งซื้อแต่สถานะ ไม่ใช่ ออเดอร์ใหม่')
                        }
                    }).catch(err => {
                        console.log("ERROR => ", err)
                        //ไม่พบรายการสั่งซื้อ
                        //reject('ไม่พบรายการสั่งซื้อ')
                        reject(poId)
                    })
                })
            }else{
                //ข้อความอื่น ๆ
                reject('ข้อความอื่น ๆ')
            }
        }else{
            //ลูกค้าไม่ได้ส่งเป็น text
            reject('ลูกค้าไม่ได้ส่งเป็น text')
        }
    })
}


function getPomasterId(msg){
    return new Promise((resolve,reject) => {
        let poId = null
        let array = msg.split('เวลารับสินค้า')[0].split(' ')
        for(let i = 0 ; i < array.length ; i++){
            let isnum = /^\d+$/.test(array[i])
            if(isnum === true){
                poId = Number(array[i])
                break;
            }
        }
        resolve(poId)        
    })
}



function notifyMessageLine(text){
    return new Promise((resolve,reject) => {
        request({
            method: 'POST',
            uri: 'https://notify-api.line.me/api/notify',
            header: {'Content-Type': 'application/x-www-form-urlencoded'},
            auth: {bearer: TOKEN_GROUP_ADMIN},
            form: {message: `${text}\nช่องทางการสั่งซื้อ: LINE`}
        }, (err, httpResponse, body) => {
            if (err) {
                reject(null)
            } else {
                resolve(JSON.parse(body))
            }
        })
    })
}

function notifyMessageSocial(text){
    return new Promise((resolve,reject) => {
        request({
            method: 'POST',
            uri: 'https://notify-api.line.me/api/notify',
            header: {'Content-Type': 'application/x-www-form-urlencoded'},
            auth: {bearer: TOKEN_GROUP_ADMIN},
            form: {message: `${text}\nช่องทางการสั่งซื้อ: Facebook/อื่น ๆ`}
        }, (err, httpResponse, body) => {
            if (err) {
                reject(null)
            } else {
                resolve(JSON.parse(body))
            }
        })
    })
}