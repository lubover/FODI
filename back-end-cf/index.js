/**
 * IS_CN: 如果为世纪互联版本，请将 0 改为 1
 * EXPOSE_PATH：暴露路径，如全盘展示请留空，否则按 '/媒体/音乐' 的格式填写
 * ONEDRIVE_REFRESHTOKEN: refresh_token
 */
const IS_CN = 0;
const EXPOSE_PATH = ""
const ONEDRIVE_REFRESHTOKEN = "OAQABAAAAAABTYj0VqP05TZ6xV9yGkWlGKsH1VVI-RD2uJsWXFl_RP89XZDCSX_lAYP2buyoSINjaBSZ7qXdIthllPUm6-EQ6hl9nfEva45N95o7hP-CsF3wbWYWq8lpWmwJaEbn1q4MTVZFnYMTUbHSVqWU2809ZJKB8pT-SS-mpykWD9nuzx4cT4Ruj65b3FQddpKO_iBtLYMvnPOXIv82HagDe9pTE_J2Rmq7wvluUfpXZH9QziF1soIMZk7D90wApoOk8ut4CdwHxu0AJAo1_Na5ls_n9rZzMcX10IejZzFryNoGAhiB_FMHVlzJQFxp1e5VyS1qEHRgf7RWvij9TP4d_PHW6nRtb1RpONvR80VJBymu_U9UiQj0dgREA-WZZMA0vFP5RHrgNix0jfTJCmlZd-MUyhsG4WZBfr04bp6qh_s5ifLo8ZlppOVD0I2jfuTFO9sA6lapiNCm4A2xaTZa9rg_fzSrO36vc39mGYDNCvzDLu10BClTQQH-h4BHu6QCVl4lBr_1I_1yiv4M9ncT0EqsmcLpVVgp2hRiJU9Ljks41QMmpbtsJG4wwcyVRHcfqEVYTlEYktMKlcCi6thRgt-HinX-azInHlWKLqsX5TiSBAXDx-PNvLNcCgimgs55qaEyFF59cviPepSHamt1k2fTxjDldva_EUpEyrn4sn8rKIKO4pCYI9fDDCCKx2GACFJNeN8kcitSORhdsgs-VvQCq2dbaTB8qJEpE2JQJr5SKylEZU5KljBEjCvSoX_GLVEZ3nfb8ex8yayqgpsBkkWpZEOLU0V1Lmy1LmZto_Gl6HyuJunXzvCcR6VZXE-jyaTwgAA"


async function handleRequest(request) {
  let requestPath
  let querySplited
  let queryString = request.url.split('?')[1]
  if (queryString) {
    querySplited = queryString.split('=')
  }
  if (querySplited && querySplited[0] === 'file') {
    const file = querySplited[1]
    const fileName = file.split('/').pop();
    requestPath = file.replace('/' + fileName, '')
    const url = await fetchFiles(requestPath, fileName)
    return Response.redirect(url, 302)
  } else {
    const { headers } = request
    const contentType = headers.get('content-type')
    let body={}
    if (contentType && contentType.includes('form')) {
      const formData = await request.formData()
      for (let entry of formData.entries()) {
        body[entry[0]] = entry[1]
      }
    }
    requestPath = body ? body['?path'] : '';
    const files = await fetchFiles(requestPath, null, body.passwd);
    return new Response(files, {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

addEventListener('fetch', event => {
  return event.respondWith(handleRequest(event.request))
})


const clientId = [
  '4da3e7f2-bf6d-467c-aaf0-578078f0bf7c',
  '04c3ca0b-8d07-4773-85ad-98b037d25631'

]
const clientSecret = [
  '7/+ykq2xkfx:.DWjacuIRojIaaWL0QI6',
  'h8@B7kFVOmj0+8HKBWeNTgl@pU/z4yLB'
]

const oauthHost = [
  'https://login.microsoftonline.com',
  'https://login.partner.microsoftonline.cn'
]

const apiHost = [
  'https://graph.microsoft.com',
  'https://microsoftgraph.chinacloudapi.cn'
]

const OAUTH = {
  'redirectUri': 'https://scfonedrive.github.io',
  'refreshToken': ONEDRIVE_REFRESHTOKEN,
  'clientId': clientId[IS_CN],
  'clientSecret': clientSecret[IS_CN],
  'oauthUrl': oauthHost[IS_CN] + '/common/oauth2/v2.0/',
  'apiUrl': apiHost[IS_CN] + '/v1.0/me/drive/root',
  'scope': apiHost[IS_CN] + '/Files.ReadWrite.All offline_access'
}

async function gatherResponse(response) {
  const { headers } = response
  const contentType = headers.get('content-type')
  if (contentType.includes('application/json')) {
    return await response.json()
  } else if (contentType.includes('application/text')) {
    return await response.text()
  } else if (contentType.includes('text/html')) {
    return await response.text()
  } else {
    return await response.text()
  }
}

async function getContent(url) {
  const response = await fetch(url)
  const result = await gatherResponse(response)
  return result
}

async function getContentWithHeaders(url, headers) {
  const response = await fetch(url, { headers: headers })
  const result = await gatherResponse(response)
  return result
}

async function fetchFormData(url, data) {
  const formdata = new FormData();
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      formdata.append(key, data[key])
    }
  }
  const requestOptions = {
    method: 'POST',
    body: formdata
  };
  const response = await fetch(url, requestOptions)
  const result = await gatherResponse(response)
  return result
}

async function fetchAccessToken() {
  url = OAUTH['oauthUrl'] + 'token'
  data = {
    'client_id': OAUTH['clientId'],
    'client_secret': OAUTH['clientSecret'],
    'grant_type': 'refresh_token',
    'requested_token_use': 'on_behalf_of',
    'refresh_token': OAUTH['refreshToken']
  }
  const result = await fetchFormData(url, data)
  return result.access_token
}

async function fetchFiles(path, fileName, passwd) {
  if (!path || path === '/') {
    if (EXPOSE_PATH === '') {
      path = ''
    } else {
      path = ':' + EXPOSE_PATH
    }
  } else {
    if (EXPOSE_PATH === '') {
      path = ':' + path
    } else {
      path = ':' + EXPOSE_PATH + path
    }
  }

  const accessToken = await fetchAccessToken()
  const uri = OAUTH.apiUrl + encodeURI(path) + '?expand=children(select=name,size,parentReference,lastModifiedDateTime,@microsoft.graph.downloadUrl)'

  const body = await getContentWithHeaders(uri, {
    Authorization: 'Bearer ' + accessToken
  })
  if (fileName) {
    let thisFile = null
    body.children.forEach(file => {
      if (file.name === decodeURIComponent(fileName)) {
        thisFile = file['@microsoft.graph.downloadUrl']
        return
      }
    })
    return thisFile
  } else {
    let files = []
    let encrypted = false
    for (let i = 0; i < body.children.length; i++) {
      const file = body.children[i]
      if (file.name === '.password') {
        const PASSWD = await getContent(file['@microsoft.graph.downloadUrl'])
        if (PASSWD !== passwd) {
          encrypted = true;
          break
        } else {
          continue
        }
      }
      files.push({
        name: file.name,
        size: file.size,
        time: file.lastModifiedDateTime,
        url: file['@microsoft.graph.downloadUrl']
      })
    }
    let parent
    if (body.children.length) {
      parent = body.children[0].parentReference.path
    } else {
      parent = body.parentReference.path
    }
    parent = parent.split(':').pop().replace(EXPOSE_PATH, '') || '/'
    parent = decodeURIComponent(parent)
    if (encrypted) {
      return JSON.stringify({ parent: parent, files: [], encrypted: true })
    } else {
      return JSON.stringify({ parent: parent, files: files })
    }
  }
}
