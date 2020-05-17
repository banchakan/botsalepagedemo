const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const port = process.env.PORT || 4000
const api = require('./config/createInstance')
const url = require('url')

const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message/reply'
let line_header = null
let token_group_admin = null

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.post('/:shop', (req, res) => {
    let path = url.parse(req.url).path
    let subdomain = path.slice(1, path.length)
    getToken(subdomain).then(() => {
        replyMessage(req.body)
        res.json(200)
    }).catch(err => {
        console.log('get token error')
        res.json(500)
    })
})

// app.post('/notify', (req, res) => {
//     api.post('/lineliff/sendnotify', {salePageId: req.body.data.salePageId, text: req.body.data.text}).then(result => {
//         if(result.data.code && result.data.code === 200){
//             res.json('OK')
//         }else{
//             res.json('Error 1 => ', result.data)
//         }
//     }).catch(err => {
//         res.json('Error => ', err)
//     })
// })

// app.post('/social', (req, res) => {
//     let message = req.body.data
//     notifyMessageSocial(message).then(() => {
//         res.json(true)
//     }).catch(err => {
//         res.json(false)
//     })
// })

app.listen(port)

function getToken(subdomain){
    return new Promise((resolve,reject) => {
        api.get(`/shop/channelaccesstoken?subDomain=${subdomain}`).then(domain => {
            if(domain.data.channelAccessToken){
                line_header = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer {${domain.data.channelAccessToken}}`
                }
                token_group_admin = `${domain.data.lineTokenFull}`
                resolve(true)
            }else{
                reject(null)
            }
        }).catch(err => {
            reject(null)
        })
    })
}

function replyMessage(body){
    let msg = body.events[0].message
    let replyToken = body.events[0].replyToken
    checkMessage(msg).then(result => {
        if(result.type === 'order'){
            notifyMessageLine({salePageId: result.data.salePage.salePageId, text: msg.text}).then(() => {
                //ส่งข้อความให้ Admin สำเร็จ
                let jsonMessage = getFlexMessageTemplate(result.data)
                request.post({
                    url: LINE_MESSAGING_API,
                    headers: line_header,
                    body: JSON.stringify({
                        replyToken: replyToken,
                        messages: [jsonMessage]
                    })
                }, (err, res, body) => {
                    console.log('status = ' + res.statusCode);
                });
            }).catch(err => {
                //การส่งข้อความไปยังกลุ่ม Admin ผิดพลาด
                console.log("notify message admin error => ", err)
                request.post({
                    url: LINE_MESSAGING_API,
                    headers: line_header,
                    body: JSON.stringify({
                        replyToken: replyToken,
                        messages: [
                            {
                                type: 'text',
                                text: `ร้าน ${result.data.salePage.shop.shopName} ไม่สามารถรับออร์เดอร์ได้ในขณะนี้ ขอขอบ คุณ${result.data.customer.customerFullName} ที่ต้องการใช้บริการ ทางร้านจะเปิดรับออร์เดอร์ในภายหลัง`
                                //-text: `${err.toString()}`
                            }
                        ]
                    })
                }, (err, res, body) => {
                    console.log('status = ' + res.statusCode);
                });
            })
        }else if(result.type === 'reserve') {
            let message = `การจองโต๊ะ รบกวนขอทราบ\nชื่อลูกค้า\nเบอร์โทร\nจำนวนคน\nเวลาเข้ามาที่ร้าน\n**หลังส่งข้อความแล้วรอการตอบกลับยืนยันจากทางร้านได้เลยค่ะ**`
            replyMessageText(message, replyToken).then(() => {
                // let notifyMessage = `มีการจองโต๊ะจากลูกค้า\n**กำลังรอการตอบกลับ**`
                // notifyMessageLine(notifyMessage)
            })
        }else if(result.type === 'promotion'){
            let message = `รับอาหารที่ร้าน รับส่วนรด 10%`
            let imageUrl = 'https://firebasestorage.googleapis.com/v0/b/salepage-54ec5.appspot.com/o/promotion.png?alt=media&token=29f4cbf1-07ae-4c0d-be4b-0b7d2ad836bd'
            replyMessageImage(message, imageUrl , replyToken).then(() => {
                // let notifyMessage = `มีการจองโต๊ะจากลูกค้า\n**กำลังรอการตอบกลับ**`
                // notifyMessageLine(notifyMessage)
            })
        }
    }).catch(text => {
        console.log('error message => ', text)
        //err ดูในเมธอด checkMessage => reject
    })
}

function checkMessage(msg){
    return new Promise((resolve,reject) => {
        if(msg.type === 'text'){
            if(msg.text.includes('New Order No.')){
                const poid = getPomasterId(msg.text)
                api.get(`/pomaster/pomaster?id=${poid}`).then(opj_pomaster => {
                    if(opj_pomaster.data.poStatus.id === 1){
                        //พบรายการสั่งซื้อใหม่
                        resolve({type: 'order', data: opj_pomaster.data})
                    }else{
                        //พบการสั่งซื้อแต่สถานะ ไม่ใช่ ออเดอร์ใหม่
                        reject('status not start')
                    }
                }).catch(err => {
                    //ไม่พบรายการสั่งซื้อ
                    reject('order not found')
                })
            }else if(msg.type === 'ยกเลิก'){

            }else if(msg.type === 'ยืนยัน'){
                
            }else{
                //ข้อความอื่น ๆ
                reject('other text')
            }
        }else{
            //ลูกค้าไม่ได้ส่งเป็น text
            reject('not text')
        }
    })
}

function getPomasterId(msg){
    let array = msg.split('เวลารับสินค้า')[0].split('\n')[0].split(' ')
    console.log('========> POID => ', array[array.length-1])
    return array[array.length-1]
}

function replyMessageText(message, replyToken){
    return new Promise((resolve,reject) => {
        request.post({
            url: LINE_MESSAGING_API,
            headers: line_header,
            body: JSON.stringify({
                replyToken: replyToken,
                messages: [
                    {
                        type: 'text',
                        text: message
                    }
                ]
            })
        }, (err, res, body) => {
            console.log('status = ' + res.statusCode);
            resolve(true)
        });
        
    })
}

function replyMessageImage(message,image,replyToken){
    return new Promise((resolve,reject) => {
        request.post({
            url: LINE_MESSAGING_API,
            headers: line_header,
            body: JSON.stringify({
                replyToken: replyToken,
                messages: [
                    {
                        type: 'text',
                        text: message
                    },
                    {
                        type: 'image',
                        originalContentUrl: image,
                        previewImageUrl: image
                    }
                ]
            })
        }, (err, res, body) => {
            console.log('status = ' + res.statusCode);
            resolve(true)
        });
        
    })
}

function notifyMessageLine(message){
    return new Promise((resolve,reject) => {
        api.post('/lineliff/sendnotify', message).then(res => {
            console.log(res.data)
            if(res.data.code && res.data.code === 200){
                resolve(true)
            }else{
                reject(null)
            }
        })
    })
}

// function notifyMessageSocial(){
//     return new Promise((resolve,reject) => {
//         request({
//             method: 'POST',
//             uri: 'https://notify-api.line.me/api/notify',
//             header: {'Content-Type': 'application/x-www-form-urlencoded'},
//             auth: {bearer: 'r7MC3j5B84SECqInbbFv5YvieI7xQZdDedSbrCxJEJu'},
//             form: {message: 'เมาแล้ว'}
//         }, (err, httpResponse, body) => {
//             if (err) {
//                 reject(null)
//             } else {
//                 resolve(JSON.parse(body))
//             }
//         })
//     })
// }

function checkTyprPay(status){
    if(status === 1){
        return 'โอนเงิน'
    }else if(status === 2) {
        return 'เงินสด'
    }else{
        return 'ไม่ระบุ'
    }
}

function getFlexMessageTemplate(poMaster){
    let shopLogo = 'https://lh3.googleusercontent.com/proxy/VrqNRk4IHuiKVk_YidL-SLrzYesSbQadagSi9C_Gir6F-MMoJw5_7ZmIgJxvMMQecleONpzDE0RPc-xtqCLo1X0yQOYtFvfe1puiX0hCblBuu9tNnJQ'
    let poId = poMaster.id
    let payType = checkTyprPay(poMaster.salePage.mapPayType[0].payType.payTypeId)
    let comment = poMaster.poComment
    let total = poMaster.poSumAll
    let productList = poMaster.poDetails
    let date = new Date(poMaster.pickUpTime+'')
    let h = date.getHours().toString()
    let m = date.getMinutes().toString()
    let pickup_time = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`

    let shopPhone = ''
    if(poMaster.salePage.shopContact){
        if(poMaster.salePage.shopContact.phone){
            shopPhone = poMaster.salePage.shopContact.phone
        }
    }

    let shopName = 'ยืนยันการสั่งซื้อ'
    if(poMaster.salePage.shop.shopName){
        shopName = poMaster.salePage.shop.shopName
    }
    
    let cusName = 'ไม่ประสงค์ออกนาม'
    if(poMaster.customer.customerFullName){
        cusName = poMaster.customer.customerFullName
    }

    if(poMaster.salePage.shop.shopLogoLink){
        shopLogo = poMaster.salePage.shop.shopLogoLink
    }

    let footer = {
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
    
    let orderFooter = [
        {
            type: "box",
            layout: "baseline",
            contents: [
                {
                    type: "text",
                    text: `หมายเหตุ ${comment}`,
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
                    text: `${shopName} ขอขอบคุณลูกค้า ${cusName} ที่ใช้บริการ`,
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
            }
        }
    }

    productList.forEach(p => {
        template.contents.body.contents[1].contents.push({
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

    orderFooter.forEach((content, i) => {
        if( i === 0){
            if(comment && comment !== ''){
                template.contents.body.contents[1].contents.push(content)
            }
        }else{
            template.contents.body.contents[1].contents.push(content)
        }
    })

    if(shopPhone){
        template.contents = {
            ...template.contents,
            footer
        }
    }

    return template
}
