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
            body: body,
        });

        if ((response.status / 100).toFixed(0) === '5') {
            console.error('Server error')
            return null
        }

        return response
    } catch (e) {
        console.error('Failed to fetch api')
        return null
    }
}

const api = {
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
    },
    authLogout: async function() {
        const response = await doRequest('/auth', 'post')

        if (response === null) {
            return null
        }

        if (response.status === 200) {
            return true
        }
    },
}

export default api;
