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
  let data = getData();
  if(request.method === 'OPTIONS') {
    return new Response("OK", {headers: corsHeaders});
  }

  if(request.method === 'POST' || request.method === 'GET') {
    return new Response(data, {
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
