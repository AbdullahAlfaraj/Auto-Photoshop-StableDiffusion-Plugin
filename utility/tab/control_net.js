const api = require('../api')
const html_manip = require('../html_manip')
const selection = require('../../selection')
const note = require('../notification')
const controlnet_preset = require('../presets/controlnet_preset')
const preset = require('../presets/preset')
const Enum = require('../../enum')
const event = require('../event')

const g_controlnet_max_supported_models = 3
let g_controlnet_presets
class ControlNetUnit {
    static {}

    static resetUnit(index) {
        const controlnet_unit_default = {
            module: null,
            model: null,
            weight: 1.0,
            resize_mode: null,
            lowvram: null,
            processor_res: null,
            threshold_a: null,
            threshold_b: null,

            guidance_start: 0,
            guidance_end: 1,
            guessmode: null,
        }
        this.setUnit(index, controlnet_unit_default)
    }

    static resetUnits() {
        for (let i = 0; i < g_controlnet_max_supported_models; ++i) {
            this.resetUnit(i)
        }
    }
    static getUnit(index) {
        const controlnet_unit = {
            module: this.getModule(index),
            model: this.getModel(index),
            weight: this.getWeight(index),
            resize_mode: null,
            lowvram: null,
            processor_res: null,
            threshold_a: null,
            threshold_b: null,

            guidance_start: this.getGuidanceStrengthStart(index),
            guidance_end: this.getGuidanceStrengthEnd(index),
            guessmode: null,
        }
        return controlnet_unit
    }
    static setUnit(index, unit_settings) {
        const controlnet_unit_setters = {
            module: this.setModule,
            model: this.setModel,
            weight: this.setWeight,
            resize_mode: null,
            lowvram: null,
            processor_res: null,
            threshold_a: null,
            threshold_b: null,

            guidance_start: this.setGuidanceStrengthStart,
            guidance_end: this.setGuidanceStrengthEnd,
            guessmode: null,
        }

        for (const [name, value] of Object.entries(unit_settings)) {
            try {
                if (
                    controlnet_unit_setters.hasOwnProperty(name)
                    //&& value.toString() // check if it has a value, null return error; undefine return error; 0 pass
                ) {
                    // if (value) {
                    const setter = controlnet_unit_setters[name]

                    setter(index, value)
                    // }
                }
            } catch (e) {
                console.warn(e)
            }
        }
    }
    static getUnits() {
        const controlnet_units = {}

        for (let i = 0; i < g_controlnet_max_supported_models; ++i) {
            controlnet_units[i] = this.getUnit(i)
        }
        return controlnet_units
    }
    static setUnits(controlnet_units) {
        for (const [index, unit] of Object.entries(controlnet_units)) {
            try {
                this.setUnit(index, unit)
            } catch (e) {
                console.warn(e)
            }
        }
    }
    static doesUnitExist(index) {
        //TODO: check if controlnet unit exist
        if (index >= 0) {
        }
    }

    static getModule(index) {
        const module = getSelectedModule(index)
        return module
    }
    static setModule(index, module_item) {
        try {
            const module_menu_id = 'mModulesMenuControlNet_' + index
            html_manip.selectMenuItem(module_menu_id, module_item)
        } catch (e) {
            html_manip.unselectMenuItem(module_menu_id)
            console.warn(e)
        }
    }
    static getModel(index) {
        const model = getSelectedModel(index)
        return model
    }
    static setModel(index, model_item) {
        try {
            const model_menu_id = 'mModelsMenuControlNet_' + index
            html_manip.selectMenuItem(model_menu_id, model_item)
        } catch (e) {
            html_manip.unselectMenuItem(model_menu_id)
            console.warn(e)
        }
    }
    static getWeight(index = 0) {
        const weight = getWeight(index)
        return weight
    }
    static setWeight(index, weight) {
        setWeight(index, weight)
    }
    static getGuidanceStrengthStart(index) {
        const guidance_strength = getControlNetGuidanceStrengthStart(index)
        return guidance_strength
    }
    static setGuidanceStrengthStart(index, sd_value) {
        setControlNetGuidanceStrengthStart(index, sd_value)
    }
    static getGuidanceStrengthEnd(index) {
        const guidance_strength = getControlNetGuidanceStrengthEnd(index)
        return guidance_strength
    }
    static setGuidanceStrengthEnd(index, sd_value) {
        setControlNetGuidanceStrengthEnd(index, sd_value)
    }

    static getControlNetUnitJson(index = 0) {}
}

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
                'mModulesMenuControlNet_' + index,
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

function getControlNetGuidanceStrengthStart(index) {
    sd_value = html_manip.getSliderSdValue(
        'slControlNetGuidanceStrengthStart_' + index,
        0,
        100,
        0,
        1
    )
    return sd_value
}
function setControlNetGuidanceStrengthStart(index, sd_value) {
    const slider_id = 'slControlNetGuidanceStrengthStart_' + index
    const label_id = 'lControlNetGuidanceStrengthStart_' + index
    html_manip.setSliderSdValue(slider_id, label_id, sd_value, 0, 100, 0, 1)
}

function setControlNetEnable(index, sd_value) {
    const slider_id = 'slControlNetGuidanceStrengthStart_' + index
    const label_id = 'lControlNetGuidanceStrengthStart_' + index
    html_manip.setSliderSdValue(slider_id, label_id, sd_value, 0, 100, 0, 1)
}

function getControlNetGuidanceStrengthEnd(index) {
    sd_value = html_manip.getSliderSdValue(
        'slControlNetGuidanceStrengthEnd_' + index,
        0,
        100,
        0,
        1
    )
    return sd_value
}
function setControlNetGuidanceStrengthEnd(index, sd_value) {
    const slider_id = 'slControlNetGuidanceStrengthEnd_' + index
    const label_id = 'lControlNetGuidanceStrengthEnd_' + index
    html_manip.setSliderSdValue(slider_id, label_id, sd_value, 0, 100, 0, 1)
}

// controlnet settings getters
function getControlNetWeightGuidanceStrengthStart(controlnet_index = 0) {
    const slider_value = document.getElementById(
        'slControlNetGuidanceStrengthStart_' + controlnet_index
    ).value
    const sd_value = general.mapRange(slider_value, 0, 100, 0, 1) // convert slider value to SD ready value
    return sd_value
}

function getControlNetWeightGuidanceStrengthEnd(controlnet_index = 0) {
    const slider_value = document.getElementById(
        'slControlNetGuidanceStrengthEnd_' + controlnet_index
    ).value
    const sd_value = general.mapRange(slider_value, 0, 100, 0, 1) // convert slider value to SD ready value
    return sd_value
}

function getWeight(controlnet_index = 0) {
    const slider_value = document.getElementById(
        'slControlNetWeight_' + controlnet_index
    ).value

    const sd_value = general.mapRange(slider_value, 0, 100, 0, 2) // convert slider value to SD ready value
    return sd_value
}
function setWeight(index = 0, sd_weight) {
    const slider_id = 'slControlNetWeight_' + index
    const label_id = 'lControlNetWeight_' + index
    // const  = general.mapRange(slider_value, 0, 100, 0, 2) // convert slider value to SD ready value
    // document.getElementById(slider_id).value = sd_wegith
    html_manip.setSliderSdValue(slider_id, label_id, sd_weight, 0, 100, 0, 2)
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
function setEnable(index) {
    document.getElementById('chEnableControlNet_' + index).checked =
        b_live_update
}
function getSelectedModule(controlnet_index = 0) {
    const module_name = html_manip.getSelectedMenuItemTextContent(
        'mModulesMenuControlNet_' + controlnet_index
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

    // debugger
    let active_index = 0
    for (let index = 0; index < g_controlnet_max_supported_models; index++) {
        if (getEnableControlNet(index)) {
            controlnet_units[active_index] = {
                input_image: g_generation_session.controlNetImage[index],
                mask: '',
                module: getSelectedModule(index),
                model: getSelectedModel(index),
                weight: getWeight(index),
                resize_mode: 'Scale to Fit (Inner Fit)',
                lowvram: getUseLowVram(index),
                processor_res: 512,
                threshold_a: 64,
                threshold_b: 64,
                // guidance: ,
                guidance_start: getControlNetWeightGuidanceStrengthStart(index),
                guidance_end: getControlNetWeightGuidanceStrengthEnd(index),
                guessmode: false,
            }
            active_index++
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

async function populateControlNetPresetMenu() {
    // const default_preset_name = 'Select CtrlNet Preset'
    // const default_preset_settings = {} // empty preset

    const custom_presets = await preset.getAllCustomPresetsSettings(
        Enum.PresetTypeEnum['ControlNetPreset']
    )
    g_controlnet_presets = {
        'Select CtrlNet Preset': {},
        ...controlnet_preset.ControlNetNativePresets,
        ...custom_presets,
    }

    const presets_names = Object.keys(g_controlnet_presets)

    html_manip.populateMenu(
        'mControlNetPresetMenu',
        'mControlNetPresetMenuItem',
        presets_names,
        (preset_name, item_html_element) => {
            item_html_element.innerHTML = preset_name
        }
    )
    html_manip.selectMenuItem('mControlNetPresetMenu', 'Select CtrlNet Preset')
}

document
    .getElementById('mControlNetPresetMenu')
    .addEventListener('change', async (evt) => {
        try {
            ControlNetUnit.resetUnits()
            const preset_index = evt.target.selectedIndex
            const preset_name = evt.target.options[preset_index].textContent
            units_settings = g_controlnet_presets[preset_name]

            ControlNetUnit.setUnits(units_settings)
        } catch (e) {
            console.warn(e)
        }
    })

document
    .getElementById('bSetAllControlImage')
    .addEventListener('click', async () => {
        const selectionInfo = await selection.Selection.getSelectionInfoExe()
        if (selectionInfo) {
            const base64_image =
                await g_generation_session.setControlNetImageHelper()

            for (
                index = 0;
                index < g_controlnet_max_supported_models;
                index++
            ) {
                await g_generation_session.setControlNetImage(
                    index,
                    base64_image
                )
            }
        } else {
            await note.Notification.inactiveSelectionArea()
        }
    })

for (let index = 0; index < g_controlnet_max_supported_models; index++) {
    //event listeners
    document
        .getElementById('slControlNetGuidanceStrengthStart_' + index)
        .addEventListener('input', (evt) => {
            // debugger
            const sd_value = general.mapRange(evt.target.value, 0, 100, 0, 1) // convert slider value to SD ready value
            document.getElementById(
                'lControlNetGuidanceStrengthStart_' + index
            ).textContent = Number(sd_value).toFixed(2)
        })

    document
        .getElementById('slControlNetGuidanceStrengthEnd_' + index)
        .addEventListener('input', (evt) => {
            // debugger
            const sd_value = general.mapRange(evt.target.value, 0, 100, 0, 1) // convert slider value to SD ready value
            document.getElementById(
                'lControlNetGuidanceStrengthEnd_' + index
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
                // debugger
                const base64_image =
                    await g_generation_session.setControlNetImageHelper()
                await g_generation_session.setControlNetImage(
                    index,
                    base64_image
                )
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

document
    .getElementById('mControlNetPresetMenu')
    .addEventListener('updatePresetMenuEvent', async (event) => {
        // console.log("I'm listening on a custom event")
        await populateControlNetPresetMenu()
    })
async function initializeControlNetTab(controlnet_max_models) {
    try {
        if (controlnet_max_models > g_controlnet_max_supported_models)
            controlnet_max_models = g_controlnet_max_supported_models

        await populateControlNetPresetMenu()

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

module.exports = {
    requestControlNetModelList,
    populateModelMenu,
    initializeControlNetTab,
    getWeight,
    mapPluginSettingsToControlNet,
    getEnableControlNet,
    getSelectedModule,
    getSelectedModel,
    getControlNetMaxModelsNumber,
    getControlNetGuidanceStrengthStart,
    setControlNetGuidanceStrengthStart,
    getControlNetGuidanceStrengthEnd,
    setControlNetGuidanceStrengthEnd,
    ControlNetUnit,
    populateControlNetPresetMenu,
}
