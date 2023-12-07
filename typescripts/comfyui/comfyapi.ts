import { app } from 'photoshop'
import settings_tab from '../settings/settings'
import { requestGet, requestPost } from '../util/ts/api'
import { base64UrlToBase64 } from '../util/ts/general'
interface ComfyError {
    type: string
    message: string
    details: string
    extra_info: any
}

interface NodeError {
    errors: ComfyError[]
    dependent_outputs: string[]
    class_type: string
}
export interface ComfyResult {
    error?: ComfyError
    node_errors?: { [key: string]: NodeError }
}
class ComfyAPI {
    private object_info: Record<string, any> = {}
    comfy_url: string
    status: boolean = false

    constructor(comfy_url: string) {
        this.comfy_url = comfy_url
    }
    async init(display_error = false) {
        try {
            this.object_info = await this.initializeObjectInfo(this.comfy_url)
            this.status = true
            return this.object_info
        } catch (e) {
            console.error(e)
            this.status = false
            if (display_error) {
                app.showAlert(`${e}`)
            }
        }
    }
    setUrl(comfy_url: string) {
        this.comfy_url = comfy_url
    }
    async refresh() {
        this.object_info = await this.initializeObjectInfo(this.comfy_url)
    }
    async queue() {
        const res = await requestGet(`${this.comfy_url}/queue`)
        const queue_running = res?.queue_running ? res?.queue_running : []
        const queue_pending = res?.queue_pending ? res?.queue_pending : []
        return { queue_running, queue_pending }
    }
    async prompt(prompt: any) {
        try {
            const payload = {
                prompt: prompt,
            }
            const res = await requestPost(`${this.comfy_url}/prompt`, payload)

            return res
        } catch (e) {
            console.error(e)
        }
    }

    async getHistory(prompt_id: string = '') {
        try {
            const url = `${this.comfy_url}/history/${prompt_id}`

            const res = await requestGet(url)

            return res
        } catch (e) {
            console.error(e)
        }
    }
    async view(
        filename: string,
        type: string = 'output',
        subfolder: string = ''
    ): Promise<string> {
        const ab: ArrayBuffer = await requestGet(
            `${this.comfy_url}/view?subfolder=${subfolder}&type=${type}&filename=${filename}`
        )
        return Buffer.from(ab).toString('base64')
    }

    async initializeObjectInfo(comfy_url: string) {
        try {
            const full_url = `${comfy_url}/object_info`
            const object_info = await requestGet(full_url)
            if (!object_info)
                throw `can not request from comfyui url: ${comfy_url}`
            return object_info
        } catch (e) {
            console.error(e)
            throw e
        }
    }
    getObjectInfo() {
        try {
            return this.object_info
        } catch (e) {
            console.error(e)
            throw e
        }
    }
    getReadableError(result: ComfyResult): string {
        const parseError = (error: any) =>
            `Error: ${error.message}\n${
                error.details ? `Details: ${error.details}\n` : ''
            }`

        let errorMessage = result.error ? parseError(result.error) : ''

        if (result.node_errors) {
            for (const [node_id, node_error] of Object.entries(
                result.node_errors
            )) {
                errorMessage += `Node ${node_id}:\n${node_error.errors
                    .map(parseError)
                    .join('')}`
            }
        }
        return errorMessage
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
    getLoras(): string[] {
        return this.getData(['LoraLoader', 'input', 'required', 'lora_name'])
    }
    async interrupt() {
        const res = await requestPost(`${this.comfy_url}/interrupt`, {})
        console.log('res: ', res)
        return res
    }
}

export default {
    ComfyAPI,
    comfy_api: new ComfyAPI(settings_tab.store.data.comfy_url),
}
