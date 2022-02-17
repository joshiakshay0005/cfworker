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
    response = await saveApiCalls(request, 'client-layout-');
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

const saveApiCalls = async (request, keyId) => {
  const KvStoreKeyId = getKVStoreKeyId(request, keyId);
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

