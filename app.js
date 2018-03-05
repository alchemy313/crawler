import request from 'request'
import minimist from 'minimist'
import api from './api'
import user from './user.json'

let common_header = {
    'User-Agent': '5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.167 Safari/537.36',
    'Accept-Encoding': '*',
    'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7,zh-TW;q=0.6'
}

let propertyTypeID = ""
let cancellationPolicyID = ""

//process control
let mapLimit = async (list, limit, asyncHandle) => {
    let recursion = (arr) => {
        if(arr.length){
            return asyncHandle(arr.shift()).then((data)=>{
                processArr = processArr.concat(data)
                if (arr.length !== 0) return recursion(arr)
                else return true
            })
        }
        return false
    }

    let listCopy = [].concat(list)
    let asyncList = [], processArr = []
    while(limit--) {
        asyncList.push( recursion(listCopy) )
    }
    await Promise.all(asyncList)
    return processArr
}

//get userId
async function autoLogin(userForm) {
    return new Promise((resolve, reject) => {
        request({
            uri: api.CONDORDIA_USER_LOGIN(),
            headers: common_header,
            method: 'POST',
            form: userForm
        }, (error, response, body) => {
            let resData = JSON.parse(body)
            if(resData.code === 0){
                resolve(resData.data.id)
            }else{
                reject(resData.message)
            }
        })
    })
}

async function getPropertyTypeId(name) {
    return new Promise((resolve, reject) => {
        if (propertyTypeID.length) resolve(propertyTypeID)
        request({
            uri: api.CONDORDIA_GET_PROPERTY_TYPES(),
            headers: Object.assign(common_header, {'coz-lang':'zh-cn'}),
        }, (error, response, body) => {
            let resData = JSON.parse(body)
            if (resData.code === 0) {
                propertyTypeID = resData.data.find(e => e.name === name).id
                resolve (propertyTypeID)
            }else{
                reject(resData.detail)
            }
        })
    })
}

async function getCancellationPolicyID(name) {
    return new Promise((resolve, reject) => {
        if (cancellationPolicyID.length) resolve(cancellationPolicyID)
        request({
            uri: api.CONDORDIA_GET_CANCELLATION_POLICIES(),
            headers: Object.assign(common_header, {'coz-lang':'zh-cn'}),
        }, (error, response, body) => {
            let resData = JSON.parse(body)
            if (resData.code === 0) {
                propertyTypeID = resData.data.find(e => e.name === name).id
                resolve (propertyTypeID)
            }else{
                reject(resData.detail)
            }
        })
    })
}

//set avatar
function randomAvatar() {
    let genders = ['men', 'women']
    return api.RANDOM_AVATAR_GENERATOR(genders[~~(Math.random() * 2)], ~~(Math.random() * 99))
}

//get pure text
function getPureText(html) {
    if(!html) return ''
    return html
        .replace(/<(style|script|iframe)[^>]*?>[\s\S]+?<\/\1\s*>/gi,'')
        .replace(/<[^>]+?>/g,'')
        .replace(/\s+/g,' ')
        .replace(/ /g,' ')
        .replace(/>/g,' ')
}

//find or create a user
async function createUserByCountry(country, listingCount) {
    let registerUser = async (nickName, email, password) => {
        return new Promise((resolve, reject) => {
            request({
                uri: api.JAKKU_ADD_USER(),
                headers: common_header,
                method: 'POST',
                form: {
                    email: '',
                    user_name: '',
                    source: '',
                    old_id: '',
                    password: '',
                    userInfo: {
                        nick_name: '',
                        first_name: '',
                        avatar: randomAvatar(),
                        preferred_locale: 'cn'
                    }
                }
            }, (error, response, body) => {

            })
        })
    }
}

//get country list
function getCountryList() {
    return new Promise((resolve, reject) => {
        request({
            uri: api.DUOMIYOU_COUNTRY_LIST(),
            headers: common_header
        }, (error, response, body) => {
            if (!error && (response.statusCode >= 200 && response.statusCode < 300)) {
                let resultData = JSON.parse(JSON.parse(body))
                resolve(resultData.dtPlaceCountryList)
            }
            reject(error)
        })
    })
}

//get listing's id
async function getListingsByCountry(country, pageSize) {
    let listingByPage = async (currentPage) => {
        return new Promise((resolve, reject) => {
            request({
                uri: api.DUOMIYOU_GET_LISTING_BY_COUNTRY(),
                qs: {
                    placeId: country.id,
                    themeTypeId: '',
                    sceneryThemeId: '',
                    bedroomCountFrom: '',
                    bedroomCountTo: '',
                    priceFrom: '',
                    priceTo: '',
                    sort: 'weight',
                    sortType: 'DESC',
                    personCount: '',
                    productName: '',
                    isDiscount: '',
                    pageSize: pageSize,
                    signature: '',
                    currentPage: currentPage
                },
                headers: common_header
            }, (error, response, body) => {
                if (!error && (response.statusCode >= 200 && response.statusCode < 300)) {
                    let resultData = JSON.parse(JSON.parse(body))
                    resolve(resultData)
                }
                reject(error)
            })
        })
    }

    let firstCrawlerData = await listingByPage(1)
    const remainListingSize = firstCrawlerData.maxRank - pageSize
    const times = remainListingSize/pageSize
    if(times){
        let asyncList = []
        for(let i = 0; i<times; i++){
            asyncList.push( listingByPage(i+2) )
        }
        const remainData = await Promise.all(asyncList)
        return remainData.reduce((accumulator, currentVal) => accumulator.concat(currentVal.dtVillaList), firstCrawlerData.dtVillaList)
    } else {
        return firstCrawlerData.dtVillaList
    }
}

//concat a listing array
function getListingDetail(listingId) {
    return new Promise((resolve, reject) => {
        request({
            uri: api.DUOMIYOU_GET_LISTING_DETAIL(),
            qs: {
                id: listingId,
                signature: ''
            },
            headers: common_header
        }, (error, response, body) => {
            if (!error && (response.statusCode >= 200 && response.statusCode < 300)) {
                let resultData = JSON.parse(JSON.parse(body))
                resolve([resultData])
            }
            reject(error)
        })
    })
}

//store listing into eadu's db
function storeListingToDB(listingDetail, userId) {
    const photoArr = listingDetail.dtImportantParameter[0].picture.split(',').filter(e => e.length).map(e => api.DUOMIYOU_CONCAT_PHOTO_URL(e))
    return new Promise( async (resolve, reject) => {
        let storeListingBasicInfo = () => {
            return new Promise( async resolve => {
                const propertyTypeId = await getPropertyTypeId('别墅')
                const cancellationPolicyId = await getCancellationPolicyID('严苛的')
                const listingBasicInfo = {
                    host_id: userId,
                    cancellation_policy_id: cancellationPolicyId,
                    property_type_id: propertyTypeId,
                    title: listingDetail.dtImportantParameter[0].name,
                    description: getPureText(listingDetail.dtImportantParameter[0].contentIntroduction),
                    room_type: 'ENTIRE_HOME',
                    shared_type: 'INDIVIDUAL',
                    accommodation_capacity: 1,
                    bed_count: listingDetail.dtImportantParameter[0].bedroomCount,
                    full_bathroom_count: listingDetail.dtImportantParameter[0].bathroomCount? parseInt(listingDetail.dtImportantParameter[0].bathroomCount) : 0,
                    half_bathroom_count: 0,
                    is_instant_booking: 0,
                    status: 'NOT_LISTED',
                    wifi_name: '',
                    wifi_password: '',
                    require_id_verification: 0,
                    check_in_time: '07:00 AM',
                    check_out_time: '11:00 PM',
                    house_manual: `${getPureText(listingDetail.dtImportantParameter[0].hotelPolicy)}
                    ${listingDetail.dtImportantParameter[0].policyRemark}`,
                    extra_house_rule: '',
                    currency_name: 'CNY',
                    min_booking_days: 0,
                    max_booking_days: 0,
                    weekend_price_modifier: 0,
                    base_price: listingDetail.dtImportantParameter[0].price,
                    rental_type: 'DAY',
                    cleaning_fee: 0,
                    deposit_fee: 0,
                    extra_guest_fee: 0,
                    standard_guest_num: 0,
                    preparation_days: 0,
                    upload_source: 'DUOMIYOU',
                    advance_notice_days: 0,
                    booking_window_days: 0,
                    viewed_count: 0,
                    favourite_count: 0,
                    weight: 60
                }

                request({
                    uri: api.EADU_ADD_LISTING(),
                    headers: common_header,
                    method: 'POST',
                    form: listingBasicInfo
                }, (error, response, body) => {
                    let resData = JSON.parse(body)
                    if(resData.code === 0){
                        resolve(resData)
                    }
                })
            })
        }

        let storeListingLocationInfo = (listingId) => {
            return new Promise(resolve => {
                const locationInfo = {
                    lat: listingDetail.dtImportantParameter[0].latitude,
                    lng: listingDetail.dtImportantParameter[0].longitude,
                    address: listingDetail.dtImportantParameter[0].address,
                    district: '',
                    city: '',
                    province: listingDetail.dtPlaceTitle[0].placeName2,
                    postal_code: '000000',
                    country: listingDetail.dtPlaceTitle[0].placeName1,
                    country_code: '',
                    street: '',
                    unit_number: '',
                    place_id: '',
                    types: '',
                    geocode: '',
                    old_address: listingDetail.dtImportantParameter[0].placeName
                }

                request({
                    uri: api.EADU_ADD_LOCATION(listingId),
                    headers: common_header,
                    method: 'POST',
                    form: locationInfo
                }, (error, response, body) => {
                    let resData = JSON.parse(body)
                    if(resData.code === 0){
                        resolve(resData)
                    }
                })
            })
        }

        let storeListingDefaultPhotoUrl = (listingId) =>  {
            return new Promise(resolve => {
                const defaultPhotoUrl = photoArr[0]
                request({
                    uri: api.EADU_ADD_PHOTO_DEFAULT_URL(listingId),
                    headers: common_header,
                    method: 'POST',
                    form: { default_photo_url: defaultPhotoUrl }
                }, (error, response, body) => {
                    let resData = JSON.parse(body)

                    if(resData.code === 0){
                        resolve(resData)
                    }
                })
            })
        }

        let storeListingPhotoUrls = (listingId) =>  {
            const photoUrls = photoArr.map(e => ({url: e, alt: ''}))
            return new Promise(resolve => {
                request({
                    uri: api.EADU_ADD_PHOTO_URLS(listingId),
                    headers: common_header,
                    method: 'POST',
                    form: { photo_urls: photoUrls }
                }, (error, response, body) => {
                    let resData = JSON.parse(body)
                    if(resData.code === 0){
                        resolve(resData)
                    }
                })
            })
        }

        const storeInfo = await storeListingBasicInfo()
        if(storeInfo.code === 0){
            await Promise.all([
                storeListingLocationInfo(storeInfo.data.id),
                storeListingDefaultPhotoUrl(storeInfo.data.id),
                storeListingPhotoUrls(storeInfo.data.id),
            ])
            console.log(listingDetail.dtImportantParameter[0].name, '房源存储完成')
            resolve(storeInfo.data.id)
        }
    })
}

//crawler work flow
(async function() {
    const argv = minimist(process.argv.slice(2), {
        alias: { c: ['concurrency'],  s: ['store_concurrency'], },
        default: { concurrency: 15, store_concurrency: 5 },
    })
    console.log('抓取进程数:', argv.concurrency, '存储进程数', argv.store_concurrency)
    const userId = await autoLogin(user)
    console.log('后台管理员登录完成....')
    const countryList = await getCountryList()
    console.log('获取国家列表完成....')
    const listingArr = await mapLimit(countryList, 10, (country) => getListingsByCountry(country, 30))
    console.log('获取房源列表完成....  开始获取房源详情....')
    const listingDetailArr = await mapLimit(listingArr.splice(0,10), argv.concurrency, (listing) => getListingDetail(listing.id))
    console.log('获取房源详情列表完成.... 房源数:', listingDetailArr.length, '开始储存房源详情....')
    await mapLimit(listingDetailArr, argv.store_concurrency, (listing) => storeListingToDB(listing, userId))
    console.log('完成所有抓取')
}())