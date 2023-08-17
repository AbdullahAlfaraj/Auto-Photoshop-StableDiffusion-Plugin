declare let g_version: any
declare let g_sd_url: any

export async function getVersionRequest() {
    console.log('requestGetSamplers: ')
    const current_version = g_version

    return current_version
}
export async function requestGetSamplers() {
    let json = null
    try {
        console.log('requestGetSamplers: ')

        const full_url = `${g_sd_url}/sdapi/v1/samplers`
        let request = await fetch(full_url)
        json = await request.json()
        // console.log('samplers json:', json)
    } catch (e) {
        console.warn(e)
    }
    return json
}

export async function requestGetUpscalers() {
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

export async function setInpaintMaskWeight(value: number) {
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

export async function requestGetModels() {
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

export async function requestSwapModel(model_title: string) {
    console.log('requestSwapModel: ')

    const full_url = `${g_sd_url}/sdapi/v1/options`
    const payload = {
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
