const general = require('../general')
const psapi = require('../../psapi')
const html_manip = require('../html_manip')
const layer_util = require('../layer')
const dummy = require('../dummy')
const io = require('../io')
class HordeSettings {
    static {}
    static async saveSettings() {
        try {
            const settings = await getSettings()

            let native_horde_settings = await mapPluginSettingsToHorde(settings)
            const horde_api_key = html_manip.getHordeApiKey()
            native_horde_settings['api_key'] = html_manip.getHordeApiKey()
            await io.IOJson.saveHordeSettingsToFile(native_horde_settings)
        } catch (e) {
            console.warn(e)
        }
    }
    static async loadSettings() {
        try {
            let native_horde_settings =
                await io.IOJson.loadHordeSettingsFromFile()
            html_manip.setHordeApiKey(native_horde_settings['api_key'])
        } catch (e) {
            console.warn(e)
        }
    }
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
        try {
            const workers = await getWorkers()

            const workers_ids = getWorkerID(workers)
            const settings = await getSettings()
            this.plugin_settings = settings
            let payload = await mapPluginSettingsToHorde(settings)
            // payload['workers'] = workers_ids
            payload['workers'] = []

            this.horde_settings = payload
            return this.horde_settings
        } catch (e) {
            console.warn('getSettings: ', e)
        }
    }

    /**
     * @returns {json}{payload, dir_name, images_info, metadata}
     */
    async generateRequest(settings) {
        try {
            this.horde_id = null //reset request_id
            this.requestStatus = await requestHorde(settings)
            if (this.requestStatus?.message) {
                await app.showAlert(this.requestStatus?.message)
            }
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

    async interruptRequest(horde_id) {
        try {
            console.log('interruptRquest():')

            const full_url = `https://stablehorde.net/api/v2/generate/status/${horde_id}`

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
            // g_generation_session.request_status = Enum.requestStatus['']
            this.last_horde_id = this.horde_id
            this.horde_id = null //horde_id could be used startCheckingprogress() so we need to nullify it as soon as possible. TODO: refactor this dependency.
            this.isCanceled = true
            // this.interval_id = clearTimeout(this.interval_id)
            await this.interruptRequest(this.last_horde_id)
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
                        base64: dummy.getDummyBase64(), //TODO:change this to the base64_png
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
        console.log('startCheckingProgress is called')
        return await new Promise((resolve, reject) => {
            if (this.horde_id && !this.isCanceled) {
                this.interval_id = setTimeout(async () => {
                    try {
                        console.warn(
                            'startCheckingProgress(): horde_id and isCanceled',
                            this.horde_id,
                            this.isCanceled
                        )
                        //check the request status
                        const check_json = await requestHordeCheck(
                            this.horde_id
                        )

                        this.updateHordeProgressBar(check_json)

                        if (check_json['done']) {
                            // this.interval_id = clearTimeout(this.interval_id)

                            const images_info = await this.processHordeResult()
                            if (this.horde_id) {
                                this.last_horde_id = this.horde_id
                                this.horde_id = null
                            }
                            return resolve(images_info)
                        } else {
                            //the request is not done and the user hasn't canceled it
                            console.warn(
                                'startCheckingProgress(): reqursive startCheckingProgress call',
                                this.horde_id,
                                this.isCanceled
                            )
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
                console.warn(
                    'startCheckingProgress: else block',
                    this.horde_id,
                    this.isCanceled
                )
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

    let seed = ps['seed']
    if (parseInt(ps['seed']) === -1) {
        const random_seed = Math.floor(Math.random() * 100000000000 + 1) // Date.now() doesn't have enough resolution to avoid duplicate
        seed = random_seed.toString()
    }
    const width = general.nearestMultiple(ps['width'], 64)
    const height = general.nearestMultiple(ps['height'], 64)
    const nsfw = html_manip.getUseNsfw()
    let horde_payload = {
        prompt: horde_prompt,
        params: {
            sampler_name: sampler,
            toggles: [1, 4],
            cfg_scale: ps['cfg_scale'],
            denoising_strength: ps['denoising_strength'],
            seed: seed,
            height: height,
            width: width,
            seed_variation: 1,
            post_processing: ['GFPGAN'],
            karras: false,
            tiling: false,
            steps: parseInt(ps['steps']),
            n: 1,
        },
        nsfw: nsfw,
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

let g_horde_generation_result
let g_b_request_result = false
function cancelRequestClientSide() {
    this.interval_id = clearTimeout(this.interval_id)
    // g_id = null
    g_b_request_result = false
}

module.exports = {
    hordeGenerator,
    HordeSettings,
}
