import settings_tab from '../settings/settings'
import { requestGet } from '../util/ts/api'

class ComfyAPI {
    private object_info: Record<string, any> = {}
    comfy_url: string
    constructor(comfy_url: string) {
        this.comfy_url = comfy_url
    }
    async init() {
        this.object_info = await this.getObjectInfo(this.comfy_url)
    }
    setUrl(comfy_url: string) {
        this.comfy_url = comfy_url
    }
    async refresh() {
        this.object_info = await this.getObjectInfo(this.comfy_url)
    }

    async getObjectInfo(comfy_url: string) {
        try {
            const object_info = await requestGet(`${comfy_url}/object_info`)
            return object_info
        } catch (e) {
            console.error(e)
        }
    }
    private getData(path: string[]): any[] {
        let data = []
        try {
            let obj = this.object_info
            for (const p of path) {
                obj = obj[p]
            }
            data = obj[0]
        } catch (e) {
            console.error(
                `Failed to get data from path ${path.join('.')}: ${e}`
            )
        }
        return data
    }

    getModels(): any[] {
        return this.getData([
            'CheckpointLoader',
            'input',
            'required',
            'ckpt_name',
        ])
    }

    getVAEs(): any[] {
        return this.getData(['VAELoader', 'input', 'required', 'vae_name'])
    }
    getSamplerNames(): string[] {
        return this.getData(['KSampler', 'input', 'required', 'sampler_name'])
    }
    getHiResUpscalers(): string[] {
        return this.getData([
            'LatentUpscaleBy',
            'input',
            'required',
            'upscale_method',
        ])
    }
}
export default {
    ComfyAPI,
    comfy_api: new ComfyAPI(settings_tab.store.data.comfy_url),
}
