//get workers
//select a worker
//send a request => requestHorde(horde_settings)
//check for progress => requestHordeCheck(request_id)
//when progress is full, request the result => requestHordeStatus(request_id)
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

    payload = {
        prompt: 'string',
        params: {
            sampler_name: 'k_lms',
            toggles: [1, 4],
            cfg_scale: 5,
            denoising_strength: 0.75,
            seed: 'string',
            height: 512,
            width: 512,
            seed_variation: 1,
            post_processing: ['GFPGAN'],
            karras: false,
            tiling: false,
            steps: 5,
            n: 1,
        },
        nsfw: false,
        trusted_workers: true,
        censor_nsfw: false,
        // workers: ['4c79ab19-8e6c-4054-83b3-773b7ce71ece'],
        workers: workers_ids,
        models: ['stable_diffusion'],
        // source_image: 'string',
        // source_processing: 'img2img',
        // source_mask: 'string',
        r2: true,
        shared: false,
    }
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
    clearTimeout(g_interval_id)
    g_id = null
    g_b_request_result = false
}

async function startCheckingProgress() {
    if (!g_interval_id && g_id) {
        g_interval_id = setInterval(async () => {
            try {
                const check_json = await requestHordeCheck(g_id)
                if (check_json['done'] && !g_b_request_result) {
                    console.log('horde request is done')
                    g_b_request_result = true
                    g_horde_generation_result = await requestHordeStatus(g_id)
                    cancelRequestClientSide()
                }
            } catch (e) {
                console.warn(e)
            }
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
