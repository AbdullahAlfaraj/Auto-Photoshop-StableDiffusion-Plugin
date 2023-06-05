const api = require('../api')
const html_manip = require('../html_manip')
const selection = require('../../selection')
const note = require('../notification')
const controlnet_preset = require('../presets/controlnet_preset')
const preset = require('../presets/preset')
const Enum = require('../../enum')
const event = require('../event')

// const g_controlnet_max_supported_models = 3
let g_controlnet_presets
let g_module_detail

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
            // guessmode: null,
        }
        this.setUnit(index, controlnet_unit_default)
    }

    static resetUnits() {
        for (let i = 0; i < g_controlnet_max_models; ++i) {
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
            // guessmode: null,
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
            // guessmode: null,
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

        for (let i = 0; i < g_controlnet_max_models; ++i) {
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
            const module_menu_element = controlnetElement(
                index,
                '.mModulesMenuControlNet_'
            )

            html_manip.selectMenuItemByElement(module_menu_element, module_item)
            // module_menu_element.dispatchEvent(new Event('click'))
            // module_menu_element.click()
            changeModule(module_item, index)
        } catch (e) {
            html_manip.unselectMenuItemByElement(module_menu_element)
            console.warn(e)
        }
    }
    static getModel(index) {
        const model = getSelectedModel(index)
        return model
    }
    static setModel(index, model_item) {
        try {
            const model_menu_element = controlnetElement(
                index,
                '.mModelsMenuControlNet_'
            )
            html_manip.selectMenuItemByElement(model_menu_element, model_item)
        } catch (e) {
            html_manip.unselectMenuItemByElement(model_menu_element)
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
    static getProcessorRes(index) {
        const slider = controlnetElement(index, '.slControlNetProcessorRes_')

        return slider.value
    }
    static setProcessorRes(index, sd_value) {
        const slider = controlnetElement(index, '.slControlNetProcessorRes_')
        slider.value = sd_value
    }
    static getThreshold(index, a_or_b) {
        let slider
        if (a_or_b === 'a') {
            slider = controlnetElement(index, '.slControlNetThreshold_A_')
        } else if (a_or_b === 'b') {
            slider = controlnetElement(index, '.slControlNetThreshold_B_')
        }

        const sd_value = general.mapRange(
            slider.value,
            slider.min,
            slider.max,
            slider.dataset['sd_min'],
            slider.dataset['sd_max']
        )
        return sd_value
    }
    static setThreshold(index, a_or_b, sd_value) {
        let slider
        let label
        if (a_or_b === 'a') {
            slider = controlnetElement(index, '.slControlNetThreshold_A_')
            label = controlnetElement(index, '.lControlNetThreshold_A_')
        } else if (a_or_b === 'b') {
            slider = controlnetElement(index, '.slControlNetThreshold_B_')
            label = controlnetElement(index, '.lControlNetThreshold_B_')
        }

        const slider_value = general.mapRange(
            sd_value,
            slider.dataset['sd_min'],
            slider.dataset['sd_max'],
            slider.min,
            slider.max
        )
        slider.value = String(slider_value)
        label.innerText = String(sd_value)
    }

    static getControlNetUnitJson(index = 0) {}
}

async function checkIfControlNetInstalled() {}

async function requestControlNetDetectMap(
    controlnet_init_image,
    _module,
    processor_res,
    threshold_a,
    threshold_b
) {
    try {
        const payload = {
            controlnet_module: _module,
            controlnet_input_images: [controlnet_init_image],
            controlnet_processor_res: processor_res,
            controlnet_threshold_a: threshold_a,
            controlnet_threshold_b: threshold_b,
        }
        const full_url = `${g_sd_url}/controlnet/detect`

        const response_data = await api.requestPost(full_url, payload)

        // update the mask preview with the new detectMap
        if (response_data['images'].length === 0) {
            app.showAlert(response_data['info'])
        }
        return response_data['images'][0]
    } catch (e) {
        console.warn('requestControlNetDetectMap(): ', _module, e)
    }
}

async function requestControlNetVersion() {
    const json = await api.requestGet(`${g_sd_url}/controlnet/version`)

    const version = json?.version

    return version
}
async function requestControlNetMaxUnits() {
    const json = await api.requestGet(`${g_sd_url}/controlnet/settings`)

    const control_net_max_models_num = json?.control_net_max_models_num ?? 1

    return control_net_max_models_num
}

async function requestControlNetModelList() {
    const control_net_json = await api.requestGet(
        `${g_sd_url}/controlnet/model_list`
    )

    const model_list = control_net_json?.model_list

    return model_list
}

async function requestControlNetModuleList() {
    const result = await api.requestGet(
        `${g_sd_url}/controlnet/module_list?alias_names=1`
    )

    return result?.module_list
}
async function populateModelMenu() {
    try {
        const models = await requestControlNetModelList()
        for (let index = 0; index < g_controlnet_max_models; index++) {
            const menu_element = controlnetElement(
                index,
                '.mModelsMenuControlNet_'
            )
            html_manip.populateMenuByElement(
                menu_element,
                'mModelsMenuItemControlNet_',
                models,
                (item, item_html_element) => {
                    item_html_element.innerHTML = item
                    item_html_element.dataset['index'] = index
                },
                false,
                'Select Model'
            )
        }
    } catch (e) {
        console.warn(e)
    }
}

function changeModule(_module, index) {
    // const index = index

    const preprocessor_res_element = controlnetElement(
        index,
        '.slControlNetProcessorRes_'
    )

    const threshold_a_element = controlnetElement(
        index,
        '.slControlNetThreshold_A_'
    )
    const threshold_b_element = controlnetElement(
        index,
        '.slControlNetThreshold_B_'
    )

    const detail = g_module_detail[_module]

    function remapArray(arr) {
        let obj = {
            preprocessor_res: arr[0] || null,
            threshold_a: arr[1] || null,
            threshold_b: arr[2] || null,
        }
        return obj
    }
    const params = remapArray(detail['sliders'])
    const model_free = detail.model_free

    // threshold_a_element.min = prams.
    //     threshold_a_element.max =

    if (model_free)
        controlnetElement(
            index,
            '.mModelsMenuControlNet_'
        ).parentElement.style.display = 'none'
    else
        controlnetElement(
            index,
            '.mModelsMenuControlNet_'
        ).parentElement.style.display = 'block'

    if (params?.preprocessor_res) {
        const preprocessor_res_label_element = controlnetElement(
            index,
            '.labelControlNetProcessorRes_'
        )
        preprocessor_res_element.style.display = 'block'
        preprocessor_res_label_element.innerText = params.preprocessor_res.name
    } else {
        preprocessor_res_element.style.display = 'none'
    }
    if (params?.threshold_a) {
        const threshold_a_label_element = controlnetElement(
            index,
            '.labelControlNetThreshold_A_'
        )

        threshold_a_element.dataset['sd_min'] = params.threshold_a.min
        threshold_a_element.dataset['sd_max'] = params.threshold_a.max
        ControlNetUnit.setThreshold(index, 'a', params.threshold_a.value)
        threshold_a_element.style.display = 'block'
        threshold_a_label_element.innerText = params.threshold_a.name + ':'
    } else {
        ControlNetUnit.setThreshold(index, 'a', 32)
        threshold_a_element.style.display = 'none'
    }

    if (params?.threshold_b) {
        const threshold_b_label_element = controlnetElement(
            index,
            '.labelControlNetThreshold_B_'
        )

        threshold_b_element.dataset['sd_min'] = params.threshold_b.min
        threshold_b_element.dataset['sd_max'] = params.threshold_b.max
        ControlNetUnit.setThreshold(index, 'b', params.threshold_b.value)
        threshold_b_element.style.display = 'block'
        threshold_b_label_element.innerText = params.threshold_b.name + ':'
    } else {
        ControlNetUnit.setThreshold(index, 'b', 32)
        threshold_b_element.style.display = 'none'
    }
}
async function populatePreprocessorMenu() {
    try {
        const modules = await requestControlNetModuleList()
        for (let index = 0; index < g_controlnet_max_models; index++) {
            const menu_element = controlnetElement(
                index,
                '.mModulesMenuControlNet_'
            )

            menu_element.dataset['index'] = String(index)
            html_manip.populateMenuByElement(
                menu_element,
                'mModuleMenuItemControlNet_',
                modules,
                (item, item_html_element) => {
                    item_html_element.innerHTML = item
                    item_html_element.dataset['index'] = index
                },
                false,
                'Select Module'
            )

            menu_element.addEventListener('click', (event) => {
                changeModule(
                    event.target.innerText,
                    event.target.dataset['index']
                )
            })
        }
    } catch (e) {
        console.warn(e)
    }
}
function controlnetElement(index, class_) {
    const element = document.querySelector(
        `#controlnet_settings_${index} ${class_}`
    )
    return element
}
function getControlNetGuidanceStrengthStart(index) {
    const slider_element = document.querySelector(
        `#controlnet_settings_${index} .slControlNetGuidanceStrengthStart_`
    )
    const sd_value = html_manip.getSliderSdValueByElement(
        slider_element,
        0,
        100,
        0,
        1
    )
    return sd_value
}
function setControlNetGuidanceStrengthStart(index, sd_value) {
    const slider_element = controlnetElement(
        index,
        '.slControlNetGuidanceStrengthStart_'
    )

    const label_element = controlnetElement(
        index,
        '.lControlNetGuidanceStrengthStart_'
    )
    html_manip.setSliderSdValueByElements(
        slider_element,
        label_element,
        sd_value,
        0,
        100,
        0,
        1
    )
}

function getControlNetGuidanceStrengthEnd(index) {
    const slider_element = controlnetElement(
        index,
        '.slControlNetGuidanceStrengthEnd_'
    )
    const sd_value = html_manip.getSliderSdValueByElement(
        slider_element,
        0,
        100,
        0,
        1
    )
    return sd_value
}
function setControlNetGuidanceStrengthEnd(index, sd_value) {
    const slider_element = controlnetElement(
        index,
        '.slControlNetGuidanceStrengthEnd_'
    )

    const label_element = controlnetElement(
        index,
        '.lControlNetGuidanceStrengthEnd_'
    )
    html_manip.setSliderSdValueByElements(
        slider_element,
        label_element,
        sd_value,
        0,
        100,
        0,
        1
    )
}

// controlnet settings getters
function getControlNetWeightGuidanceStrengthStart(index = 0) {
    const slider_element = controlnetElement(
        index,
        '.slControlNetGuidanceStrengthStart_'
    )
    const slider_value = slider_element.value
    const sd_value = general.mapRange(slider_value, 0, 100, 0, 1) // convert slider value to SD ready value
    return sd_value
}

function getControlNetWeightGuidanceStrengthEnd(index = 0) {
    const slider_value = controlnetElement(
        index,
        '.slControlNetGuidanceStrengthEnd_'
    ).value

    const sd_value = general.mapRange(slider_value, 0, 100, 0, 1) // convert slider value to SD ready value
    return sd_value
}

function getWeight(index = 0) {
    const slider_value = document.querySelector(
        `#controlnet_settings_${index} .slControlNetWeight_`
    ).value

    const sd_value = general.mapRange(slider_value, 0, 100, 0, 2) // convert slider value to SD ready value
    return sd_value
}
function setWeight(index = 0, sd_weight) {
    const slider_element = document.querySelector(
        `#controlnet_settings_${index} .slControlNetWeight_`
    )
    const label_element = document.querySelector(
        `#controlnet_settings_${index} .lControlNetWeight_`
    )

    html_manip.setSliderSdValueByElements(
        slider_element,
        label_element,
        sd_weight,
        0,
        100,
        0,
        2
    )
}
function getUseLowVram(index = 0) {
    const b_result = document.querySelector(
        `#controlnet_settings_${index} .chlowVram_`
    ).checked
    return b_result
}
function getEnableControlNet(index = 0) {
    const is_enable = document.querySelector(
        `#controlnet_settings_${index} .chEnableControlNet_`
    ).checked
    return is_enable
}
function setEnable(index) {
    document.querySelector(
        `#controlnet_settings_${index} .chEnableControlNet_`
    ).checked = b_live_update
}
function getSelectedModule(index = 0) {
    const menu_element = controlnetElement(index, '.mModulesMenuControlNet_')

    const module_name =
        html_manip.getSelectedMenuItemTextContentByElement(menu_element)

    return module_name
}
function getSelectedModel(index = 0) {
    const menu_element = controlnetElement(index, '.mModelsMenuControlNet_')
    const model_name =
        html_manip.getSelectedMenuItemTextContentByElement(menu_element)
    return model_name
}
function getUseGuessMode(index = 0) {
    const is_guess_mode = document.querySelector(
        `#controlnet_settings_${index} .chGuessMode_`
    ).checked

    return is_guess_mode
}

function getControlNetMode(index = 0) {
    const controlnet_mode = document.querySelector(
        `#controlnet_settings_${index} .rgControlNetMode_`
    ).selected

    return controlnet_mode
}

function getControlNetPixelPerfect(index = 0) {
    const pixel_perfect = document.querySelector(
        `#controlnet_settings_${index} .chPixelPerfect_`
    ).checked

    return pixel_perfect
}
function isControlNetModeEnable() {
    let is_tab_enabled = !document.getElementById('chDisableControlNetTab')
        .checked

    let numOfEnabled = 0
    if (g_controlnet_max_models <= 0) {
        return false
    }

    if (is_tab_enabled) {
        for (let index = 0; index < g_controlnet_max_models; index++) {
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
// function getControlNetMaxModelsNumber() {
//     return g_controlnet_max_supported_models
// }

function preprocessorData(
    processor_res = 512,
    threshold_a = 64,
    threshold_b = 64,
    a_min = 64,
    a_max = 1024,
    b_min = 64,
    b_max = 1024,
    processor_res_label = 'Annotator resolution',
    threshold_a_label = 'threshold a',
    threshold_b_label = 'threshold b'
) {
    return {
        processor_res,
        threshold_a,
        threshold_b,
        a_min,
        a_max,
        b_min,
        b_max,
        processor_res_label,
        threshold_a_label,
        threshold_b_label,
    }
}

function mapPluginSettingsToControlNet(plugin_settings) {
    const ps = plugin_settings // for shortness
    let controlnet_units = []

    let active_index = 0
    for (let index = 0; index < g_controlnet_max_models; index++) {
        const preprocessor_name = getSelectedModule(index)

        controlnet_units[active_index] = {
            enabled: getEnableControlNet(index),
            input_image: g_generation_session.controlNetImage[index],
            mask: '',
            module: getSelectedModule(index),
            model: getSelectedModel(index),
            weight: getWeight(index),
            resize_mode: 'Scale to Fit (Inner Fit)',
            lowvram: getUseLowVram(index),
            processor_res: ControlNetUnit.getProcessorRes(index),
            threshold_a: ControlNetUnit.getThreshold(index, 'a'),
            threshold_b: ControlNetUnit.getThreshold(index, 'b'),
            // guidance: ,
            guidance_start: getControlNetWeightGuidanceStrengthStart(index),
            guidance_end: getControlNetWeightGuidanceStrengthEnd(index),
            // guessmode: false,
            control_mode: parseInt(getControlNetMode()),
            pixel_perfect: getControlNetPixelPerfect(),
        }
        active_index++
    }

    // if (
    //     plugin_settings['mode'] === Enum.generationModeEnum['Img2Img'] ||
    //     plugin_settings['mode'] === Enum.generationModeEnum['Inpaint'] ||
    //     plugin_settings['mode'] === Enum.generationModeEnum['Outpaint']
    // ) {
    //     const b_use_guess_mode = getUseGuessMode()
    //     controlnet_units[0]['guessmode'] = b_use_guess_mode
    // }

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

            for (index = 0; index < g_controlnet_max_models; index++) {
                await g_generation_session.setControlNetImage(
                    index,
                    base64_image
                )
            }
        } else {
            await note.Notification.inactiveSelectionArea()
        }
    })

function initControlNetUnitsEventListeners(controlnet_max_models) {
    for (let index = 0; index < controlnet_max_models; index++) {
        //event listeners
        controlnetElement(
            index,
            '.slControlNetGuidanceStrengthStart_'
        ).addEventListener('input', (evt) => {
            const sd_value = general.mapRange(evt.target.value, 0, 100, 0, 1) // convert slider value to SD ready value
            controlnetElement(
                index,
                '.lControlNetGuidanceStrengthStart_'
            ).textContent = Number(sd_value).toFixed(2)
        })

        controlnetElement(
            index,
            '.slControlNetGuidanceStrengthEnd_'
        ).addEventListener('input', (evt) => {
            const sd_value = general.mapRange(evt.target.value, 0, 100, 0, 1) // convert slider value to SD ready value
            controlnetElement(
                index,
                '.lControlNetGuidanceStrengthEnd_'
            ).textContent = Number(sd_value).toFixed(2)
        })

        document
            .querySelector(`#controlnet_settings_${index} .slControlNetWeight_`)
            .addEventListener('input', (evt) => {
                const sd_value = general.mapRange(
                    evt.target.value,
                    0,
                    100,
                    0,
                    2
                ) // convert slider value to SD ready value
                document.querySelector(
                    `#controlnet_settings_${index} .lControlNetWeight_`
                ).textContent = Number(sd_value).toFixed(2)
            })

        // controlnetElement(index, '.slControlNetProcessorRes_').addEventListener(
        //     'input',
        //     (evt) => {
        //
        //         const sd_value = general.mapRange(
        //             evt.target.value,
        //             64,
        //             2048,
        //             64,
        //             2048
        //         ) // convert slider value to SD ready value
        //         controlnetElement(index, '.lControlNetProcessorRes_').textContent =
        //             Number(sd_value).toFixed(2)
        //     }
        // )
        controlnetElement(index, '.slControlNetThreshold_A_').addEventListener(
            'input',
            (event) => {
                const slider = event.target
                const sd_value = Number(
                    general
                        .mapRange(
                            slider.value,
                            slider.min,
                            slider.max,
                            slider.dataset['sd_min'],
                            slider.dataset['sd_max']
                        )
                        .toFixed(2)
                )
                controlnetElement(index, '.lControlNetThreshold_A_').innerText =
                    String(sd_value)
                // ControlNetUnit.setThreshold(index, 'a', sd_value)
                // controlnetElement(index, '.lControlNetThreshold_A_').value =
                //     sd_value
            }
        )
        controlnetElement(index, '.slControlNetThreshold_B_').addEventListener(
            'input',
            (event) => {
                const slider = event.target
                const sd_value = Number(
                    general
                        .mapRange(
                            slider.value,
                            slider.min,
                            slider.max,
                            slider.dataset['sd_min'],
                            slider.dataset['sd_max']
                        )
                        .toFixed(2)
                )
                controlnetElement(index, '.lControlNetThreshold_B_').innerText =
                    String(sd_value)
                // ControlNetUnit.setThreshold(index, 'a', sd_value)
                // controlnetElement(index, '.lControlNetThreshold_A_').value =
                //     sd_value
            }
        )
        document
            .querySelector(`#controlnet_settings_${index} .bSetControlImage_`)
            .addEventListener('click', async () => {
                const selectionInfo =
                    await selection.Selection.getSelectionInfoExe()
                if (selectionInfo) {
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
            .querySelector(`#controlnet_settings_${index} .bControlMask_`)
            .addEventListener('click', async () => {
                await previewAnnotator(index)
            })
    }
}
document
    .getElementById('mControlNetPresetMenu')
    .addEventListener('updatePresetMenuEvent', async (event) => {
        // console.log("I'm listening on a custom event")
        await populateControlNetPresetMenu()
    })

async function previewAnnotator(index) {
    try {
        const controlnet_init_image =
            g_generation_session.controlNetImage[index]
        const _module = ControlNetUnit.getModule(index)
        const processor_res = ControlNetUnit.getProcessorRes(index)
        const threshold_a = ControlNetUnit.getThreshold(index, 'a')
        const threshold_b = ControlNetUnit.getThreshold(index, 'b')
        if (!controlnet_init_image) {
            const error = 'ControlNet initial image is empty'
            app.showAlert(error)
            throw error
        }
        if (!_module || _module === 'none') {
            const error = 'select a valid controlnet module (preprocessor)'
            app.showAlert(error)
            throw error
        }

        const detect_map = await requestControlNetDetectMap(
            controlnet_init_image,
            _module,
            processor_res,
            threshold_a,
            threshold_b
        )

        const rgb_detect_map_url =
            await io.convertBlackAndWhiteImageToRGBChannels3(detect_map)
        const rgb_detect_map = general.base64UrlToBase64(rgb_detect_map_url)
        g_generation_session.controlNetMask[index] = rgb_detect_map

        html_manip.setControlMaskSrc(rgb_detect_map_url, index)
    } catch (e) {
        console.warn('PreviewAnnotator click(): index: ', index, e)
    }
}
async function previewAnnotatorFromCanvas(index) {
    try {
        const _module = ControlNetUnit.getModule(index)

        const width = html_manip.getWidth()
        const height = html_manip.getHeight()
        const selectionInfo = await psapi.getSelectionInfoExe()
        g_generation_session.control_net_preview_selection_info = selectionInfo
        const base64 = await io.IO.getSelectionFromCanvasAsBase64Interface_New(
            width,
            height,
            selectionInfo,
            true
        )

        if (!_module || _module === 'none') {
            const error = 'select a valid controlnet module (preprocessor)'
            app.showAlert(error)
            throw error
        }

        const processor_res = ControlNetUnit.getProcessorRes(index)
        const threshold_a = ControlNetUnit.getThreshold(index, 'a')
        const threshold_b = ControlNetUnit.getThreshold(index, 'b')

        const detect_map = await requestControlNetDetectMap(
            base64,
            _module,
            processor_res,
            threshold_a,
            threshold_b
        )

        const rgb_detect_map_url =
            await io.convertBlackAndWhiteImageToRGBChannels3(detect_map)
        g_generation_session.controlNetMask[index] = detect_map
        html_manip.setControlMaskSrc(rgb_detect_map_url, index)
    } catch (e) {
        console.warn('PreviewAnnotator click(): index: ', index, e)
    }
}
// document
//     .getElementById('bPreviewAnnotator_0')
//     .addEventListener('click', async (event) => {
//         const index = parseInt(event.target.dataset['controlnet-index'])
//         await previewAnnotator(index)
//     })

function initPreviewElement(index) {
    //make init mask image use the thumbnail class with buttons
    // const mask_image_html = document.getElementById(
    //     'control_net_preview_image_0'
    // )

    const mask_image_html = controlnetElement(index, '.control_net_mask_')
    const mask_parent_element = mask_image_html.parentElement

    this.thumbnail_container = thumbnail.Thumbnail.wrapImgInContainer(
        mask_image_html,
        'viewer-image-container'
    )

    mask_parent_element.appendChild(thumbnail_container)

    async function toCanvas(index) {
        if (
            g_generation_session.control_net_preview_selection_info &&
            g_generation_session.controlNetMask[index]
        ) {
            const selection_info =
                g_generation_session.control_net_preview_selection_info
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
    }
    async function toControlNetInitImage(index) {
        const preview_result_base64 = g_generation_session.controlNetMask[index]
        g_generation_session.controlNetImage[index] = preview_result_base64
        g_generation_session.control_net_selection_info =
            g_generation_session.control_net_preview_selection_info

        const rgb_detect_map_url =
            await io.convertBlackAndWhiteImageToRGBChannels3(
                preview_result_base64
            )

        // g_generation_session.controlNetMask[index] = rgb_detect_map

        html_manip.setControlImageSrc(rgb_detect_map_url, index)
    }
    thumbnail.Thumbnail.addSPButtonToContainer(
        this.thumbnail_container,
        'svg_sp_btn',
        'use as ControlNet init image',

        toControlNetInitImage,
        index
    )
    thumbnail.Thumbnail.addSPButtonToContainer(
        this.thumbnail_container,
        'svg_sp_btn_canvas',
        'move to the canvas',

        toCanvas,
        index
    )
    thumbnail.Thumbnail.addSPButtonToContainer(
        this.thumbnail_container,
        'svg_sp_btn_preview',
        'preview selection from canvas',

        previewAnnotatorFromCanvas,
        index
    )
}

function initControlNetUnit(index) {
    document.querySelector(
        `#controlnet_settings_${index} .controlnet_unit_label_`
    ).textContent = `Control Net Settings Slot ${index}`
}
async function initializeControlNetTab(controlnet_max_models) {
    try {
        if (controlnet_max_models <= 0) {
            document.getElementById('controlnetMissingError').style.display =
                'block'

            return
        }
        document.getElementById('controlnetMissingError').style.display = 'none'
        // if (controlnet_max_models > g_controlnet_max_models)
        //     controlnet_max_models = g_controlnet_max_models

        await populateControlNetPresetMenu()
        const parent_container = document.getElementById(
            'controlnet_parent_container'
        )
        parent_container.innerHTML = ''
        const controlnet_unit_template = document.getElementById(
            'controlnet_settings_template'
        )

        for (let index = 0; index < controlnet_max_models; index++) {
            const controlnet_unit = controlnet_unit_template.cloneNode(true)
            controlnet_unit.id = 'controlnet_settings_' + index
            controlnet_unit.dataset['index'] = String(index)
            parent_container.appendChild(controlnet_unit)
        }

        const full_url = `${g_sd_url}/controlnet/module_list?alias_names=1`
        let result_json = await api.requestGet(full_url)
        g_module_detail = result_json['module_detail']

        initControlNetUnitsEventListeners(controlnet_max_models) // add event listener to all units after cloning

        await populateModelMenu()
        await populatePreprocessorMenu()
        for (let index = 0; index < controlnet_max_models; index++) {
            document.getElementById(
                'controlnet_settings_' + index
            ).style.display = 'block'
            initPreviewElement(index)

            initControlNetUnit(index)
        }
        // const version = await requestControlNetVersion()
        // document.getElementById('ControlNetVersion').innerText = version
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
    // getControlNetMaxModelsNumber,
    getControlNetGuidanceStrengthStart,
    setControlNetGuidanceStrengthStart,
    getControlNetGuidanceStrengthEnd,
    setControlNetGuidanceStrengthEnd,
    ControlNetUnit,
    populateControlNetPresetMenu,
    isControlNetModeEnable,
    getModuleDetail() {
        return g_module_detail
    },
    requestControlNetVersion,
    requestControlNetMaxUnits,
}
