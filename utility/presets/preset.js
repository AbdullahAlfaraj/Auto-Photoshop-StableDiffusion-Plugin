const io = require('../io')
const html_manip = require('../html_manip')
const Enum = require('../../enum')
const event = require('../event')

// const control_net = require('../../utility/tab/control_net')
let settings = {
    model: null,
    prompt_shortcut: null,
    positive_prompt: null,
    negative_prompt: null,
    selection_mode: null,
    batch_number: null,
    steps: null,
    width: null,
    height: null,
    firstphase_width: null,
    firstphase_height: null,
    cfg: null,
    denoising_strength: null,
    hi_res_denoising_strength: null,
    mask_blur: null,
    inpaint_at_full_res: null,
    hi_res_fix: null,
    inpaint_padding: null,
    seed: null,
    samplers: null,
    mask_content: null,
}

let LatentNoiseSettings = {
    model: null,
    prompt_shortcut: null,
    positive_prompt: null,
    negative_prompt: null,
    generation_mode: null,
    batch_number: null,
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
    batch_number: null,
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
    batch_number: null,
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
    batch_number: null,
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

function nullAllSettings() {}

class Preset {
    constructor() {}

    loadPresetFromJson(preset_path) {}
    savePresetToJson(preset_path, settings) {}
}

function getPresetSettingsHtml() {
    const value_str = document.getElementById('taPresetSettings').value
    const value_json = JSON.parse(value_str)
    return value_json
}
function setPresetSettingsHtml(preset_settings) {
    const JSONInPrettyFormat = JSON.stringify(preset_settings, undefined, 7)
    preset_settings_element = document.getElementById('taPresetSettings')
    preset_settings_element.value = JSONInPrettyFormat

    const new_lines_count = general.countNewLines(JSONInPrettyFormat)
    new_lines_count
    preset_settings_element.style.height = new_lines_count * 12 + 100
}

function getPresetName() {
    const preset_name = document.getElementById('tiPresetName').value
    return preset_name
}
function setPresetName(preset_name) {
    document.getElementById('tiPresetName').value = preset_name
}

function getPresetSettings(preset_type) {
    let preset_settings
    if (preset_type === Enum.PresetTypeEnum['SDPreset']) {
        preset_settings = g_ui_settings_object.getSettings()
    } else if (preset_type === Enum.PresetTypeEnum['ControlNetPreset']) {
        const { ControlNetUnit } = require('../../utility/tab/control_net') // only import ControlNetUnit to avoid circular dependency
        // preset_settings = control_net.ControlNetUnit.getUnits()

        preset_settings = ControlNetUnit.getUnits()
    }
    return preset_settings
}

function getPresetType() {
    const presetType = document.getElementById('rgPresetType').selected

    return presetType
}

document.getElementById('btnNewPreset').addEventListener('click', () => {
    // const g_ui_settings_object = getUISettingsObject()
    // debugger
    const preset_type = getPresetType()
    const preset_settings = getPresetSettings(preset_type)

    // const settings = g_ui_settings_object.getSettings()

    setPresetSettingsHtml(preset_settings)

    const preset_name = getPresetName()
    setPresetNameLabel(preset_name)
})

function getPresetNameLabel() {
    //use presetNameLabel as the final name for a preset
    const preset_name = document.getElementById('lPresetName').textContent
    return preset_name
}
function setPresetNameLabel(preset_name) {
    document.getElementById('lPresetName').textContent = preset_name.trim()
}

async function populatePresetMenu() {
    // presets = ['preset_1', 'preset_2', 'preset_3']
    const preset_type = getPresetType()
    const presets = await getAllCustomPresetsSettings(preset_type)
    const presets_names = Object.keys(presets)
    html_manip.populateMenu(
        'mSettingTabPresetMenu',
        'mPresetMenuItemClass',
        presets_names,
        (item, item_html_element) => {
            item_html_element.innerHTML = item
        }
    )
}
async function deletePreset() {
    try {
        const preset_name = html_manip.getSelectedMenuItemTextContent(
            'mSettingTabPresetMenu'
        )
        const preset_file_name = preset_name + '.json'

        const preset_type = getPresetType()
        const preset_folder_name = mapPresetTypeToPresetFolder(preset_type)
        const custom_preset_entry = await io.IOFolder.getCustomPresetFolder(
            preset_folder_name
        )

        await io.IOJson.deleteFile(custom_preset_entry, preset_file_name)
        html_manip.unselectMenuItem('mSettingTabPresetMenu') // unselect the custom preset menu
        setPresetSettingsHtml({}) //reset preset settings text area
        setPresetName('')
        setPresetNameLabel('')
        await populatePresetMenu() // update the custom preset Menu
        triggerUpdatePresetMenu(preset_type)
    } catch (e) {
        console.warn(e)
    }
}

async function getCustomPresetEntries(preset_folder_name) {
    const custom_preset_entry = await io.IOFolder.getCustomPresetFolder(
        preset_folder_name
    )

    const custom_preset_entries = await io.IOJson.getJsonEntries(
        custom_preset_entry
    )

    return custom_preset_entries
}

async function loadPresetSettingsFromFile(preset_file_name, preset_type) {
    // const preset_type = getPresetType()

    const preset_folder_name = mapPresetTypeToPresetFolder(preset_type)
    const custom_preset_entry = await io.IOFolder.getCustomPresetFolder(
        preset_folder_name
    )
    let preset_settings = {}
    try {
        preset_settings = await io.IOJson.loadJsonFromFile(
            custom_preset_entry,
            preset_file_name
        )
    } catch (e) {
        console.warn(e)
    }
    return preset_settings
}
async function getAllCustomPresetsSettings(preset_type) {
    const preset_folder_name = mapPresetTypeToPresetFolder(preset_type)
    const custom_preset_entries = await getCustomPresetEntries(
        preset_folder_name
    )
    let custom_presets = {}
    for (const entry of custom_preset_entries) {
        const preset_name = entry.name.split('.json')[0]
        let preset_settings = await loadPresetSettingsFromFile(
            entry.name,
            preset_type
        )

        custom_presets[preset_name] = preset_settings
    }
    return custom_presets
}

function mapPresetTypeToPresetFolder(preset_type) {
    let preset_folder

    if (preset_type === Enum.PresetTypeEnum['SDPreset']) {
        preset_folder = 'custom_preset'
    } else if (preset_type === Enum.PresetTypeEnum['ControlNetPreset']) {
        preset_folder = 'controlnet_preset'
    }
    return preset_folder
}

function triggerUpdatePresetMenu(preset_type) {
    let menu_id
    if (preset_type === Enum.PresetTypeEnum['SDPreset']) {
        menu_id = '#mPresetMenu'
    } else if (preset_type === Enum.PresetTypeEnum['ControlNetPreset']) {
        menu_id = '#mControlNetPresetMenu'
    }
    event.triggerEvent(menu_id, event.updatePresetMenuEvent)
}
Array.from(document.getElementsByClassName('rbPresetType')).forEach((rb) => {
    rb.addEventListener('click', async () => {
        const preset_type = rb.value
        await populatePresetMenu()
    })
})

document.getElementById('btnSavePreset').addEventListener('click', async () => {
    //save preset settings from textarea to json file
    //reload the preset menu
    const preset_type = getPresetType()
    const custom_preset_folder_name = mapPresetTypeToPresetFolder(preset_type)
    const custom_preset_entry = await io.IOFolder.getCustomPresetFolder(
        custom_preset_folder_name
    )
    const preset_settings = getPresetSettingsHtml()
    const preset_name = getPresetNameLabel()

    //check if the file exist and prompt the user to override it or cancel
    await io.IOJson.saveJsonToFileExe(
        preset_settings,
        custom_preset_entry,
        preset_name + '.json'
    )
    await populatePresetMenu()
    triggerUpdatePresetMenu(preset_type)
    html_manip.selectMenuItem('mSettingTabPresetMenu', preset_name)
})
document
    .getElementById('btnDeletePreset')
    .addEventListener('click', async () => {
        await deletePreset()
    })

document.getElementById('tiPresetName').addEventListener('input', () => {
    //save preset settings from textarea to json file
    //reload the preset menu
    const preset_name = getPresetName()
    setPresetNameLabel(preset_name)
    //check if the file exist and prompt the user to override it or cancel
})
document
    .getElementById('mSettingTabPresetMenu')
    .addEventListener('input', () => {
        //Note: is this correct?! why use Input and change events together
        //save preset settings from textarea to json file
        //reload the preset menu
        const preset_name = getPresetName()
        setPresetNameLabel(preset_name)
        //check if the file exist and prompt the user to override it or cancel
    })

document
    .getElementById('mSettingTabPresetMenu')
    .addEventListener('change', async (evt) => {
        try {
            const preset_index = evt.target.selectedIndex
            const preset_name = evt.target.options[preset_index].textContent
            const preset_type = getPresetType()
            setPresetName(preset_name)
            setPresetNameLabel(preset_name)

            const preset_settings = await loadPresetSettingsFromFile(
                preset_name + '.json',
                preset_type
            )
            setPresetSettingsHtml(preset_settings)
        } catch (e) {}
    })

document
    .getElementById('mPresetMenu')
    .addEventListener('updatePresetMenuEvent', async (event) => {
        // console.log("I'm listening on a custom event")
        const { populatePresetMenu } = require('../ui')
        await populatePresetMenu()
    })

async function initializePresetTab() {
    try {
        await populatePresetMenu()

        const selected_rb =
            html_manip.getSelectedRadioButtonElement('rbPresetType')
        selected_rb.click() // to trigger the click event which will update the setting preset menu according to the preset type
    } catch (e) {
        console.error(e)
    }
}
initializePresetTab()
module.exports = {
    LatentNoiseSettings,
    FillSettings,
    OriginalSettings,
    HealBrushSettings,
    populatePresetMenu,
    getCustomPresetEntries,
    loadPresetSettingsFromFile,
    getAllCustomPresetsSettings,
    initializePresetTab,
}
