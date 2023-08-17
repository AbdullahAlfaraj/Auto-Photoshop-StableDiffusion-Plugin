export enum GenerationModeEnum {
    Txt2Img = 'txt2img',
    Img2Img = 'img2img',
    Inpaint = 'inpaint',
    Outpaint = 'outpaint',
    Upscale = 'upscale',
    LassoInpaint = 'lasso_inpaint',
    LassoOutpaint = 'lasso_outpaint',
}

export enum ScriptMode {
    Txt2Img = 'txt2img',
    Img2Img = 'img2img',
    Inpaint = 'inpaint',
    Outpaint = 'outpaint',
}

export enum MaskModeEnum {
    Transparent = 'transparent',
    Borders = 'border',
    Corners = 'corner',
}

export interface SelectionInfoType {
    left: number
    right: number
    top: number
    bottom: number
    width: number
    height: number
}

export enum PresetTypeEnum {
    SDPreset = 'sd_preset',
    ControlNetPreset = 'controlnet_preset',
}
