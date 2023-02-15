const general = require('../general')
const psapi = require('../../psapi')
const html_manip = require('../html_manip')
const layer_util = require('../layer')
function getDummyBase64() {
    const b64Image =
        'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAIAAADTED8xAAADMElEQVR4nOzVwQnAIBQFQYXff81RUkQCOyDj1YOPnbXWPmeTRef+/3O/OyBjzh3CD95BfqICMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMK0CMO0TAAD//2Anhf4QtqobAAAAAElFTkSuQmCC'
    return b64Image
}
function getDummyWebpBase64() {
    // const b64ImageWebp = `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`
    const b64webp = `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`
    return b64webp
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
        this.horde_id = null
        this.last_horde_id = null
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

    /**
     * @returns {json}{payload, dir_name, images_info, metadata}
     */
    async generateRequest(settings) {
        try {
            this.horde_id = null //reset request_id
            this.requestStatus = await requestHorde(settings)
            this.horde_id = this.requestStatus.id
            console.log(
                'generateRequest this.requestStatus: ',
                this.requestStatus
            )

            const images_info = await this.startCheckingProgress()
            const result = await this.toGenerationFormat(images_info)
            console.warn('generateRequest() images_info: ', images_info)
            console.warn('generateRequest() result: ', result)

            html_manip.updateProgressBarsHtml(0) // reset progress bar
            return result
        } catch (e) {
            this.horde_id = null
            console.warn(e)
        }
    }
    async generate() {
        //*) get the settings
        this.horde_settings = await this.getSettings()
        //*) send generateRequest() and trigger the progress bar update
        this.isCanceled = false
        const result = await this.generateRequest(this.horde_settings)

        return result
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
    // async layerToBase64WebpToFile
    //convert layer to .webp file
    //read the .webp file as buffer data base64 .webp
    async layerToBase64Webp(layer, document_name, image_name) {
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

    async toGenerationFormat(images_info) {
        //convert the output of native horde generation to the values that generate() can use
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

                // delete the layer made by the webp image.
                await layer_util.deleteLayers([layer])
                // await layer.delete()

                // const json_file_name = `${image_name.split('.')[0]}.json`
                this.plugin_settings['auto_metadata'] =
                    image_info?.auto_metadata

                // g_generation_session.base64OutputImages[path] =
                //     image_info['base64']
                // await saveJsonFileInSubFolder(
                //     this.plugin_settings,
                //     document_name,
                //     json_file_name
                // ) //save the settings
                // last_images_paths[path] = image_info['layer']
                // images_info.push({
                //     base64: i,
                //     path: image_path,
                //     auto_metadata: auto_metadata_json,
                // })
                // // console.log("metadata_json: ", metadata_json)
            }

            // if (g_generation_session.isFirstGeneration) {
            //     //store them in the generation session for viewer manager to use
            //     g_generation_session.image_paths_to_layers = last_images_paths
            // } else {
            //     g_generation_session.image_paths_to_layers = {
            //         ...g_generation_session.image_paths_to_layers,
            //         ...last_images_paths,
            //     }
            //     // g_number_generation_per_session++

            // }
            const dir_name = 'temp_dir_name'
            return {
                // payload: payload,
                dir_name: dir_name,
                images_info: images_info,
                metadata: this.plugin_settings,
            }
        } catch (e) {
            console.warn(e)
        }
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

            const full_url = `https://stablehorde.net/api/v2/generate/status/${this.horde_id}`

            console.log(full_url)

            let response = await fetch(full_url, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
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
            g_interval_id = clearTimeout(g_interval_id)
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
            const temp_id = this.horde_id //this.horde_id will reset
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
                    ) //download the image from url, it works even with .webp format
                    const image_png_file_name =
                        general.convertImageNameToPng(image_file_name)

                    const uuid = await getUniqueDocumentId()
                    const image_path = `${uuid}/${image_png_file_name}` //this is the png path
                    images_info.push({
                        path: image_path,
                        base64: getDummyBase64(), //TODO:change this to the base64_png
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
    updateHordeProgressBar(check_horde_status) {
        //update the progress bar proceduer
        console.log('this.maxWaitTime: ', this.maxWaitTime)
        console.log(
            "check_horde_status['wait_time']: ",
            check_horde_status['wait_time']
        )
        console.log(
            "check_horde_status['waiting']: ",
            check_horde_status['waiting']
        )

        this.maxWaitTime = Math.max(
            check_horde_status['wait_time'],
            this.maxWaitTime
        ) // return the max time value, so we could use to calculate the complection percentage
        const delta_time = this.maxWaitTime - check_horde_status['wait_time']

        if (isNaN(this.maxWaitTime) || parseInt(this.maxWaitTime) === 0) {
            this.maxWaitTime = 0 // reset to zero
        } else {
            console.log('delta_time:', delta_time)
            console.log('this.maxWaitTime:', this.maxWaitTime)

            const completion_percentage = (delta_time / this.maxWaitTime) * 100
            console.log('completion_percentage:', completion_percentage)

            html_manip.updateProgressBarsHtml(completion_percentage)
        }
    }
    async startCheckingProgress() {
        return new Promise((resolve, reject) => {
            if (this.horde_id) {
                g_interval_id = setTimeout(async () => {
                    try {
                        // if (this.isCanceled) {
                        //     html_manip.updateProgressBarsHtml(0)
                        //     return resolve()
                        //     // return
                        // }

                        //check the request status
                        const check_json = await requestHordeCheck(
                            this.horde_id
                        )

                        this.updateHordeProgressBar(check_json)

                        if (check_json['done']) {
                            g_interval_id = clearTimeout(g_interval_id)

                            const images_info = await this.processHordeResult()
                            this.last_horde_id = this.horde_id
                            this.horde_id = null
                            return resolve(images_info)
                        } else if (this.isCanceled) {
                            //resolve the promise if we canceled the request
                            this.last_horde_id = this.horde_id
                            this.horde_id = null
                            return resolve()
                        } else {
                            //the request is not done and the user hasn't canceled it

                            const horde_result =
                                await this.startCheckingProgress() // start another check
                            return resolve(horde_result) // return the result of the new check
                        }
                    } catch (e) {
                        console.warn(e)
                        const result = await this.startCheckingProgress()
                        return resolve(result)
                    }
                }, 3000)
            } else {
                return resolve()
            }
        })
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

async function mapPluginSettingsToHorde(plugin_settings) {
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
    const extra_payload = {}
    if (ps['mode'] === 'img2img') {
        // payload['source_image'] = ps['init_images']
        // let current_doc_entry =await getCurrentDocFolder()
        // let webp_file = await current_doc_entry.getEntry('temp.webp')
        // let base64_webp =    await io.IO.base64WebpFromFile(webp_file)
        // payload['source_image'] = io.IO.base64WebpFromFile()
        // console.log('base64_webp:', base64_webp)

        // const dummy_str = getDummyWebpBase64()
        // if (base64_webp === dummy_str) {
        //     console.warn('the same base64')
        // } else {
        //     console.warn('different base64')
        // }
        // payload['source_image'] = dummy_str

        // payload['source_image'] = base64.b64encode(buffer.getvalue()).decode() //does it need to be webp?

        const init_image_base64_webp = await io.IO.base64PngToBase64Webp(
            ps['init_images'][0]
        )
        extra_payload['source_image'] = init_image_base64_webp
        extra_payload['source_processing'] = 'img2img'
    } else if (ps['mode'] === 'inpaint' || ps['mode'] === 'outpaint') {
        const init_image_base64_webp = await io.IO.base64PngToBase64Webp(
            ps['init_images'][0]
        )
        const mask_base64_webp = await io.IO.base64PngToBase64Webp(ps['mask'])
        extra_payload['source_processing'] = 'inpainting'
        extra_payload['source_image'] = init_image_base64_webp
        extra_payload['source_mask'] = mask_base64_webp
        // payload["source_mask"] = base64.b64encode(buffer.getvalue()).decode()//does it need to be webp?
    }

    let seed = ps['Seed']
    if (ps['Seed'] === '-1') {
        const random_seed = Math.floor(Math.random() * 100000000000 + 1) // Date.now() doesn't have enough resolution to avoid duplicate
        seed = random_seed.toString()
    }

    let horde_payload = {
        prompt: horde_prompt,
        params: {
            sampler_name: sampler,
            toggles: [1, 4],
            cfg_scale: ps['cfg_scale'],
            denoising_strength: ps['denoising_strength'],
            seed: seed,
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
        ...extra_payload,
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

        const horde_api_key = html_manip.getHordeApiKey()
        let request = await fetch(full_url, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                apikey: horde_api_key,
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

let g_horde_generation_result
let g_b_request_result = false
function cancelRequestClientSide() {
    g_interval_id = clearTimeout(g_interval_id)
    // g_id = null
    g_b_request_result = false
}

module.exports = {
    hordeGenerator,
}
