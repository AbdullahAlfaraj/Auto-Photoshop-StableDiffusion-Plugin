import type Jimp from 'jimp'

//@ts-ignore
const req = window['require']

// because we use window['require'], so the base path of this require function is the root path of plugin.
const selection = req('./selection')
const note = req('./utility/notification')
const controlnet_preset = req('./utility/presets/controlnet_preset')

const Enum = req('./enum')
const api = req('./utility/api')
const python_replacement = req('./utility/sdapi/python_replacement')
const sdapi = req('./sdapi_py_re')
const html_manip = req('./utility/html_manip')
const psapi = req('./psapi')
const general = req('./utility/general')
const io = req('./utility/io')
const settings_tab = req('./utility/tab/settings')
const layer_util = req('./utility/layer')
const session = req('./utility/session')
const dialog_box = req('./dialog_box')
const sampler_data = req('./utility/sampler')

const thumbnail = req('./thumbnail')
interface _Jimp extends Jimp {}
const _Jimp: typeof Jimp = (window as any)['Jimp']

export {
    selection,
    note,
    controlnet_preset,
    Enum,
    api,
    python_replacement,
    sdapi,
    html_manip,
    psapi,
    general,
    io,
    settings_tab,
    layer_util,
    session,
    dialog_box,
    sampler_data,
    thumbnail,
    _Jimp as Jimp,
}
