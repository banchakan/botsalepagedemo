
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const port = process.env.PORT || 4000
const api = require('./config/createInstance');
const fs = require('fs')

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

    checkMessage(msg).then(poMaster => {
        notifyMessageLine(msg.text).then(() => {
            //ส่งข้อความให้ Admin สำเร็จ
            const jsonMessage = getFlexMessageTemplate(poMaster)
            request.post({
                url: LINE_MESSAGING_API,
                headers: LINE_HEADER,
                body: JSON.stringify({
                    replyToken: replyToken,
                    messages: [jsonMessage]
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
                const poid = getPomasterId(msg.text)
                api.get(`/pomaster/pomaster?id=${poid}`).then(opj_pomaster => {
                    if(opj_pomaster.data.poStatus.id === 1){
                        //พบรายการสั่งซื้อใหม่
                        resolve(opj_pomaster.data)
                    }else{
                        //พบการสั่งซื้อแต่สถานะ ไม่ใช่ ออเดอร์ใหม่
                        reject('พบการสั่งซื้อแต่สถานะ ไม่ใช่ ออเดอร์ใหม่')
                    }
                }).catch(err => {
                    console.log("ERROR => ", err)
                    //ไม่พบรายการสั่งซื้อ
                    reject('ไม่พบรายการสั่งซื้อ')
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
    let array = msg.split('เวลารับสินค้า')[0].split('\n')[0].split(' ')
    return array[array.length-1]
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

function checkTyprPay(status){
    if(status === 1){
        return 'เงินสด'
    }else {
        return 'โอนเงิน'
    }
}

function getFlexMessageTemplate(poMaster){
    let shopLogo = 'https://lh3.googleusercontent.com/proxy/VrqNRk4IHuiKVk_YidL-SLrzYesSbQadagSi9C_Gir6F-MMoJw5_7ZmIgJxvMMQecleONpzDE0RPc-xtqCLo1X0yQOYtFvfe1puiX0hCblBuu9tNnJQ'
    if(poMaster.salePage.shop.shopLogoLink){
        shopLogo = poMaster.salePage.shop.shopLogoLink
    }
    let shopName = poMaster.salePage.shop.shopName
    let poId = poMaster.id
    let pickup_time = '11/5/2020 12:30'
    let payType = checkTyprPay(poMaster.salePage.mapPayType[0].payType.payTypeId)
    let comment = poMaster.poComment
    let total = poMaster.poSumAll
    let cusName = poMaster.customer.customerFullName
    let shopPhone = poMaster.salePage.shopContext.phone
    let productList = poMaster.poDetails
    
    let orderFooter = [
        {
            type: "box",
            layout: "baseline",
            contents: [
                {
                    type: "text",
                    text: `${comment}`,
                    flex: 8,
                    margin: "md",
                    size: "xs",
                    wrap: true
                }
            ]
        },
        {
            type: "box",
            layout: "vertical",
            contents: [
                {
                    type: "text",
                    text: `รวมสุทธิ ${total} บาท`,
                    size: "lg",
                    align: "start",
                    weight: "bold"
                }
            ]
        },
        {
            type: "box",
            layout: "vertical",
            margin: "xxl",
            contents: [
                {
                    type: "text",
                    text: `ร้าน${shopName} ขอขอบคุณลูกค้า คุณ${cusName} ที่ใช้บริการ`,
                    margin: "xxl",
                    size: "xs",
                    color: "#AAAAAA",
                    wrap: true
                }
            ]
        }
    ]

    let template = {
        type: "flex",
        altText: "Flex Message",
        contents: {
            type: "bubble",
            hero: {
                type: "image",
                url: `${shopLogo}`,
                size: "full",
                aspectRatio: "20:13",
                aspectMode: "cover"
            },
        },
        body: {
            type: "box",
            layout: "vertical",
            spacing: "md",
            contents: [
                {
                    type: "text",
                    text: `${shopName}`,
                    size: "xl",
                    gravity: "center",
                    weight: "bold",
                    wrap: true
                },
                {
                    type: "box",
                    layout: "vertical",
                    spacing: "sm",
                    margin: "lg",
                    contents: [   
                        {
                            type: "box",
                            layout: "baseline",
                            spacing: "sm",
                            contents: [
                                {
                                    type: "text",
                                    text: "ออร์เดอร์",
                                    flex: 2,
                                    size: "sm",
                                    color: "#AAAAAA"
                                },
                                {
                                    type: "text",
                                    text: `${poId}`,
                                    flex: 4,
                                    size: "sm",
                                    color: "#666666",
                                    wrap: true
                                }
                            ]
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            spacing: "sm",
                            contents: [
                                {
                                    type: "text",
                                    text: "เวลารับสินค้า",
                                    flex: 2,
                                    size: "sm",
                                    color: "#AAAAAA"
                                },
                                {
                                    type: "text",
                                    text: `${pickup_time}`,
                                    flex: 4,
                                    size: "sm",
                                    color: "#666666",
                                    wrap: true
                                }
                            ]
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            spacing: "sm",
                            contents: [
                                {
                                    type: "text",
                                    text: "ชำระเงิน",
                                    flex: 2,
                                    size: "sm",
                                    color: "#AAAAAA"
                                },
                                {
                                    type: "text",
                                    text: `${payType}`,
                                    flex: 4,
                                    size: "sm",
                                    color: "#666666",
                                    wrap: true
                                }
                            ]
                        },
                        {
                            type: "box",
                            layout: "vertical",
                            contents: [
                                {
                                    type: "text",
                                    text: "รายการสินค้า",
                                    size: "sm"
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        footer: {
            type: "box",
            layout: "horizontal",
            flex: 1,
            contents: [
                {
                    type: "button",
                    action: {
                        type: "uri",
                        label: "โทร",
                        uri: `tel:${shopPhone}`
                    },
                    color: "#09A50E",
                    style: "primary"
                }
            ]
        }
    }

    productList.forEach(p => {
        template.body.contents[1].contents.push({
            type: "box",
            layout: "baseline",
            contents: [
                {
                    type: "text",
                    text: "-",
                    flex: 1,
                    size: "xs",
                    align: "end"
                },
                {
                    type: "text",
                    text: `${p.product.productName} ${p.poDetailCount} ${p.product.productSuffix}`,
                    flex: 8,
                    margin: "md",
                    size: "xs"
                }
            ]
        })
    })

    orderFooter.forEach(f => {
        template.body.contents[1].contents.push(f)
    })

    return template
}





