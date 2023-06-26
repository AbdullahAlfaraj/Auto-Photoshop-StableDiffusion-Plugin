import { setControlImageSrc } from '../../utility/html_manip'
import { session_ts } from '../entry'
import { Enum, api } from '../util/oldSystem'
import { store, versionCompare } from './main'

declare const g_sd_config_obj: any
declare let g_sd_url: string

async function requestControlNetPreprocessors() {
    const control_net_json = await api.requestGet(
        `${g_sd_url}/controlnet/module_list?alias_name=1`
    )

    return control_net_json
}
async function requestControlNetModelList(): Promise<any> {
    const control_net_json = await api.requestGet(
        `${g_sd_url}/controlnet/model_list`
    )

    const model_list = control_net_json?.model_list
    return model_list
}
async function requestControlNetApiVersion() {
    const json = await api.requestGet(`${g_sd_url}/controlnet/version`)

    const version = json?.version

    return version
}
async function requestControlNetMaxUnits() {
    const json = await api.requestGet(`${g_sd_url}/controlnet/settings`)

    const control_net_max_models_num = json?.control_net_max_models_num ?? 0

    return control_net_max_models_num
}

async function initializeControlNetTab(controlnet_max_models: number) {
    store.maxControlNet = controlnet_max_models || store.maxControlNet
    store.controlnetApiVersion = await requestControlNetApiVersion()

    try {
        const models = await requestControlNetModelList()
        store.supportedModels = models || []
    } catch (e) {
        console.warn(e)
    }
    try {
        const pps = await requestControlNetPreprocessors()
        store.supportedPreprocessors = pps ? pps.module_list : []
        store.preprocessorDetail = pps ? pps.module_detail : {}
    } catch (e) {
        console.warn(e)
    }
}

function getEnableControlNet(index: number) {
    if (typeof index == 'undefined')
        return (
            store.controlNetUnitData.filter((item) => item.enabled).length > 0
        )
    else return store.controlNetUnitData[index || 0].enabled
}
function mapPluginSettingsToControlNet(plugin_settings: any) {
    const ps = plugin_settings // for shortness
    let controlnet_units: any[] = []
    function getControlNetInputImage(index: number) {
        try {
            const b_sync_input_image =
                store.controlNetUnitData[index].auto_image
            let input_image = store.controlNetUnitData[index].input_image
            if (b_sync_input_image && session_ts.store.data.init_image) {
                input_image = session_ts.store.data.init_image
                store.controlNetUnitData[index].input_image = input_image
            }

            return input_image
        } catch (e) {
            console.warn(e)
        }
    }
    for (let index = 0; index < store.maxControlNet; index++) {
        controlnet_units[index] = {
            enabled: getEnableControlNet(index),
            input_image: getControlNetInputImage(index),
            mask: '',
            module: store.controlNetUnitData[index].module,
            model: store.controlNetUnitData[index].model,
            weight: store.controlNetUnitData[index].weight,
            resize_mode: 'Scale to Fit (Inner Fit)',
            lowvram: store.controlNetUnitData[index].lowvram,
            processor_res: store.controlNetUnitData[index].processor_res || 512,
            threshold_a: store.controlNetUnitData[index].threshold_a,
            threshold_b: store.controlNetUnitData[index].threshold_b,
            // guidance: ,
            guidance_start: store.controlNetUnitData[index].guidance_start,
            guidance_end: store.controlNetUnitData[index].guidance_end,
            guessmode: false,
        }
        if (store.controlnetApiVersion > 1) {
            controlnet_units[index].control_mode =
                store.controlNetUnitData[index].control_mode
            controlnet_units[index].pixel_perfect = true
        }
    }

    if (
        plugin_settings['mode'] === Enum.generationModeEnum['Img2Img'] ||
        plugin_settings['mode'] === Enum.generationModeEnum['Inpaint'] ||
        plugin_settings['mode'] === Enum.generationModeEnum['Outpaint']
    ) {
        const b_use_guess_mode = store.controlNetUnitData[0].guessmode
        controlnet_units[0]['guessmode'] = b_use_guess_mode
    }

    const controlnet_payload = {
        ...ps,
        controlnet_units, //keep for backward compatibility for now
        subseed: -1,
        override_settings: {},
        override_settings_restore_afterwards: true,
        alwayson_scripts: {
            ...(ps?.alwayson_scripts || {}),
            controlnet: {
                args: controlnet_units,
            },
        },
    }

    return controlnet_payload
}
function getControlNetMaxModelsNumber() {
    return store.maxControlNet
}
function getUnitsData() {
    return store.controlNetUnitData
}
function setControlMaskSrc(base64: string, index: number) {
    store.controlNetUnitData[index].mask = base64
}
function setControlInputImageSrc(base64: string, index: number) {
    store.controlNetUnitData[index].input_image = base64
}
function isControlNetModeEnable() {
    let is_tab_enabled =
        !document.getElementById('chDisableControlNetTab') ||
        //@ts-ignore
        !document.getElementById('chDisableControlNetTab').checked

    let numOfEnabled = 0
    if (is_tab_enabled) {
        for (let index = 0; index < store.maxControlNet; index++) {
            if (getEnableControlNet(index)) {
                numOfEnabled += 1
            }
        }
    }
    let is_mode_enabled = is_tab_enabled // could be true
    if (is_tab_enabled === false || numOfEnabled === 0) {
        is_mode_enabled = false
    }
    return is_mode_enabled
}
function getModuleDetail() {
    return store.preprocessorDetail
}
export {
    requestControlNetModelList,
    requestControlNetMaxUnits,
    initializeControlNetTab,
    getEnableControlNet,
    mapPluginSettingsToControlNet,
    getControlNetMaxModelsNumber,
    getUnitsData,
    setControlMaskSrc,
    setControlInputImageSrc,
    isControlNetModeEnable,
    getModuleDetail,
}
