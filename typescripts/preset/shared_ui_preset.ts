import { AStore } from '../main/astore'
import { html_manip, io } from '../util/oldSystem'
import { PresetTypeEnum } from '../util/ts/enum'
// import { getNativeSDPresets } from '../util/ts/ui_ts'

export async function getLoadedPresets(ui_settings_obj: any) {
    let customPresets

    customPresets = await mapCustomPresetsToLoaders(ui_settings_obj)
    console.log('customPresets: ', customPresets)
    let loadedPresets = {
        // ...getNativeSDPresets(),
        ...customPresets,
    }
    return loadedPresets
}
export const store = new AStore({
    preset_name: '',
    custom_presets: [] as any,
    selected_preset_name: '',

    sd_presets: [],
    sd_native_presets: [],

    selected_sd_preset_name: '', // the selected sd preset in sd tab
    selected_sd_preset: {}, // the selected sd preset settings
})

export const preset_tab_store = new AStore({
    new_preset_name: '', //for the textfield field and label
    new_preset: {} as any, // settings of the current preset tab preset
    selected_preset_name: '', // name of the selected in the menu
    selected_preset: {}, //settings of the selected preset in the menu
})
export async function getCustomPresetEntries(preset_folder_name: string) {
    const custom_preset_entry = await io.IOFolder.getCustomPresetFolder(
        preset_folder_name
    )

    const custom_preset_entries = await io.IOJson.getJsonEntries(
        custom_preset_entry
    )

    return custom_preset_entries
}
export async function loadPresetSettingsFromFile(preset_file_name: string) {
    const custom_preset_entry = await io.IOFolder.getCustomPresetFolder(
        'custom_preset'
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

export async function getAllCustomPresetsSettings() {
    const custom_preset_entries = await getCustomPresetEntries('custom_preset')
    let custom_presets: any = {}
    for (const entry of custom_preset_entries) {
        const preset_name: string = entry.name.split('.json')[0]
        let preset_settings = await loadPresetSettingsFromFile(entry.name)

        custom_presets[preset_name] = preset_settings
    }
    return custom_presets
}

const updatePresetMenuEvent = new CustomEvent('updatePresetMenuEvent', {
    detail: {},
    bubbles: true,
    cancelable: true,
    composed: false,
})

export function loadPreset(ui_settings: any, preset: any) {
    console.log('preset:', preset)
    ui_settings.autoFillInSettings(preset)
}
export function loadCustomPreset(
    ui_settings_obj: any,
    custom_preset_settings: any
) {
    loadPreset(ui_settings_obj, custom_preset_settings)
}
export async function mapCustomPresetsToLoaders(ui_settings_obj: any) {
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

export function getCustomPresetsNames(custom_presets: any) {
    let presets_names: any = []
    if (custom_presets) {
        presets_names = Object.keys(custom_presets)
    }
    return presets_names
}

export function onLoadControlnetPreset() {}
export function onLoadSDPreset() {}

//sd preset = {preset_name: settings_json}
//sd_preset_loader(sd_preset)

//controlnet_preset = {preset_name: settings_json}

export { updatePresetMenuEvent }
