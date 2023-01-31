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

function nullAllSettings() {}

class Preset {
    constructor() {}

    loadPresetFromJson(preset_path) {}
    savePresetToJson(preset_path, settings) {}
}

module.exports = {
    LatentNoiseSettings,
    FillSettings,
    OriginalSettings,
}
