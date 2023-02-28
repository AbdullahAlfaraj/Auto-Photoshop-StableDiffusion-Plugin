const api = require('../api')
const html_manip = require('../html_manip')
const selection = require('../../selection')
const note = require('../notification')
const { appendConstructorOption } = require('jimp/types')
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
    const module_list = [
        // 'none',
        'canny',
        'depth',
        'depth_leres',
        'hed',
        'mlsd',
        'normal_map',
        'openpose',
        // "openpose_hand",
        'pidinet',
        'scribble',
        'fake_scribble',
        'segmentation',
    ]

    return module_list
}
async function populateModelMenu() {
    try {
        const models = await requestControlNetModelList()

        html_manip.populateMenu(
            'mModelsMenuControlNet',
            'mModelsMenuItemControlNet',
            models,
            (item, item_html_element) => {
                item_html_element.innerHTML = item
            }
        )
    } catch (e) {
        console.warn(e)
    }
}
async function populatePreprocessorMenu() {
    try {
        const modules = await requestControlNetModuleList()
        html_manip.populateMenu(
            'mModuleMenuControlNet',
            'mModuleMenuItemControlNet',
            modules,
            (item, item_html_element) => {
                item_html_element.innerHTML = item
            }
        )
    } catch (e) {
        console.warn(e)
    }
}
async function initializeControlNetTab() {
    await populateModelMenu()
    await populatePreprocessorMenu()
}

function getControlNetWeightGuidanceStrength() {
    const slider_value = document.getElementById(
        'slControlNetGuidanceStrength'
    ).value
    const sd_value = general.mapRange(slider_value, 0, 100, 0, 1) // convert slider value to SD ready value
    return sd_value
}

function getControlNetWeight() {
    const slider_value = document.getElementById('slControlNetWeight').value

    // debugger
    const sd_value = general.mapRange(slider_value, 0, 100, 0, 2) // convert slider value to SD ready value
    return sd_value
}
function getUseLowVram() {
    const b_result = document.getElementById('chlowVram').checked
    return b_result
}
function getEnableControlNet() {
    const is_enable = document.getElementById('chEnableControlNet').checked
    return is_enable
}

function getSelectedModule() {
    const module_name = html_manip.getSelectedMenuItemTextContent(
        'mModuleMenuControlNet'
    )

    return module_name
}
function getSelectedModel() {
    const model_name = html_manip.getSelectedMenuItemTextContent(
        'mModelsMenuControlNet'
    )
    return model_name
}
function getUseGuessMode() {
    const is_guess_mode = document.getElementById('chGuessMode').checked
    return is_guess_mode
}
function mapPluginSettingsToControlNet(plugin_settings) {
    const ps = plugin_settings // for shortness
    let control_net_payload = {}
    control_net_payload['control_net_weight'] = getControlNetWeight()
    control_net_payload['controlnet_guidance'] =
        getControlNetWeightGuidanceStrength()
    control_net_payload['controlnet_lowvram'] = getUseLowVram()
    control_net_payload['controlnet_input_image'] = [
        g_generation_session.controlNetImage,
    ]

    control_net_payload['controlnet_module'] = getSelectedModule()

    control_net_payload['controlnet_model'] = getSelectedModel()
    getUseGuessMode()
    control_net_payload = {
        ...ps, //all plugin settings
        ...control_net_payload, //all control net ui settings
        // prompt: ps['prompt'],
        // negative_prompt: ps['negative_prompt'],
        // controlnet_input_image: [ps['control_net_image']],
        // controlnet_mask: [],

        // controlnet_module: 'depth',
        // controlnet_model: 'control_sd15_depth [fef5e48e]',

        // controlnet_weight: parseInt(ps['control_net_weight']),
        controlnet_resize_mode: 'Scale to Fit (Inner Fit)',
        // controlnet_lowvram: true,
        controlnet_processor_res: 512,
        controlnet_threshold_a: 64,
        controlnet_threshold_b: 64,
        // seed: ps['seed'],
        subseed: -1,
        // subseed_strength: -1,
        // subseed_strength: 0,
        // controlnet_guidance: 1,
        // sampler_index: ps['sampler_index'],
        // batch_size: parseInt(ps['batch_size']),
        // n_iter: 1,
        // steps: parseInt(ps['steps']),
        // cfg_scale: ps['cfg_scale'],
        // width: ps['width'],
        // height: ps['height'],
        // restore_faces: ps['restore_faces'],
        override_settings: {},
        override_settings_restore_afterwards: true,
    }
    if (
        plugin_settings['mode'] === Enum.generationModeEnum['Img2Img'] ||
        plugin_settings['mode'] === Enum.generationModeEnum['Inpaint'] ||
        plugin_settings['mode'] === Enum.generationModeEnum['Outpaint']
    ) {
        const b_use_guess_mode = getUseGuessMode()
        control_net_payload = {
            ...control_net_payload,

            guess_mode: b_use_guess_mode,

            include_init_images: true,
        }
    }

    return control_net_payload
}

//event listeners
document
    .getElementById('slControlNetGuidanceStrength')
    .addEventListener('input', (evt) => {
        // debugger
        const sd_value = general.mapRange(evt.target.value, 0, 100, 0, 1) // convert slider value to SD ready value
        document.getElementById('lControlNetGuidanceStrength').textContent =
            Number(sd_value).toFixed(2)
    })

document
    .getElementById('slControlNetWeight')
    .addEventListener('input', (evt) => {
        // debugger
        const sd_value = general.mapRange(evt.target.value, 0, 100, 0, 2) // convert slider value to SD ready value
        document.getElementById('lControlNetWeight').textContent =
            Number(sd_value).toFixed(2)
    })
document
    .getElementById('bSetControlImage')
    .addEventListener('click', async () => {
        const selectionInfo = await selection.Selection.getSelectionInfoExe()
        if (selectionInfo) {
            await g_generation_session.setControlNetImage()
        } else {
            await note.Notification.inactiveSelectionArea()
        }
    })

document.getElementById('bControlMask').addEventListener('click', async () => {
    // const selectionInfo = await selection.Selection.getSelectionInfoExe()

    if (
        g_generation_session.control_net_selection_info &&
        g_generation_session.controlNetMask
    ) {
        // await g_generation_session.setControlNetImage()
        const selection_info = g_generation_session.control_net_selection_info
        const layer = await io.IO.base64ToLayer(
            g_generation_session.controlNetMask,
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

module.exports = {
    requestControlNetModelList,
    populateModelMenu,
    initializeControlNetTab,
    getControlNetWeight,
    mapPluginSettingsToControlNet,
    getEnableControlNet,
    getSelectedModule,
    getSelectedModel,
}
