import dns from 'node:dns/promises';
import https from 'node:https';
import { URL } from 'node:url';

const FAKE_IP_PREFIXES = ['28.', '198.19.', '198.18.'];
const GOOGLE_DOH = 'https://dns.google/resolve';

const addressCache = new Map();

const isFakeIp = (ip = '') => FAKE_IP_PREFIXES.some((prefix) => ip.startsWith(prefix));

const isNetworkFetchError = (error) => {
  const message = `${error?.message || ''} ${error?.cause?.message || ''}`.toLowerCase();
  return message.includes('fetch failed')
    || message.includes('network')
    || message.includes('tls')
    || message.includes('econnreset')
    || message.includes('socket disconnected');
};

const lookupSystemAddress = async (hostname) => {
  const result = await dns.lookup(hostname, { family: 4 });
  return result.address;
};

const httpsJsonRequest = ({ hostname, servername, path, method = 'GET', headers = {}, body = null }) => new Promise((resolve, reject) => {
  const req = https.request({
    hostname,
    servername,
    path,
    method,
    headers,
  }, (res) => {
    const chunks = [];
    res.on('data', (chunk) => chunks.push(chunk));
    res.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8');
      resolve({
        ok: (res.statusCode || 500) >= 200 && (res.statusCode || 500) < 300,
        status: res.statusCode || 500,
        text: async () => text,
        json: async () => JSON.parse(text || '{}'),
      });
    });
  });

  req.on('error', reject);
  if (body) req.write(body);
  req.end();
});

const resolveViaGoogleDoh = async (hostname) => {
  const response = await fetch(`${GOOGLE_DOH}?name=${encodeURIComponent(hostname)}&type=A`, {
    headers: { Accept: 'application/dns-json' },
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  const answer = payload.Answer?.find((entry) => entry.type === 1);
  return answer?.data || null;
};

const resolveRealAddress = async (hostname) => {
  if (addressCache.has(hostname)) {
    return addressCache.get(hostname);
  }

  let systemAddress = null;
  try {
    systemAddress = await lookupSystemAddress(hostname);
    if (!isFakeIp(systemAddress)) {
      const resolved = { address: systemAddress, source: 'system' };
      addressCache.set(hostname, resolved);
      return resolved;
    }
  } catch {
    // Fall through to DoH.
  }

  const dohAddress = await resolveViaGoogleDoh(hostname);
  if (dohAddress && !isFakeIp(dohAddress)) {
    const resolved = { address: dohAddress, source: 'doh', spoofedAddress: systemAddress };
    addressCache.set(hostname, resolved);
    return resolved;
  }

  return systemAddress
    ? { address: systemAddress, source: 'system', likelySpoofed: true }
    : null;
};

const httpsFetch = (targetUrl, init = {}, resolved = null) => {
  const url = new URL(targetUrl);
  const method = init.method || 'GET';
  const headers = { ...(init.headers || {}) };
  const body = typeof init.body === 'string' ? init.body : init.body ? String(init.body) : null;

  if (body && !headers['Content-Length'] && !headers['content-length']) {
    headers['Content-Length'] = Buffer.byteLength(body);
  }

  if (!headers.Host && !headers.host) {
    headers.Host = url.hostname;
  }

  return httpsJsonRequest({
    hostname: resolved?.address || url.hostname,
    servername: url.hostname,
    path: `${url.pathname}${url.search}`,
    method,
    headers,
    body,
  });
};

export const getNetworkDiagnostics = async (baseUrl) => {
  const hostname = new URL(baseUrl).hostname;
  const resolved = await resolveRealAddress(hostname);

  if (!resolved) {
    return {
      hostname,
      hint: `无法解析 ${hostname}。请检查 DNS 或网络连接。`,
    };
  }

  if (resolved.source === 'doh' || resolved.likelySpoofed) {
    return {
      hostname,
      resolvedAddress: resolved.address,
      spoofedAddress: resolved.spoofedAddress || null,
      hint: '检测到 Clash / FlClash fake-ip。已尝试用真实 IP 直连；若仍失败，请在 FlClash 里把 *.volces.com 设为直连并加入 fake-ip-filter。',
    };
  }

  return {
    hostname,
    resolvedAddress: resolved.address,
    hint: null,
  };
};

export const networkFetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? new URL(input) : new URL(input.url);
  const hostname = url.hostname;
  const resolved = await resolveRealAddress(hostname);

  if (resolved?.source === 'doh' || resolved?.likelySpoofed) {
    return httpsFetch(input, init, resolved);
  }

  try {
    return await fetch(input, init);
  } catch (error) {
    if (!isNetworkFetchError(error)) {
      throw error;
    }

    const fallback = await resolveViaGoogleDoh(hostname);
    if (!fallback || isFakeIp(fallback)) {
      throw error;
    }

    const fallbackResolved = { address: fallback, source: 'doh' };
    addressCache.set(hostname, fallbackResolved);
    return httpsFetch(input, init, fallbackResolved);
  }
};
