
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
    testMessage(req.body.events[0].message, req.body.events[0].replyToken)
    //replyMessage(req.body)
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

    checkMessage(msg).then(status => {
        if(status === true){
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
                                text: 'ขอบคุณที่ใช้บริการ'
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
        }else{
            testMessage(status,replyToken)
        }
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
            if(mes.text.includes('New Order No.')){
                getPomasterId(mes.text).then(poId => {
                    api.get(`/pomaster/pomaster?id=${poId}`).then(opj_pomaster => {
                        if(opj_pomaster.data.poStatus.id === 1){
                            //พบรายการสั่งซื้อใหม่
                            resolve(true)
                        }else{
                            //พบการสั่งซื้อแต่สถานะ ไม่ใช่ ออเดอร์ใหม่
                            resolve('พบการสั่งซื้อแต่สถานะ ไม่ใช่ ออเดอร์ใหม่')
                        }
                    }).catch(err => {
                        //ไม่พบรายการสั่งซื้อ
                        resolve('ไม่พบรายการสั่งซื้อ')
                    })
                })
            }else{
                //ข้อความอื่น ๆ
                resolve('ข้อความอื่น ๆ')
            }
        }else{
            //ลูกค้าไม่ได้ส่งเป็น text
            resolve('ลูกค้าไม่ได้ส่งเป็น text')
        }
    })
}


function getPomasterId(msg){
    return new Promise((resolve,reject) => {
        let poId = null
        let array = msg.split('เวลารับสินค้า')[0].split(' ')
        array.forEach(val => {
            let isnum = /^\d+$/.test(val);
            console.log(`${val} => ${isnum}`)
            if(isnum){
                poId = Number(val)
            }
        })
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









// function replyMessage(body){
//     let reply_token = body.events[0].replyToken
//     let msg =  body.events[0].message
//     let userId = body.events[0].source.userId

//     createMessage(reply_token, msg, userId).then(result => {
//         let headers = {
//             'Content-Type': 'application/json',
//             'Authorization': 'Bearer {XdnwLY7GgF/eWd1Uy8nPCThmPtS9DfxU9wJU/MErEz3NwmCJ8TGX6Op35C4CczUTEHY1rlrTEzaiETLiqevZgdgiYk9Ds04TeYPEWXs2TqEqfKiGb3GqsOC+ovynf4mXVFFVbCLftNUC35+SgEuMdQdB04t89/1O/w1cDnyilFU=}'
//         }

//         request.post({
//             url: 'https://api.line.me/v2/bot/message/reply',
//             headers: headers,
//             body: result
//         }, (err, res, body) => {
//             console.log('status = ' + res.statusCode);
//         });
//     })
// }

// function createMessage(reply_token, mes, userId) {
//     return new Promise((resolve,reject) => {
//         let body = null
//         if(mes.type === 'text'){
//             if(mes.text.includes('New Order No.')){
//                 notifyMessage(mes.text).then(notify_result => {
//                     if(notify_result.status === 200){
//                         body = JSON.stringify({
//                             replyToken: reply_token,
//                             messages: [
//                                 {
//                                     type: 'text',
//                                     text: 'กรุณาแชร์ตำแหน่งที่ตั้ง (Location) เพื่อยืนยันออเดอร์'
//                                 }
//                             ]
//                         })
//                         resolve(body)
//                     }else{
//                         body = JSON.stringify({
//                             replyToken: reply_token,
//                             messages: [
//                                 {
//                                     type: 'text',
//                                     text: 'เกิดข้อผิดพลาดในการสั่งซื้อ..'
//                                 }
//                             ]
//                         })
//                         resolve(body)
//                     }
//                 })
//             }
//         }else if(mes.type === 'location'){
//             let model = {
//                 data: {
//                     userId: userId,
//                     message: mes
//                 }
//             }
//             api.post('/checkOrder', {data: model.data.userId}).then(status => {
//                 if(status.data === false){
//                     api.post('/setLocationOrder', model)
//                     .then(result => {                
//                         if(result){
//                             updateOrderNotifyMessage(result.data).then(text => {
//                                 notifyMessage(text).then(re => {
//                                     body = JSON.stringify({
//                                         replyToken: reply_token,
//                                         messages: [
//                                             {
//                                                 type: 'text',
//                                                 text: `คุณได้สั่งออเดอร์แล้ว โปรดรอการจัดส่ง`
//                                             }
//                                         ]
//                                     })
//                                     resolve(body)
//                                 })
//                             }) 
//                         }else{
//                             body = JSON.stringify({
//                                 replyToken: reply_token,
//                                 messages: [
//                                     {
//                                         type: 'text',
//                                         text: `บันทึกข้อมูลผิดพลาด..`
//                                     }
//                                 ]
//                             })
//                             resolve(body)
//                         }
//                     }).catch(err => {
//                         //error
//                     })  
//                 }
//             })
//         }
//     })
// }

// function updateOrderNotifyMessage(order){
//     return new Promise((resolve,reject) => {
//         let title = `Update Order No. ${order.orderId}\n`
//         //let user = `ชื่อ: ${order.name}\nเบอร์โทร: ${order.tel}\nอีเมล์: ${order.email}\n`
//         let user = `ชื่อ: ${order.name}\nเบอร์โทร: ${order.tel}\n`
//         let address = ''
//         if(order.addressTitle){
//             address = `**ที่อยู่\n${order.addressTitle}\n${order.addressDetail}\n`
//         }else{
//             address = `**ที่อยู่\n${order.addressDetail}\n`
//         }
//         let url = `URL: https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}\n`
//         let product = order.orderDetail
//         resolve(`${title}${user}${address}${url}${product}`)
//     })
// }



// function getMessage() {
//     return {
//         "type": "flex",
//         "altText": "New Order",
//         "contents": {
//           "type": "bubble",
//           "direction": "ltr",
//           "header": {
//             "type": "box",
//             "layout": "vertical",
//             "contents": [
//               {
//                 "type": "text",
//                 "text": "Purchase",
//                 "size": "lg",
//                 "align": "start",
//                 "gravity": "center",
//                 "weight": "bold",
//                 "color": "#3FB81A"
//               },
//               {
//                 "type": "text",
//                 "text": "฿ 100.00",
//                 "size": "3xl",
//                 "weight": "bold",
//                 "color": "#000000"
//               },
//               {
//                 "type": "text",
//                 "text": "Order No. OD-0001",
//                 "size": "sm",
//                 "weight": "bold",
//                 "color": "#000000"
//               },
//               {
//                 "type": "text",
//                 "text": "2020.05.08 22:30 (GMT+0700)",
//                 "size": "xxs",
//                 "weight": "regular",
//                 "color": "#949494"
//               }
//             ]
//           },
//           "body": {
//             "type": "box",
//             "layout": "vertical",
//             "margin": "none",
//             "contents": [
//               {
//                 "type": "image",
//                 "url": "https://aowtakiabseafood.com/wp-content/uploads/2018/04/aowtakiab-feature.jpg",
//                 "margin": "none",
//                 "align": "start",
//                 "size": "full",
//                 "aspectRatio": "4:3",
//                 "aspectMode": "fit"
//               }
//             ]
//           }
//         }
//       }
// }




























// function findOrderIdByMessageNewOrder(msg){
//     return new Promise((resolve,reject) => {
//         let orderId = null
//         let text = msg.split('ชื่อ')[0].split(' ')
//         text.forEach(sub_text => {
//             if(Number(sub_text)){
//                 orderId = sub_text
//             }
//         })
//         resolve(orderId)
//     })
// }