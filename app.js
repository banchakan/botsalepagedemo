
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
    api.get(`/shop/channelaccesstoken?subDomain=${subdomain}`).then(domain => {
        line_header = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer {${domain.data.channelAccessToken}}`
        }
        token_group_admin = domain.data.lineTokenFull
        console.log('line_header => ', line_header)
        console.log('token_group_admin => ', token_group_admin)
        replyMessage(req.body)
        res.json(200)
    })
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
            let jsonMessage = getFlexMessageTemplate(poMaster)
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
            //-testMessage('การส่งข้อความไปยังกลุ่ม Admin ผิดพลาด',replyToken)
        })
    }).catch(text => {
        //err ดูในเมธอด checkMessage => reject
        //-testMessage(text,replyToken)
    })
}

function testMessage(text,replyToken){
    request.post({
        url: LINE_MESSAGING_API,
        headers: line_header,
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
            auth: {bearer: token_group_admin},
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
            auth: {bearer: token_group_admin},
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
// return new Promise((resolve,reject) => {
    let shopLogo = 'https://lh3.googleusercontent.com/proxy/VrqNRk4IHuiKVk_YidL-SLrzYesSbQadagSi9C_Gir6F-MMoJw5_7ZmIgJxvMMQecleONpzDE0RPc-xtqCLo1X0yQOYtFvfe1puiX0hCblBuu9tNnJQ'
    let shopName = poMaster.salePage.shop.shopName
    let poId = poMaster.id
    let payType = checkTyprPay(poMaster.salePage.mapPayType[0].payType.payTypeId)
    let comment = poMaster.poComment
    let total = poMaster.poSumAll
    let cusName = poMaster.customer.customerFullName
    let shopPhone = poMaster.salePage.shopContext.phone
    let productList = poMaster.poDetails

    let date = new Date(poMaster.pickUpTime+'')
    let h = date.getHours().toString()
    let m = date.getMinutes().toString()
    let pickup_time = `${h.padStart(2, '0')}:${m.padStart(2, '0')}`

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
            //- Footer
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

    if(shopPhone && shopPhone !== ''){
        template.contents = {
            ...template.contents,
            footer
        }
    }

    return template
//     resolve(template)    
// })
}
