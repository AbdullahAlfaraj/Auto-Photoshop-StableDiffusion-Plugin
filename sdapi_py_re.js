const { getDummyBase64, getDummyBase64_2 } = require('./utility/dummy')
const { base64ToBase64Url } = require('./utility/general')
const { getExtensionType } = require('./utility/html_manip')
const py_re = require('./utility/sdapi/python_replacement')
const Enum = require('./enum')
// const control_net = require('./utility/tab/control_net')
const {
    mapPluginSettingsToControlNet,
    getEnableControlNet,
    getModuleDetail,
} = require('./utility/tab/control_net')

const api = require('./utility/api')
//javascript plugin can't read images from local directory so we send a request to local server to read the image file and send it back to plugin as image string base64

//REFACTOR: move this function to io.js
async function requestSavePng(base64_image, image_name) {
    try {
        console.log('requestSavePng():')

        const uniqueDocumentId = await getUniqueDocumentId()
        const folder = `${uniqueDocumentId}/init_images`
        const init_entry = await getInitImagesDir()
        saveFileInSubFolder(base64_image, folder, image_name)
        console.warn('this function is deprecated')
    } catch (e) {
        console.warn(e)
        return {}
    }
}
async function requestTxt2Img(payload) {
    try {
        console.log('requestTxt2Img(): about to send a fetch request')

        let json = await py_re.txt2ImgRequest(payload)
        console.log('requestTxt2Img json:', json)

        return json
    } catch (e) {
        console.warn(e)
        return {}
    }
}

async function requestImg2Img(payload) {
    console.log('requestImg2Img(): about to send a fetch request')
    try {
        let json = await py_re.img2ImgRequest(g_sd_url, payload)
        console.log('requestImg2Img json:')
        console.dir(json)

        return json
    } catch (e) {
        console.warn(e)
        return {}
    }
}

async function requestProgress() {
    let json = {}
    try {
        console.log('requestProgress: ')

        const full_url = `${g_sd_url}/sdapi/v1/progress?skip_current_image=false`
        let request = await fetch(full_url)
        json = await request.json()
        console.log('progress json:', json)

        return json
    } catch (e) {
        console.warn(e)
        // console.log('json: ', json)
    }
}

async function requestGetModels() {
    console.log('requestGetModels: ')
    let json = []
    const full_url = `${g_sd_url}/sdapi/v1/sd-models`
    try {
        let request = await fetch(full_url)
        json = await request.json()
        console.log('models json:')
        console.dir(json)
    } catch (e) {
        console.warn(`issues requesting from ${full_url}`, e)
    }
    return json
}

async function requestGetSamplers() {
    let json = null
    try {
        console.log('requestGetSamplers: ')

        const full_url = `${g_sd_url}/sdapi/v1/samplers`
        let request = await fetch(full_url)
        json = await request.json()
        console.log('samplers json:', json)
    } catch (e) {
        console.warn(e)
    }
    return json
}

async function requestSwapModel(model_title) {
    console.log('requestSwapModel: ')

    const full_url = `${g_sd_url}/sdapi/v1/options`
    payload = {
        sd_model_checkpoint: model_title,
    }
    let request = await fetch(full_url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })

    let json = await request.json()

    console.log('models json:')
    console.dir(json)

    return json
}

async function requestInterrupt() {
    const full_url = `${g_sd_url}/sdapi/v1/interrupt`
    try {
        console.log('requestInterrupt: ')

        payload = ''
        let request = await fetch(full_url, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            // body: JSON.stringify(payload)
            // "body": payload
        })

        console.log('interrupt request:', request)
        let json = await request.json()

        return json
    } catch (e) {
        console.warn(e)
    }
}

async function getVersionRequest() {
    console.log('requestGetSamplers: ')
    const current_version = g_version

    return current_version
}

async function changeSdUrl(new_sd_url) {
    // version = "v0.0.0"
    console.log('changeSdUrl: new_sd_url:', new_sd_url)
    try {
        payload = {
            sd_url: new_sd_url,
        }

        // const full_url = `${g_sd_url}/sd_url/`
        // console.log('changeSdUrl: payload: ', payload)
        // let request = await fetch(full_url, {
        //     method: 'POST',
        //     headers: {
        //         Accept: 'application/json',
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify(payload),
        // })

        g_sd_url = new_sd_url
        // console.log('changeSdUrl: request: ', request)
    } catch (e) {
        console.warn(e)
    }
}

// function printTheJSONInPrettyFormat(json) {
//   // var badJSON = document.getElementById('prettyJSONFormat').value;
//   // var parseJSON = JSON.parse(badJSON);
//   // var JSONInPrettyFormat = JSON.stringify(json, undefined, 4);
//   // return
// }
async function loadHistory(uniqueDocumentId) {
    let json = {}
    try {
        payload = {
            uniqueDocumentId: uniqueDocumentId,
        }
        json = await py_re.loadHistory(payload)
    } catch (e) {
        console.warn(e)
    }

    return [json['image_paths'], json['metadata_jsons'], json['base64_images']]
}
async function loadPromptShortcut() {
    let prompt_shortcut_json = {}
    try {
        prompt_shortcut_json = await py_re.loadPromptShortcut(
            'prompt_shortcut.json'
        )
        console.log('loadPromptShortcut:', prompt_shortcut_json)
        // console.log('loadPromptShortcut: request: ',request)
    } catch (e) {
        console.warn(e)
        prompt_shortcut_json = {}
    }
    return prompt_shortcut_json
    // return json['prompt_shortcut']
}

async function savePromptShortcut(prompt_shortcut) {
    let json = prompt_shortcut
    try {
        await py_re.savePromptShortcut(json, 'prompt_shortcut.json')
        console.log('savePromptShortcut:', json)
        // console.log('loadPromptShortcut: request: ',request)
    } catch (e) {
        console.warn(e)
    }

    return json['prompt_shortcut']
}
async function setInpaintMaskWeight(value) {
    const full_url = `${g_sd_url}/sdapi/v1/options`
    try {
        const payload = {
            inpainting_mask_weight: value,
        }
        await fetch(full_url, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })
    } catch (e) {
        console.warn(e)
    }
}

async function requestGetConfig() {
    console.log('requestGetConfig: ')
    let json = []
    const full_url = `${g_sd_url}/config`
    try {
        let request = await fetch(full_url)
        json = await request.json()
        console.log('models json:')
        console.dir(json)
    } catch (e) {
        console.warn(`issues requesting from ${full_url}`, e)
    }
    return json
}
async function requestGetOptions() {
    console.log('requestGetOptions: ')
    let json = null
    const full_url = `${g_sd_url}/sdapi/v1/options`
    try {
        let request = await fetch(full_url)
        if (request.status === 404) {
            return null
        }

        json = await request.json()
        console.log('models json:')
        console.dir(json)
    } catch (e) {
        console.warn(`issues requesting from ${full_url}`, e)
    }
    return json
}

async function imageSearch(keywords) {
    let json = {}
    const extension_url = py_re.getExtensionUrl()

    const full_url = `${extension_url}/search/image/`
    try {
        payload = {
            keywords: keywords,
        }

        let request = await fetch(full_url, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        json = await request.json()
        console.log('imageSearch:', json)

        return json['images']
    } catch (e) {
        console.warn(e)
    }
    return []
}

// async function requestHorde(payload) {
//     payload = {
//         prompt: 'string',
//         params: {
//             sampler_name: 'k_lms',
//             toggles: [1, 4],
//             cfg_scale: 5,
//             denoising_strength: 0.75,
//             seed: 'string',
//             height: 512,
//             width: 512,
//             seed_variation: 1,
//             post_processing: ['GFPGAN'],
//             karras: false,
//             tiling: false,
//             steps: 30,
//             n: 1,
//         },
//         nsfw: false,
//         trusted_workers: true,
//         censor_nsfw: false,
//         workers: ['4c79ab19-8e6c-4054-83b3-773b7ce71ece'],
//         models: ['stable_diffusion'],
//         // source_image: 'string',
//         // source_processing: 'img2img',
//         // source_mask: 'string',
//         r2: true,
//         shared: false,
//     }
//     try {
//         console.log('requestHorde():')

//         const full_url = 'https://stablehorde.net/api/v2/generate/async'
//         // const full_url = 'https://stablehorde.net/api/v2/generate/sync'
//         console.log(full_url)

//         let request = await fetch(full_url, {
//             method: 'POST',
//             headers: {
//                 Accept: 'application/json',
//                 'Content-Type': 'application/json',
//                 apikey: '0000000000',
//                 // 'Client-Agent': '4c79ab19-8e6c-4054-83b3-773b7ce71ece',
//                 'Client-Agent': 'unknown:0:unknown',
//             },
//             body: JSON.stringify(payload),
//         })

//         let json = await request.json()
//         console.log('requestHorde json:', json)

//         return json
//     } catch (e) {
//         console.warn(e)
//         return {}
//     }
// }
// async function requestHordeCheck(id) {
//     try {
//         console.log('requestHordeCheck():')
//         const base_url = 'https://stablehorde.net/api/v2/generate/check'

//         const full_url = `${base_url}/${id}`
//         // const full_url = 'https://stablehorde.net/api/v2/generate/sync'
//         console.log(full_url)
//         const payload = {}
//         let request = await fetch(full_url, {
//             method: 'GET',
//             headers: {
//                 Accept: 'application/json',
//                 'Content-Type': 'application/json',
//                 // 'Client-Agent': '4c79ab19-8e6c-4054-83b3-773b7ce71ece',
//                 'Client-Agent': 'unknown:0:unknown',
//             },
//         })

//         let json = await request.json()
//         console.log('requestHordeCheck json:', json)

//         return json
//     } catch (e) {
//         console.warn(e)
//         return {}
//     }
// }

// async function requestHordeStatus(id) {
//     try {
//         console.log('requestHordeStatus():')
//         const base_url = 'https://stablehorde.net/api/v2/generate/status'

//         const full_url = `${base_url}/${id}`
//         // const full_url = 'https://stablehorde.net/api/v2/generate/sync'
//         console.log(full_url)
//         const payload = {}
//         let request = await fetch(full_url, {
//             method: 'GET',
//             headers: {
//                 Accept: 'application/json',
//                 'Content-Type': 'application/json',
//                 // 'Client-Agent': '4c79ab19-8e6c-4054-83b3-773b7ce71ece',
//                 'Client-Agent': 'unknown:0:unknown',
//             },
//         })

//         let json = await request.json()
//         console.log('requestHordeStatus json:', json)

//         return json
//     } catch (e) {
//         console.warn(e)
//         return {}
//     }
// }

async function requestExtraSingleImage(payload) {
    console.log('requestExtraSingleImage(): about to send a fetch request')
    try {
        let json = await py_re.extraSingleImageRequest(g_sd_url, payload)
        console.log('requestExtraSingleImage json:')
        console.dir(json)

        return json
    } catch (e) {
        console.warn(e)
        return {}
    }
}

async function requestGetUpscalers() {
    console.log('requestGetUpscalers: ')
    let json = []
    const full_url = `${g_sd_url}/sdapi/v1/upscalers`
    try {
        let request = await fetch(full_url)
        json = await request.json()
        console.log('upscalers json:')
        console.dir(json)
    } catch (e) {
        console.warn(`issues requesting from ${full_url}`, e)
    }
    return json
}

//REFACTOR: reuse the same code for (requestControlNetTxt2Img,requestControlNetImg2Img)
async function requestControlNetTxt2Img(plugin_settings) {
    console.log('requestControlNetTxt2Img: ')

    // const full_url = `${g_sd_url}/controlnet/txt2img`
    const full_url = `${g_sd_url}/sdapi/v1/txt2img`

    const control_net_settings = mapPluginSettingsToControlNet(plugin_settings)
    let control_networks = []
    // let active_control_networks = 0
    for (let index = 0; index < g_controlnet_max_models; index++) {
        if (!getEnableControlNet(index)) {
            control_networks[index] = false
            continue
        }
        control_networks[index] = true

        if (!control_net_settings['controlnet_units'][index]['input_image']) {
            app.showAlert('you need to add a valid ControlNet input image')
            throw 'you need to add a valid ControlNet input image'
        }

        if (!control_net_settings['controlnet_units'][index]['module']) {
            app.showAlert('you need to select a valid ControlNet Module')
            throw 'you need to select a valid ControlNet Module'
        }
        if (
            !control_net_settings['controlnet_units'][index]['model'] &&
            !getModuleDetail()[
                control_net_settings['controlnet_units'][index]['module']
            ].model_free
        ) {
            app.showAlert('you need to select a valid ControlNet Model')
            throw 'you need to select a valid ControlNet Model'
        }
        // active_control_networks++
    }

    let request = await fetch(full_url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(control_net_settings),
    })

    let json = await request.json()
    console.log('json:', json)

    //update the mask in controlNet tab
    const numOfImages = json['images'].length
    let numberOfAnnotations =
        numOfImages - g_generation_session.last_settings.batch_size
    if (numberOfAnnotations < 0) numberOfAnnotations = 0

    const base64_mask = json['images'].slice(numOfImages - numberOfAnnotations)

    let mask_index = 0

    for (let index = 0; index < control_networks.length; index++) {
        if (
            control_networks[index] == false ||
            mask_index >= numberOfAnnotations
        )
            continue
        html_manip.setControlMaskSrc(
            base64ToBase64Url(base64_mask[mask_index]),
            index
        )
        g_generation_session.controlNetMask[index] = base64_mask[mask_index]
        mask_index++
    }
    // g_generation_session.controlNetMask = base64_mask

    const standard_response = await py_re.convertToStandardResponse(
        control_net_settings,
        json['images'].slice(0, numOfImages - numberOfAnnotations),
        plugin_settings['uniqueDocumentId']
    )
    console.log('standard_response:', standard_response)

    return standard_response
}

//REFACTOR: reuse the same code for (requestControlNetTxt2Img,requestControlNetImg2Img)
async function requestControlNetImg2Img(plugin_settings) {
    console.log('requestControlNetImg2Img: ')

    const full_url = `${g_sd_url}/sdapi/v1/img2img`
    const control_net_settings = mapPluginSettingsToControlNet(plugin_settings)

    // let control_networks = 0
    let control_networks = []
    for (let index = 0; index < g_controlnet_max_models; index++) {
        if (!getEnableControlNet(index)) {
            control_networks[index] = false
            continue
        }
        control_networks[index] = true
        if (!control_net_settings['controlnet_units'][index]['input_image']) {
            app.showAlert('you need to add a valid ControlNet input image')
            throw 'you need to add a valid ControlNet input image'
        }

        if (!control_net_settings['controlnet_units'][index]['module']) {
            app.showAlert('you need to select a valid ControlNet Module')
            throw 'you need to select a valid ControlNet Module'
        }
        if (
            !control_net_settings['controlnet_units'][index]['model'] &&
            !getModuleDetail()[
                control_net_settings['controlnet_units'][index]['module']
            ].model_free
        ) {
            app.showAlert('you need to select a valid ControlNet Model')
            throw 'you need to select a valid ControlNet Model'
        }
    }

    let request = await fetch(full_url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(control_net_settings),
        // body: JSON.stringify(payload),
    })

    let json = await request.json()
    console.log('json:', json)

    //update the mask in controlNet tab
    const numOfImages = json['images'].length
    let numberOfAnnotations =
        numOfImages - g_generation_session.last_settings.batch_size
    if (numberOfAnnotations < 0) numberOfAnnotations = 0

    // To fix a bug: when Ultimate SD Upscale is active and running, the detection maps won’t be retrieved.
    // So set its value to 0 to avoid the result images being loaded in the annotation map interface.
    if (
        scripts.script_store.isInstalled() &&
        scripts.script_store.is_active &&
        scripts.script_store.selected_script_name !== 'None' &&
        scripts.script_store.is_selected_script_available
    ) {
        numberOfAnnotations = 0
    }
    const base64_mask = json['images'].slice(numOfImages - numberOfAnnotations)

    let mask_index = 0
    for (let index = 0; index < control_networks.length; index++) {
        if (
            control_networks[index] == false ||
            mask_index >= numberOfAnnotations
        )
            continue
        html_manip.setControlMaskSrc(
            base64ToBase64Url(base64_mask[mask_index]),
            index
        )
        g_generation_session.controlNetMask[index] = base64_mask[mask_index]
        mask_index++
    }

    // g_generation_session.controlNetMask = base64_mask

    const standard_response = await py_re.convertToStandardResponse(
        control_net_settings,
        json['images'].slice(0, numOfImages - numberOfAnnotations),
        plugin_settings['uniqueDocumentId']
    )
    console.log('standard_response:', standard_response)

    // //get all images except last because it's the mask
    // for (const image of json['images'].slice(0, -1)) {
    //     await io.IO.base64ToLayer(image)
    // }

    return standard_response
}

async function isWebuiRunning() {
    console.log('isWebuiRunning: ')
    let json = []
    const full_url = `${g_sd_url}/user`
    try {
        let request = await fetch(full_url)
        json = await request.json()
        console.log('json:')
        console.dir(json)
    } catch (e) {
        console.warn(`issues requesting from ${full_url}`, e)
        return false
    }
    return true
}
async function requestLoraModels() {
    const full_url = `${g_sd_url}/sdapi/v1/loras`
    const lora_models = (await api.requestGet(full_url)) ?? []
    return lora_models
}
module.exports = {
    requestTxt2Img,
    requestImg2Img,

    requestProgress,
    requestGetModels,
    requestSwapModel,
    requestInterrupt,
    requestGetSamplers,
    getVersionRequest,
    changeSdUrl,
    loadPromptShortcut,
    savePromptShortcut,
    loadHistory,
    setInpaintMaskWeight,
    requestGetConfig,
    requestGetOptions,
    imageSearch,
    requestSavePng,
    // requestHorde,
    // requestHordeCheck,
    // requestHordeStatus,
    requestExtraSingleImage,
    requestGetUpscalers,
    requestControlNetTxt2Img,
    requestControlNetImg2Img,
    isWebuiRunning,
    requestLoraModels,
}
