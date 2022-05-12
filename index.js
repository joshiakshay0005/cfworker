addEventListener('fetch', event => {
  event.respondWith(handleRequest(event))
})

const corsHeaders = {
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET,POST',
  'Access-Control-Allow-Origin': '*',
}
/**
 * Respond with custom theme text
 * @param {Request} request
 */
async function handleRequest(event) {
  let request = event.request;
  let response;
  if (request.method === 'GET' && (request.url.indexOf('/theme') > -1)) {
    response = await getApiCalls(request, 'current-theme-');
  } else if(request.method === 'POST' && request.url.indexOf('/theme') > -1) {
    response = await saveApiCalls(request, 'current-theme-');
  } else if(request.method === 'GET' && request.url.indexOf('/layout') > -1) {
    if (request.url.indexOf('language') > -1) {
      response = await getApiCallsWithLanguage(request, 'current-layout-');
    } else {
      response = await getApiCalls(request, 'current-layout-');
    }
  } else if(request.method === 'POST' && request.url.indexOf('/layout') > -1) {
    response = await saveApiCalls(request, 'current-layout-');
  } else if(request.method === 'POST' && request.url.indexOf('/clientlayout') > -1) {
    response = await saveClientApiCalls(request, '');
  } else if(request.method === 'POST' && request.url.indexOf('/accesstoken') > -1) {
    response = await saveAccessTokanCalls(request, 'access-token-');
  } else if(request.method === 'GET' && request.url.indexOf('/translations') > -1) {
    if (request.url.indexOf('language') > -1) {
      response = await getTranslationsApiCalls(request, 'translations-')
    } else {
      response = await getApiCalls(request, 'translations-');
    }
  } else if(request.method === 'POST' && request.url.indexOf('/translations') > -1) {
    response = await saveTranslationsApiCalls(request, 'translations-');
  } else if(request.method === 'GET' && request.url.indexOf('/accesstoken') > -1) {
    response = await getApiCalls(request, 'access-token-');
  } else if(request.method === 'GET' && request.url.indexOf('api/js') > -1) {
    // response = await getHTMLWebCompApiCalls(request, event);
    response = await getJSWebCompApiCalls(request);
    return response;
  } else if(request.method === 'GET' && request.url.indexOf('/getclientlayout') > -1) {
    let KvStoreKeyId;
    let tenantId;
    if (request.url.indexOf('tenantId') && request.url.indexOf('userId')) {
      const queryParam = request.url.split('?')[1].split('&');
      tenantId = queryParam[0].split('=')[1];
      userId = queryParam[1].split('=')[1];
      KvStoreKeyId = `${tenantId}_${userId}`;
    }
    const respData = await styles.get(KvStoreKeyId);
    return new Response(respData, {
      headers: {
        'content-type': 'application/json',
        ...corsHeaders
      },
    });
  } else if(request.method === 'GET' && request.url.indexOf('/getUserId') > -1) {
    const userId = Math.random().toString(36).slice(2);
    const resp = JSON.stringify({userId: userId});
    return new Response(resp, {
      headers: {
        'content-type': 'application/json',
        ...corsHeaders,
      },
    });
  } else if (request.method === 'GET' && (request.url.indexOf('/analytics') > -1)) {
    response = await getApiCalls(request, 'analytics-');
  } else if(request.method === 'POST' && request.url.indexOf('/analytics') > -1) {
    response = await saveApiCalls(request, 'analytics-');
  } else if(request.method === 'GET' && request.url.indexOf('/upload') > -1) {
    response = await fileGetApiCalls(request, 'upload-');
  } else if(request.method === 'POST' && request.url.indexOf('/upload') > -1) {
    response = await uploadApiCalls(request, 'upload-');
  } else {
    response = new Response('Not Found', {
      headers: {
        'content-type': 'application/json',
        ...corsHeaders,
      },
    })
  }
  return response;
}

async function gatherResponse(response) {
  const { headers } = response;
  const contentType = headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return JSON.stringify(await response.json());
  } else if (contentType.includes('application/text')) {
    return response.text();
  } else if (contentType.includes('text/html')) {
    return response.text();
  } else {
    return response.text();
  }
}

async function getHTMLWebCompApiCalls(request, event) {
  // KV store to be available for the authkey
  const host = request.headers.get("Host");
  const queryParams = getWebCompQueryParams(request.url);
  const keyStoreKeyId = `${host}_${queryParams['key']}`;
  let kvAuthKeyData = await styles.get(keyStoreKeyId);
  if (!queryParams['key']) {
    return new Response('Bad Request', { status: 400});
  } else if (kvAuthKeyData === null) {
    return new Response('User Not Authenticated', { status: 403});
  } else {
    const blobUrl = `https://tcnew.blob.core.windows.net/webcomp${queryParams['version']}/home.component.html`;
    const init = {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
      },
      cf: {
        // Always cache this fetch regardless of content type
        // for a max of 1800 seconds before revalidating the resource
        cacheTtl: 1800,
        cacheEverything: true,
      }
    };
    let response = await fetch(blobUrl, init);
    // Reconstruct the Response object to make its headers mutable.
    response = new Response(response.body, response);
    // Set cache control headers to cache on browser for 3600 seconds
    response.headers.set('cache-control', `max-age=3600`);
    return response;
  }
}

async function getJSWebCompApiCalls(request) {
  // KV store to be available for the authkey
  const host = request.headers.get("Host");
  const queryParams = getWebCompQueryParams(request.url);
  const keyStoreKeyId = `${host}_${queryParams['key']}`;
  let kvAuthKeyData = await styles.get(keyStoreKeyId);
  if (!queryParams['key']) {
    return new Response('Bad Request', { status: 400});
  } else if (kvAuthKeyData === null) {
    return new Response('User Not Authenticated', { status: 403});
  } else {
    const blobUrl = `https://tcnew.blob.core.windows.net/webcomp${queryParams['version']}/${queryParams['webcompname']}.js`;
    const init = {
      headers: {
        'content-type': 'application/x-javascript',
      },
      cf: {
        // Always cache this fetch regardless of content type
        // for a max of 1800 seconds before revalidating the resource
        cacheTtl: 1800,
        cacheEverything: true,
      }
    };
    let response = await fetch(blobUrl, init);
    // Reconstruct the Response object to make its headers mutable.
    response = new Response(response.body, response);
    // Set cache control headers to cache on browser for 3600 seconds
    response.headers.set('cache-control', `max-age=3600`);
    return response;
  }
}

const getWebCompQueryParams = (url) => {
  let queryParams = {};
  if (url.indexOf('tenantid')) {
    const params = url.split('?')[1].split('&');
    params.forEach(item => {
      keyValue = item.split('=');
      queryParams[keyValue[0]] = keyValue[1];
    });
  }
  return queryParams;
}

const getJsFilename = (url) => {
  let fileName;
  if (url.indexOf('fileName')) {
    const queryParam = url.split('?');
    fileName = queryParam[1].split('=')[1];
  }
  return fileName;
}


const getApiCalls = async (request, keyId) => {
  const KvStoreKeyId = getKVStoreKeyId(request, keyId);
  optionsCall(request);
  const storedKVThemeStyles = await styles.get(KvStoreKeyId);
  return new Response(storedKVThemeStyles, {
    headers: {
      'content-type': 'application/json',
      ...corsHeaders,
    },
  });
}

const getTranslationsApiCalls = async (request, keyId) => {
  // const KvStoreKeyId = getKVStoreKeyId(request, keyId);
  let newKeyId;
  let tenantId;
  let langId;
  if (request.url.indexOf('tenantId')) {
    const queryParam1 = request.url.split('?');
    const queryParam2 = queryParam1[1].split('&');
    tenantId = queryParam2[0].split('=')[1];
    langId = queryParam2[1].split('=')[1];
    newKeyId = keyId + tenantId;
  }
  optionsCall(request);
  let storedKVTranslationsData = await styles.get(newKeyId);
  storedKVTranslationsData = JSON.parse(storedKVTranslationsData);
  let selectedLanguageData = JSON.stringify(storedKVTranslationsData[langId]);
  return new Response(selectedLanguageData, {
    headers: {
      'content-type': 'application/json',
      ...corsHeaders,
    },
  });
}

const getApiCallsWithLanguage = async (request, keyId) => {
  const KvStoreKeyId = getKVStoreKeyLanguageId(request, keyId);
  optionsCall(request);
  const storedKVThemeStyles = await styles.get(KvStoreKeyId);
  return new Response(storedKVThemeStyles, {
    headers: {
      'content-type': 'application/json',
      ...corsHeaders,
    },
  });
}

const saveAccessTokanCalls = async (request, keyId) => {
  let KvStoreKeyId;
  let tenantId;
  if (request.url.indexOf('tenantId')) {
    const queryParam = request.url.split('?');
    tenantId = queryParam[1].split('=')[1];
    KvStoreKeyId = keyId + tenantId;
  }
  optionsCall(request);
  const reqBody = JSON.stringify(await request.json());

  await styles.put(KvStoreKeyId, reqBody);
  return new Response(KvStoreKeyId, {
    headers: {
      'content-type': 'application/json',
      ...corsHeaders
    },
  });
}

const saveClientApiCalls = async (request) => {
  let KvStoreKeyId;
  let tenantId;
  if (request.url.indexOf('tenantId') && request.url.indexOf('userId')) {
    const queryParam = request.url.split('?')[1].split('&');
    tenantId = queryParam[0].split('=')[1];
    userId = queryParam[1].split('=')[1];
    KvStoreKeyId = `${tenantId}_${userId}`;
  }
  optionsCall(request);
  const reqBody = JSON.stringify(await request.json());

  await styles.put(KvStoreKeyId, reqBody);
  return new Response(userId, {
    headers: {
      'content-type': 'application/json',
      ...corsHeaders
    },
  });
}

const saveApiCalls = async (request, keyId) => {
  let KvStoreKeyId;
  let tenantId;
  if (request.url.indexOf('tenantId') > -1) {
    const queryParam1 = request.url.split('?');
    if (request.url.indexOf('language') > -1) {
      const queryParam2 = queryParam1[1].split('&');
      tenantId = queryParam2[0].split('=')[1];
      langId = queryParam2[1].split('=')[1];
      KvStoreKeyId = keyId + tenantId + '-' + langId;
    } else {
      tenantId = queryParam1[1].split('=')[1];
      KvStoreKeyId = keyId + tenantId;
    }
  }
  optionsCall(request);
  const reqBody = JSON.stringify(await request.json());

  // Start sync with client-layout
  // let clientLayoutVal = JSON.parse(reqBody);
  // clientLayoutVal = clientLayoutVal.pages;
  // await styles.put(`${tenantId}_9fd7afa9-92c1-44fa-a0ff-b076fcadee53`, JSON.stringify(clientLayoutVal));
  // End sync with client-layout

  await styles.put(KvStoreKeyId, reqBody);
  return new Response(KvStoreKeyId, {
    headers: {
      'content-type': 'application/json',
      ...corsHeaders
    },
  });
}

const uploadApiCalls = async (request, keyId) => {
  let KvStoreKeyId;
  let tenantId;
  if (request.url.indexOf('tenantId') > -1) {
    const queryParam1 = request.url.split('?');
    if (request.url.indexOf('language') > -1) {
      const queryParam2 = queryParam1[1].split('&');
      tenantId = queryParam2[0].split('=')[1];
      langId = queryParam2[1].split('=')[1];
      KvStoreKeyId = keyId + tenantId + '-' + langId;
    } else {
      tenantId = queryParam1[1].split('=')[1];
      KvStoreKeyId = keyId + tenantId;
    }
  }
  optionsCall(request);
  // const formData = await request.formData();
  // const file = formData.get('file');
  // console.log(formData);
  // console.log(file);
  // const body = {};
  // for (const entry of formData.entries()) {
  //   body[entry[0]] = entry[1];
  // }
  // console.log(JSON.stringify(body));
  // Start sync with client-layout
  // let clientLayoutVal = JSON.parse(reqBody);
  // clientLayoutVal = clientLayoutVal.pages;
  // await styles.put(`${tenantId}_9fd7afa9-92c1-44fa-a0ff-b076fcadee53`, JSON.stringify(clientLayoutVal));
  // End sync with client-layout

  const reqBody = JSON.stringify(await request.json());
  await styles.put(KvStoreKeyId, JSON.stringify(reqBody));
  return new Response(reqBody, {
    headers: {
      'content-type': 'application/json',
      ...corsHeaders
    },
  });
}

const fileGetApiCalls = async (request, keyId) => {
  const KvStoreKeyId = getKVStoreKeyId(request, keyId);
  optionsCall(request);
  const storedKVThemeStyles = await styles.get(KvStoreKeyId);
  return new Response(storedKVThemeStyles, {
    headers: {
      'content-type': 'multipart/form-data',
      ...corsHeaders,
    },
  });
}

const saveTranslationsApiCalls = async (request, keyId) => {
  let KvStoreKeyId;
  let tenantId;
  if (request.url.indexOf('tenantId') > -1) {
    const queryParam1 = request.url.split('?');
    tenantId = queryParam1[1].split('=')[1];
    KvStoreKeyId = keyId + tenantId;
  }
  optionsCall(request);

  const reqBody = JSON.stringify(await request.json());
  const translationsReqData = JSON.parse(reqBody);

  // Start sync with translations data
  let translationsData = await styles.get(`translations-${tenantId}`);
  translationsData = JSON.parse(translationsData);
  if (translationsReqData['en_value']) {
    const enLanguageData = translationsData['en_us'];
    enLanguageData[translationsReqData.key] = translationsReqData['en_value'];
  }
  if (translationsReqData['fr_value']) {
    const frLanguageData = translationsData['fr'];
    frLanguageData[translationsReqData.key] = translationsReqData['fr_value'];
  }
  if (translationsReqData['es_value']) {
    const esLanguageData = translationsData['es'];
    esLanguageData[translationsReqData.key] = translationsReqData['es_value'];
  }
  // End sync with translations data

  await styles.put(KvStoreKeyId, JSON.stringify(translationsData));
  return new Response(JSON.stringify(translationsData), {
    headers: {
      'content-type': 'application/json',
      ...corsHeaders
    },
  });
}

const getKVStoreKeyId = (request, keyId) => {
  let newKeyId;
  if (request.url.indexOf('tenantId')) {
    const queryParam = request.url.split('?');
    const tenantId = queryParam[1].split('=')[1];
    newKeyId = keyId + tenantId;
  }
  return newKeyId;
}

const getKVStoreKeyLanguageId = (request, keyId) => {
  let newKeyId;
  // if (request.url.indexOf('tenantId')) {
  //   const queryParam = request.url.split('?');
  //   const tenantId = queryParam[1].split('=')[1];
  //   newKeyId = keyId + tenantId;
  // }
  let tenantId;
  if (request.url.indexOf('tenantId')) {
    const queryParam1 = request.url.split('?');
    if (request.url.indexOf('language')) {
      const queryParam2 = queryParam1[1].split('&');
      tenantId = queryParam2[0].split('=')[1];
      langId = queryParam2[1].split('=')[1];
      newKeyId = keyId + tenantId + '-' + langId;
    } else {
      tenantId = queryParam1[1].split('=')[1];
      newKeyId = keyId + tenantId;
    }
  }
  return newKeyId;
}

const optionsCall = (request) => {
  if(request.method === 'OPTIONS') {
    return new Response("OK", {headers: corsHeaders});
  }
}

async function readRequestBody(request) {
  const { headers } = request
  const contentType = headers.get("content-type") || ""

  if (contentType.includes("application/json")) {
    return JSON.stringify(await request.json())
  }
  else if (contentType.includes("application/text")) {
    return request.text()
  }
  else if (contentType.includes("text/html")) {
    return request.text()
  }
  else if (contentType.includes("form")) {
    const formData = await request.formData()
    const body = {}
    for (const entry of formData.entries()) {
      body[entry[0]] = entry[1]
    }
    return JSON.stringify(body)
  }
  else {
    // Perhaps some other type of data was submitted in the form
    // like an image, or some other binary data.
    return 'a file';
  }
}

