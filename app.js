import request from 'request'
import api from './api'

const common_header = {
    'User-Agent': '5.0 (Macintosh; Intel Mac OS X 10_13_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.167 Safari/537.36',
    'Accept-Encoding': '*',
    'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7,zh-TW;q=0.6'
}

let mapLimit = async (list, limit, asyncHandle) => {
    let recursion = (arr) => {
        return asyncHandle(arr.shift()).then((data)=>{
            processArr = processArr.concat(data)
            if (arr.length !== 0) return recursion(arr)
            else return 'process finished'
        })
    }

    let listCopy = [].concat(list)
    let asyncList = [], processArr = []
    while(limit--) {
        asyncList.push( recursion(listCopy) )
    }
    await Promise.all(asyncList)
    return processArr
}

function _randomAvatar() {
    let genders = ['men', 'women']
    return api.RANDOM_AVATAR_GENERATOR(genders[~~(Math.random() * 2)], ~~(Math.random() * 99))
}

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
                        avatar: _randomAvatar(),
                        preferred_locale: 'cn'
                    }
                }
            }, (error, response, body) => {

            })
        })
    }
}

function getCountryList() {
    return new Promise((resolve, reject) => {
        request({
            uri: 'http://www.duomiyou.com/api/pc/Product.svc/Get_ProductSearchDetailList',
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

async function getListingsByCountry(country, pageSize) {
    let listingByPage = async (currentPage) => {
        return new Promise((resolve, reject) => {
            request({
                uri: 'http://www.duomiyou.com/api/pc/Product.svc/Get_ProductSearchList',
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
    await createUserByCountry(country, firstCrawlerData.maxRank)
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

function getListingDetail(listingId) {
    return new Promise((resolve, reject) => {
        request({
            uri: 'http://www.duomiyou.com/api/pc/Product.svc/Get_ProductDetail',
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

function storeListingToDB(listingDetail) {
    return new Promise((resolve, reject) => {

    })
}

(async function() {
    const countryList = await getCountryList()
    const listingArr = await mapLimit(countryList, 5, (country) => getListingsByCountry(country, 30))
    const listingDetailArr = await mapLimit(listingArr, 15, (listing) => getListingDetail(listing.id))
    await mapLimit(listingDetailArr, 2, (listing) => storeListingToDB(listing))
}())