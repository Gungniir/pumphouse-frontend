const baseUrl = 'http://localhost:8000/api'

/**
 * @param path
 * @param method
 * @param body
 * @returns {Promise<Response|null>}
 */
async function doRequest(path, method, body = null) {
    try {
        const response = await fetch(baseUrl + path, {
            method: method,
            headers: {
                'Accept': 'application/json',
            },
            credentials: 'include',
            body: body,
        });

        if ((response.status / 100).toFixed(0) === '5') {
            console.error('Server error')
            return null
        }

        console.log(response)

        if (response.status === 422) {
            console.error('Validation error')
            return null
        }

        return response
    } catch (e) {
        console.error('Failed to fetch api')
        return null
    }
}

/**
 *
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
    function leadingZero(a) {
        return a >= 10 ? `${a}` : `0${a}`
    }

    return `${date.getUTCFullYear()}.${leadingZero(date.getUTCMonth()+1)}.${leadingZero(date.getUTCDate())} ${leadingZero(date.getUTCHours())}:${leadingZero(date.getUTCMinutes())}:${leadingZero(date.getUTCSeconds())}`
}

const api = {
    /**
     * Войти в аккаунт
     * @param login
     * @param password
     * @returns {Promise<null|boolean>}
     */
    authLogin: async function(login, password) {
        const data = new FormData();
        data.append('login', login)
        data.append('password', password)

        const response = await doRequest('/auth', 'post', data)

        if (response === null) {
            return null
        }

        if (response.status === 404) {
            return false
        }

        if (response.status === 200) {
            return true
        }

        return null
    },
    authLogout: async function() {
        const response = await doRequest('/auth', 'post')

        if (response === null) {
            return null
        }

        if (response.status === 200) {
            return true
        }

        return null
    },

    residentsIndex: async function() {
        const response = await doRequest('/residents', 'get')

        if (response === null) {
            return null
        }

        if (response.status === 401 || response.status === 403) {
            return false
        }

        return response.json()
    },
    residentsStore: async function(fio, area) {
        const data = new FormData()
        data.append('fio', fio)
        data.append('area', area)
        data.append('start_date', formatDate(new Date()))

        const response = await doRequest('/residents', 'post', data)

        if (response === null) {
            return null
        }

        if (response.status === 201) {
            return true
        }

        if (response.status === 401 || response.status === 403) {
            return false
        }

        return null
    },

    periodsIndex: async function() {
        const response = await doRequest('/periods', 'get')

        if (response === null) {
            return null
        }

        if (response.status === 401 || response.status === 403) {
            return false
        }

        return response.json()
    },

    pumpMeterRecordsIndex: async function() {
        const response = await doRequest('/pump-meter-records', 'get')

        if (response === null) {
            return null
        }

        if (response.status === 401 || response.status === 403) {
            return false
        }

        return response.json()
    },

    tariffIndex: async function(periodID) {
        const response = await doRequest(`/periods/${periodID}/tariffs`, 'get')

        if (response === null) {
            return null
        }

        if (response.status === 401 || response.status === 403) {
            return false
        }

        if (response.status === 404) {
            return undefined
        }

        return response.json()
    },
}

export default api;
