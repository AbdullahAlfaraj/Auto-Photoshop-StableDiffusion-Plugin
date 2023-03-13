const html_manip = require('./html_manip')
const presets = require('./presets/preset')
const session = require('./session')
const GenerationSettings = require('./generation_settings')
const app_events = require('./app_events')
const selection = require('../selection')
const { executeAsModal } = require('photoshop').core
class UI {
    static #instance = null

    static instance() {
        if (!UI.#instance) {
            UI.#instance = new UI()
        }
        return UI.#instance
    }

    constructor() {
        if (!UI.#instance) {
            UI.#instance = this
        }
        this.SubscribeToEvents()
        return UI.#instance
    }

    SubscribeToEvents() {
        app_events.selectionModeChangedEvent.subscribe(
            UI.instance().generateModeUI
        )
        app_events.generateMoreEvent.subscribe(UI.instance().generateMoreUI)
        app_events.resolutionSizeChangedEvent.subscribe(
            UI.instance().updateResDifferenceLabel
        )
    }

    onStartSessionUI() {
        // will toggle the buttons needed when a generation session start

        const accept_class_btns = Array.from(
            document.getElementsByClassName('acceptClass')
        )

        const discard_class_btns = Array.from(
            document.getElementsByClassName('discardClass')
        )

        const discard_selected_class_btns = Array.from(
            document.getElementsByClassName('discardSelectedClass')
        )

        const accept_selected_class_btns = Array.from(
            document.getElementsByClassName('acceptSelectedClass')
        )

        //show the accept and discard buttons when a new session is active
        accept_class_btns.forEach(
            (element) => (element.style.display = 'inline-block')
        )
        discard_class_btns.forEach(
            (element) => (element.style.display = 'inline-block')
        )
        discard_selected_class_btns.forEach(
            (element) => (element.style.display = 'inline-block')
        )
        accept_selected_class_btns.forEach(
            (element) => (element.style.display = 'inline-block')
        )

        this.generateMoreUI()
    }
    onActiveSessionUI() {}
    generateModeUI(mode) {
        const generate_btns = Array.from(
            document.getElementsByClassName('btnGenerateClass')
        )
        generate_btns.forEach((element) => {
            element.textContent = `Generate ${mode}`
        })
        html_manip.setGenerateButtonsColor('generate', 'generate-more')
    }
    generateMoreUI() {
        const generate_btns = Array.from(
            document.getElementsByClassName('btnGenerateClass')
        )
        const generation_mode = session.GenerationSession.instance().mode
        const generation_name =
            session.GenerationSession.instance().getCurrentGenerationModeByValue(
                generation_mode
            )
        generate_btns.forEach((element) => {
            element.textContent = `Generate More ${generation_name}`
        })
        html_manip.setGenerateButtonsColor('generate-more', 'generate')
    }

    onEndSessionUI() {
        const accept_class_btns = Array.from(
            document.getElementsByClassName('acceptClass')
        )

        const discard_class_btns = Array.from(
            document.getElementsByClassName('discardClass')
        )
        const discard_selected_class_btns = Array.from(
            document.getElementsByClassName('discardSelectedClass')
        )

        const accept_selected_class_btns = Array.from(
            //Node: change customClass to acceptSelectedClass
            document.getElementsByClassName('acceptSelectedClass')
        )

        accept_class_btns.forEach((element) => (element.style.display = 'none'))
        discard_class_btns.forEach(
            (element) => (element.style.display = 'none')
        )
        discard_selected_class_btns.forEach(
            (element) => (element.style.display = 'none')
        )

        accept_selected_class_btns.forEach(
            (element) => (element.style.display = 'none')
        )

        this.generateModeUI(GenerationSettings.sd_mode)
    }

    setGenerateBtnText(textContent) {
        const generate_btns = Array.from(
            document.getElementsByClassName('btnGenerateClass')
        )
        generate_btns.forEach((element) => {
            element.textContent = textContent
        })
    }

    async updateResDifferenceLabel() {
        const ratio = await selection.Selection.getImageToSelectionDifference()
        const arrow = ratio >= 1 ? '↑' : '↓'
        let final_ratio = ratio // this ratio will always be >= 1
        if (ratio >= 1) {
            // percentage = percentage >= 1 ? percentage : 1 / percentage

            // const percentage_str = `${arrow}X${percentage.toFixed(2)}`

            // console.log('scale_info_str: ', scale_info_str)
            // console.log('percentage_str: ', percentage_str)
            document
                .getElementById('res-difference')
                .classList.remove('res-decrease')
        } else {
            final_ratio = 1 / ratio
            document
                .getElementById('res-difference')
                .classList.add('res-decrease')
        }
        const ratio_str = `${arrow}x${final_ratio.toFixed(2)}`
        document.getElementById('res-difference').innerText = ratio_str
    }
}

class UIElement {
    constructor() {
        this.name
        this.html_elem
        this.sd_value
    }
    setValue() {}
    getValue() {}
}
function createUIElement(getter, setter) {
    let ui_element_obj = new UIElement()
    ui_element_obj.getValue = getter
    ui_element_obj.setValue = setter
    return ui_element_obj
}
class UISettings {
    // get and set the settings of the ui. the stable diffusion settings not the human friendly settings
    constructor() {
        this.width = createUIElement(
            html_manip.getWidth,
            html_manip.autoFillInWidth
        )
        this.height = createUIElement(
            html_manip.getHeight,
            html_manip.autoFillInHeight
        )
        this.steps = createUIElement(
            html_manip.getSteps,
            html_manip.autoFillInSteps
        )
        this.batch_number = createUIElement(
            html_manip.getBatchNumber,
            html_manip.autoFillInBatchNumber
        )
        this.firstphase_width = createUIElement(
            html_manip.getHrWidth,
            html_manip.autoFillInHRWidth
        )
        this.firstphase_height = createUIElement(
            html_manip.getHrHeight,
            html_manip.autoFillInHRHeight
        )
        this.cfg = createUIElement(html_manip.getCFG, html_manip.setCFG)
        this.denoising_strength = createUIElement(
            html_manip.getDenoisingStrength,
            html_manip.autoFillInDenoisingStrength
        )

        this.mask_content = createUIElement(
            html_manip.getMaskContent,
            html_manip.setMaskContent
        )
        this.seed = createUIElement(html_manip.getSeed, html_manip.setSeed)
        this.prompt = createUIElement(
            html_manip.getPrompt,
            html_manip.autoFillInPrompt
        )
        this.negative_prompt = createUIElement(
            html_manip.getNegativePrompt,
            html_manip.autoFillInNegativePrompt
        )
        this.mask_blur = createUIElement(
            html_manip.getMaskBlur,
            html_manip.setMaskBlur
        )
        this.mask_expansion = createUIElement(
            html_manip.getMaskExpansion,
            html_manip.setMaskExpansion
        )
        this.samplers = createUIElement(
            html_manip.getCheckedSamplerName,
            html_manip.autoFillInSampler
        )

        this.uiElements = {
            // model: null,
            // prompt_shortcut: null,
            prompt: this.prompt,
            negative_prompt: this.negative_prompt,
            // selection_mode: null,
            batch_size: this.batch_number,
            steps: this.steps,
            width: this.width,
            height: this.height,
            firstphase_width: this.firstphase_width,
            firstphase_height: this.firstphase_height,
            cfg_scale: this.cfg,
            denoising_strength: this.denoising_strength,
            // hi_res_denoising_strength:0.7,
            mask_blur: this.mask_blur,
            mask_expansion: this.mask_expansion,
            // inpaint_at_full_res: false,
            // hi_res_fix:false,
            // inpaint_padding:0,
            seed: this.seed,
            sampler_index: this.samplers,
            mask_content: this.mask_content,
        }
    }

    autoFillInSettings(settings) {
        for (const [name, value] of Object.entries(settings)) {
            if (this.uiElements.hasOwnProperty(name) && value) {
                //get the values for debugging
                const old_value = this.uiElements[name].getValue()
                console.log(
                    '(name,old_value) => newValue:',
                    name,
                    old_value,
                    value
                )
                //set the value
                this.uiElements[name].setValue(value)
            }
        }
    }
    saveAsJson(json_file_name, settings) {
        for (const [name, value] of Object.entries(settings)) {
            if (this.uiElements.hasOwnProperty(name) && value) {
                //get the values for debugging
                const old_value = this.uiElements[name].getValue()
                console.log(
                    '(name,old_value) => newValue:',
                    name,
                    old_value,
                    value
                )

                //set the value
            }
        }
    }
}
// const ui_settings = new UISettings()

function loadPreset(ui_settings, preset) {
    console.log('preset:', preset)
    ui_settings.autoFillInSettings(preset)
}

function loadLatentNoiseSettings(ui_settings) {
    loadPreset(ui_settings, presets.LatentNoiseSettings)
}

function loadFillSettings(ui_settings) {
    loadPreset(ui_settings, presets.FillSettings)
}
function loadOriginalSettings(ui_settings) {
    loadPreset(ui_settings, presets.OriginalSettings)
}
async function loadHealBrushSettings(ui_settings) {
    document.getElementById('rbModeInpaint').click()
    const { timer } = require('./general')
    // await timer(1000)
    // if (layer_util.Layer.doesLayerExist(psapi.inpaint_mask_layer)) {
    //     // psapi.executeCommandExe(async () => {
    //     //     inpaint_mask_layer.opacity = 50
    //     // })
    //     // ;(async () => {
    //     //     await executeAsModal(() => {
    //     //         inpaint_mask_layer.opacity = 50
    //     //     })
    //     // })()
    // } else {
    //     await psapi.createTempInpaintMaskLayer()
    // }

    // await executeAsModal(() => {
    //     inpaint_mask_layer.opacity = 50
    // })
    loadPreset(ui_settings, presets.HealBrushSettings)
}

let loadedPresets = {
    fill: loadFillSettings,
    original: loadOriginalSettings,
    'latent noise': loadLatentNoiseSettings,
    'Heal Brush': loadHealBrushSettings,
}

module.exports = {
    UI,
    UIElement,
    UISettings,
    loadLatentNoiseSettings,
    loadFillSettings,
    loadHealBrushSettings,
    loadedPresets,
}
