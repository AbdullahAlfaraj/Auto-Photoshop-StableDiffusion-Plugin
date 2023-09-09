import { setControlImageSrc } from '../../utility/html_manip'
// import { session_ts } from '../entry'
// import * as session_ts from '../session/session'
import { store as session_store } from '../session/session_store'
import { Enum, api, python_replacement } from '../util/oldSystem'
import { GenerationModeEnum } from '../util/ts/enum'
import store, {
    DefaultControlNetUnitData,
    DefaultPresetControlNetUnitData,
    controlNetUnitData,
} from './store'

const { getExtensionUrl } = python_replacement
declare const g_sd_config_obj: any
declare let g_sd_url: string

async function requestControlNetPreprocessors() {
    const control_net_json = await api.requestGet(
        `${g_sd_url}/controlnet/module_list?alias_names=true`
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

    const control_net_max_models_num = (json?.control_net_unit_count || json?.control_net_max_models_num) ?? 0

    return control_net_max_models_num
}

async function requestControlNetFiltersKeywords(
    keyword = 'All',
    module_list: string[],
    model_list: string[]
) {
    try {
        const extension_url = getExtensionUrl()
        // const full_url = `${extension_url}/controlnet/filter?keyword=${keyword}`

        const full_url = `${extension_url}/controlnet/filter`

        const payload = {
            keyword: keyword,
            preprocessor_list: module_list,
            model_list: model_list,
        }
        //const full_url = `${g_sd_url}/controlnet/filter?keyword=${keyword}`
        const control_net_json = await api.requestPost(full_url, payload)

        return control_net_json
    } catch (e) {
        console.warn(e)
    }
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
    try {
        //retrieve all keywords to popular the dropdown menu

        const filters = await requestControlNetFiltersKeywords(
            'All',
            store.supportedPreprocessors,
            store.supportedModels
        )

        store.filterKeywords = filters
            ? ['none'].concat(filters.keywords)
            : ['none']
        if (filters) {
            store.controlNetUnitData.forEach((unitData) => {
                unitData.module_list = filters.module_list
                unitData.model_list = filters.model_list
                unitData.model = filters.default_model
                unitData.module = filters.default_option
                unitData.model = filters.default_model
            })
        }
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
            if (
                b_sync_input_image &&
                [GenerationModeEnum.Txt2Img].includes(session_store.data.mode)
            ) {
                //conditions: 1) txt2img mode 2)auto image on  3)first generation of session

                input_image = session_store.data.controlnet_input_image ?? ''
                store.controlNetUnitData[index].input_image = input_image
                store.controlNetUnitData[index].selection_info =
                    plugin_settings.selection_info
            }
            if (
                b_sync_input_image &&
                [
                    GenerationModeEnum.Img2Img,
                    GenerationModeEnum.Inpaint,
                    GenerationModeEnum.Outpaint,
                    GenerationModeEnum.LassoInpaint,
                ].includes(session_store.data.mode)
            ) {
                // img2img mode
                input_image = session_store.data.init_image
                store.controlNetUnitData[index].input_image = input_image
                store.controlNetUnitData[index].selection_info =
                    plugin_settings.selection_info
            } else if (
                b_sync_input_image &&
                store.controlNetUnitData[index].enabled
            ) {
                //txt2img mode
            }

            return input_image
        } catch (e) {
            console.warn(e)
        }
    }
    function getControlNetMask(index: number) {
        try {
            if (
                [
                    GenerationModeEnum.Txt2Img,
                    GenerationModeEnum.Img2Img,
                ].includes(session_store.data.mode)
            ) {
                //maskless mode
            } else {
                //mask related mode
                store.controlNetUnitData[index].mask = '' // use the mask from the sd mode
            }
            return store.controlNetUnitData[index].mask
        } catch (e) {
            console.warn(e)
        }
    }
    for (let index = 0; index < store.maxControlNet; index++) {
        controlnet_units[index] = {
            enabled: getEnableControlNet(index),
            input_image: getControlNetInputImage(index),
            mask: getControlNetMask(index),
            module: store.controlNetUnitData[index].module,
            model: store.controlNetUnitData[index].model,
            weight: store.controlNetUnitData[index].weight,
            resize_mode: 'Crop and Resize',
            lowvram: store.controlNetUnitData[index].lowvram,
            processor_res: store.controlNetUnitData[index].processor_res || 512,
            threshold_a: store.controlNetUnitData[index].threshold_a,
            threshold_b: store.controlNetUnitData[index].threshold_b,
            // guidance: ,
            guidance_start: store.controlNetUnitData[index].guidance_start,
            guidance_end: store.controlNetUnitData[index].guidance_end,
        }
        if (store.controlnetApiVersion > 1) {
            //new controlnet v2
            controlnet_units[index].control_mode =
                store.controlNetUnitData[index].control_mode
            controlnet_units[index].pixel_perfect =
                store.controlNetUnitData[index].pixel_perfect
        } else {
            // old controlnet v1
            controlnet_units[index].guessmode =
                store.controlNetUnitData[index].guessmode
        }
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

export function setUnitData(unitData: controlNetUnitData, index: number) {
    try {
        store.controlNetUnitData[index] = {
            ...store.controlNetUnitData[index],
            ...unitData,
        }

        if (!unitData?.enabled) {
            store.controlNetUnitData[index] = {
                ...store.controlNetUnitData[index],
                ...DefaultPresetControlNetUnitData,
            }
        }
    } catch (e) {
        console.error(e)
    }
}
function setControlDetectMapSrc(base64: string, index: number) {
    // store.controlNetUnitData[index].mask = base64
    store.controlNetUnitData[index].detect_map = base64
}
function setControlInputImageSrc(base64: string, index: number) {
    store.controlNetUnitData[index].input_image = base64
}
function isControlNetModeEnable() {
    let is_tab_enabled = !store.disableControlNetTab

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
    requestControlNetFiltersKeywords,
    initializeControlNetTab,
    getEnableControlNet,
    mapPluginSettingsToControlNet,
    getControlNetMaxModelsNumber,
    getUnitsData,
    setControlDetectMapSrc,
    setControlInputImageSrc,
    isControlNetModeEnable,
    getModuleDetail,
    store,
}
