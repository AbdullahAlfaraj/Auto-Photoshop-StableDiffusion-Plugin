export let ui_config = {
    tile_width: {
        minimum: 0,
        maximum: 2048,
        step: 64,
        label: 'Tile width',
        value: 512,
    },
    tile_height: {
        minimum: 0,
        maximum: 2048,
        step: 64,
        label: 'Tile height',
        value: 0,
    },
    mask_blur: {
        minimum: 0,
        maximum: 64,
        step: 1,
        label: 'Mask blur',
        value: 8,
    },
    padding: { minimum: 0, maximum: 128, step: 1, label: 'Padding', value: 32 },

    seams_fix_denoise: {
        label: 'Denoise',
        minimum: 0,
        maximum: 1,
        step: 0.01,
        value: 0.35,
        visible: false,
        interactive: true,
    },

    seams_fix_width: {
        label: 'Width',
        minimum: 0,
        maximum: 128,
        step: 1,
        value: 64,
        visible: false,
        interactive: true,
    },
    seams_fix_mask_blur: {
        label: 'Mask blur',
        minimum: 0,
        maximum: 64,
        step: 1,
        value: 4,
        visible: false,
        interactive: true,
    },
    seams_fix_padding: {
        label: 'Padding',
        minimum: 0,
        maximum: 128,
        step: 1,
        value: 16,
        visible: false,
        interactive: true,
    },
    redraw_mode: {
        label: 'Type',
        choices: ['Linear', 'Chess', 'None'],
        type: 'index',
        value: 0,
    },
    save_upscaled_image: {
        label: 'Upscaled',
        value: true,
    },
    save_seams_fix_image: {
        label: 'Seams fix',
        value: false,
    },

    seams_fix_type: {
        label: 'Type',
        choices: [
            'None',
            'Band pass',
            'Half tile offset pass',
            'Half tile offset pass + intersections',
        ],
        type: 'index',
        value: 3,
    },

    target_size_type: {
        label: 'Target size type',
        choices: [
            'From img2img2 settings',
            'Custom size',
            'Scale from image size',
        ],
        type: 'index',
        value: 2,
    },

    custom_width: {
        label: 'Custom width',
        minimum: 64,
        maximum: 8192,
        step: 64,
        value: 2048,
        visible: false,
        interactive: true,
    },
    custom_height: {
        label: 'Custom height',
        minimum: 64,
        maximum: 8192,
        step: 64,
        value: 2048,
        visible: false,
        interactive: true,
    },
    custom_scale: {
        label: 'Scale',
        minimum: 1,
        maximum: 16,
        step: 0.01,
        value: 2,
        visible: false,
        interactive: true,
    },

    upscaler_index: {
        label: 'Upscaler',
        choices: [],
        type: 'index',
        value: 0,
    },
}
