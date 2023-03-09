const io = require('../io')

let settings = {
    model: null,
    prompt_shortcut: null,
    positive_prompt: null,
    negative_prompt: null,
    selection_mode: null,
    batch_number: null,
    steps: null,
    width: null,
    height: null,
    firstphase_width: null,
    firstphase_height: null,
    cfg: null,
    denoising_strength: null,
    hi_res_denoising_strength: null,
    mask_blur: null,
    inpaint_at_full_res: null,
    hi_res_fix: null,
    inpaint_padding: null,
    seed: null,
    samplers: null,
    mask_content: null,
}

let LatentNoiseSettings = {
    model: null,
    prompt_shortcut: null,
    positive_prompt: null,
    negative_prompt: null,
    generation_mode: null,
    batch_number: null,
    steps: null,
    width: null,
    height: null,
    firstphase_width: null,
    firstphase_height: null,
    cfg: null,
    denoising_strength: 0.92,
    hi_res_denoising_strength: null,
    mask_blur: null,
    inpaint_at_full_res: null,
    hi_res_fix: null,
    inpaint_padding: null,
    seed: null,
    samplers: null,
    mask_content: '2',
}

let FillSettings = {
    model: null,
    prompt_shortcut: null,
    positive_prompt: null,
    negative_prompt: null,
    generation_mode: null,
    batch_number: null,
    steps: null,
    width: null,
    height: null,
    firstphase_width: null,
    firstphase_height: null,
    cfg: null,
    denoising_strength: 0.7,
    hi_res_denoising_strength: null,
    mask_blur: null,
    inpaint_at_full_res: null,
    hi_res_fix: null,
    inpaint_padding: null,
    seed: null,
    samplers: null,
    mask_content: '0',
}
let OriginalSettings = {
    model: null,
    prompt_shortcut: null,
    positive_prompt: null,
    negative_prompt: null,
    generation_mode: null,
    batch_number: null,
    steps: null,
    width: null,
    height: null,
    firstphase_width: null,
    firstphase_height: null,
    cfg: null,
    denoising_strength: 0.7,
    hi_res_denoising_strength: null,
    mask_blur: null,
    inpaint_at_full_res: null,
    hi_res_fix: null,
    inpaint_padding: null,
    seed: null,
    samplers: null,
    mask_content: '1',
}
let HealBrushSettings = {
    model: null,
    prompt_shortcut: null,
    positive_prompt: null,
    negative_prompt: null,
    generation_mode: null,
    batch_number: null,
    steps: '25',
    width: null,
    height: null,
    firstphase_width: null,
    firstphase_height: null,
    cfg: '9',
    denoising_strength: 0.92,
    hi_res_denoising_strength: null,
    mask_blur: 1,
    inpaint_at_full_res: null,
    hi_res_fix: null,
    inpaint_padding: null,
    seed: null,
    samplers: null,
    mask_content: '2',
    mask_expansion: 2,
}

function nullAllSettings() {}

class Preset {
    constructor() {}

    loadPresetFromJson(preset_path) {}
    savePresetToJson(preset_path, settings) {}
}

function getPresetSettingsHtml() {
    const value_str = document.getElementById('taPresetSettings').value
    const value_json = JSON.parse(value_str)
    return value_json
}
function setPresetSettingsHtml(preset_settings) {
    const JSONInPrettyFormat = JSON.stringify(preset_settings, undefined, 7)
    preset_settings_element = document.getElementById('taPresetSettings')
    preset_settings_element.value = JSONInPrettyFormat

    const new_lines_count = general.countNewLines(JSONInPrettyFormat)
    new_lines_count
    preset_settings_element.style.height = new_lines_count * 10 + 100
}

function getPresetName() {
    const preset_name = document.getElementById('tiPresetName').value
    return preset_name
}
function setPresetName() {}
document.getElementById('btnNewPreset').addEventListener('click', () => {
    const settings = g_ui_settings.getSettings()
    setPresetSettingsHtml(settings)
})

document.getElementById('btnSavePreset').addEventListener('click', async () => {
    //save preset settings from textarea to json file
    //reload the preset menu

    const custom_preset_entry = await io.IOFolder.getCustomPresetFolder()
    const preset_settings = getPresetSettingsHtml()
    const preset_name = getPresetName()

    //check if the file exist and prompt the user to override it or cancel
    io.IOJson.saveJsonToFileExe(
        preset_settings,
        custom_preset_entry,
        preset_name + '.json'
    )
})

module.exports = {
    LatentNoiseSettings,
    FillSettings,
    OriginalSettings,
    HealBrushSettings,
}
