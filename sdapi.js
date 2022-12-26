//javascript plugin can't read images from local directory so we send a request to local server to read the image file and send it back to plugin as image string base64
async function getInitImage (init_image_name) {
  console.log('getInitImage(): get Init Image from the server :')
  payload = {
    init_image_name: init_image_name
  }

  const full_url = 'http://127.0.0.1:8000/getInitImage/'
  console.log(full_url)
  console.log('getInitImage payload:', payload)
  let request = await fetch(full_url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
    // "body": payload
  })

  let json = await request.json()
  console.log('json:')
  console.dir(json)
  base64data = json.init_image_str
  image_src = `data:image/png;base64, ${base64data}`
  return image_src

  // console.log(img.src)

  // let img_blob =  await (await fetch(img.src)).blob()
  // console.log("img_blob:")
  // console.dir(img_blob)
}

async function requestTxt2Img (payload) {
  // const url = "http://127.0.0.1:7860"
  // const full_url =`${url}/sdapi/v1/txt2img`

  // payload = {
  //     "prompt": "puppy dog",
  //     "steps": 5
  // }

  //   payload = {
  //     "prompt": "cute cat, kitten",
  //     "steps": 10
  //   }

  // response = requests.post(, json=payload)

  console.log('requestTxt2Img(): about to send a fetch request')

  const full_url = 'http://127.0.0.1:8000/txt2img/'
  console.log(full_url)

  let request = await fetch(full_url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
    // "body": payload
  })

  let json = await request.json()
  console.log('json:')
  console.dir(json)
  




  // base64data = json.images[0]
  // let img = document.getElementById('img1')
  // img.src = `data:image/png;base64, ${base64data}`
  // console.log(img.src)

  // let img_blob =  await (await fetch(img.src)).blob()
  // console.log("img_blob:")
  // console.dir(img_blob)

  // try {
  //   navigator.clipboard.write([
  //       new ClipboardItem({
  //           'image/png': img_blob
  //       })
  //   ]);
  // } catch (error) {
  //   console.error(error);
  // }

  //  request.data (data =>{
  //     console.log(data);
  // });
  return json
}

async function requestImg2Img (payload) {
  console.log('requestTxt2Img(): about to send a fetch request')

  const full_url = 'http://127.0.0.1:8000/img2img/'
  console.log(full_url)
  console.log('requestImg2Img payload is: ', payload)
  let request = await fetch(full_url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
    // "body": payload
  })

  let json = await request.json()
  console.log('json:')
  console.dir(json)

  return json
}

async function requestProgress () {
  console.log('requestProgress: ')

  const full_url =
    'http://127.0.0.1:8000/sdapi/v1/progress?skip_current_image=false'
  let request = await fetch(full_url)
  let json = await request.json()
  console.log('progress json:')
  console.dir(json)

  return json
}

async function requestGetModels () {
  console.log('requestGetModels: ')

  const full_url = 'http://127.0.0.1:8000/sdapi/v1/sd-models'
  let request = await fetch(full_url)
  let json = await request.json()
  console.log('models json:')
  console.dir(json)

  return json
}

async function requestGetSamplers () {
  console.log('requestGetSamplers: ')

  const full_url = 'http://127.0.0.1:8000/sdapi/v1/samplers'
  let request = await fetch(full_url)
  let json = await request.json()
  console.log('samplers json:')
  console.dir(json)

  return json
}

async function requestSwapModel (model_title) {
  console.log('requestSwapModel: ')
  // const full_url = 'http://127.0.0.1:8000/swapModel'

  const full_url = 'http://127.0.0.1:8000/sdapi/v1/options'
  payload = {
    sd_model_checkpoint: model_title
  }
  let request = await fetch(full_url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
    // "body": payload
  })

  let json = await request.json()

  console.log('models json:')
  console.dir(json)

  return json
}

async function requestInterrupt (model_title) {
  try {
    console.log('requestInterrupt: ')
    // const full_url = 'http://127.0.0.1:8000/swapModel'

    const full_url = 'http://127.0.0.1:8000/sdapi/v1/interrupt'
    payload = {
      // sd_model_checkpoint: model_title
    }
    let request = await fetch(full_url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
      // "body": payload
    })

    console.log("interrupt request:", request)
    let json = await request.json()

    console.log('interrupt json:')
    console.dir(json)

    return json
  } catch (e) {
    console.warn(e)
  }
}


module.exports = {
  requestTxt2Img,
  requestImg2Img,
  getInitImage,
  requestProgress,
  requestGetModels,
  requestSwapModel,
  requestInterrupt,
  requestGetSamplers
}
