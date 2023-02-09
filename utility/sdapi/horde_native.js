const general = require('../general')
const psapi = require('../../psapi')
const html_manip = require('../html_manip')
function getDummyBase64() {
    const b64Image =
        'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAIAAADTED8xAAADMElEQVR4nOzVwQnAIBQFQYXff81RUkQCOyDj1YOPnbXWPmeTRef+/3O/OyBjzh3CD95BfqICMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMO0TAAD//2Anhf4QtqobAAAAAElFTkSuQmCC'
    return b64Image
}
class hordeGenerator {
    //horde generation process:
    //*) get the settings
    //*) get send request
    //*) wait for response
    //*) load the image to the canvas
    //*) move and scale image to the selection
    //*) save the image to history/data folder
    //*) load the image data into the plugin / viewer tab
    //*)

    //other options:
    //*)interrupt the generation process
    //*)cancel the generation process on error

    constructor() {
        this.horde_settings
        this.plugin_settings
        this.currentGenerationResult = null
        this.requestStatus = null
        this.isProcessHordeResultCalled = false
        this.maxWaitTime = 0
        this.waiting = 0
        this.isCanceled = false
    }

    async getSettings() {
        const workers = await getWorkers()

        const workers_ids = getWorkerID(workers)
        const settings = await getSettings()
        this.plugin_settings = settings
        let payload = mapPluginSettingsToHorde(settings)
        payload['workers'] = workers_ids

        this.horde_settings = payload
        return this.horde_settings
    }

    async generateRequest(settings) {
        try {
            g_id = null //reset request_id
            this.requestStatus = await requestHorde(settings)
            g_id = this.requestStatus.id
            console.log(
                'generateRequest this.requestStatus: ',
                this.requestStatus
            )

            await this.startCheckingProgress()
        } catch (e) {
            g_id = null
            console.warn(e)
        }
    }
    async generate() {
        //*) get the settings
        this.horde_settings = await this.getSettings()
        //*) send generateRequest() and trigger the progress bar update
        this.isCanceled = false
        await this.generateRequest(this.horde_settings)
        //*) store the generation result in the currentGenerationResult

        //*) return the generation currentGenerationResult
    }

    isValidGeneration() {
        if (this.currentGenerationResult) {
            return true // if true if valid, false otherwise
        } else {
            return false
        }
    }
    preGenerate() {}

    async layerToBase64ToFile(layer, document_name, image_name) {
        const width = html_manip.getWidth()
        const height = html_manip.getHeight()
        const image_buffer = await psapi.newExportPng(
            layer,
            image_name,
            width,
            height
        )

        const base64_image = _arrayBufferToBase64(image_buffer) //convert the buffer to base64
        //send the base64 to the server to save the file in the desired directory
        // await sdapi.requestSavePng(base64_image, image_name)
        await saveFileInSubFolder(base64_image, document_name, image_name)
        return base64_image
    }
    async toSession(images_info) {
        try {
            //images_info[0] = {path:path,base64:base64png}
            // let last_images_paths = await silentImagesToLayersExe(images_info)
            let last_images_paths = {}
            for (const image_info of images_info) {
                const path = image_info['path']
                // const base64_image = image_info['base64']
                const layer = image_info['layer']
                const [document_name, image_name] = path.split('/')

                // await saveFileInSubFolder(base64_image, document_name, image_name)
                image_info['base64'] = await this.layerToBase64ToFile(
                    layer,
                    document_name,
                    image_name
                )
                const json_file_name = `${image_name.split('.')[0]}.json`
                this.plugin_settings['auto_metadata'] =
                    image_info?.auto_metadata

                g_generation_session.base64OutputImages[path] =
                    image_info['base64']
                await saveJsonFileInSubFolder(
                    this.plugin_settings,
                    document_name,
                    json_file_name
                ) //save the settings
                last_images_paths[path] = image_info['layer']
            }

            if (g_generation_session.isFirstGeneration) {
                //store them in the generation session for viewer manager to use
                g_generation_session.image_paths_to_layers = last_images_paths
            } else {
                g_generation_session.image_paths_to_layers = {
                    ...g_generation_session.image_paths_to_layers,
                    ...last_images_paths,
                }
                // g_number_generation_per_session++
            }
        } catch (e) {
            console.warn(e)
        }
    }

    async interruptRequest() {
        try {
            console.log('interruptRquest():')

            const full_url = `https://stablehorde.net/api/v2/generate/status/${g_id}`

            console.log(full_url)

            let response = await fetch(full_url, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    apikey: '0000000000',
                    // 'Client-Agent': '4c79ab19-8e6c-4054-83b3-773b7ce71ece',
                    'Client-Agent': 'unknown:0:unknown',
                },
            })

            let result = await response.json()
            console.log('interruptReqquest result:', result)

            return result
        } catch (e) {
            console.warn(e)
            return
        }
    }
    async interrupt() {
        try {
            html_manip.updateProgressBarsHtml(0)
            this.isCanceled = true
            g_interval_id = clearInterval(g_interval_id)
            await this.interruptRequest()
        } catch (e) {
            console.warn(e)
        }
    }
    async postGeneration() {
        toggleTwoButtonsByClass(false, 'btnGenerateClass', 'btnInterruptClass')
    }
    async processHordeResult() {
        //*) get the result from the horde server
        //*) save them locally to output directory
        //*) import them into the canvas
        //*) resize and move the layers to fit the selection
        //*) return the results to be stored and processed by the g_generation_session
        try {
            if (this.isProcessHordeResultCalled) {
                return
            }
            this.isProcessHordeResultCalled = true
            console.log('horde request is done')
            // g_b_request_result = true
            const temp_id = g_id //g_id will reset
            // cancelRequestClientSide()
            g_horde_generation_result = await requestHordeStatus(temp_id)

            const generations = g_horde_generation_result.generations
            const writeable_entry = await getCurrentDocFolder()
            const images_info = [] //{path:image_path,base64:}
            for (const image_horde_container of generations) {
                try {
                    const url = image_horde_container.img
                    const image_file_name = general.newOutputImageName('webp')

                    const image_layer = await downloadItExe(
                        url,
                        writeable_entry,
                        image_file_name
                    ) //
                    const image_png_file_name =
                        general.convertImageNameToPng(image_file_name)

                    const uuid = await getUniqueDocumentId()
                    const image_path = `${uuid}/${image_png_file_name}` //this is the png path
                    images_info.push({
                        path: image_path,
                        base64: getDummyBase64(),
                        layer: image_layer,
                    })
                    await psapi.layerToSelection(
                        g_generation_session.selectionInfo
                    ) //TODO: create a safe layerToSelection function
                } catch (e) {
                    console.warn(e)
                }
            }
            this.isProcessHordeResultCalled = false //reset for next generation
            return images_info
        } catch (e) {
            console.warn(e)
        }
    }
    async startCheckingProgress() {
        if (!g_interval_id && g_id) {
            g_interval_id = setInterval(async () => {
                try {
                    if (this.isCanceled) {
                        html_manip.updateProgressBarsHtml(0)
                        return
                    }
                    const check_json = await requestHordeCheck(g_id)

                    //update the progress bar proceduer
                    console.log('this.maxWaitTime: ', this.maxWaitTime)
                    console.log(
                        "check_json['wait_time']: ",
                        check_json['wait_time']
                    )
                    console.log(
                        "check_json['waiting']: ",
                        check_json['waiting']
                    )

                    this.maxWaitTime = Math.max(
                        check_json['wait_time'],
                        this.maxWaitTime
                    ) // return the max time value, so we could use to calculate the complection percentage
                    const delta_time =
                        this.maxWaitTime - check_json['wait_time']

                    if (
                        isNaN(this.maxWaitTime) ||
                        parseInt(this.maxWaitTime) === 0
                    ) {
                        this.maxWaitTime = 0 // reset to zero
                    } else {
                        const completion_percentage =
                            (delta_time / this.maxWaitTime) * 100

                        html_manip.updateProgressBarsHtml(completion_percentage)
                    }

                    //

                    if (
                        check_json['done'] &&
                        g_interval_id
                        // !g_b_request_result
                    ) {
                        g_interval_id = clearInterval(g_interval_id)

                        const images_info = await this.processHordeResult()

                        await this.toSession(images_info)
                        html_manip.updateProgressBarsHtml(0) // reset progress bar

                        await psapi.reSelectMarqueeExe(
                            g_generation_session.selectionInfo
                        )
                        //update the viewer
                        await this.postGeneration()
                        await loadViewerImages()
                    }
                } catch (e) {
                    console.warn(e)
                }
            }, 3000)
        }
    }
}
const webui_to_horde_samplers = {
    'Euler a': 'k_euler_a',
    Euler: 'k_euler',
    LMS: 'k_lms',
    Heun: 'k_heun',
    DPM2: 'k_dpm_2',
    'DPM2 a': 'k_dpm_2_a',
    'DPM++ 2S a': 'k_dpmpp_2s_a',
    'DPM++ 2M': 'k_dpmpp_2m',
    'DPM++ SDE': 'k_dpmpp_sde',
    'DPM fast': 'k_dpm_fast',
    'DPM adaptive': 'k_dpm_adaptive',
    'LMS Karras': 'k_lms',
    'DPM2 Karras': 'k_dpm_2',
    'DPM2 a Karras': 'k_dpm_2_a',
    'DPM++ 2S a Karras': 'k_dpmpp_2s_a',
    'DPM++ 2M Karras': 'k_dpmpp_2m',
    'DPM++ SDE Karras': 'k_dpmpp_sde',
    DDIM: 'ddim',
    PLMS: 'plms',
}

//get workers
//select a worker
//send a request => requestHorde(horde_settings)
//check for progress => requestHordeCheck(request_id)
//when progress is full, request the result => requestHordeStatus(request_id)

function mapPluginSettingsToHorde(plugin_settings) {
    const { getModelHorde } = require('../sd_scripts/horde')
    const ps = plugin_settings // for shortness
    const sampler = webui_to_horde_samplers[ps['sampler_index']]
    const model = getModelHorde()
    let horde_prompt
    if (ps['negative_prompt'].length > 0) {
        horde_prompt = `${ps['prompt']} ### ${ps['negative_prompt']}`
    } else {
        horde_prompt = ps['prompt'] //no negative prompt
    }
    let horde_payload = {
        prompt: horde_prompt,
        params: {
            sampler_name: sampler,
            toggles: [1, 4],
            cfg_scale: ps['cfg_scale'],
            denoising_strength: ps['denoising_strength'],
            // seed: 'string',
            height: ps['height'],
            width: ps['width'],
            seed_variation: 1,
            post_processing: ['GFPGAN'],
            karras: false,
            tiling: false,
            steps: parseInt(ps['steps']),
            n: 1,
        },
        nsfw: false,
        trusted_workers: true,
        censor_nsfw: false,
        // workers: ['4c79ab19-8e6c-4054-83b3-773b7ce71ece'],
        // workers: workers_ids,
        // models: ['stable_diffusion'],
        models: [model],
        // source_image: 'string',
        // source_processing: 'img2img',
        // source_mask: 'string',
        r2: true,
        shared: false,
    }
    return horde_payload
}

function getWorkerID(workers_json) {
    let workers_ids = []
    for (worker of workers_json) {
        workers_ids.push(worker?.id)
    }
    console.log('workers_ids:', workers_ids)

    return workers_ids
}
async function getWorkers() {
    const full_url = 'https://stablehorde.net/api/v2/workers'
    // const full_url = 'https://stablehorde.net/api/v2/generate/sync'
    console.log(full_url)

    let request = await fetch(full_url, {
        method: 'GET',
        headers: {
            Accept: 'application/json',
        },
    })

    let workers = await request.json()
    // const workers_ids = getWorkerID(workers)
    console.log('requestHorde workers:', workers)
    return workers
}
async function requestHorde(payload) {
    // const workers = await getWorkers()

    // const workers_ids = getWorkerID(workers)
    // const settings = await getSettings()
    // payload = mapPluginSettingsToHorde(settings)
    // payload['workers'] = workers_ids
    // payload = {
    //     prompt: 'string',
    //     params: {
    //         sampler_name: 'k_lms',
    //         toggles: [1, 4],
    //         cfg_scale: 5,
    //         denoising_strength: 0.75,
    //         // seed: 'string',
    //         height: 512,
    //         width: 512,
    //         seed_variation: 1,
    //         post_processing: ['GFPGAN'],
    //         karras: false,
    //         tiling: false,
    //         steps: 5,
    //         n: 1,
    //     },
    //     nsfw: false,
    //     trusted_workers: true,
    //     censor_nsfw: false,
    //     // workers: ['4c79ab19-8e6c-4054-83b3-773b7ce71ece'],
    //     workers: workers_ids,
    //     models: ['stable_diffusion'],
    //     // source_image: 'string',
    //     // source_processing: 'img2img',
    //     // source_mask: 'string',
    //     r2: true,
    //     shared: false,
    // }
    try {
        console.log('requestHorde():')

        const full_url = 'https://stablehorde.net/api/v2/generate/async'
        // const full_url = 'https://stablehorde.net/api/v2/generate/sync'
        console.log(full_url)

        let request = await fetch(full_url, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                apikey: '0000000000',
                // 'Client-Agent': '4c79ab19-8e6c-4054-83b3-773b7ce71ece',
                'Client-Agent': 'unknown:0:unknown',
            },
            body: JSON.stringify(payload),
        })

        let json = await request.json()
        console.log('requestHorde json:', json)

        return json
    } catch (e) {
        console.warn(e)
        return {}
    }
}
async function requestHordeCheck(id) {
    try {
        console.log('requestHordeCheck():')
        const base_url = 'https://stablehorde.net/api/v2/generate/check'

        const full_url = `${base_url}/${id}`
        // const full_url = 'https://stablehorde.net/api/v2/generate/sync'
        console.log(full_url)
        const payload = {}
        let request = await fetch(full_url, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                // 'Client-Agent': '4c79ab19-8e6c-4054-83b3-773b7ce71ece',
                'Client-Agent': 'unknown:0:unknown',
            },
        })

        let json = await request.json()
        console.log('requestHordeCheck json:', json)

        return json
    } catch (e) {
        console.warn(e)
        return {}
    }
}

async function requestHordeStatus(id) {
    try {
        console.log('requestHordeStatus():')
        const base_url = 'https://stablehorde.net/api/v2/generate/status'

        const full_url = `${base_url}/${id}`
        // const full_url = 'https://stablehorde.net/api/v2/generate/sync'
        console.log(full_url)
        const payload = {}
        let request = await fetch(full_url, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                // 'Client-Agent': '4c79ab19-8e6c-4054-83b3-773b7ce71ece',
                'Client-Agent': 'unknown:0:unknown',
            },
        })

        let json = await request.json()
        console.log('requestHordeStatus json:', json)

        return json
    } catch (e) {
        console.warn(e)
    }
}

let g_interval_id
let g_id
let g_horde_generation_result
let g_b_request_result = false
function cancelRequestClientSide() {
    g_interval_id = clearInterval(g_interval_id)
    g_id = null
    g_b_request_result = false
}

// async function processHordeResult() {
//     try {
//         const check_json = await requestHordeCheck(g_id)
//         if (
//             check_json['done'] &&
//             g_interval_id
//             // !g_b_request_result
//         ) {
//             clearInterval(g_interval_id)
//             console.log('horde request is done')
//             // g_b_request_result = true
//             const temp_id = g_id //g_id will reset
//             // cancelRequestClientSide()
//             g_horde_generation_result = await requestHordeStatus(temp_id)

//             const generations = g_horde_generation_result.generations
//             const writeable_entry = await getCurrentDocFolder()
//             for (image_horde_container of generations) {
//                 try {
//                     const url = image_horde_container.img
//                     image_file_name = general.newOutputImageName('webp')
//                     const image_layer = await downloadItExe(
//                         url,
//                         writeable_entry,
//                         image_file_name
//                     ) //

//                     await psapi.layerToSelection(
//                         g_generation_session.selectionInfo
//                     ) //TODO: create a safe layerToSelection function
//                 } catch (e) {
//                     console.warn(e)
//                 }
//             }
//         }
//     } catch (e) {
//         console.warn(e)
//     }
// }
// async function startCheckingProgress() {
//     if (!g_interval_id && g_id) {
//         g_interval_id = setInterval(async () => {
//             await processHordeResult()
//         }, 3000)
//     }
// }

module.exports = {
    // requestHorde,
    // requestHordeCheck,
    // requestHordeStatus,
    // requestHordeMain,
    // getWorkers,
    hordeGenerator,
}
