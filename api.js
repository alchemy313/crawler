import env from './env.json'

export default {
    DUOMIYOU_COUNTRY_LIST: () => {
        return `http://www.duomiyou.com/api/pc/Product.svc/Get_ProductSearchDetailList`
    },
    DUOMIYOU_GET_LISTING_BY_COUNTRY: () => {
        return `http://www.duomiyou.com/api/pc/Product.svc/Get_ProductSearchList`
    },
    DUOMIYOU_GET_LISTING_DETAIL: () => {
        return `http://www.duomiyou.com/api/pc/Product.svc/Get_ProductDetail`
    },
    DUOMIYOU_CONCAT_PHOTO_URL: (fileName) => {
        return `http://www.duomiyou.com/uploads/pcDetailKvPic/${fileName}`
    },
    CONDORDIA_USER_LOGIN: () => {
        return `${env.path.condordia}/admin/auth/login/email`
    },
    CONDORDIA_GET_PROPERTY_TYPES: () => {
        return `${env.path.condordia}/property_types?limit=100`
    },
    CONDORDIA_GET_CANCELLATION_POLICIES: () => {
        return `${env.path.condordia}/cancellation_policies`
    },
    EADU_ADD_LISTING: () => {
        return `${env.path.eadu}/listings`
    },
    EADU_ADD_LOCATION: (id) => {
        return `${env.path.eadu}/listings/location/${id}`
    },
    EADU_ADD_PHOTO_DEFAULT_URL: (id) => {
        return `${env.path.eadu}/listings/${id}/images/default`
    },
    EADU_ADD_PHOTO_URLS: (id) => {
        return `${env.path.eadu}/listings/${id}/images`
    },
    JAKKU_ADD_USER: () => {
        return `${env.path.jakku}/users`
    },
    JAKKU_ADD_USER_INFO: (id) => {
        return `${env.path.jakku}/users/${id}/info`
    },
    JAKKU_FIND_USER: () => {
        return `${env.path.jakku}/users/action/find`
    },
    RANDOM_AVATAR_GENERATOR: (gender = "men", id = 1) => {
        return `https://randomuser.me/api/portraits/${gender}/${id}.jpg`
    }
}