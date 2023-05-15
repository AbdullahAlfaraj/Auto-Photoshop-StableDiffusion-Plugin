interface ScriptArgs {
    _: string
    tile_width: number
    tile_height: number
    mask_blur: number
    padding: number
    seams_fix_width: number
    seams_fix_denoise: number
    seams_fix_padding: number
    upscaler_index: number
    save_upscaled_image: boolean
    redraw_mode: number
    save_seams_fix_image: boolean
    seams_fix_mask_blur: number
    seams_fix_type: number
    target_size_type: number
    custom_width: number
    custom_height: number
    custom_scale: number
}

let json_obj: ScriptArgs = {
    _: '',
    tile_width: 512,
    tile_height: 0,
    mask_blur: 8,
    padding: 32,
    seams_fix_width: 64,
    seams_fix_denoise: 0.275,
    seams_fix_padding: 32,
    upscaler_index: 3,
    save_upscaled_image: false,
    redraw_mode: 0,
    save_seams_fix_image: true,
    seams_fix_mask_blur: 8,
    seams_fix_type: 3,
    target_size_type: 2,
    custom_width: 1080,
    custom_height: 1440,
    custom_scale: 1.875,
}

export let script_args: (string | number | boolean)[] = Object.values(json_obj)
export let script_name: string = 'Ultimate SD upscale'
