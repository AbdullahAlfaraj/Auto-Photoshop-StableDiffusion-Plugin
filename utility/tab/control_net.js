const api = require('../api')
const html_manip = require('../html_manip')
const selection = require('../../selection')
const note = require('../notification')
const g_controlnet_max_supported_models = 3

async function checkIfControlNetInstalled() {}
async function requestControlNetModelList() {
    const control_net_json = await api.requestGet(
        `${g_sd_url}/controlnet/model_list`
    )

    const model_list = control_net_json?.model_list

    // const model_list = [
    //     'none',
    //     'control_sd15_depth [fef5e48e]',
    //     'control_sd15_openpose [fef5e48e]',
    //     'control_sd15_scribble [fef5e48e]',
    // ]
    return model_list
}

async function requestControlNetModuleList() {
    // const control_net_json = await api.requestGet(
    //     `${g_sd_url}/controlnet/model_list`
    // )
    // const module_list = [
    //     // 'none',
    //     'canny',
    //     'depth',
    //     'depth_leres',
    //     'hed',
    //     'mlsd',
    //     'normal_map',
    //     'openpose',
    //     // "openpose_hand",
    //     'pidinet',
    //     'scribble',
    //     'fake_scribble',
    //     'segmentation',
    // ]
    const module_list = g_sd_config_obj.getControlNetPreprocessors()
    // const module_list = g_controlnet_preprocessors
    return module_list
}
async function populateModelMenu() {
    try {
        const models = await requestControlNetModelList()
        for (
            let index = 0;
            index < g_controlnet_max_supported_models;
            index++
        ) {
            html_manip.populateMenu(
                'mModelsMenuControlNet_' + index,
                'mModelsMenuItemControlNet_' + index,
                models,
                (item, item_html_element) => {
                    item_html_element.innerHTML = item
                }
            )
        }
    } catch (e) {
        console.warn(e)
    }
}

async function populatePreprocessorMenu() {
    try {
        const modules = await requestControlNetModuleList()
        for (
            let index = 0;
            index < g_controlnet_max_supported_models;
            index++
        ) {
            html_manip.populateMenu(
                'mModuleMenuControlNet_' + index,
                'mModuleMenuItemControlNet_' + index,
                modules,
                (item, item_html_element) => {
                    item_html_element.innerHTML = item
                }
            )
        }
    } catch (e) {
        console.warn(e)
    }
}
async function initializeControlNetTab(controlnet_max_models) {
    try {
        if (controlnet_max_models > g_controlnet_max_supported_models)
            controlnet_max_models = g_controlnet_max_supported_models

        for (let index = 0; index < controlnet_max_models; index++) {
            await populateModelMenu(index)
            await populatePreprocessorMenu(index)
            document.getElementById(
                'controlnet_settings_' + index
            ).style.display = 'block'
        }
    } catch (e) {
        console.warn(e)
    }
}
// controlnet settings getters
function getControlNetWeightGuidanceStrength(controlnet_index = 0) {
    const slider_value = document.getElementById(
        'slControlNetGuidanceStrength_' + controlnet_index
    ).value
    const sd_value = general.mapRange(slider_value, 0, 100, 0, 1) // convert slider value to SD ready value
    return sd_value
}

function getControlNetWeight(controlnet_index = 0) {
    const slider_value = document.getElementById(
        'slControlNetWeight_' + controlnet_index
    ).value

    const sd_value = general.mapRange(slider_value, 0, 100, 0, 2) // convert slider value to SD ready value
    return sd_value
}
function getUseLowVram(controlnet_index = 0) {
    const b_result = document.getElementById(
        'chlowVram_' + controlnet_index
    ).checked
    return b_result
}
function getEnableControlNet(controlnet_index = 0) {
    const is_enable = document.getElementById(
        'chEnableControlNet_' + controlnet_index
    ).checked
    return is_enable
}

function getSelectedModule(controlnet_index = 0) {
    const module_name = html_manip.getSelectedMenuItemTextContent(
        'mModuleMenuControlNet_' + controlnet_index
    )

    return module_name
}
function getSelectedModel(controlnet_index = 0) {
    const model_name = html_manip.getSelectedMenuItemTextContent(
        'mModelsMenuControlNet_' + controlnet_index
    )
    return model_name
}
function getUseGuessMode(controlnet_index = 0) {
    const is_guess_mode = document.getElementById(
        'chGuessMode_' + controlnet_index
    ).checked
    return is_guess_mode
}

function getControlNetMaxModelsNumber() {
    return g_controlnet_max_supported_models
}

function mapPluginSettingsToControlNet(plugin_settings) {
    const ps = plugin_settings // for shortness
    let controlnet_units = []

    for (let index = 0; index < g_controlnet_max_supported_models; index++) {
        if (!getEnableControlNet(index)) break
        controlnet_units[index] = {
            input_image: g_generation_session.controlNetImage[index],
            mask: '',
            module: getSelectedModule(index),
            model: getSelectedModel(index),
            weight: getControlNetWeight(index),
            resize_mode: 'Scale to Fit (Inner Fit)',
            lowvram: getUseLowVram(index),
            processor_res: 512,
            threshold_a: 64,
            threshold_b: 64,
            guidance: getControlNetWeightGuidanceStrength(index),
            guidance_start: 0,
            guidance_end: 1,
            guessmode: false,
        }
    }

    if (
        plugin_settings['mode'] === Enum.generationModeEnum['Img2Img'] ||
        plugin_settings['mode'] === Enum.generationModeEnum['Inpaint'] ||
        plugin_settings['mode'] === Enum.generationModeEnum['Outpaint']
    ) {
        const b_use_guess_mode = getUseGuessMode()
        controlnet_units[0]['guessmode'] = b_use_guess_mode
    }

    const controlnet_payload = {
        ...ps,
        controlnet_units,
        subseed: -1,
        override_settings: {},
        override_settings_restore_afterwards: true,
    }

    return controlnet_payload
}
function refreshControlNetTab() {}

for (let index = 0; index < g_controlnet_max_supported_models; index++) {
    //event listeners
    document
        .getElementById('slControlNetGuidanceStrength_' + index)
        .addEventListener('input', (evt) => {
            // debugger
            const sd_value = general.mapRange(evt.target.value, 0, 100, 0, 1) // convert slider value to SD ready value
            document.getElementById(
                'lControlNetGuidanceStrength_' + index
            ).textContent = Number(sd_value).toFixed(2)
        })

    document
        .getElementById('slControlNetWeight_' + index)
        .addEventListener('input', (evt) => {
            // debugger
            const sd_value = general.mapRange(evt.target.value, 0, 100, 0, 2) // convert slider value to SD ready value
            document.getElementById('lControlNetWeight_' + index).textContent =
                Number(sd_value).toFixed(2)
        })
    document
        .getElementById('bSetControlImage_' + index)
        .addEventListener('click', async () => {
            const selectionInfo =
                await selection.Selection.getSelectionInfoExe()
            if (selectionInfo) {
                await g_generation_session.setControlNetImage(index)
            } else {
                await note.Notification.inactiveSelectionArea()
            }
        })

    document
        .getElementById('bControlMask_' + index)
        .addEventListener('click', async () => {
            // const selectionInfo = await selection.Selection.getSelectionInfoExe()

            if (
                g_generation_session.control_net_selection_info &&
                g_generation_session.controlNetMask[index]
            ) {
                const selection_info =
                    g_generation_session.control_net_selection_info
                const layer = await io.IO.base64ToLayer(
                    g_generation_session.controlNetMask[index],
                    'ControlNet Mask.png',
                    selection_info.left,
                    selection_info.top,
                    selection_info.width,
                    selection_info.height
                )
            } else {
                // await note.Notification.inactiveSelectionArea()
                app.showAlert('Mask Image is not available')
            }
        })
}

module.exports = {
    requestControlNetModelList,
    populateModelMenu,
    initializeControlNetTab,
    getControlNetWeight,
    mapPluginSettingsToControlNet,
    getEnableControlNet,
    getSelectedModule,
    getSelectedModel,
    getControlNetMaxModelsNumber,
}
