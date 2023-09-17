// import { control_net, scripts, session_ts } from '../entry'
// import * as session_ts from '../session/session'
import * as scripts from '../ultimate_sd_upscaler/scripts'
import { store as session_store } from '../session/session_store'
import { ControlNetSession, GenerateSession, A1111Server, ComfyServer } from 'diffusion-chain';
import { control_net } from '../entry'

import {
    html_manip,
    io,
    layer_util,
    psapi,
    python_replacement,
    selection,
    session,
} from '../util/oldSystem'

import { core } from 'photoshop'
import {
    getEnableControlNet,
    getModuleDetail,
    mapPluginSettingsToControlNet,
} from '../controlnet/entry'

import { store as extra_page_store } from '../extra_page/extra_page'
const executeAsModal = core.executeAsModal

declare let g_inpaint_mask_layer: any
declare let g_sd_url: any
declare let g_controlnet_max_models: any
declare let g_generation_session: any

declare let g_last_seed: any
interface SessionData {
    init_image?: string
    mask?: string
    selectionInfo?: any
}

async function saveOutputImagesToDrive(images_info: any, settings: any) {
    const base64OutputImages = [] //delete all previouse images, Note move this to session end ()
    let index = 0
    for (const image_info of images_info) {
        const path = image_info['path']
        const base64_image = image_info['base64']
        base64OutputImages[index] = base64_image
        const [document_name, image_name] = path.split('/')
        await io.saveFileInSubFolder(base64_image, document_name, image_name) //save the output image
        const json_file_name = `${image_name.split('.')[0]}.json`
        settings['auto_metadata'] = image_info?.auto_metadata

        await io.saveJsonFileInSubFolder(
            settings,
            document_name,
            json_file_name
        ) //save the settings
        index += 1
    }
    session_store.data.last_seed =
        images_info?.length > 0 ? images_info[0]?.auto_metadata?.Seed : '-1'
    return base64OutputImages
}
class Mode {
    constructor() {}

    async initializeSession(): Promise<SessionData> {
        return {}
    }
    static async generate(settings: any): Promise<{
        output_images: any
        response_json: any
    }> {
        return { output_images: [], response_json: null }
    }
    //return settings that would be used by the restApi
    static async getSettings(session_data: any) {
        const ui_settings = await session.getSettings(session_data)

        return ui_settings
    }
    //take the output from restapi and formate it to a standard formate the plugin ui understand
    static async processOutput(images_info: any, settings: any): Promise<any> {
        const base64OutputImages = await saveOutputImagesToDrive(
            images_info,
            settings
        )
        return base64OutputImages
    }
    static async interrupt() {
        return await this.requestInterrupt()
    }

    static async requestInterrupt() {
        const full_url = `${g_sd_url}/sdapi/v1/interrupt`
        try {
            console.log('requestInterrupt: ')
            let request = await fetch(full_url, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            })

            // console.log('interrupt request:', request)
            let json = await request.json()
            return json
        } catch (e) {
            console.warn(e)
        }
    }
}

export class Txt2ImgMode extends Mode {
    static server: A1111Server | ComfyServer
    // constructor() {
    // }

    static async initializeSession(): Promise<SessionData> {
        const selectionInfo = await psapi.getSelectionInfoExe()

        const init_image = ''
        const mask = ''
        return { selectionInfo, init_image, mask }
    }
    
    static async generate(
        settings: any
    ): Promise<{ output_images: any; response_json: any }> {
        if (!this.server || this.server.getBaseUrl() != g_sd_url) this.server = new A1111Server(g_sd_url);

        const generateSession = new GenerateSession();
        generateSession.modelCheckpoint = '';
        generateSession.batchSize = settings.batch_size;
        generateSession.denoisingStrength = settings.denoising_strength;
        generateSession.cfgScale = settings.cfg_scale
        generateSession.height = settings.height;
        generateSession.width = settings.width;
        generateSession.samplerIndex = settings.sampler_index;
        generateSession.seed = settings.seed;
        generateSession.prompt = settings.prompt;
        generateSession.negativePrompt = settings.negativePrompt;
        generateSession.steps = settings.steps;

        if (control_net.isControlNetModeEnable()) {
            const datas = control_net.getControlNetDatas();
            datas.forEach(data => {
                const cnSession = new ControlNetSession();
                cnSession.enabled = data.enabled;
                cnSession.controlMode = data.control_mode as any;
                cnSession.guidanceEnd = data.guidance_end;
                cnSession.guidanceStart = data.guidance_start;
                cnSession.lowVRam = data.lowvram;
                cnSession.maskBase64 = data.mask;
                cnSession.model = data.model;
                cnSession.module = data.module;
                cnSession.annotatorBase64 = data.module ? '' : data.input_image
                cnSession.originImageBase64 = data.module ? data.input_image : '';
                cnSession.pixelPerfect = data.pixel_perfect;
                cnSession.processRes = data.processor_res;
                cnSession.thresholdA = data.threshold_a;
                cnSession.thresholdB = data.threshold_b;
                cnSession.weight = data.weight

                generateSession.controlNets.push(cnSession)
            })
        }

        try {
            return {
                output_images: await this.server.generate(generateSession, {}),
                response_json: {}
            }
        } catch(e) {
            console.error(e);
            throw e; 
        }
    }

    //take the output from restapi and formate it to a standard formate the plugin ui understand
    static async processOutput(images_info: any, settings: any): Promise<any> {
        const base64OutputImages = await saveOutputImagesToDrive(
            images_info,
            settings
        )
        return base64OutputImages
    }
}

export class Img2ImgMode extends Mode {
    static server: A1111Server
    constructor() {
        super()
    }
    
    static async initializeSession(): Promise<SessionData> {
        const selectionInfo = await psapi.getSelectionInfoExe()
        const init_image = await io.getImg2ImgInitImage()
        const mask = ''
        return { selectionInfo, init_image, mask }
    }

    static async generate(
        settings: any
    ): Promise<{ output_images: any; response_json: any }> {
        if (!this.server || this.server.getBaseUrl() != g_sd_url) this.server = new A1111Server(g_sd_url);

        const generateSession = new GenerateSession();
        if (settings.mask) {
            generateSession.maskBase64 = settings.mask
        }
        generateSession.initImagesBase64 = settings.init_images;
        generateSession.modelCheckpoint = '';
        generateSession.batchSize = settings.batch_size;
        generateSession.denoisingStrength = settings.denoising_strength;
        generateSession.cfgScale = settings.cfg_scale
        generateSession.height = settings.height;
        generateSession.width = settings.width;
        generateSession.samplerIndex = settings.sampler_index; 
        generateSession.seed = settings.seed;
        generateSession.prompt = settings.prompt;
        generateSession.negativePrompt = settings.negativePrompt;
        generateSession.steps = settings.steps;

        if (control_net.isControlNetModeEnable()) {
            const datas = control_net.getControlNetDatas();
            datas.forEach(data => {
                const cnSession = new ControlNetSession();
                cnSession.enabled = data.enabled;
                cnSession.controlMode = data.control_mode as any;
                cnSession.guidanceEnd = data.guidance_end;
                cnSession.guidanceStart = data.guidance_start;
                cnSession.lowVRam = data.lowvram;
                cnSession.maskBase64 = data.mask;
                cnSession.model = data.model;
                cnSession.module = data.module;
                cnSession.annotatorBase64 = data.module ? '' : data.input_image
                cnSession.originImageBase64 = data.module ? data.input_image : '';
                cnSession.pixelPerfect = data.pixel_perfect;
                cnSession.processRes = data.processor_res;
                cnSession.thresholdA = data.threshold_a;
                cnSession.thresholdB = data.threshold_b;
                cnSession.weight = data.weight

                generateSession.controlNets.push(cnSession)
            })
        }

        try {
            return {
                output_images: await this.server.generate(generateSession, {}),
                response_json: {}
            }
        } catch(e) {
            console.error(e);
            throw e; 
        }
    }
}

export class InpaintMode extends Img2ImgMode {
    constructor() {
        super()
    }

    static async initializeSession() {
        const selectionInfo = await psapi.getSelectionInfoExe()
        let init_image
        let mask

        try {
            await executeAsModal(
                async () => {
                    if (layer_util.Layer.doesLayerExist(g_inpaint_mask_layer)) {
                        g_inpaint_mask_layer.opacity = 100
                    }
                },
                { commandName: 'Set Inpaint Layer Opacity to 100%' }
            )

            const obj = await io.getInpaintInitImageAndMask()
            init_image = obj.init_image
            mask = obj.mask
        } catch (e) {
            console.warn(e)
        }

        return { selectionInfo, init_image, mask }
    }
}

export class LassoInpaintMode extends Img2ImgMode {
    constructor() {
        super()
    }

    static async initializeSession() {
        await selection.channelToSelectionExe('mask')

        try {
            await executeAsModal(
                async () => {
                    if (layer_util.Layer.doesLayerExist(g_inpaint_mask_layer)) {
                        g_inpaint_mask_layer.opacity = 100
                    }
                },
                { commandName: 'Set Inpaint Layer Opacity to 100%' }
            )
        } catch (e) {
            console.warn(e)
        }
        const [init_image, mask] = await selection.inpaintLassoInitImageAndMask(
            'mask'
        )

        const selectionInfo = await psapi.getSelectionInfoExe()
        return { selectionInfo, init_image, mask }
    }
}

export class OutpaintMode extends Img2ImgMode {
    constructor() {
        super()
    }

    static async initializeSession() {
        const selectionInfo = await psapi.getSelectionInfoExe()
        let init_image
        let mask

        try {
            const obj = await io.getOutpaintInitImageAndMask()
            init_image = obj.init_image
            mask = obj.mask
        } catch (e) {
            console.warn(e)
        }

        return { selectionInfo, init_image, mask }
    }
}
export class UpscaleMode extends Img2ImgMode {
    static async requestExtraSingleImage(payload: any) {
        try {
            let json = await python_replacement.extraSingleImageRequest(
                g_sd_url,
                payload
            )

            return json
        } catch (e) {
            console.warn(e)
            return {}
        }
    }

    static async getSettings(session_data: any) {
        //REFACTOR: move to generation_settings.js

        let payload: any = {}
        try {
            const selection_info = session_data.selectionInfo
            const upscaling_resize = extra_page_store.data.upscaling_resize
            const width = selection_info.width * upscaling_resize
            const height = selection_info.height * upscaling_resize

            //resize_mode = 0 means "resize to upscaling_resize"
            //resize_mode = 1 means "resize to width and height"
            payload['resize_mode'] = extra_page_store.data.resize_mode
            payload['show_extras_results'] =
                extra_page_store.data.show_extras_results
            payload['gfpgan_visibility'] =
                extra_page_store.data.gfpgan_visibility
            payload['codeformer_visibility'] =
                extra_page_store.data.codeformer_visibility
            payload['codeformer_weight'] =
                extra_page_store.data.codeformer_weight
            payload['upscaling_resize'] = upscaling_resize
            payload['upscaling_resize_w'] = width
            payload['upscaling_resize_h'] = height
            payload['upscaling_crop'] = extra_page_store.data.upscaling_crop

            const upscaler1 = extra_page_store.data.upscaler_1
            const upscaler2 = extra_page_store.data.upscaler_2
            payload['upscaler_1'] = upscaler1 ? upscaler1 : 'None'
            payload['upscaler_2'] = upscaler2 ? upscaler2 : 'None'

            payload['extras_upscaler_2_visibility'] =
                extra_page_store.data.extras_upscaler_2_visibility
            payload['upscale_first'] = extra_page_store.data.upscale_first

            payload['image'] = session_data.init_image
        } catch (e) {
            console.error(e)
        }
        return payload
    }

    static async generate(settings: any): Promise<{
        output_images: any
        response_json: any
    }> {
        let response_json
        let output_images
        try {
            response_json = await this.requestExtraSingleImage(settings)
            output_images = await this.processOutput(
                response_json.images_info,
                settings
            )
        } catch (e) {
            console.warn(e)
            console.warn('output_images: ', output_images)
            console.warn('response_json: ', response_json)
        }
        return { output_images, response_json }
    }
}
