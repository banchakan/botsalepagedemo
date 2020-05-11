
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
    const msg = getMessage();
    request.post({
        url: LINE_MESSAGING_API,
        headers: LINE_HEADER,
        body: JSON.stringify({
                replyToken: bodyResponse.events[0].replyToken,
                messages: [msg]
            })
    }, (err, res, body) => {
        console.log('status = ', res.statusCode);
    });
}

function getMessage() {
    return {
        "type": "flex",
        "altText": "New Order",
        "contents": {
          "type": "bubble",
          "direction": "ltr",
          "header": {
            "type": "box",
            "layout": "vertical",
            "contents": [
              {
                "type": "text",
                "text": "Purchase",
                "size": "lg",
                "align": "start",
                "gravity": "center",
                "weight": "bold",
                "color": "#3FB81A"
              },
              {
                "type": "text",
                "text": "฿ 100.00",
                "size": "3xl",
                "weight": "bold",
                "color": "#000000"
              },
              {
                "type": "text",
                "text": "Order No. OD-0001",
                "size": "sm",
                "weight": "bold",
                "color": "#000000"
              },
              {
                "type": "text",
                "text": "2020.05.08 22:30 (GMT+0700)",
                "size": "xxs",
                "weight": "regular",
                "color": "#949494"
              }
            ]
          },
          "body": {
            "type": "box",
            "layout": "vertical",
            "margin": "none",
            "contents": [
              {
                "type": "image",
                "url": "https://aowtakiabseafood.com/wp-content/uploads/2018/04/aowtakiab-feature.jpg",
                "margin": "none",
                "align": "start",
                "size": "full",
                "aspectRatio": "4:3",
                "aspectMode": "fit"
              }
            ]
          }
        }
      }
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




