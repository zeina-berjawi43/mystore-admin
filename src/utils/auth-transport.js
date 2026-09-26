// Shared fetch/axios recovery. Never retry a request under a different login.
export const API_URL = 'https://mystore-backend-u6ey.onrender.com';
export function createAuthTransport(storage, rawFetch, invalid) {
    let flight;
    const clear = async (expected) => {
        if (await storage.clearSession(expected) && await storage.getItem('refreshToken') === null)
            invalid();
    };
    const refresh = async (expected) => {
        if (!expected || await storage.getItem('refreshToken') !== expected)
            throw new Error('Session changed. Please try again.');
        if (flight?.refresh === expected)
            return flight.promise;
        const promise = (async () => {
            const previousAccess = await storage.getItem('accessToken');
            const exchange = async () => {
                if (await storage.getItem('refreshToken') !== expected)
                    throw new Error('Session changed. Please try again.');
                const currentAccess = await storage.getItem('accessToken');
                if (currentAccess && currentAccess !== previousAccess)
                    return currentAccess;
                const response = await rawFetch(`${API_URL}/auth/refresh-token`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: expected }),
                });
                if (await storage.getItem('refreshToken') !== expected)
                    throw new Error('Session changed. Please try again.');
                if (!response.ok) {
                    if (response.status === 401 || response.status === 403)
                        await clear(expected);
                    throw new Error(response.status === 401 ? 'Session expired. Please log in again.' : 'Session refresh unavailable. Please try again.');
                }
                const data = await response.json();
                if (!data.accessToken)
                    throw new Error('Invalid refresh response. Please try again.');
                if (await storage.getItem('refreshToken') !== expected)
                    throw new Error('Session changed. Please try again.');
                if (!await storage.commitAccess(expected, data.accessToken))
                    throw new Error('Session changed. Please try again.');
                return data.accessToken;
            };
            return storage.withRefreshLock ? storage.withRefreshLock(exchange) : exchange();
        })();
        flight = { refresh: expected, promise };
        try {
            return await promise;
        }
        finally {
            if (flight?.promise === promise)
                flight = undefined;
        }
    };
    const authorizedFetch = async (input, init, send = rawFetch) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        const headers = new Headers(init?.headers || (typeof input === 'object' && 'headers' in input ? input.headers : undefined));
        const publicAuth = ['/auth/admin/login', '/auth/refresh-token', '/auth/logout'].some(path => url === API_URL + path);
        if (!url.startsWith(`${API_URL}/`) || publicAuth || !headers.has('Authorization'))
            return send(input, init);
        const session = await storage.getItem('refreshToken');
        const token = await storage.getItem('accessToken');
        if (!session) {
            await clear(null);
            throw new Error('Session expired. Please log in again.');
        }
        headers.set('Authorization', `Bearer ${token || await refresh(session)}`);
        if (await storage.getItem('refreshToken') !== session)
            throw new Error('Session changed. Please try again.');
        const response = await send(input, { ...init, headers });
        if (await storage.getItem('refreshToken') !== session)
            throw new Error('Session changed. Please try again.');
        if (response.status !== 401)
            return response;
        const latest = await storage.getItem('accessToken');
        const recovered = latest && latest !== token ? latest : await refresh(session);
        if (await storage.getItem('refreshToken') !== session)
            throw new Error('Session changed. Please try again.');
        headers.set('Authorization', `Bearer ${recovered}`);
        const retried = await send(input, { ...init, headers });
        if (await storage.getItem('refreshToken') !== session)
            throw new Error('Session changed. Please try again.');
        if (retried.status === 401) {
            await clear(session);
            throw new Error('Session expired. Please log in again.');
        }
        return retried;
    };
    const logout = async () => {
        const refreshToken = await storage.getItem('refreshToken');
        await clear(refreshToken);
        if (refreshToken) {
            const response = await rawFetch(`${API_URL}/auth/logout`, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) });
            if (!response.ok)
                throw new Error('Local session cleared, but server logout could not be confirmed.');
        }
    };
    return { fetch: authorizedFetch, refresh, logout, withFetch: (send) => (input, init) => authorizedFetch(input, init, send) };
}
