//how to get environment variable in javascript
const sd_url = 'http://127.0.0.1:7860'

function newOutputImageName() {
    const random_id = Math.floor(Math.random() * 100000000000 + 1) // Date.now() doesn't have enough resolution to avoid duplicate
    const image_name = `output- ${Date.now()}-${random_id}.png`
    console.log('generated image name:', image_name)
    return image_name
}

async function txt2ImgRequest(payload) {
    console.log('payload:', payload)

    // if(payload['use_prompt_shortcut']){

    //     const prompt_shortcut_dict = prompt_shortcut.load()
    //     prompt_shortcut_dict.update(payload["prompt_shortcut_ui_dict"])
    //     payload['prompt'] = prompt_shortcut.replaceShortcut(payload['prompt'],prompt_shortcut_dict)
    //     # edit negative prompt, replaceShortcut(negative_prompt)
    //     payload['negative_prompt'] = prompt_shortcut.replaceShortcut(payload['negative_prompt'],prompt_shortcut_dict)
    // }
    const endpoint = 'sdapi/v1/txt2img'
    try {
        console.log('txt2ImgRequest(): about to send a fetch request')

        const full_url = `${sd_url}/${endpoint}`
        console.log(full_url)

        let request = await fetch(full_url, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            // "body": payload
        })

        let r = await request.json()
        console.log('txt2ImgRequest json:', r)

        const uniqueDocumentId = payload['uniqueDocumentId']
        // dir_fullpath,dirName = serverHelper.getUniqueDocumentDirPathName(uniqueDocumentId)
        // serverHelper.createFolder(dir_fullpath)
        const image_paths = []

        const metadata = []
        const images_info = []

        for (i of r['images']) {
            // const image = Image.open(
            //     io.BytesIO(base64.b64decode(i.split(',', 1)[0]))
            // )

            const png_payload = {
                image: 'data:image/png;base64,' + i,
            }

            // response2 = await client.post(url=f'{sd_url}/sdapi/v1/png-info', json=png_payload)
            // pnginfo = PngImagePlugin.PngInfo()
            // pnginfo.add_text("parameters", response2.json().get("info"))

            const image_name = newOutputImageName()
            const image_path = `${uniqueDocumentId}/${image_name}`

            // image_path = f'output/{dirName}/{image_name}'
            // image_paths.append(image_path)
            // image.save(f'./{image_path}', pnginfo=pnginfo)

            // metadata_info = response2.json().get("info")
            // metadata_json = metadata_to_json.convertMetadataToJson(metadata_info)
            // metadata.append(metadata_json)

            images_info.push({ base64: i, path: image_path })
            // console.log("metadata_json: ", metadata_json)
        }
        const dir_name = 'temp_dir_name'
        return {
            payload: payload,
            dir_name: dir_name,
            images_info: images_info,
            metadata: metadata,
        }
    } catch (e) {
        console.warn(e)
        return {}
    }

    // const request_path = '/sdapi/v1/txt2img'
}

async function img2ImgRequest(sd_url, payload) {
    console.log('payload:', payload)

    // if(payload['use_prompt_shortcut']){// edit prompt

    //     #edit prompt, replaceShortcut(prompt)
    //     prompt_shortcut_dict = prompt_shortcut.load()
    //     prompt_shortcut_dict.update(payload["prompt_shortcut_ui_dict"])
    //     payload['prompt'] = prompt_shortcut.replaceShortcut(payload['prompt'],prompt_shortcut_dict)
    //     # edit negative prompt, replaceShortcut(negative_prompt)
    //     payload['negative_prompt'] = prompt_shortcut.replaceShortcut(payload['negative_prompt'],prompt_shortcut_dict)
    // }

    // init_img_dir = "./init_images"
    // init_img_name = payload['init_image_name']
    // init_img = Image.open(f"{init_img_dir}/{init_img_name}")
    // init_img_str = img_2_b64(init_img)
    // payload['init_images'] = [init_img_str]

    // init_img_mask_name = payload.get('init_image_mask_name',"")

    // #only if image exist then try to open it
    // if(len(init_img_mask_name) > 0):
    // init_img_mask = Image.open(f"{init_img_dir}/{init_img_mask_name}")

    // if(payload['use_sharp_mask'] == False):# use blurry mask
    // iteration = payload['mask_expansion']
    //         init_img_mask = applyDilation(init_img_mask,iteration)

    //         init_img_mask_str = img_2_b64(init_img_mask)
    //         payload['mask'] = init_img_mask_str #there is only one mask, unlike 'init_images' which is of type array

    // print(type(init_img_str))
    // #request the images to be generated

    const endpoint = 'sdapi/v1/img2img'

    const full_url = `${sd_url}/${endpoint}`
    let request = await fetch(full_url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        // "body": payload
    })

    let r = await request.json()

    console.log('img2ImgRequest json:', r)

    const uniqueDocumentId = payload['uniqueDocumentId']
    // dir_fullpath,dirName = serverHelper.getUniqueDocumentDirPathName(uniqueDocumentId)
    // serverHelper.createFolder(dir_fullpath)
    const image_paths = []
    const metadata = []
    const images_info = []

    for (i of r['images']) {
        // image = Image.open(io.BytesIO(base64.b64decode(i.split(",",1)[0])))

        const png_payload = {
            image: 'data:image/png;base64,' + i,
        }
        // response2 = await client.post(url=f'{sd_url}/sdapi/v1/png-info', json=png_payload, timeout=None)
        // pnginfo = PngImagePlugin.PngInfo()
        // pnginfo.add_text("parameters", response2.json().get("info"))
        // image_name = f'output- {time.time()}.png'
        // image_path = f'output/{dirName}/{image_name}'
        // image_paths.append(image_path)
        // image.save(f'./{image_path}', pnginfo=pnginfo)

        // metadata_info = response2.json().get("info")
        // metadata_json = metadata_to_json.convertMetadataToJson(metadata_info)
        // metadata.append(metadata_json)
        const image_name = newOutputImageName()
        const image_path = `${uniqueDocumentId}/${image_name}`

        images_info.push({ base64: i, path: image_path })
        // print("metadata_json: ", metadata_json)
    }
    const dir_name = 'temp_dir_name'
    // return [dirName, images_info, metadata]
    return {
        payload: payload,
        dir_name: dir_name,
        images_info: images_info,
        metadata: metadata,
    }
}

module.exports = {
    txt2ImgRequest,
    img2ImgRequest,
    sd_url,
}
