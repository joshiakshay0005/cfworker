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
    response = await getApiCallsWithLanguage(request, 'current-layout-');
  } else if(request.method === 'POST' && request.url.indexOf('/layout') > -1) {
    response = await saveApiCalls(request, 'current-layout-');
  } else if(request.method === 'POST' && request.url.indexOf('/clientlayout') > -1) {
    response = await saveClientApiCalls(request, '');
  } else if(request.method === 'POST' && request.url.indexOf('/accesstoken') > -1) {
    response = await saveAccessTokanCalls(request, 'access-token-');
  } else if(request.method === 'GET' && request.url.indexOf('/accesstoken') > -1) {
    response = await getApiCalls(request, 'access-token-');
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

  // const clientLayoutVal = JSON.parse(reqBody);
  // // Start sync with current-layout
  // let currLayoutVal = await styles.get(`current-layout-${tenantId}`);
  // currLayoutVal = JSON.parse(currLayoutVal);
  // currLayoutVal.pages.forEach((page) => {
  //   const clientItemPage = clientLayoutVal.find((ele) => ele.pageId == page.pageId);
  //   if (clientItemPage && clientItemPage.items.length > 0) {
  //     page.pageLayout.layoutFormat.forEach(layout => {
  //       layout.columnItems.forEach(column => {
  //         column.itemsContainer.forEach(item => {
  //           if(Array.isArray(item)) {
  //             item.forEach(itemDetails => {
  //               if (itemDetails.properties) {
  //                 const clientItemVal = clientItemPage.items.find(elem => (elem.itemPropsId === itemDetails.properties.id) || (elem.itemOuterId === item.id  && elem.rowId === layout.rowId && elem.columnId === column.columnId));
  //                 if (clientItemVal) {
  //                   itemDetails.properties.defaultValue = clientItemVal.value;
  //                 } else {
  //                   itemDetails.properties.defaultValue = '';
  //                 }
  //               }
  //             })
  //           } else {
  //             if (item.properties) {
  //               const clientItemVal = clientItemPage.items.find(elem => ((elem.itemPropsId === item.properties.id) || (elem.itemOuterId === item.id  && elem.rowId === layout.rowId && elem.columnId === column.columnId)));
  //               if (clientItemVal) {
  //                 item.properties.defaultValue = clientItemVal.value;
  //                 console.log('clientItemVal:', JSON.stringify(clientItemVal));
  //                 console.log('item:', JSON.stringify(item.properties));
  //               } else {
  //                 item.properties.defaultValue = '';
  //               }
  //             }
  //           }
  //         });
  //       });
  //     });
  //   }
  // })
  // await styles.put(`current-layout-${tenantId}`, JSON.stringify(currLayoutVal));
  // // End sync with current-layout

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
    const queryParam1 = request.url.split('?');
    if(request.url.indexOf('language')) {
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

