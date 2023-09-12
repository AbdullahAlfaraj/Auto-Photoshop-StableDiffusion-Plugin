import { reaction } from 'mobx'
import globalStore from '../globalstore'
import Locale from './locale'

const elemSelectorForLocale = {
    // tab bar
    '#sp-stable-diffusion-ui-tab sp-label': 'Stable Diffusion',
    '#sp-viewer-tab sp-label': 'Viewer',
    '#sp-control_net-tab sp-label': 'ControlNet',
    // '#sp-history-tab sp-label': 'History',
    '#sp-lexica-tab sp-label': 'Lexica',
    '#sp-image_search-tab sp-label': 'Image Search',
    '#sp-prompts-library-tab sp-label': 'Prompts library',
    '#sp-horde-tab sp-label': 'Horde',
    '#sp-extras-tab sp-label': 'Extras',
    '#sp-presets-tab sp-label': 'Presets',
    '#sp-settings-tab sp-label': 'Settings',

    // viewer tab
    '#rgSubTab .rbSubTab': 'Viewer',
    '#rbHistoryTab': 'History',
    '#rbImageSearch': 'Image Search',
    '#rbPromptsLibrary': 'Prompts Library',
    '#rbLexica': 'Lexica',
    '#viewerSubTab .flexContainer sp-label':
        'View your generated images on the canvas',
    // '#btnSetMaskViewer': 'Set Mask',
    // '#btnSetInitImageViewer': 'Set Init Image',
    '#btnInterruptViewer': 'Interrupt',
    // '#btnSelectionArea': 'Selection Area',

    // extra tab
    // '#slThumbnailSize sp-label': 'Thumbnail Size',
    '#chSquareThumbnail': 'Square 1:1',
    '#btnGenerateUpscale': 'Generate upscale',
    '#btnInterruptUpscale': 'Interrupt',
    '#progressContainerUpscale sp-label': 'No work in progress',
    '#slUpscaler2Visibility .title': 'Upscaler 2 visibility',
    '#slGFPGANVisibility .title': 'GFPGAN visibility',
    '#slCodeFormerVisibility .title': 'CodeFormer visibility',
    '#slCodeFormerWeight .title': 'CodeFormer weight',

    // sd tab
    '#pViewerProgressBar .lProgressLabel': 'Progress...',
    '#btnRefreshModels': 'Refresh',
    '#btnUpdate': 'Update',
    '#chUsePromptShortcut': 'prompt shortcut',
    '#btnInterrupt': 'Interrupt',
    '#bSetInitImage': 'Image',
    '#bSetInitImageMask': 'Mask',
    '#batchNumberSdUiTabContainer sp-label': 'Batch Size',
    '#batchCountSdUiTabContainer sp-label': 'Batch count',
    '#rbSelectionModeLabel': 'Selection Mode',
    '#selectionModeGroup [value=ratio]': 'ratio',
    '#selectionModeGroup [value=precise]': 'precise',
    '#selectionModeGroup [value=ignore]': 'ignore',
    '#slCfgScale .title': 'CFG Scale',
    '#slImageCfgScale .title': 'Image CFG Scale',
    '#slMaskBlur sp-label': 'Mask blur',
    '#slMaskExpansion sp-label': 'Mask Expansion',
    '#slInpaintingMaskWeight .title': 'Inpainting conditioning mask strength',
    '#slInpainting_fill .title': 'Masked content',
    '#slInpainting_fill [value=0]': 'fill',
    '#slInpainting_fill [value=1]': 'original',
    '#slInpainting_fill [value=2]': 'latent noise',
    '#slInpainting_fill [value=3]': 'latent nothing',
    '#chInpaintFullRes': 'Inpaint at Full Res',
    '#chRestoreFaces': 'Restore Faces',
    '#chHiResFixs': 'Highres. fix',
    '#HiResDiv .title': 'Upscaler',
    '#HiResStep': 'Hires steps',
    '#hrScaleSlider .title': 'Hires Scale',
    '#hrDenoisingStrength .title': 'High Res Denoising Strength',
    '#hrWidth': 'Hi Res Output Width',
    '#hrHeight': 'Hi Res Output Height',
    '#lNameInpaintPdding': 'Inpaint Padding',
    '#btnRandomSeed': 'Random',
    '#btnLastSeed': 'Last',
    '#sampler_group sp-label': 'Sampling method',
    '#sdLabelSeed': 'Seed',
    '#collapsible': 'Show Samplers',
    '#slHeight .title': 'Height',
    '#slWidth .title': 'Width',
    '#sdLabelSampleStep': 'Sampling Steps',
}

function renderLocale(locale: string) {
    Object.keys(elemSelectorForLocale).forEach((selector) => {
        const elem = document.querySelector(selector)
        if (elem) {
            // @ts-ignore
            elem.innerHTML = Locale(elemSelectorForLocale[selector])
        }
    })
}

reaction(() => globalStore.Locale, renderLocale)
renderLocale(globalStore.Locale)
