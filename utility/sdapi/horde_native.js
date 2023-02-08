const general = require('../general')

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
    let horde_payload = {
        prompt: ps['prompt'],
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
    const workers = await getWorkers()

    const workers_ids = getWorkerID(workers)
    const settings = await getSettings()
    payload = mapPluginSettingsToHorde(settings)
    payload['workers'] = workers_ids
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
    clearInterval(g_interval_id)
    g_id = null
    g_b_request_result = false
}

async function processHordeResult() {
    try {
        const check_json = await requestHordeCheck(g_id)
        if (
            check_json['done'] &&
            g_interval_id
            // !g_b_request_result
        ) {
            clearInterval(g_interval_id)
            console.log('horde request is done')
            // g_b_request_result = true
            const temp_id = g_id //g_id will reset
            // cancelRequestClientSide()
            g_horde_generation_result = await requestHordeStatus(temp_id)

            const generations = g_horde_generation_result.generations
            const writeable_entry = await getCurrentDocFolder()
            for (image_horde_container of generations) {
                try {
                    const url = image_horde_container.img
                    image_file_name = general.newOutputImageName('webp')
                    const image_layer = await downloadItExe(
                        url,
                        writeable_entry,
                        image_file_name
                    ) //
                } catch (e) {
                    console.warn(e)
                }
            }
        }
    } catch (e) {
        console.warn(e)
    }
}
async function startCheckingProgress() {
    if (!g_interval_id && g_id) {
        g_interval_id = setInterval(async () => {
            await processHordeResult()
        }, 3000)
    }
}

async function requestHordeMain() {
    try {
        let json = await requestHorde()
        g_id = json.id
        startCheckingProgress()
        console.log('requestHordeMain json: ', json)
    } catch (e) {
        console.warn(e)
    }
}
module.exports = {
    requestHorde,
    requestHordeCheck,
    requestHordeStatus,
    requestHordeMain,
    getWorkers,
}
