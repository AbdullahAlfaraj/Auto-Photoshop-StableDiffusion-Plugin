//tips that will display when you hover over a html element
const tips_json = {
    snapshot: '',
    txt2img: 'use this mode to generate images from text only',
    img2img: 'use this mode to generate variation of an image',
    inpaint:
        'use this mode to generate variation of a small area of an image, while keeping the rest of the image intact',
    outpaint:
        'use this mode to (1) fill any missing area of an image,(2) expand an image',
    generate: 'create',
    discardAll: 'Delete all generated images from the canvas',
    acceptAll: 'Keep all generated images on the canvas',
    acceptSelected: 'Keep only the highlighted images',
    discardSelected: 'Delete only the highlighted images',
    modelMenu: 'select a model',
    refresh: 'Refresh the plugin, only fixes minor issues.',
    prompt_shortcut: 'use {keyword} form the prompts library',
    inpaint: 'use when you need to modify an already existing part of an image',
    img2img: 'use this mode when you want to generate variation of an image',
    txt2img: 'use this mode to generate images based on text only',
    batchNumber:
        'the number of images to generate at once.The larger the number more VRAM stable diffusion will use.',
    steps: 'how long should stable diffusion take to generate an image',
    selection_mode_ratio:
        'will auto fill the width and height slider to the same ratio as the selection area',
    selection_mode_precise:
        'auto fill width and height slider to the size as the selection area',
    selection_mode_ignore:
        'you will have to fill the width and height slider manually',
    cfg_scale: 'larger value will put more emphasis on the prompt',
    preset_menu:
        'auto fill the plugin with smart settings, to speed up your working process.',
    width: 'the generated image width',
    height: 'the generated image height',
    mask_expansion:
        "the larger the value the more the mask will expand, '0' means use precise masking, use in combination with the mask blur",
    mask_content_fill: '',
}

module.exports = { tips_json }
