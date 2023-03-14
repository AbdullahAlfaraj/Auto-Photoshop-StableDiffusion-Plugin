const html_manip = require('./html_manip')
const presets = require('./presets/preset')
const layer_util = require('../utility/layer')
const psapi = require('../psapi')
const Enum = require('../enum')
const { executeAsModal } = require('photoshop').core

class UI {
    constructor() {}

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
        const generation_mode = g_generation_session.mode
        const generation_name = getCurrentGenerationModeByValue(generation_mode)
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

        this.generateModeUI(g_sd_mode)
    }

    setGenerateBtnText(textContent) {
        const generate_btns = Array.from(
            document.getElementsByClassName('btnGenerateClass')
        )
        generate_btns.forEach((element) => {
            element.textContent = textContent
        })
    }
}

// const defaultSettings = {
//   model: null,
//   prompt_shortcut: null,
//   positive_prompt: "",
//   negative_prompt: "",
//   selection_mode: null,
//   batch_number: 1,
//   steps: 20,
//   width: 512 ,
//   height:512,
//   firstphase_width:512,
//   firstphase_height:512,
//   cfg:7,
//   denoising_strength:0.7,
//   hi_res_denoising_strength:0.7,
//   mask_blur: 8,
//   inpaint_at_full_res: false,
//   hi_res_fix:false,
//   inpaint_padding:0,
//   seed:-1,
//   samplers: null,
//   mask_content:null
//   }

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
        // this.width = new ui.UIElement()
        // this.width.getValue = html_manip.getWidth
        // this.width.setValue = html_manip.autoFillInWidth
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
    getSettings() {
        let settings = {}
        for (const [name, ui_element] of Object.entries(this.uiElements)) {
            if (ui_element) {
                const value = ui_element.getValue()
                settings[name] = value
            }
        }
        return settings
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

    loadPreset(ui_settings, presets.HealBrushSettings)
}
function loadCustomPreset(ui_settings_obj, custom_preset_settings) {
    loadPreset(ui_settings_obj, custom_preset_settings)
}

function loadCustomPresetsSettings() {}
async function mapCustomPresetsToLoaders(ui_settings_obj) {
    const name_to_settings_obj = await presets.getAllCustomPresetsSettings(
        Enum.PresetTypeEnum['SDPreset']
    )
    const preset_name_to_loader_obj = {}
    for (const [preset_name, preset_settings] of Object.entries(
        name_to_settings_obj
    )) {
        preset_name_to_loader_obj[preset_name] = () => {
            loadCustomPreset(ui_settings_obj, preset_settings)
        }
    }
    return preset_name_to_loader_obj
}

const g_nativePresets = {
    fill: loadFillSettings,
    original: loadOriginalSettings,
    'latent noise': loadLatentNoiseSettings,
    'Heal Brush': loadHealBrushSettings,
}

async function getLoadedPresets(ui_settings_obj) {
    let customPresets

    customPresets = await mapCustomPresetsToLoaders(ui_settings_obj)
    console.log('customPresets: ', customPresets)
    let loadedPresets = {
        ...g_nativePresets,
        ...customPresets,
    }
    return loadedPresets
}
let g_ui_settings_object = new UISettings()
function getUISettingsObject() {
    return g_ui_settings_object
}

//REFACTOR: move to ui.js
function addPresetMenuItem(preset_title) {
    // console.log(model_title,model_name)
    const menu_item_element = document.createElement('sp-menu-item')
    menu_item_element.className = 'mPresetMenuItem'
    menu_item_element.innerHTML = preset_title

    // menu_item_element.addEventListener('select',()=>{
    //   preset_func(g_ui_settings)
    // })
    return menu_item_element
}
//REFACTOR: move to ui.js
async function populatePresetMenu() {
    document.getElementById('mPresetMenu').innerHTML = ''
    const divider_elem = document.createElement('sp-menu-divider')
    const preset_name = 'Select Smart Preset'
    const preset_func = () => {}
    const dummy_preset_item = addPresetMenuItem(preset_name, preset_func)
    dummy_preset_item.setAttribute('selected', 'selected')
    // dummy_preset_item.setAttribute('disabled')
    document.getElementById('mPresetMenu').appendChild(dummy_preset_item)
    document.getElementById('mPresetMenu').appendChild(divider_elem)
    const presets = await getLoadedPresets(g_ui_settings_object)
    for ([key, value] of Object.entries(presets)) {
        const preset_menu_item = addPresetMenuItem(key, value)
        document.getElementById('mPresetMenu').appendChild(preset_menu_item)
    }
}

populatePresetMenu()
//REFACTOR: move to preset_tab.js
document
    .getElementById('mPresetMenu')
    .addEventListener('change', async (evt) => {
        const preset_index = evt.target.selectedIndex
        const preset_name = evt.target.options[preset_index].textContent
        const presets = await getLoadedPresets(g_ui_settings_object)
        if (presets.hasOwnProperty(preset_name)) {
            const loader = presets[preset_name]
            if (loader.constructor.name === 'AsyncFunction') {
                await loader(g_ui_settings_object)
            } else {
                loader(g_ui_settings_object)
            }
        }
    })

module.exports = {
    UI,
    UIElement,
    UISettings,
    loadLatentNoiseSettings,
    loadFillSettings,
    loadHealBrushSettings,
    getLoadedPresets,
    getUISettingsObject,
    populatePresetMenu,
}
