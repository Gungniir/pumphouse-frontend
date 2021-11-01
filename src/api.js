const baseUrl = 'http://localhost:8000/api'

class ConnectionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConnectionError'
    }
}
class AuthError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthError'
    }
}
class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError'
    }
}
class ConflictError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConflictError'
    }
}
class BadRequestError extends Error {
    constructor(message) {
        super(message);
        this.name = 'BadRequestError'
    }
}


/**
 * @param path
 * @param method
 * @param {FormData|string} body
 * @returns {Promise<Response|null>}
 */
async function doRequest(path, method, body = null) {
    let urlEncoded = false
    if (method !== 'post' && typeof body === 'object' && body) {
        // Fix. Php не может в miltipart/form-data при не post
        const newBody = []

        body.forEach((value, key) => {
            const encodedKey = encodeURIComponent(key);
            const encodedValue = encodeURIComponent(value.toString());
            newBody.push(encodedKey + "=" + encodedValue)
        })

        body = newBody.join('&')

        urlEncoded = true
    }

    const headers = {
        'Accept': 'application/json'
    }

    if (urlEncoded) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8'
    }

    try {
        const response = await fetch(baseUrl + path, {
            method: method,
            headers: headers,
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

    /**
     * Получить список периодов
     *
     * @throws ConnectionError|AuthError
     * @returns {Promise<{data: [{id: Number, begin_date: string, end_date: string}]}>}
     */
    periodsIndex: async function() {
        const response = await doRequest('/periods', 'get')

        if (response === null) {
            throw new ConnectionError()
        }

        if (response.status === 401 || response.status === 403) {
            throw new AuthError(response.status)
        }

        return await response.json()
    },
    /**
     * Создать новый период
     *
     * @param {Number} year
     * @param {Number} month
     * @throws ConnectionError|AuthError|ConflictError
     * @returns {Promise<{data: {id: Number, begin_date: string, end_date: string}}>}
     */
    periodsStore: async function(year, month) {
        const data = new FormData()
        data.append('year', year.toString())
        data.append('month', month.toString())

        const response = await doRequest('/periods', 'post', data)

        if (response === null) {
            throw new ConnectionError()
        }

        if (response.status === 401 || response.status === 403) {
            throw new AuthError()
        }

        if (response.status === 409) {
            const regexp = /Duplicate found: (\d+)/m
            const groups = regexp.exec(await response.text())
            throw new ConflictError(groups[1])
        }

        return await response.json()
    },
    /**
     * Получить информацию о периоде
     *
     * @param {Number} periodID
     * @throws ConnectionError|AuthError|ConflictError
     * @returns {Promise<{data: {id: Number, begin_date: string, end_date: string}}>}
     */
    periodsView: async function(periodID) {
        const response = await doRequest(`/periods/${periodID}`, 'get')

        if (response === null) {
            throw new ConnectionError()
        }

        if (response.status === 401 || response.status === 403) {
            throw new AuthError(response.status)
        }

        if (response.status === 404) {
            throw new NotFoundError()
        }

        return await response.json()
    },
    /**
     * Получить или создать период
     *
     * @param {Number} year
     * @param {Number} month
     * @throws ConnectionError|AuthError
     * @returns {Promise<{data: {id: Number, begin_date: string, end_date: string}}>}
     */
    periodsViewOrStore: async function(year, month) {
        try {
            return await this.periodsStore(year, month)
        } catch (e) {
            if (e.name !== 'ConflictError') {
                throw e
            }
            const id = Number(e.message)
            return await this.periodsView(id)
        }
    },
    /**
     * Посчитать чеки
     *
     * @throws ConnectionError|AuthError|ConflictError|NotFoundError|BadRequestError
     * @param periodID
     * @returns {Promise<true>}
     */
    periodsCalculate: async function(periodID) {
        const response = await doRequest(`/periods/${periodID}/calculate`, 'post')

        if (response === null) {
            throw new ConnectionError()
        }

        if (response.status === 401 || response.status === 403) {
            throw new AuthError()
        }

        if (response.status === 404) {
            throw new NotFoundError()
        }

        if (response.status === 409) { // Чеки уже посчитаны
            throw new ConflictError()
        }

        if (response.status === 400) { // Не установлен тариф или значение счетчика
            throw new BadRequestError()
        }

        return true
    },


    /**
     * Получить тариф периода
     *
     * @param {Number} periodID
     * @throws ConnectionError|AuthError|NotFoundError
     * @returns {Promise<{data: {id: Number, period_id: Number, cost: Number}}>}
     */
    tariffsIndex: async function(periodID) {
        const response = await doRequest(`/periods/${periodID}/tariffs`, 'get')

        if (response === null) {
            throw new ConnectionError()
        }

        if (response.status === 401 || response.status === 403) {
            throw new AuthError(response.status)
        }

        if (response.status === 404) {
            throw new NotFoundError()
        }

        return await response.json()
    },
    /**
     * Записать тариф на период
     *
     * @param {Number} periodID
     * @param {Number} cost
     * @throws AuthError|ConnectionError|NotFoundError|ConflictError
     * @returns {Promise<{data: {id: Number, period_id: Number, cost: Number}}>}
     */
    tariffsStore: async function(periodID, cost) {
        const data = new FormData()
        data.append('cost', cost.toFixed(2))

        const response = await doRequest(`/periods/${periodID}/tariffs`, 'post', data)

        if (response === null) {
            throw new ConnectionError()
        }

        if (response.status === 401 || response.status === 403) {
            throw new AuthError()
        }

        if (response.status === 409) {
            throw new ConflictError()
        }

        if (response.status === 404) {
            throw new NotFoundError()
        }

        return await response.json()
    },
    /**
     * Изменить тариф на период
     *
     * @param {Number} tariffID
     * @param {Number} cost
     * @throws AuthError|ConnectionError|NotFoundError
     * @returns {Promise<{data: {id: Number, period_id: Number, cost: Number}}>}
     */
    tariffsUpdate: async function(tariffID, cost) {
        const data = new FormData()
        data.append('cost', cost.toFixed(2))

        const response = await doRequest(`/tariffs/${tariffID}`, 'put', data)

        if (response === null) {
            throw new ConnectionError()
        }

        if (response.status === 401 || response.status === 403) {
            throw new AuthError()
        }

        if (response.status === 404) {
            throw new NotFoundError()
        }

        return await response.json()
    },
    /**
     * Удалить тариф на период
     *
     * @param {Number} tariffID
     * @throws AuthError|ConnectionError|NotFoundError
     * @returns {Promise<true>}
     */
    tariffsDestroy: async function(tariffID) {
        const response = await doRequest(`/tariffs/${tariffID}`, 'delete')

        if (response === null) {
            throw new ConnectionError()
        }

        if (response.status === 401 || response.status === 403) {
            throw new AuthError()
        }

        if (response.status === 404) {
            throw new NotFoundError()
        }

        return true
    },

    /**
     * Получить список records
     *
     * @throws ConnectionError|AuthError
     * @returns {Promise<{data: [{id: Number, period_id: Number, amount_volume: Number}]}>}
     */
    recordsIndex: async function() {
        const response = await doRequest('/pump-meter-records', 'get')

        if (response === null) {
            throw new ConnectionError()
        }

        if (response.status === 401 || response.status === 403) {
            throw new AuthError(response.status)
        }

        return await response.json()
    },
    /**
     * Получить record определенного периода
     *
     * @throws ConnectionError|AuthError|NotFoundError
     * @returns {Promise<{data: {id: Number, period_id: Number, amount_volume: Number}}>}
     */
    recordsIndexPeriod: async function(periodID) {
        const response = await doRequest(`/periods/${periodID}/pump-meter-records`, 'get')


        if (response === null) {
            throw new ConnectionError()
        }

        if (response.status === 401 || response.status === 403) {
            throw new AuthError(response.status)
        }

        if (response.status === 404) {
            throw new NotFoundError()
        }

        return await response.json()
    },
    /**
     * Записать тариф на период
     *
     * @param {Number} periodID
     * @param {Number} amount_volume
     * @throws AuthError|ConnectionError|NotFoundError|ConflictError
     * @returns {Promise<{data: {id: Number, period_id: Number, amount_volume: Number}}>}
     */
    recordsStore: async function(periodID, amount_volume) {
        const data = new FormData()
        data.append('amount_volume', amount_volume.toFixed(2))

        const response = await doRequest(`/periods/${periodID}/pump-meter-records`, 'post', data)

        if (response === null) {
            throw new ConnectionError()
        }

        if (response.status === 401 || response.status === 403) {
            throw new AuthError()
        }

        if (response.status === 409) {
            throw new ConflictError()
        }

        if (response.status === 404) {
            throw new NotFoundError()
        }

        return await response.json()
    },
    /**
     * Изменить тариф на период
     *
     * @param {Number} periodID
     * @param {Number} recordID
     * @param {Number} amountVolume
     * @throws AuthError|ConnectionError|NotFoundError
     * @returns {Promise<string>}
     */
    recordsUpdate: async function(periodID, recordID, amountVolume) {
        const data = new FormData()
        data.append('amount_volume', amountVolume.toString())

        const response = await doRequest(`/periods/${periodID}/pump-meter-records/${recordID}`, 'put', data)

        if (response === null) {
            throw new ConnectionError()
        }

        if (response.status === 401 || response.status === 403) {
            throw new AuthError()
        }

        if (response.status === 404) {
            throw new NotFoundError()
        }

        return await response.text()
    },
    /**
     * Удалить тариф на период
     *
     * @param {Number} periodID
     * @param {Number} recordID
     * @throws AuthError|ConnectionError|NotFoundError
     * @returns {Promise<true>}
     */
    recordsDestroy: async function(periodID, recordID) {
        const response = await doRequest(`/periods/${periodID}/pump-meter-records/${recordID}`, 'delete')

        if (response === null) {
            throw new ConnectionError()
        }

        if (response.status === 401 || response.status === 403) {
            throw new AuthError()
        }

        if (response.status === 404) {
            throw new NotFoundError()
        }

        return true
    },

    /**
     * Получить все выпущенные чеки
     *
     * @throws ConnectionError|AuthError
     * @returns {Promise<{id: Number, resident_id: Number, period_id: Number, amount_rub: Number}[]>}
     */
    billsIndex: async function() {
        const response = await doRequest('/bills', 'get')

        if (response === null) {
            throw new ConnectionError()
        }

        if (response.statusCode === 401 || response.statusCode === 403) {
            throw new AuthError()
        }

        return await response.json()
    },
    /**
     * Получить все выпущенные чеки
     *
     * @throws ConnectionError|AuthError|NotFoundError
     * @returns {Promise<{id: Number, resident_id: Number, period_id: Number, amount_rub: Number}[]>}
     */
    billsIndexPeriod: async function(periodID) {
        const response = await doRequest(`/periods/${periodID}/bills`, 'get')

        if (response === null) {
            throw new ConnectionError()
        }

        if (response.statusCode === 401 || response.statusCode === 403) {
            throw new AuthError()
        }

        if (response.statusCode === 404) {
            throw new NotFoundError()
        }

        return (await response.json()).data
    },
}

export default api;
