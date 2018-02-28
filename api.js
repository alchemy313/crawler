const env = {
    path: {
        condordia: 'http://galaxy.cozystay.com/api/v2',
        eadu: 'http://galaxy.cozystay.com:30081/v2',
        jakku: 'http://galaxy.cozystay.com:30083/v2'
    }
}

export default {
    DUOMIYOU_COUNTRY_LIST: () => {
        return `http://www.duomiyou.com/api/pc/Product.svc/Get_ProductSearc hDetailList`
    },
    DUOMIYOU_GET_LISTING_BY_COUNTRY: () => {
        return `http://www.duomiyou.com/api/pc/Product.svc/Get_ProductSearchList`
    },
    DUOMIYOU_GET_LISTING_DETAIL: () => {
        return `http://www.duomiyou.com/api/pc/Product.svc/Get_ProductDetail`
    },

    CONDORDIA_USER_LOGIN: () => {
        return `${env.path.condordia}/admin/auth/login/email`
    },
    RANDOM_AVATAR_GENERATOR: (gender = "men", id = 1) => {
        return `https://randomuser.me/api/portraits/${gender}/${id}.jpg`
    },
    JAKKU_FIND_USER: () => {
        return `${env.path.jakku}/users/action/find`
    },
    JAKKU_ADD_USER: () => {
        return `${env.path.jakku}/users`
    },
    JAKKU_ADD_USER_INFO: (id) => {
        return `${env.path.jakku}/users/${id}/info`
    }
}