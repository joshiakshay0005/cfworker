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

  let themeKeyId = 'current-theme-';
  if (request.url.indexOf('tenantId')) {
    const queryParam = request.url.split('?');
    const tenantId = queryParam[1].split('=')[1];
    themeKeyId = themeKeyId + tenantId;
  }
  let data = getData();

  if(request.method === 'OPTIONS') {
    return new Response("OK", {headers: corsHeaders});
  }

  if(request.method === 'POST') {
    const reqBody = JSON.stringify(await request.json());
    await styles.put(themeKeyId, reqBody);
    return new Response(themeKeyId, {
      headers: {
        'content-type': 'application/json',
        ...corsHeaders
      },
    });
  }

  if(request.method === 'GET') {
    const storedKVThemeStyles = await styles.get(themeKeyId);
    return new Response(storedKVThemeStyles, {
      headers: {
        'content-type': 'application/json',
        ...corsHeaders,
      },
    })
  }
}

function getData() {
  return `{"primaryColor":{"key":"primaryColor","value":"#3F51B5"},"secondaryColor":{"key":"secondaryColor","value":"#00FF00"},"buttonColor":{"key":"buttonColor","value":"#3F51B5"},"buttonTextColor":{"key":"buttonTextColor","value":"#FFFFFF"},"textColor":{"key":"textColor","value":"#33d15b"},"linkTextColor":{"key":"linkTextColor","value":"#438137"},"menuColor":{"key":"menuColor","value":"#6879df"},"menuTextColor":{"key":"menuTextColor","value":"#e1cbcb"}}`
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

