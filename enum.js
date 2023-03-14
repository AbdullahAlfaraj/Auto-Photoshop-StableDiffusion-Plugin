const clickTypeEnum = {
    Click: 'click',
    ShiftClick: 'shift_click',
    AltClick: 'alt_click',
    SecondClick: 'second_click', //when we click a thumbnail that is active/ has orange border
}
const generationModeEnum = {
    Txt2Img: 'txt2img',
    Img2Img: 'img2img',
    Inpaint: 'inpaint',
    Outpaint: 'outpaint',
    Upscale: 'upscale',
}

const AutomaticStatusEnum = {
    NoApi: 'no_api',
    Offline: 'offline',
    RunningNoApi: 'running_no_api',
    RunningWithApi: 'running_with_api',
}

const ViewerObjectTypeEnum = {
    OutputImage: 'output_image',
    InitImage: 'init_image',
    MaskImage: 'mask_image',
}

const RequestStateEnum = {
    Generating: 'generating', // in the generation process
    Interrupted: 'interrupted', // canceled/ interrupted
    Finished: 'finished', // finished generating
}
const DocumentTypeEnum = {
    NoBackground: 'no_background',
    ImageBackground: 'image_background',
    SolidBackground: 'solid_background',
    ArtBoard: 'artboard',
}
const BackgroundHistoryEnum = {
    CorrectBackground: 'correct_background',
    NoBackground: 'no_background',
}

const PresetTypeEnum = {
    SDPreset: 'sd_preset',
    ControlNetPreset: 'controlnet_preset',
}
module.exports = {
    clickTypeEnum,
    generationModeEnum,
    AutomaticStatusEnum,
    ViewerObjectTypeEnum,
    RequestStateEnum,
    DocumentTypeEnum,
    BackgroundHistoryEnum,
    PresetTypeEnum,
}
