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
    }
}

export default api;
