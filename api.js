const env = {
    path: {
        eadu: 'http://localhost:30081/v2',
        jakku: 'http://localhost:30083/v2'
    }
}

export default {
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