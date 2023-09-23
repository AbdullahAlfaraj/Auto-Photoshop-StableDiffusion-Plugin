// import { control_net, scripts, session_ts } from '../entry'
// import * as session_ts from '../session/session'
import * as scripts from '../ultimate_sd_upscaler/scripts'
import * as control_net from '../controlnet/entry'
import { store as session_store } from '../session/session_store'
import sd_tab_util from '../sd_tab/util'

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
    // constructor() {
    // }

    static async initializeSession(): Promise<SessionData> {
        const selectionInfo = await psapi.getSelectionInfoExe()

        const init_image = ''
        const mask = ''
        return { selectionInfo, init_image, mask }
    }

    //return settings that would be used by the restApi
    // static async getSettings() {
    //     const ui_settings = await session.getSettings()

    //     return ui_settings
    // }

    //@ts-ignore
    static async requestTxt2Img(payload) {
        try {
            console.log('requestTxt2Img(): about to send a fetch request')

            let json = await python_replacement.txt2ImgRequest(payload)
            console.log('requestTxt2Img json:', json)

            return json
        } catch (e) {
            console.warn(e)
            return {}
        }
    }

    //REFACTOR: reuse the same code for (requestControlNetTxt2Img,requestControlNetImg2Img)
    static async requestControlNetTxt2Img(plugin_settings: any) {
        console.log('requestControlNetTxt2Img: ')

        const full_url = `${g_sd_url}/sdapi/v1/txt2img`

        const control_net_settings =
            mapPluginSettingsToControlNet(plugin_settings)
        let control_networks = []
        // let active_control_networks = 0
        for (let index = 0; index < g_controlnet_max_models; index++) {
            if (!getEnableControlNet(index)) {
                control_networks[index] = false
                continue
            }
            control_networks[index] = true

            if (
                !control_net_settings['controlnet_units'][index]['input_image']
            ) {
                //@ts-ignore
                app.showAlert('you need to add a valid ControlNet input image')
                throw 'you need to add a valid ControlNet input image'
            }

            if (!control_net_settings['controlnet_units'][index]['module']) {
                //@ts-ignore
                app.showAlert('you need to select a valid ControlNet Module')
                throw 'you need to select a valid ControlNet Module'
            }

            const is_model_free: boolean =
                getModuleDetail()[
                    control_net_settings['controlnet_units'][index]['module']
                ].model_free

            const has_model =
                control_net_settings['controlnet_units'][index]['model']
            const is_model_none: boolean =
                has_model && has_model.toLowerCase() === 'none'

            if (!is_model_free && (!has_model || is_model_none)) {
                //@ts-ignore
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
        })

        let json = await request.json()
        console.log('json:', json)

        //update the mask in controlNet tab
        const numOfImages = json['images'].length
        let numberOfAnnotations =
            numOfImages - session_store.data.ui_settings.batch_size
        if (numberOfAnnotations < 0) numberOfAnnotations = 0

        const base64_mask = json['images'].slice(
            numOfImages - numberOfAnnotations
        )

        let mask_index = 0

        for (let index = 0; index < control_networks.length; index++) {
            if (
                control_networks[index] == false ||
                mask_index >= numberOfAnnotations
            )
                continue
            control_net.setControlDetectMapSrc(base64_mask[mask_index], index)
            g_generation_session.controlNetMask[index] = base64_mask[mask_index]
            mask_index++
        }
        // g_generation_session.controlNetMask = base64_mask

        const standard_response =
            await python_replacement.convertToStandardResponse(
                control_net_settings,
                json['images'].slice(0, numOfImages - numberOfAnnotations),
                plugin_settings['uniqueDocumentId']
            )
        console.log('standard_response:', standard_response)

        return standard_response
    }
    //REFACTOR: move to generation.js
    static async generate(
        settings: any
    ): Promise<{ output_images: any; response_json: any }> {
        let response_json
        let output_images
        try {
            // const b_enable_control_net = control_net.getEnableControlNet()
            const b_enable_control_net = control_net.isControlNetModeEnable()

            if (b_enable_control_net) {
                //use control net
                if (session_store.data.generation_number === 1) {
                    session_store.data.controlnet_input_image =
                        await io.getImg2ImgInitImage()
                }
                // console.log(
                //     'session_store.data.controlnet_input_image: ',
                //     session_store.data.controlnet_input_image
                // )

                response_json = await this.requestControlNetTxt2Img(settings)
            } else {
                response_json = await this.requestTxt2Img(settings)
            }

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
    constructor() {
        super()
    }

    //REFACTOR: reuse the same code for (requestControlNetTxt2Img,requestControlNetImg2Img)
    static async requestControlNetImg2Img(plugin_settings: any) {
        const full_url = `${g_sd_url}/sdapi/v1/img2img`
        const control_net_settings =
            mapPluginSettingsToControlNet(plugin_settings)

        // let control_networks = 0
        let control_networks = []
        for (let index = 0; index < g_controlnet_max_models; index++) {
            if (!getEnableControlNet(index)) {
                control_networks[index] = false
                continue
            }
            control_networks[index] = true
            if (
                !control_net_settings['controlnet_units'][index]['input_image']
            ) {
                //@ts-ignore
                app.showAlert('you need to add a valid ControlNet input image')
                throw 'you need to add a valid ControlNet input image'
            }

            if (!control_net_settings['controlnet_units'][index]['module']) {
                //@ts-ignore
                app.showAlert('you need to select a valid ControlNet Module')
                throw 'you need to select a valid ControlNet Module'
            }
            const is_model_free: boolean =
                getModuleDetail()[
                    control_net_settings['controlnet_units'][index]['module']
                ].model_free

            const has_model =
                control_net_settings['controlnet_units'][index]['model']
            const is_model_none: boolean =
                has_model && has_model.toLowerCase() === 'none'

            if (!is_model_free && (!has_model || is_model_none)) {
                //@ts-ignore
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
            numOfImages - session_store.data.ui_settings.batch_size
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
        const base64_mask = json['images'].slice(
            numOfImages - numberOfAnnotations
        )

        let mask_index = 0
        for (let index = 0; index < control_networks.length; index++) {
            if (
                control_networks[index] == false ||
                mask_index >= numberOfAnnotations
            )
                continue
            control_net.setControlDetectMapSrc(base64_mask[mask_index], index)
            g_generation_session.controlNetMask[index] = base64_mask[mask_index]
            mask_index++
        }

        const standard_response =
            await python_replacement.convertToStandardResponse(
                control_net_settings,
                json['images'].slice(0, numOfImages - numberOfAnnotations),
                plugin_settings['uniqueDocumentId']
            )
        console.log('standard_response:', standard_response)

        return standard_response
    }

    static async requestImg2Img(payload: any) {
        console.log('requestImg2Img(): about to send a fetch request')
        try {
            let json = await python_replacement.img2ImgRequest(
                g_sd_url,
                payload
            )
            console.log('requestImg2Img json:')
            console.dir(json)

            return json
        } catch (e) {
            console.warn(e)
            return {}
        }
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
        let response_json
        let output_images
        try {
            //checks on index 0 as if not enabled ignores the rest
            const b_enable_control_net = control_net.isControlNetModeEnable()

            if (b_enable_control_net) {
                //use control net
                response_json = await this.requestControlNetImg2Img(settings)
            } else {
                response_json = await this.requestImg2Img(settings)
            }
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
            'mask',
            sd_tab_util.helper_store.data.lasso_offset
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
