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

function preprocessor_res_json(
    label = 'Preprocessor resolution',
    minimum = 64,
    maximum = 2048,
    value = 512,
    step = 1
) {
    return {
        label,
        minimum,
        maximum,
        value,
        step,
    }
}
function threshold_a_json(
    label = 'Canny low threshold',
    minimum = 1,
    maximum = 255,
    value = 100,
    step = 1,
    visible = true,
    interactive = true
) {
    return { label, minimum, maximum, value, step, visible, interactive }
}
function threshold_b_json(
    label = 'Canny high threshold',
    minimum = 1,
    maximum = 255,
    value = 200,
    step = 1,
    visible = true,
    interactive = true
) {
    return {
        label,
        minimum,
        maximum,
        value,
        step,
        visible,
        interactive,
    }
}

const g_preprocessor_parms_new = {
    none: { preprocessor_res: null, threshold_a: null, threshold_b: null },

    canny: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 1)
        ),
        threshold_a: threshold_a_json(
            (label = 'Canny low threshold'),
            (minimum = 1),
            (maximum = 255),
            (value = 100),
            (step = 1),
            (visible = true),
            (interactive = true)
        ),
        threshold_b: threshold_b_json(
            (label = 'Canny high threshold'),
            (minimum = 1),
            (maximum = 255),
            (value = 200),
            (step = 1),
            (visible = true),
            (interactive = true)
        ),
    },
    depth: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 1)
        ),
        threshold_a: null,
        threshold_b: null,
    },
    depth_leres: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor Resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 1)
        ),
        threshold_a: threshold_a_json(
            (label = 'Remove Near %'),
            (minimum = 0),
            (maximum = 100),
            (value = 0),
            (step = 0.1),
            (visible = true),
            (interactive = true)
        ),
        threshold_b: threshold_b_json(
            (label = 'Remove Background %'),
            (minimum = 0),
            (maximum = 100),
            (value = 0),
            (step = 0.1),
            (visible = true),
            (interactive = true)
        ),
    },
    hed: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor Resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 1)
        ),
        threshold_a: null,
        threshold_b: null,
    },
    hed_safe: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor Resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 1)
        ),
        threshold_a: null,
        threshold_b: null,
    },
    mediapipe_face: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor Resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 8)
        ),
        threshold_a: threshold_a_json(
            (label = 'Max Faces'),
            (minimum = 1),
            (maximum = 10),
            (value = 1),
            (step = 1),
            (visible = true),
            (interactive = true)
        ),
        threshold_b: threshold_b_json(
            (label = 'Min Face Confidence'),
            (minimum = 0.01),
            (maximum = 1.0),
            (value = 0.5),
            (step = 0.01),
            (visible = true),
            (interactive = true)
        ),
    },
    mlsd: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor Resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 1)
        ),
        threshold_a: threshold_a_json(
            (label = 'Hough value threshold (MLSD)'),
            (minimum = 0.01),
            (maximum = 2.0),
            (value = 0.1),
            (step = 0.01),
            (visible = true),
            (interactive = true)
        ),
        threshold_b: threshold_b_json(
            (label = 'Hough distance threshold (MLSD)'),
            (minimum = 0.01),
            (maximum = 20.0),
            (value = 0.1),
            (step = 0.01),
            (visible = true),
            (interactive = true)
        ),
    },
    normal_map: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor Resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 1)
        ),
        threshold_a: threshold_a_json(
            (label = 'Normal background threshold'),
            (minimum = 0.0),
            (maximum = 1.0),
            (value = 0.4),
            (step = 0.01),
            (visible = true),
            (interactive = true)
        ),
        threshold_b: null,
    },
    openpose: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor Resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 1)
        ),
        threshold_a: null,
        threshold_b: null,
    },
    openpose_hand: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor Resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 1)
        ),
        threshold_a: null,
        threshold_b: null,
    },
    openpose_face: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor Resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 1)
        ),
        threshold_a: null,
        threshold_b: null,
    },
    openpose_faceonly: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor Resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 1)
        ),
        threshold_a: null,
        threshold_b: null,
    },
    openpose_full: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor Resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 1)
        ),
        threshold_a: null,
        threshold_b: null,
    },
    clip_vision: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor Resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 1)
        ),
        threshold_a: null,
        threshold_b: null,
    },
    color: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor Resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 8)
        ),
        threshold_a: null,
        threshold_b: null,
    },
    pidinet: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor Resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 8)
        ),
        threshold_a: null,
        threshold_b: null,
    },
    pidinet_safe: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor Resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 8)
        ),
        threshold_a: null,
        threshold_b: null,
    },
    pidinet_sketch: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor Resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 8)
        ),
        threshold_a: null,
        threshold_b: null,
    },
    pidinet_scribble: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor Resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 8)
        ),
        threshold_a: null,
        threshold_b: null,
    },
    scribble_xdog: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor Resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 8)
        ),
        threshold_a: threshold_a_json(
            (label = 'XDoG Threshold'),
            (minimum = 1.0),
            (maximum = 64.0),
            (value = 32.0),
            (step = 1.0),
            (visible = true),
            (interactive = true)
        ),
    },
    scribble_hed: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor Resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 8)
        ),
    },
    segmentation: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor Resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 1)
        ),
        threshold_a: null,
        threshold_b: null,
    },
    threshold: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 1)
        ),
        threshold_a: threshold_a_json(
            (label = 'Binarization Threshold'),
            (minimum = 0),
            (maximum = 255),
            (value = 127),
            (step = 1),
            (visible = true),
            (interactive = true)
        ),
        threshold_b: null,
    },
    depth_zoe: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 1)
        ),
        threshold_a: null,
        threshold_b: null,
    },
    normal_bae: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 1)
        ),
        threshold_a: null,
        threshold_b: null,
    },
    oneformer_coco: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 1)
        ),
        threshold_a: null,
        threshold_b: null,
    },
    oneformer_ade20k: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 1)
        ),
        threshold_a: null,
        threshold_b: null,
    },
    lineart: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 1)
        ),
        threshold_a: null,
        threshold_b: null,
    },
    lineart_coarse: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 1)
        ),
        threshold_a: null,
        threshold_b: null,
    },
    lineart_anime: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 1)
        ),
        threshold_a: null,
        threshold_b: null,
    },
    lineart_standard: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 1)
        ),
        threshold_a: null,
        threshold_b: null,
    },
    shuffle: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 1)
        ),
        threshold_a: null,
        threshold_b: null,
    },
    tile_resample: {
        preprocessor_res: null,
        threshold_a: threshold_a_json(
            (label = 'Down Sampling Rate'),
            (minimum = 1.0),
            (maximum = 8.0),
            (value = 1.0),
            (step = 0.01),
            (visible = true),
            (interactive = true)
        ),
        threshold_b: null,
    },
    inpaint: { preprocessor_res: null, threshold_a: null, threshold_b: null },
    invert: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 1)
        ),
        threshold_a: null,
        threshold_b: null,
    },
    lineart_anime_denoise: {
        preprocessor_res: preprocessor_res_json(
            (label = 'Preprocessor resolution'),
            (minimum = 64),
            (maximum = 2048),
            (value = 512),
            (step = 1)
        ),
        threshold_a: null,
        threshold_b: null,
    },
}

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

        // debugger

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

    // const module_list = g_sd_config_obj.getControlNetPreprocessors()

    const result = await api.requestGet(
        `${g_sd_url}/controlnet/module_list?alias_names=false`
    )

    // const module_list = g_controlnet_preprocessors
    return result?.module_list
}
async function populateModelMenu() {
    try {
        const models = await requestControlNetModelList()
        for (
            let index = 0;
            index < g_controlnet_max_supported_models;
            index++
        ) {
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

    const threshold_a_element = controlnetElement(
        index,
        '.slControlNetThreshold_A_'
    )
    const threshold_b_element = controlnetElement(
        index,
        '.slControlNetThreshold_B_'
    )

    const parms =
        _module in g_preprocessor_parms_new
            ? g_preprocessor_parms_new[_module]
            : g_preprocessor_parms_new['none']

    // threshold_a_element.min = prams.
    //     threshold_a_element.max =
    // debugger

    if (parms?.threshold_a) {
        const threshold_a_label_element = controlnetElement(
            index,
            '.labelControlNetThreshold_A_'
        )

        threshold_a_element.dataset['sd_min'] = parms.threshold_a.minimum
        threshold_a_element.dataset['sd_max'] = parms.threshold_a.maximum
        ControlNetUnit.setThreshold(index, 'a', parms.threshold_a.value)
        threshold_a_element.style.display = 'block'
        threshold_a_label_element.innerText = parms.threshold_a.label
    } else {
        ControlNetUnit.setThreshold(index, 'a', 32)
        threshold_a_element.style.display = 'none'
    }

    if (parms?.threshold_b) {
        const threshold_b_label_element = controlnetElement(
            index,
            '.labelControlNetThreshold_B_'
        )

        threshold_b_element.dataset['sd_min'] = parms.threshold_b.minimum
        threshold_b_element.dataset['sd_max'] = parms.threshold_b.maximum
        ControlNetUnit.setThreshold(index, 'b', parms.threshold_b.value)
        threshold_b_element.style.display = 'block'
        threshold_b_label_element.innerText = parms.threshold_b.label
    } else {
        ControlNetUnit.setThreshold(index, 'b', 32)
        threshold_b_element.style.display = 'none'
    }
}
async function populatePreprocessorMenu() {
    try {
        // debugger
        const modules = await requestControlNetModuleList()
        for (
            let index = 0;
            index < g_controlnet_max_supported_models;
            index++
        ) {
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
    // debugger
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
function isControlNetModeEnable() {
    let is_tab_enabled = !document.getElementById('chDisableControlNetTab')
        .checked

    let numOfEnabled = 0
    if (is_tab_enabled) {
        for (let index = 0; index < getControlNetMaxModelsNumber(); index++) {
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
function getControlNetMaxModelsNumber() {
    return g_controlnet_max_supported_models
}

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

    // debugger
    let active_index = 0
    for (let index = 0; index < g_controlnet_max_supported_models; index++) {
        const preprocessor_name = getSelectedModule(index)
        // const prams =
        //     preprocessor_name in g_preprocessor_parms_new
        //         ? g_preprocessor_parms_new[preprocessor_name]
        //         : g_preprocessor_parms_new['none']

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
            guessmode: false,
        }
        active_index++
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
        controlnet_units, //keep for backward compatibility for now
        subseed: -1,
        override_settings: {},
        override_settings_restore_afterwards: true,
        alwayson_scripts: {
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

function initControlNetUnitsEventListeners(controlnet_max_models) {
    for (let index = 0; index < controlnet_max_models; index++) {
        //event listeners
        controlnetElement(
            index,
            '.slControlNetGuidanceStrengthStart_'
        ).addEventListener('input', (evt) => {
            // debugger
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
            // debugger
            const sd_value = general.mapRange(evt.target.value, 0, 100, 0, 1) // convert slider value to SD ready value
            controlnetElement(
                index,
                '.lControlNetGuidanceStrengthEnd_'
            ).textContent = Number(sd_value).toFixed(2)
        })

        document
            .querySelector(`#controlnet_settings_${index} .slControlNetWeight_`)
            .addEventListener('input', (evt) => {
                // debugger
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
        //         // debugger
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
        // debugger
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
        'svg_sp_btn',
        'move to the canvas',

        toCanvas,
        index
    )
    thumbnail.Thumbnail.addSPButtonToContainer(
        this.thumbnail_container,
        'svg_sp_btn',
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
        if (controlnet_max_models > g_controlnet_max_supported_models)
            controlnet_max_models = g_controlnet_max_supported_models

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

        initControlNetUnitsEventListeners(controlnet_max_models) // add event listener to all units after cloning

        for (let index = 0; index < controlnet_max_models; index++) {
            await populateModelMenu(index)
            await populatePreprocessorMenu(index)
            document.getElementById(
                'controlnet_settings_' + index
            ).style.display = 'block'
            initPreviewElement(index)

            initControlNetUnit(index)
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
    isControlNetModeEnable,
    preprocessor_res_json,
}
