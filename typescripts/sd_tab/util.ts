import { control_net, main } from '../entry'
import { AStore } from '../main/astore'
import { script_store } from '../ultimate_sd_upscaler/scripts'
import { ScriptMode } from '../ultimate_sd_upscaler/ultimate_sd_upscaler'
import {
    dialog_box,
    general,
    html_manip,
    sampler_data,
    settings_tab,
    thumbnail,
} from '../util/oldSystem'
import { requestGet } from '../util/ts/api'

import { GenerationModeEnum, SelectionInfoType } from '../util/ts/enum'
import {
    getVersionRequest,
    requestGetModels,
    requestGetSamplers,
    requestGetUpscalers,
    setInpaintMaskWeight,
} from '../util/ts/sdapi'
import { store as session_store } from '../session/session_store'
import { setUnitData } from '../controlnet/entry'
import { controlNetUnitData } from '../controlnet/store'
import { presetToStore } from '../util/ts/io'
import { refreshExtraUpscalers } from '../extra_page/extra_page'

import { readdirSync, readFileSync } from 'fs'

declare let g_models: any[]
declare let g_automatic_status: any
declare let g_sd_options_obj: any

declare let g_controlnet_max_models: number
declare let g_sd_url: string

export const mode_config = [
    {
        name: 'txt2img',
        title: 'use this mode to generate images from text only',
        id: '',
    },
    {
        name: 'img2img',
        title: 'use this mode to generate variation of an image',
        id: '',
    },
    {
        name: 'inpaint',
        title: 'use this mode to generate variation of a small area of an image, while keeping the rest of the image intact',
        id: 'rbModeInpaint',
    },
    {
        name: 'outpaint',
        title: 'use this mode to (1) fill any missing area of an image,(2) expand an image',
        id: '',
    },
]
export const mask_content_config = [
    {
        name: 'fill',
        value: 0,
    },
    {
        name: 'original',
        value: 1,
    },
    {
        name: 'latent noise',
        value: 2,
    },
    {
        name: 'latent nothing',
        value: 3,
    },
]
export enum SelectionModeEnum {
    Ratio = 'ratio',
    Precise = 'precise',
    Ignore = 'ignore',
}
export const selection_mode_config = [
    {
        name: 'ratio',
        value: 'ratio',
        title: '',
    },
    {
        name: 'precise',
        value: 'precise',
        title: 'use the selection area width and height to fill the width and height sliders',
    },
    {
        name: 'ignore',
        value: 'ignore',
        title: 'fill the width and height sliders manually',
    },
]

export const store = new AStore({
    selected_model: '',
    is_lasso_mode: false,
    mode: GenerationModeEnum.Txt2Img,
    rb_mode: ScriptMode.Txt2Img,

    batch_size: 1,
    batch_count: 1,
    steps: 20,
    width: 512,
    height: 512,
    ratio: 1.0,
    cfg: 7.0,
    b_width_height_link: true,
    denoising_strength: 0.7,
    hr_denoising_strength: 0.7,
    inpaint_full_res: false,
    enable_hr: false,
    sampler_name: 'Euler a',
    image_cfg_scale: 1.5,
    seed: '-1' as string,
    mask_blur: 0,
    mask_expansion: 0,
    inpaint_full_res_padding: 0,

    hr_scale: 2.0,

    hr_resize_x: 512,
    hr_resize_y: 512,
    hr_second_pass_steps: 0,
    restore_faces: false,
    inpainting_fill: mask_content_config[0].value,
    hr_upscaler: '',

    selection_mode: selection_mode_config[0].value,
})
export const default_preset = {
    sd_tab_preset: {
        prompt: '',
        negative_prompt: '',
        // is_lasso_mode: false,

        batch_size: 1,
        batch_count: 1,
        steps: 20,
        width: 512,
        height: 512,
        ratio: 1,
        cfg: 7,
        b_width_height_link: true,
        denoising_strength: 0.7,
        hr_denoising_strength: 0.7,
        // inpaint_full_res: false,
        // enable_hr: false,
        sampler_name: 'Euler a',
        image_cfg_scale: 1.5,
        seed: '-1',
        mask_blur: 0,
        mask_expansion: 0,
        inpaint_full_res_padding: 0,
        hr_scale: 2,
        hr_resize_x: 512,
        hr_resize_y: 512,
        hr_second_pass_steps: 0,
        // restore_faces: false,
        inpainting_fill: 0,
        hr_upscaler: '',
        selection_mode: 'ratio',
    },
    controlnet_tab_preset: [{}, {}, {}, {}, {}, {}, {}],
}

export const helper_store = new AStore({
    b_show_sampler: false, //false when off, true when on,
    models: [] as any[],
    loras: [] as any[],
    embeddings: [] as any[],
    sampler_list: [] as any[],
    hr_upscaler_list: [] as string[],
    previous_width: 512,
    previous_height: 512,
    native_presets: {},
})
export async function refreshModels() {
    let b_result = false
    try {
        g_models = await requestGetModels()
        if (g_models.length > 0) {
            b_result = true
        }

        helper_store.data.models = g_models

        // for (let model of g_models) {
        //     // console.log(model.title)//Log
        //     // const menu_item_element = document.createElement('sp-menu-item')
        //     // menu_item_element.className = 'mModelMenuItem'
        //     menu_item_element.innerHTML = model.title
        //     menu_item_element.dataset.model_hash = model.hash
        //     menu_item_element.dataset.model_title = model.title
        //     // document
        //     //     .getElementById('mModelsMenu')
        //     //     .appendChild(menu_item_element)
        // }
    } catch (e) {
        b_result = false
        console.warn(e)
    }
    return b_result
}

async function promptForUpdate(header_message: any, long_message: any) {
    const shell = require('uxp').shell

    ;(async () => {
        const buttons = ['Cancel', 'OK']
        const r1 = await dialog_box.prompt(
            header_message,
            long_message,
            buttons
            // 'Please Update you Plugin. it will take about 10 seconds to update',
            // 'update from discord, update from github'[
            // ['Cancel', 'Discord', 'Github']
            // ('Cancel', 'OK')
            // ]
        )
        let url
        try {
            if (r1 === 'Cancel') {
                /* cancelled or No */
                console.log('cancel')
            } else if (r1 === 'Github') {
                url =
                    'https://github.com/AbdullahAlfaraj/Auto-Photoshop-StableDiffusion-Plugin'
                // await py_re.openUrlRequest(url)
            } else if (r1 === 'Discord') {
                console.log('Discord')
                // url = 'https://discord.gg/3mVEtrddXJ'
                // url = 'https://discord.gg/YkUJXYWK3c'
                // await py_re.openUrlRequest(url)
            } else if (r1 === 'Ok') {
            }
            // console.log('url: ', url)
        } catch (e) {
            console.warn(e, url)
        }
    })()
}
export async function updateClickEventHandler(current_version: string) {
    try {
        const online_data = await general.requestOnlineData()
        const b_need_update = general.compareVersions(
            current_version,
            online_data.new_version
        )

        let header_message = "You're Plugin is up to date."
        let long_message = ''
        if (b_need_update) {
            header_message = `New Version is Available (${online_data.new_version})`
            long_message = online_data.update_message
        }

        await promptForUpdate(header_message, long_message)
    } catch (e) {
        console.warn(e)
    }
}

export function tempDisableElement(element: any, time: number) {
    element.classList.add('disableBtn')
    element.disabled = true
    // element.style.opacity = '0.65'
    // element.style.cursor = 'not-allowed'
    setTimeout(function () {
        element.disabled = false
        element.classList.remove('disableBtn')
        // element.style.opacity = '1.0'
        // element.style.cursor = 'default'
    }, time)
}

async function updateVersionUI() {
    let bStatus = false
    try {
        const version = await getVersionRequest()
        document.getElementById('lVersionNumber')!.textContent = version
        if (version !== 'v0.0.0') {
            bStatus = true
        }
    } catch (e) {
        console.warn(e)
        document.getElementById('lVersionNumber')!.textContent = 'v0.0.0'
        bStatus = false
    }
    return bStatus
}

//REFACTOR: move to generation_settings.js
export async function initSamplers() {
    let bStatus = false
    try {
        // let sampler_group = document.getElementById('sampler_group')!
        // sampler_group.innerHTML = ''

        let samplers = await requestGetSamplers()
        if (!samplers) {
            //if we failed to get the sampler list from auto1111, use the list stored in sampler.js
            samplers = sampler_data.samplers
        }
        helper_store.data.sampler_list = samplers

        // for (let sampler of samplers) {
        //     // console.log(sampler)//Log
        //     // sampler.name
        //     // <sp-radio class="rbSampler" value="Euler">Euler</sp-radio>
        //     // const rbSampler = document.createElement('sp-radio')
        //     // rbSampler.innerHTML = sampler.name
        //     // rbSampler.setAttribute('class', 'rbSampler')
        //     // rbSampler.setAttribute('value', sampler.name)
        //     // sampler_group.appendChild(rbSampler)
        //     //add click event on radio button for Sampler radio button, so that when a button is clicked it change g_sd_sampler globally
        // }
        // document
        //     .getElementsByClassName('rbSampler')[0]
        //     .setAttribute('checked', '')
        if (samplers.length > 0) {
            bStatus = true
        }
    } catch (e) {
        console.warn(e)
    }
    return bStatus
}

export function loadNativePreset() {
    const json_container: { [key: string]: any } = {}
    const dir = 'plugin:/presets' // specify the directory containing the .json files

    readdirSync(dir).forEach((file) => {
        if (file.endsWith('.json')) {
            const fileContent = readFileSync(`${dir}/${file}`, 'utf8')
            const fileNameWithoutExtension = file.slice(0, -5)
            json_container[fileNameWithoutExtension] = JSON.parse(fileContent)
        }
    })

    console.log(json_container)
    return json_container
}
export async function refreshUI() {
    try {
        const b_proxy_server_status = await updateVersionUI()
        if (b_proxy_server_status) {
            html_manip.setProxyServerStatus('connected', 'disconnected')
            // g_automatic_status = Enum.AutomaticStatusEnum['RunningWithApi']
        } else {
            html_manip.setProxyServerStatus('disconnected', 'connected')
        }

        //@ts-ignore
        g_automatic_status = await checkAutoStatus()
        //@ts-ignore
        await displayNotification(g_automatic_status)

        const bSamplersStatus = await initSamplers()

        await refreshModels()
        helper_store.data.loras = await requestLoraModels()
        helper_store.data.embeddings = await requestEmbeddings()
        await refreshExtraUpscalers()

        await setInpaintMaskWeight(1.0) //set the inpaint conditional mask to 1 when the on plugin start

        //get the latest options

        await g_sd_options_obj.getOptions()
        //get the selected model
        store.data.selected_model = g_sd_options_obj.getCurrentModel()
        //update the ui with that model title

        // const current_model_hash =
        //     html_manip.getModelHashByTitle(current_model_title)
        // html_manip.autoFillInModel(current_model_hash)

        //fetch the inpaint mask weight from sd webui and update the slider with it.
        const inpainting_mask_weight =
            await g_sd_options_obj.getInpaintingMaskWeight()
        console.log('inpainting_mask_weight: ', inpainting_mask_weight)
        html_manip.autoFillInInpaintMaskWeight(inpainting_mask_weight)

        //init ControlNet Tab

        helper_store.data.hr_upscaler_list = await requestGetHiResUpscalers()

        g_controlnet_max_models = await control_net.requestControlNetMaxUnits()
        await control_net.initializeControlNetTab(g_controlnet_max_models)
        await main.populateVAE()

        helper_store.data.native_presets = loadNativePreset()
    } catch (e) {
        console.warn(e)
    }
}

export async function requestGetHiResUpscalers(): Promise<string[]> {
    try {
        const full_url = `${g_sd_url}/sdapi/v1/upscalers`
        let upscalers = await requestGet(full_url)
        return [
            'Latent',
            'Latent (antialiased)',
            'Latent (bicubic)',
            'Latent (bicubic antialiased)',
            'Latent (nearest)',
            'Latent (nearest-exact)',
            ...upscalers.map((upscaler: any) => upscaler.name),
        ]
    } catch (e) {
        console.warn('requestGetHiResUpscalers:', e)
        return [
            'Latent',
            'Latent (antialiased)',
            'Latent (bicubic)',
            'Latent (bicubic antialiased)',
            'Latent (nearest)',
            'Latent (nearest-exact)',
        ]
    }
}

export async function requestLoraModels() {
    const full_url = `${g_sd_url}/sdapi/v1/loras`
    const lora_models = (await requestGet(full_url)) ?? []
    return lora_models
}

export async function requestEmbeddings() {
    try {
        const full_url = `${g_sd_url}/sdapi/v1/embeddings`
        let results = (await requestGet(full_url)) || {}
        let embeddings = Object.keys(results?.loaded || {})
        return embeddings
    } catch (e) {
        console.error(e)
        return []
    }
}

export function getLoraModelPrompt(lora_model_name: string) {
    return `<lora:${lora_model_name}:1>`
}

export async function onModeChange(new_mode: ScriptMode) {
    try {
        script_store.setMode(new_mode)
        store.data.rb_mode = new_mode
        store.data.mode = store.data.rb_mode as unknown as GenerationModeEnum

        //@ts-ignore
        await postModeSelection() // do things after selection
    } catch (e) {
        console.warn(e)
    }
}

export function viewMaskExpansion() {
    if (session_store.data.expanded_mask) {
        const mask_src = general.base64ToBase64Url(
            session_store.data.expanded_mask
        )
        html_manip.setInitImageMaskSrc(mask_src)
    } else {
        console.log(
            'the mask has not been expanded, g_generation_session.base64maskExpansionImage is empty'
        )
    }
}
function viewDrawnMask() {
    //this is the generated mask or user drawn mask, but it's not the mask after expansion
    if (session_store.data.mask) {
        const mask_src = general.base64ToBase64Url(session_store.data.mask)
        html_manip.setInitImageMaskSrc(mask_src)
    } else {
        console.log('no mask is available')
    }
}
export function initInitMaskElement() {
    //make init mask image use the thumbnail class with buttons
    const mask_image_html = html_manip.getInitImageMaskElement()
    const mask_parent_element = mask_image_html.parentElement

    const thumbnail_container = thumbnail.Thumbnail.wrapImgInContainer(
        mask_image_html,
        'viewer-image-container'
    )
    mask_parent_element.appendChild(thumbnail_container)
    thumbnail.Thumbnail.addSPButtonToContainer(
        thumbnail_container,
        'svg_sp_btn',
        'view original mask',

        viewDrawnMask,
        null
    )
    thumbnail.Thumbnail.addSPButtonToContainer(
        thumbnail_container,
        'svg_sp_btn_expand',
        'view modified mask',

        viewMaskExpansion,
        null
    )
    // populateLoraModelMenu() // no need for await
}

function scaleToRatio(
    newValue1: number,
    oldValue1: number,
    newValue2: undefined, //get ignored
    oldValue2: number,
    maxValue: number,
    minValue: number
) {
    const ratio = newValue1 / oldValue1
    let finalNewValue2 = Math.max(
        minValue,
        Math.min(maxValue, oldValue2 * ratio)
    )
    let finalNewValue1 = newValue1
    if (finalNewValue2 === maxValue || finalNewValue2 === minValue) {
        finalNewValue1 = oldValue1 * (finalNewValue2 / oldValue2)
    }
    return [finalNewValue1, finalNewValue2]
}

export function widthSliderOnChangeEventHandler(
    new_value: number,
    min_value: number,
    max_value: number
) {
    try {
        const b_link = store.data.b_width_height_link
        let final_width = new_value
        let final_height
        if (b_link) {
            ;[final_width, final_height] = scaleToRatio(
                new_value,
                helper_store.data.previous_width,
                undefined,
                store.data.height,
                max_value,
                min_value
            )

            store.data.width = final_width
            store.data.height = final_height

            helper_store.data.previous_width = store.data.width
            helper_store.data.previous_height = store.data.height
        }
    } catch (e) {
        console.error(e)
    }
}

export function heightSliderOnChangeEventHandler(
    new_value: number,
    min_value: number,
    max_value: number
) {
    try {
        let new_height = new_value
        const b_link = store.data.b_width_height_link
        let final_height = new_height
        let final_width
        if (b_link) {
            ;[final_height, final_width] = scaleToRatio(
                new_height,
                helper_store.data.previous_height,
                undefined,
                store.data.width,
                max_value,
                min_value
            )

            store.data.width = final_width
            store.data.height = final_height

            helper_store.data.previous_width = store.data.width
            helper_store.data.previous_height = store.data.height
        }
    } catch (e) {
        console.error(e)
    }
}
export function calcLinkedValue(new_value: number) {}
export async function initPlugin() {
    try {
        //*) load plugin settings
        //*) load horde settings
        //*)
        //*) initialize the samplers
        //*)
        await settings_tab.loadSettings()
        // await horde_native.HordeSettings.loadSettings()
        const bSamplersStatus = await initSamplers() //initialize the sampler
        await setInpaintMaskWeight(1.0) //set the inpaint conditional mask to 1 when the on plugin start
        await refreshUI()

        //@ts-ignore
        await loadPromptShortcut()
        //@ts-ignore
        await refreshPromptMenu()
    } catch (e) {
        console.error(e)
    }
}
export function scaleFromToLabel(width: number, height: number, scale: number) {
    const hr_width = Math.ceil(width * scale)
    const hr_height = Math.ceil(height * scale)
    return `${width}x${height} -> ${hr_width}x${hr_height}`
}

export function onWidthSliderInput(new_value: number) {
    try {
        store.data.width = new_value

        store.data.ratio = calcRatio(
            new_value,
            store.data.height,
            session_store.data.current_selection_info
        )
    } catch (e) {
        console.error(e)
    }
}

export function onHeightSliderInput(new_value: number) {
    try {
        store.data.height = new_value
        store.data.ratio = calcRatio(
            store.data.width,
            new_value,
            session_store.data.current_selection_info
        )
    } catch (e) {
        console.error(e)
    }
}

export function calcRatio(
    width: number,
    height: number,
    selectionInfo: SelectionInfoType | undefined
) {
    let ratio = 1

    if (selectionInfo) {
        ratio = (width * height) / (selectionInfo.width * selectionInfo.height)
    }
    return ratio
}

export function loadPresetSettings(preset: any) {
    if (preset?.sd_tab_preset) {
        presetToStore(preset?.sd_tab_preset, store)
    }
    if (preset?.controlnet_tab_preset) {
        preset?.controlnet_tab_preset.forEach(
            (unit: controlNetUnitData, index: number) => {
                try {
                    setUnitData(unit, index)
                } catch (e) {
                    console.log('error at unit index: ', index)
                    console.error(e)
                }
            }
        )
        // io_ts.presetToStore(preset?.controlnet_tab_preset, store)
    }
}
