const clickTypeEnum = {
    Click: 'click',
    ShiftClick: 'shift_click',
    AltClick: 'alt_click',
    SecondClick: 'second_click', //when we click a thumbnail that is active/ has orange border
}

const ViewerObjectTypeEnum = {
    OutputImage: 'output_image',
    InitImage: 'init_image',
    MaskImage: 'mask_image',
}

module.exports = {
    clickTypeEnum,
    ViewerObjectTypeEnum,
}
