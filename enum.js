const clickTypeEnum = {
    Click: 'click',
    ShiftClick: 'shift_click',
    AltClick: 'alt_click',
    SecondClick: 'second_click', //when we click a thumbnail that is active/ has orange border
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

module.exports = {
    clickTypeEnum,
    AutomaticStatusEnum,
    ViewerObjectTypeEnum,
    RequestStateEnum,
    DocumentTypeEnum,
    BackgroundHistoryEnum,
}
