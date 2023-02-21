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

module.exports = {
    clickTypeEnum,
    generationModeEnum,
}
