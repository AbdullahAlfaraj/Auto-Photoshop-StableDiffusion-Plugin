const MaintainPositionSettings = {
    0: {
        module: 'openpose',
        model: 'control_sd15_openpose [fef5e48e]',
        weight: 1,
        resize_mode: null,
        lowvram: null,
        processor_res: null,
        threshold_a: null,
        threshold_b: null,
        guidance_start: 0,
        guidance_end: 0.3,
        guessmode: null,
    },
    1: {
        module: 'depth',
        model: 'control_sd15_depth [fef5e48e]',
        weight: 0.8,
        resize_mode: null,
        lowvram: null,
        processor_res: null,
        threshold_a: null,
        threshold_b: null,
        guidance_start: 0,
        guidance_end: 0.6,
        guessmode: null,
    },
}

const ControlNetNativePresets = {
    'Maintain Position': MaintainPositionSettings,
    'Maintain Position 2': MaintainPositionSettings,
}
module.exports = {
    ControlNetNativePresets,
    MaintainPositionSettings,
}
