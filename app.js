
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const port = process.env.PORT || 4000
const api = require('./config/createInstance');

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.post('/webhook', (req, res) => {
    replyMessage(req.body)
    res.json(200)
})
app.listen(port)

function replyMessage(body){
    let reply_token = body.events[0].replyToken
    let msg =  body.events[0].message
    let userId = body.events[0].source.userId

    createMessage(reply_token, msg, userId).then(result => {
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

function createMessage(reply_token, mes, userId) {
    return new Promise((resolve,reject) => {
        let body = null
        if(mes.type === 'text'){
            if(mes.text.includes('New Order No.')){
                notifyMessage(mes.text).then(notify_result => {
                    if(notify_result.status === 200){
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
            }
        }else if(mes.type === 'location'){
            let model = {
                data: {
                    userId: userId,
                    message: mes
                }
            }
            api.post('/checkOrder', {data: model.data.userId}).then(status => {
                if(status.data === false){
                    api.post('/setLocationOrder', model)
                    .then(result => {                
                        if(result){
                            updateOrderNotifyMessage(result.data).then(text => {
                                notifyMessage(text).then(re => {
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
                                })
                            }) 
                        }else{
                            body = JSON.stringify({
                                replyToken: reply_token,
                                messages: [
                                    {
                                        type: 'text',
                                        text: `บันทึกข้อมูลผิดพลาด..`
                                    }
                                ]
                            })
                            resolve(body)
                        }
                    }).catch(err => {
                        //error
                    })  
                }
            })
        }
    })
}

function updateOrderNotifyMessage(order){
    return new Promise((resolve,reject) => {
        let title = `Update Order No. ${order.orderId}\n`
        let user = `ชื่อ: ${order.name}\nเบอร์โทร: ${order.tel}\nอีเมล์: ${order.email}\n`
        let address = ''
        if(order.addressTitle){
            address = `**ที่อยู่\n${order.addressTitle}\n${order.addressDetail}\n`
        }else{
            address = `**ที่อยู่\n${order.addressDetail}\n`
        }
        let url = `URL: https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}\n`
        let product = order.orderDetail
        resolve(`${title}${user}${address}${url}${product}`)
    })
}

function notifyMessage(text){
    return new Promise((resolve,reject) => {
        request({
            method: 'POST',
            uri: 'https://notify-api.line.me/api/notify',
            header: {'Content-Type': 'application/x-www-form-urlencoded'},
            auth: {bearer: '3iEMFExWiRAUpKfW8ZAA59KR44BEDdVpG18SYCVSZMj'},
            form: {message: text},
        }, (err, httpResponse, body) => {
            if (err) {
                reject(null)
            } else {
                resolve(JSON.parse(body))
            }
        })
    })
}




























function findOrderIdByMessageNewOrder(msg){
    return new Promise((resolve,reject) => {
        let orderId = null
        let text = msg.split('ชื่อ')[0].split(' ')
        text.forEach(sub_text => {
            if(Number(sub_text)){
                orderId = sub_text
            }
        })
        resolve(orderId)
    })
}



