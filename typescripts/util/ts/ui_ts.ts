import { multiPrompts } from '../../entry'
import {
    getAllCustomPresetsSettings,
    loadCustomPreset,
    loadPreset,
} from '../../preset/shared_ui_preset'
import { sd_tab_store } from '../../stores'
import { html_manip } from '../oldSystem'
import { PresetTypeEnum, ScriptMode } from './enum'

let LatentNoiseSettings = {
    model: null,
    prompt_shortcut: null,
    positive_prompt: null,
    negative_prompt: null,
    generation_mode: null,
    batch_size: null,
    steps: null,
    width: null,
    height: null,
    firstphase_width: null,
    firstphase_height: null,
    cfg: null,
    denoising_strength: 0.92,
    hi_res_denoising_strength: null,
    mask_blur: null,
    inpaint_at_full_res: null,
    hi_res_fix: null,
    inpaint_padding: null,
    seed: null,
    samplers: null,
    mask_content: '2',
}

let FillSettings = {
    model: null,
    prompt_shortcut: null,
    positive_prompt: null,
    negative_prompt: null,
    generation_mode: null,
    batch_size: null,
    steps: null,
    width: null,
    height: null,
    firstphase_width: null,
    firstphase_height: null,
    cfg: null,
    denoising_strength: 0.7,
    hi_res_denoising_strength: null,
    mask_blur: null,
    inpaint_at_full_res: null,
    hi_res_fix: null,
    inpaint_padding: null,
    seed: null,
    samplers: null,
    mask_content: '0',
}
let OriginalSettings = {
    model: null,
    prompt_shortcut: null,
    positive_prompt: null,
    negative_prompt: null,
    generation_mode: null,
    batch_size: null,
    steps: null,
    width: null,
    height: null,
    firstphase_width: null,
    firstphase_height: null,
    cfg: null,
    denoising_strength: 0.7,
    hi_res_denoising_strength: null,
    mask_blur: null,
    inpaint_at_full_res: null,
    hi_res_fix: null,
    inpaint_padding: null,
    seed: null,
    samplers: null,
    mask_content: '1',
}
let HealBrushSettings = {
    model: null,
    prompt_shortcut: null,
    positive_prompt: null,
    negative_prompt: null,
    generation_mode: null,
    batch_size: null,
    steps: '25',
    width: null,
    height: null,
    firstphase_width: null,
    firstphase_height: null,
    cfg: '9',
    denoising_strength: 0.92,
    hi_res_denoising_strength: null,
    mask_blur: 1,
    inpaint_at_full_res: null,
    hi_res_fix: null,
    inpaint_padding: null,
    seed: null,
    samplers: null,
    mask_content: '2',
    mask_expansion: 2,
}

class UI {
    constructor() {}
}
interface UIElements {
    [key: string]: UIElement

    prompt: UIElement
    negative_prompt: UIElement
    mode: UIElement
    batch_size: UIElement
    batch_count: UIElement

    steps: UIElement
    width: UIElement
    height: UIElement

    cfg: UIElement
    denoising_strength: UIElement
    mask_content: UIElement
    seed: UIElement
    mask_blur: UIElement
    mask_expansion: UIElement
    samplers: UIElement
}
class UIElement {
    name: any
    html_elem: any
    sd_value: any
    constructor() {
        this.name
        this.html_elem
        this.sd_value
    }
    setValue(new_value: any) {}
    getValue(): any {}
}
function createUIElement(getter: any, setter: any) {
    let ui_element_obj = new UIElement()
    ui_element_obj.getValue = getter
    ui_element_obj.setValue = setter
    return ui_element_obj
}
class UISettings {
    prompt: UIElement
    negative_prompt: UIElement
    mode: UIElement
    steps: UIElement
    batch_size: UIElement
    batch_count: UIElement
    width: UIElement
    height: UIElement
    cfg: UIElement
    denoising_strength: UIElement
    mask_content: UIElement
    seed: UIElement
    mask_blur: UIElement
    mask_expansion: UIElement
    samplers: UIElement
    uiElements: UIElements
    // get and set the settings of the ui. the stable diffusion settings not the human friendly settings
    constructor() {
        const createUIElementWrapper = <T extends never>(
            getter: () => T,
            setter: (value: T) => void
        ) => {
            return createUIElement(getter, setter)
        }

        const sdTabStoreDataWrapper = <T extends never>(
            key: keyof typeof sd_tab_store.data
        ) => {
            return createUIElementWrapper(
                () => sd_tab_store.data[key] as T,
                (value: T) => (sd_tab_store.data[key] = value)
            )
        }
        this.prompt = createUIElement(
            () => {
                return multiPrompts.getPrompt().positive
            },
            (value: string) => {
                multiPrompts.setPrompt({ positive: value })
            }
        )
        this.negative_prompt = createUIElement(
            () => {
                return multiPrompts.getPrompt().negative
            },
            (value: string) => {
                multiPrompts.setPrompt({ negative: value })
            }
        )

        this.mode = sdTabStoreDataWrapper('rb_mode')
        this.batch_size = sdTabStoreDataWrapper('batch_size')
        this.batch_count = sdTabStoreDataWrapper('batch_count')
        this.steps = sdTabStoreDataWrapper('steps')
        this.width = sdTabStoreDataWrapper('width')
        this.height = sdTabStoreDataWrapper('height')
        this.cfg = sdTabStoreDataWrapper('cfg')
        // this.mask_blur =

        this.denoising_strength = createUIElement(
            () => {
                return sd_tab_store.data.denoising_strength
            },
            (value: number) => {
                sd_tab_store.data.denoising_strength = value
            }
        )

        this.mask_content = createUIElement(
            html_manip.getMaskContent,
            html_manip.setMaskContent
        )
        this.seed = createUIElement(
            () => {
                return sd_tab_store.data.seed
            },
            (value: string) => {
                sd_tab_store.data.seed = value
            }
        )

        this.mask_blur = createUIElement(
            () => {
                return sd_tab_store.data.mask_blur
            },
            (value: number) => {
                sd_tab_store.data.mask_blur = value
            }
        )

        this.mask_expansion = createUIElement(
            html_manip.getMaskExpansion,
            html_manip.setMaskExpansion
        )
        this.samplers = createUIElement(
            () => {
                return sd_tab_store.data.sampler_name
            },
            (value: string) => {
                sd_tab_store.data.sampler_name = value
            }
        )

        this.uiElements = {
            // model: null,
            // prompt_shortcut: null,
            prompt: this.prompt,
            negative_prompt: this.negative_prompt,
            // selection_mode: null,
            mode: this.mode,
            batch_size: this.batch_size,
            batch_count: this.batch_count,
            steps: this.steps,
            width: this.width,
            height: this.height,

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
            cfg: this.cfg,
            samplers: this.samplers,
        }
    }

    autoFillInSettings(settings: any) {
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
        let settings: any = {}
        for (const [name, ui_element] of Object.entries(this.uiElements)) {
            if (ui_element) {
                const value = ui_element.getValue()
                settings[name] = value
            }
        }
        return settings
    }

    saveAsJson(json_file_name: string, settings: any) {
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

function loadLatentNoiseSettings(ui_settings: any) {
    loadPreset(ui_settings, LatentNoiseSettings)
}

function loadFillSettings(ui_settings: any) {
    loadPreset(ui_settings, FillSettings)
}
function loadOriginalSettings(ui_settings: any) {
    loadPreset(ui_settings, OriginalSettings)
}
async function loadHealBrushSettings(ui_settings: any) {
    document.getElementById('rbModeInpaint')!.click()

    loadPreset(ui_settings, HealBrushSettings)
}

function loadCustomPresetsSettings() {}
async function mapCustomPresetsToLoaders(ui_settings_obj: any) {
    const name_to_settings_obj = await getAllCustomPresetsSettings()
    const preset_name_to_loader_obj: any = {}
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
export function getNativeSDPresets() {
    return g_nativePresets
}
let g_ui_settings_object = new UISettings()
function getUISettingsObject() {
    return g_ui_settings_object
}

//REFACTOR: move to ui.js
function addPresetMenuItem(preset_title: string) {
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
// async function populatePresetMenu() {
//     document.getElementById('mPresetMenu')!.innerHTML = ''
//     const divider_elem = document.createElement('sp-menu-divider')
//     const preset_name = 'Select Smart Preset'
//     // const preset_func = () => {}
//     const dummy_preset_item = addPresetMenuItem(preset_name)
//     dummy_preset_item.setAttribute('selected', 'selected')
//     // dummy_preset_item.setAttribute('disabled')
//     document.getElementById('mPresetMenu')!.appendChild(dummy_preset_item)
//     document.getElementById('mPresetMenu')!.appendChild(divider_elem)
//     const presets = await getLoadedPresets(g_ui_settings_object)
//     for (const [key, value] of Object.entries(presets)) {
//         const preset_menu_item = addPresetMenuItem(key)
//         document.getElementById('mPresetMenu')!.appendChild(preset_menu_item)
//     }
// }

// populatePresetMenu()
//REFACTOR: move to preset_tab.js
// document
//     .getElementById('mPresetMenu')!
//     .addEventListener('change', async (evt: any) => {
//         const preset_index = evt.target.selectedIndex
//         const preset_name: string = evt.target.options[preset_index].textContent
//         const presets: any = await getLoadedPresets(g_ui_settings_object)
//         if (presets.hasOwnProperty(preset_name)) {
//             const loader = presets[preset_name]
//             if (loader.constructor.name === 'AsyncFunction') {
//                 await loader(g_ui_settings_object)
//             } else {
//                 loader(g_ui_settings_object)
//             }
//         }
//     })

// {
//     sd_tab:
//     controlnet_tab:
//     settings_tab:
// }
export {
    UI,
    UIElement,
    UISettings,
    loadLatentNoiseSettings,
    loadFillSettings,
    loadHealBrushSettings,
    getUISettingsObject,
    // populatePresetMenu,
}
