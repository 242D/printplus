import { createHash } from 'crypto';

function resolveRealIP(req) {
    return req.headers['cf-connecting-ip'] || req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
}

function detectBrowser(req) {
    let ua = req.headers['user-agent'];
    let browser = 'unknown';
    if (/Edge/.test(ua)) {
        browser = 'Edge';
    } else if (/Firefox/.test(ua)) {
        browser = 'Firefox';
    } else if (/Chrome/.test(ua)) {
        browser = 'Chrome';
    } else if (/Safari/.test(ua)) {
        browser = 'Safari';
    } else if (/MSIE/.test(ua)) {
        browser = 'IE';
    } else if (/Trident/.test(ua)) {
        browser = 'IE';
    }
    return browser;
}

let clientStore = {};

export default (req, res, next) => {
    let usefulHeaders = {
        ip: resolveRealIP(req),
        browser: detectBrowser(req)
    };

    let usefulData = {
        method: req.method,
        url: req.url,
        query: req.query,
        body: req.body,
        headers: usefulHeaders
    };


    if (clientStore[usefulHeaders.ip] && clientStore[usefulHeaders.ip].data && clientStore[usefulHeaders.ip].data.complete) {
        clientStore[usefulHeaders.ip].data.lastSeen = Date.now();
        req.clientData = clientStore[usefulHeaders.ip];
        return next();
    } else {
        res.set('Accept-CH', 'DPR, Width, Viewport-Width, Device-Memory');
        res.set('Accept-CH-Lifetime', 60 * 60 * 24 * 7);

        req.clientData = {
            fingerprints: {
                request: createHash('sha256').update(JSON.stringify(usefulData)).digest('hex'),
                client: createHash('sha256').update(JSON.stringify(usefulHeaders)).digest('hex')
            },
            info: usefulHeaders,
            data: usefulData
        };
        
        Object.assign(req.clientData, clientStore[usefulHeaders.ip]);

        clientStore[usefulHeaders.ip] = req.clientData;
        
        if (req.headers['device-memory']) {
            clientStore[usefulHeaders.ip].data.memory = req.headers['device-memory'];
        }
        if (req.headers['dpr']) {
            clientStore[usefulHeaders.ip].data.dpr = req.headers['dpr'];
        }
        if (req.headers['width']) {
            clientStore[usefulHeaders.ip].data.width = req.headers['width'];
        }
        if (req.headers['viewport-width']) {
            clientStore[usefulHeaders.ip].data.viewportWidth = req.headers['viewport-width'];
        }
        if (clientStore[usefulHeaders.ip].data.memory && (clientStore[usefulHeaders.ip].data.width || clientStore[usefulHeaders.ip].data.viewportWidth)) {
            clientStore[usefulHeaders.ip].data.complete = true;
        }
    }

    clientStore[usefulHeaders.ip].data.lastSeen = Date.now();
    next();
}

const _clientStore = clientStore;
export { _clientStore as clientStore };
