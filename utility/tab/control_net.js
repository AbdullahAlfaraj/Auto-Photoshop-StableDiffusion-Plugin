const api = require('../api')
const html_manip = require('../html_manip')
async function requestControlNetModelList() {
    const control_net_json = await api.requestGet(
        `${g_sd_url}/controlnet/model_list`
    )
    const model_list = control_net_json?.model_list
    return model_list
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
async function initializeControlNetTab() {
    await populateModelMenu()
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
module.exports = {
    requestControlNetModelList,
    populateModelMenu,
    initializeControlNetTab,
}
