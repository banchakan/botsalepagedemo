const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const port = process.env.PORT || 4000
const api = require('./config/createInstance')
const url = require('url')

const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message'
let line_header = null
let token_group_admin = null

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.post('/:shop', (req, res) => {
    let path = url.parse(req.url).path
    let subdomain = path.slice(1, path.length)
    getToken(subdomain).then(() => {
        checkMessage(req.body.events[0].message).then(result => {
            if(result.type === 'order'){
                confirmOrder(req.body.events[0].source.userId, result.data.id, req.body.events[0].replyToken)
            }else if(result.type === 'confirm'){
                let poid = result.data
                console.log('confirm poid => ', poid)
                getPomasterById(poid).then(opj_pomaster => {
                    //พบรายการสั่งซื้อใหม่
                    let message = createStringNotify(opj_pomaster)
                    console.log('message to admin => ', message)
                    notifyToGroupAdmin(opj_pomaster.salePage.salePageId, message).then(() => {
                        //ส่ง flex message
                        let jsonMessage = getFlexMessageTemplate(opj_pomaster)
                        replyMessage(req.body.events[0].replyToken, jsonMessage)
                    }).catch(err => {
                        //การส่งข้อความไปยังกลุ่ม admin มีปัญหา
                        let model = {
                            type: 'text',
                            //text: `ร้าน ${opj_pomaster.salePage.shop.shopName} ไม่สามารถรับออร์เดอร์ได้ในขณะนี้ ขอขอบ คุณ${opj_pomaster.customer.customerFullName} ที่ต้องการใช้บริการ ทางร้านจะเปิดรับออร์เดอร์ในภายหลัง`
                            text: `${err.toString()}`
                        }
                        replyMessage(req.body.events[0].replyToken, model)
                    })
                }).catch(err => {
                    //ไม่พบรายการสั่งซื้อ
                    console.log('error get po master => ',err)
                })
            }else if(result.type === 'cancel'){
                let poid = result.data
                console.log('cancel poid => ', poid)
                //update status po master to cancle

                let model = {
                    type: 'text',
                    text: `ดำเนินการยกเลิกออร์เดอร์ที่ ${poid} เรียบร้อยแล้ว`
                }
                replyMessage(req.body.events[0].replyToken, model)
            }
            else{
                //ไม่มีเคสนี้
            }
        }).catch(err => {
            console.log('checkMessage error => ', err)
        })
        res.json(200)
    }).catch(err => {
        console.log('get token error => ', err)
        res.json(500)
    })
})

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
                console.log('not token')
                reject(null)
            }
        }).catch(err => {
            console.log('error method')
            reject(null)
        })
    })
}

function checkMessage(msg){
    return new Promise((resolve,reject) => {
        if(msg.type === 'text'){
            if(msg.text.includes('New Order No.')){
                let poid = getPomasterId(msg.text)
                getPomasterById(poid).then(opj_pomaster => {
                    //พบรายการสั่งซื้อใหม่
                    resolve({type: 'order', data: opj_pomaster})
                }).catch(err => {
                    //มีปัญหา ดูที่ getPomasterById()
                    reject('get po master error')
                })
            }else if(msg.text.includes('ยืนยันออร์เดอร์ | No.')){
                let array = msg.text.split(' ')
                console.log('array confirm order => ', array)
                resolve({type: 'confirm', data: array[array.length-1]})
            }else if(msg.text.includes('ยกเลิกออร์เดอร์ | No.')){
                let array = msg.text.split(' ')
                resolve({type: 'cancel', data: array[array.length-1]})
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
    return array[array.length-1]
}

function confirmOrder(userId, orderId, token){
    request.post({
        uri: `${LINE_MESSAGING_API}/push`,
        headers: line_header,
        body: JSON.stringify({
            to: userId,
            replyToken: token,
            messages: [
                {
                    type: "template",
                    altText: "This is a confirm template",
                    template: {
                        type: "confirm",
                        text: "ยืนยันการสั่งซื้อ",
                        actions: [
                            {
                                type: "message",
                                label: "ยืนยัน",
                                text: `ยืนยันออร์เดอร์ | No. ${orderId}`
                            },
                            {
                                type: "message",
                                label: "ยกเลิก",
                                text: `ยกเลิกออร์เดอร์ | No. ${orderId}`
                            }
                        ]
                    }
                }
            ]
        })
    }, (err, res, body) => {
       
    });
}

//- LINE Notify
function notifyToGroupAdmin(salePageId, text){
    return new Promise((resolve,reject) => {
        let message = {
            salePageId: salePageId,
            text: text
        }
        api.post('/lineliff/sendnotify', message).then(res => {
            if(res.data.code && res.data.code === 200){
                resolve(true)
            }else{
                reject(null)
            }
        })
    })
}

//- API
function getPomasterById(poid){
    console.log('size po id => ', poid.length)
    return new Promise((resolve,reject) => {
        api.get(`/pomaster/pomaster?id=${poid}`).then(opj_pomaster => {
            if(opj_pomaster.data.poStatus.id === 1){
                //พบรายการสั่งซื้อใหม่
                resolve(opj_pomaster.data)
            }else{
                //พบการสั่งซื้อแต่สถานะ ไม่ใช่ ออเดอร์ใหม่
                reject('status not start')
            }
        }).catch(err => {
            //ไม่พบรายการสั่งซื้อ
            reject('order not found')
        })
    })
}

//- Create String
function createStringNotify(po){
    let pickupDate = new Date(po.pickUpTime)
    let pickupTime = `เวลารับสินค้า: ${pickupDate.getDate()}/${pickupDate.getMonth()+1}/${pickupDate.getFullYear()} ${pickupDate.getHours()}:${pickupDate.getMinutes()}\n`
    let title = `New Order No. ${po.id}\n`
    let code = `รหัส: ${po.poCode}\n`
    let name = `ชื่อ: ${po.customer.customerFullName}\n`
    let phone = `เบอร์โทร: ${po.customer.customerPhone}\n`
    let sum = `รวม ${po.poSumAll} บาท`
    let order = '**สินค้า\n'
    po.poDetails.forEach((p,i) => {
        order = `${order}${i+1}. ${p.product.productName} ${p.poDetailCount} ${p.product.productSuffix} ${p.poDetailSum}.-\n`
    })

    let message = `${title}${code}${pickupTime}${name}${phone}${order}`

    if(po.poComment){
        comment = ``
        message = `${message}หมายเหตุ * ${po.poComment}\n`
    }
    message = `${message}${sum}`
    console.log("Message notify => ", message)
    return message
}

// Reply Message
function replyMessage(replyToken, jsonMessage){
    request.post({
        url: `${LINE_MESSAGING_API}/reply`,
        headers: line_header,
        body: JSON.stringify({
            replyToken: replyToken,
            messages: [jsonMessage]
        })
    }, (err, res, body) => {
        console.log('status = ' + res.statusCode);
    });
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
