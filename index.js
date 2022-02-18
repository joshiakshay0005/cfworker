addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
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
async function handleRequest(request) {

  let response;
  if (request.method === 'GET' && (request.url.indexOf('/theme') > -1)) {
    response = await getApiCalls(request, 'current-theme-');
  } else if(request.method === 'POST' && request.url.indexOf('/theme') > -1) {
    response = await saveApiCalls(request, 'current-theme-');
  } else if(request.method === 'GET' && request.url.indexOf('/layout') > -1) {
    response = await getApiCalls(request, 'current-layout-');
  } else if(request.method === 'POST' && request.url.indexOf('/layout') > -1) {
    response = await saveApiCalls(request, 'current-layout-');
  } else if(request.method === 'POST' && request.url.indexOf('/clientlayout') > -1) {
    response = await saveClientApiCalls(request, '');
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

const saveClientApiCalls = async (request) => {
  let KvStoreKeyId;
  let tenantId;
  let userId = await styles.get('userId');;
  if (request.url.indexOf('tenantId')) {
    const queryParam = request.url.split('?');
    tenantId = queryParam[1].split('=')[1];
    KvStoreKeyId = `${tenantId}_${userId}`;
  }
  optionsCall(request);
  const reqBody = JSON.stringify(await request.json());

  // Start sync with current-layout
  let currLayoutVal = await styles.get(`current-layout-${tenantId}`);
  currLayoutVal = JSON.parse(currLayoutVal);
  currLayoutVal.pages = JSON.parse(reqBody);
  await styles.put(`current-layout-${tenantId}`, JSON.stringify(currLayoutVal));
  // End sync with current-layout

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
  if (request.url.indexOf('tenantId')) {
    const queryParam = request.url.split('?');
    tenantId = queryParam[1].split('=')[1];
    KvStoreKeyId = keyId + tenantId;
  }
  optionsCall(request);
  const reqBody = JSON.stringify(await request.json());

  // Start sync with client-layout
  let clientLayoutVal = JSON.parse(reqBody);
  clientLayoutVal = clientLayoutVal.pages;
  await styles.put(`${tenantId}_9fd7afa9-92c1-44fa-a0ff-b076fcadee53`, JSON.stringify(clientLayoutVal));
  // End sync with client-layout

  await styles.put(KvStoreKeyId, reqBody);
  return new Response(KvStoreKeyId, {
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

