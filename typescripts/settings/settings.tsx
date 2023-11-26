import React from 'react'
import ReactDOM from 'react-dom/client'
import { observer } from 'mobx-react'
import { AStore } from '../main/astore'

import { SpCheckBox, SpMenu, SpSlider, SpTextfield } from '../util/elements'
import Locale from '../locale/locale'
import globalStore from '../globalstore'
import { io } from '../util/oldSystem'
import { reaction } from 'mobx'
//@ts-ignore
import { storage } from 'uxp'
import { ErrorBoundary } from '../util/errorBoundary'
import { MaskModeEnum, ScriptMode } from '../util/ts/enum'
import { store as progress_store } from '../session/progress'
import { requestPost } from '../util/ts/api'
import { comfyapi } from '../entry'

// import { Jimp } from '../util/oldSystem'
declare const Jimp: any // make sure you import jimp before importing settings.tsx
declare let g_sd_url: string
type InterpolationMethod = {
    [key: string]: {
        photoshop: string
        jimp: string
    }
}

const interpolationMethods: InterpolationMethod = {
    nearestNeighbor: {
        photoshop: 'nearestNeighbor',
        jimp: Jimp.RESIZE_NEAREST_NEIGHBOR,
    },
    bicubic: {
        photoshop: 'bicubicAutomatic',
        jimp: Jimp.RESIZE_BICUBIC,
    },
    bilinear: {
        photoshop: 'bilinear',
        jimp: Jimp.RESIZE_BILINEAR,
    },
}

enum ExtensionTypeEnum {
    ProxyServer = 'proxy_server',
    Auto1111Extension = 'auto1111_extension',
    None = 'none',
}
const config = {
    [ExtensionTypeEnum.ProxyServer]: {
        title: "use the proxy server, need to run 'start_server.bat' ",
        value: ExtensionTypeEnum.ProxyServer,
        label: 'Proxy Server',
    },
    [ExtensionTypeEnum.Auto1111Extension]: {
        title: 'use Automatic1111 Photoshop SD Extension, need to install the extension in Auto1111',
        value: ExtensionTypeEnum.Auto1111Extension,
        label: 'Auto1111 Extension',
    },
    [ExtensionTypeEnum.None]: {
        title: 'Use the Plugin Only No Additional Component',
        value: ExtensionTypeEnum.None,
        label: 'None',
    },
}

function extensionTypeName(extension_type: ExtensionTypeEnum) {
    return extension_type
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}
interface AStoreData {
    scale_interpolation_method: typeof interpolationMethods.bilinear
    should_log_to_file: boolean
    delete_log_file_timer_id: ReturnType<typeof setInterval> | undefined
    b_borders_or_corners: MaskModeEnum
    use_image_cfg_scale_slider: boolean
    extension_type: ExtensionTypeEnum
    use_sharp_mask: boolean
    use_prompt_shortcut: boolean
    bTurnOffServerStatusAlert: boolean
    CLIP_stop_at_last_layers: number
    use_smart_object: boolean
    selected_backend: 'Automatic1111' | 'ComfyUI'
    comfy_url: string
}
export const store = new AStore<AStoreData>({
    scale_interpolation_method: interpolationMethods.bilinear,
    should_log_to_file:
        JSON.parse(storage.localStorage.getItem('should_log_to_file')) || false,
    delete_log_file_timer_id: undefined,
    b_borders_or_corners: MaskModeEnum.Transparent,
    use_image_cfg_scale_slider: false,
    extension_type: ExtensionTypeEnum.Auto1111Extension,
    use_sharp_mask: false,
    use_prompt_shortcut: true,
    bTurnOffServerStatusAlert:
        JSON.parse(storage.localStorage.getItem('bTurnOffServerStatusAlert')) ||
        false,
    CLIP_stop_at_last_layers: 1,
    use_smart_object: true, // true to keep layer as smart objects, false to rasterize them
    // selected_backend: 'Automatic1111' as 'Automatic1111' | 'ComfyUI',
    selected_backend: (storage.localStorage.getItem('selected_backend') ||
        'ComfyUI') as 'Automatic1111' | 'ComfyUI',
    comfy_url:
        storage.localStorage.getItem('comfy_url') || 'http://127.0.0.1:8188',
})

function onShouldLogToFileChange(event: any) {
    try {
        const should_log_to_file: boolean = event.target.checked
        store.data.should_log_to_file = should_log_to_file
        storage.localStorage.setItem('should_log_to_file', should_log_to_file)
        if (should_log_to_file && !store.data.delete_log_file_timer_id) {
            store.data.delete_log_file_timer_id = setDeleteLogTimer()
        } else {
            //don't log and clear delete file timer
            try {
                clearInterval(
                    store.data.delete_log_file_timer_id as ReturnType<
                        typeof setInterval
                    >
                )
                store.data.delete_log_file_timer_id = undefined
            } catch (e) {
                console.warn(e)
            }
        }

        //@ts-ignore
        setLogMethod(should_log_to_file)
    } catch (e) {
        console.warn(e)
    }
}

function setDeleteLogTimer() {
    const timer_id = setInterval(async () => {
        await io.deleteFileIfLargerThan('log.txt', 200)
    }, 2 * 60 * 1000)
    console.log('setDeleteLogTimer() timer_id :', timer_id)
    return timer_id
}
async function postOptions(options: Object) {
    try {
        const full_url = `${g_sd_url}/sdapi/v1/options`
        await requestPost(full_url, options)
    } catch (e) {
        console.warn('failed postOptions at : ', g_sd_url, options, e)
    }
}

interface Options {
    [key: string]: number
    CLIP_stop_at_last_layers: number
}

async function getOptions(): Promise<Options | null> {
    const full_url = `${g_sd_url}/sdapi/v1/options`
    try {
        const response = await fetch(full_url)
        if (response.status === 404) return null
        return await response.json()
    } catch (error) {
        console.error(`Error fetching from ${full_url}:`, error)
        return null
    }
}

@observer
export class Settings extends React.Component<{}> {
    async componentDidMount(): Promise<void> {
        if (store.data.selected_backend === 'Automatic1111') {
            const options = await getOptions()

            store.data.CLIP_stop_at_last_layers =
                options?.CLIP_stop_at_last_layers ??
                store.data.CLIP_stop_at_last_layers
        }
    }

    render() {
        return (
            <div style={{ width: '100%' }}>
                <sp-label>ComfyUI Url:</sp-label>
                <SpTextfield
                    type="text"
                    placeholder="http://127.0.0.1:8188"
                    // value={config.default}
                    value={store.data.comfy_url}
                    onChange={(event: any) => {
                        // store.data.search_query = event.target.value

                        let url = event.target.value.trim() // remove leading and trailing white spaces
                        url = url.replace(/[/\\]$/, '')
                        console.log(url)
                        store.data.comfy_url = url
                        comfyapi.comfy_api.setUrl(store.data.comfy_url)
                        storage.localStorage.setItem(
                            'comfy_url',
                            store.data.comfy_url
                        )
                    }}
                ></SpTextfield>
                <sp-radio-group>
                    {['Automatic1111', 'ComfyUI'].map(
                        (backend: any, index: number) => {
                            return (
                                <sp-radio
                                    key={index}
                                    title={backend}
                                    value={backend}
                                    onClick={(evt: any) => {
                                        store.data.selected_backend =
                                            evt.target.value
                                        storage.localStorage.setItem(
                                            'selected_backend',
                                            store.data.selected_backend
                                        )
                                    }}
                                    checked={
                                        store.data.selected_backend === backend
                                            ? true
                                            : void 0
                                    }
                                >
                                    {backend}
                                </sp-radio>
                            )
                        }
                    )}
                </sp-radio-group>
                <SpMenu
                    title="select an interploation method for resizing images"
                    items={Object.keys(interpolationMethods)}
                    label_item="Select Interpolation Method"
                    selected_index={Object.keys(interpolationMethods).findIndex(
                        (key) => {
                            return (
                                interpolationMethods[key].photoshop ===
                                    store.data.scale_interpolation_method
                                        .photoshop &&
                                interpolationMethods[key].jimp ===
                                    store.data.scale_interpolation_method.jimp
                            )
                        }
                    )}
                    onChange={(id: any, value: any) => {
                        store.updateProperty(
                            'scale_interpolation_method',
                            interpolationMethods[value.item]
                        )
                    }}
                ></SpMenu>

                <div style={{ width: '100%' }}>
                    <sp-label>select language</sp-label>
                </div>
                <SpMenu
                    title="select language"
                    items={['en_US', 'zh_CN']}
                    label_item="select language"
                    selected_index={['en_US', 'zh_CN'].indexOf(
                        globalStore.Locale
                    )}
                    onChange={(id: any, value: any) => {
                        globalStore.Locale = value.item
                        localStorage.setItem('last_selected_locale', value.item)
                        console.log(
                            localStorage.getItem('last_selected_locale')
                        )
                    }}
                ></SpMenu>
                <div style={{}}>
                    <SpCheckBox
                        style={{
                            marginRight: '10px',
                        }}
                        onChange={onShouldLogToFileChange}
                        checked={store.data.should_log_to_file}
                    >
                        {
                            //@ts-ignore
                            Locale('Log Errors To File')
                        }
                    </SpCheckBox>
                </div>

                <sp-radio-group
                    style={{ display: 'flex' }}
                    selected={store.data.b_borders_or_corners}
                    onClick={(event: any) => {
                        store.data.b_borders_or_corners = event.target.value
                    }}
                >
                    <sp-label slot="label">
                        {Locale('Mask Layer Mode:')}
                    </sp-label>
                    {[
                        {
                            label: 'fully transparent',
                            value: MaskModeEnum.Transparent,
                        },
                        { label: 'keep borders', value: MaskModeEnum.Borders },
                        { label: 'keep corners', value: MaskModeEnum.Corners },
                    ].map((mode: any, index: number) => {
                        // console.log('mode:', mode.label, ' index:', index)
                        return (
                            <sp-radio
                                key={`mode-${index}`}
                                checked={
                                    store.data.b_borders_or_corners ===
                                    mode.value
                                        ? true
                                        : void 0
                                }
                                value={mode.value}
                            >
                                {Locale(mode.label)}
                            </sp-radio>
                        )
                    })}
                </sp-radio-group>
                <SpCheckBox
                    style={{
                        marginRight: '10px',
                    }}
                    onChange={(evt: any) => {
                        progress_store.data.live_progress_image =
                            evt.target.checked
                    }}
                    checked={progress_store.data.live_progress_image}
                >
                    {
                        //@ts-ignore
                        Locale('Live Progress Image')
                    }
                </SpCheckBox>
                <div>
                    <sp-checkbox
                        id="chUseImageCfgScaleSlider"
                        title="image cfg slider for pix2pix mode"
                        value={store.data.use_image_cfg_scale_slider}
                        onClick={(evt: any) => {
                            store.data.use_image_cfg_scale_slider =
                                evt.target.checked
                        }}
                        style={{ display: 'inline-flex' }}
                    >
                        Image Cfg Scale Slider
                    </sp-checkbox>
                </div>
                <div>
                    <sp-checkbox
                        id="chUseSharpMask"
                        checked={store.data.use_sharp_mask}
                        onClick={(evt: any) => {
                            store.data.use_sharp_mask = evt.target.checked
                        }}
                    >
                        use sharp mask
                    </sp-checkbox>
                </div>
                <div>
                    <sp-radio-group selected={store.data.extension_type}>
                        <sp-label slot="label">Select Extension:</sp-label>
                        {[
                            ExtensionTypeEnum.ProxyServer,
                            ExtensionTypeEnum.Auto1111Extension,
                            ExtensionTypeEnum.None,
                        ].map((extension_type, index: number) => {
                            return (
                                <sp-radio
                                    key={index}
                                    title={config[extension_type].title}
                                    class="rbExtensionType"
                                    value={config[extension_type].value}
                                    checked={
                                        store.data.extension_type ===
                                        config[extension_type].value
                                            ? true
                                            : void 0
                                    }
                                    onClick={(evt: any) => {
                                        store.data.extension_type =
                                            evt.target.value
                                    }}
                                >
                                    {config[extension_type].label}
                                </sp-radio>
                            )
                        })}
                    </sp-radio-group>
                </div>
                <div>
                    <sp-checkbox
                        id="chTurnOffServerStatusAlert"
                        checked={
                            store.data.bTurnOffServerStatusAlert
                                ? true
                                : undefined
                        }
                        onClick={(evt: any) => {
                            store.data.bTurnOffServerStatusAlert =
                                evt.target.checked
                            storage.localStorage.setItem(
                                'bTurnOffServerStatusAlert',
                                evt.target.checked
                            )
                        }}
                    >
                        Turn Off Server Status Alert
                    </sp-checkbox>
                </div>
                <div>
                    <SpSlider
                        show-value="false"
                        min={1}
                        max={12}
                        value={store.data.CLIP_stop_at_last_layers}
                        onInput={(evt: any) => {
                            store.data.CLIP_stop_at_last_layers =
                                evt.target.value
                        }}
                        onChange={async (evt: any) => {
                            console.log(
                                'should update clip skip through the option endpoint'
                            )
                            await postOptions({
                                CLIP_stop_at_last_layers:
                                    store.data.CLIP_stop_at_last_layers,
                            })
                        }}
                        title="clip skip: use 1 for none, 2 for skipping one layer"
                    >
                        <sp-label slot="label">
                            {Locale('Clip Skip: ')}
                        </sp-label>
                        <sp-label slot="label">
                            {store.data.CLIP_stop_at_last_layers}
                        </sp-label>
                    </SpSlider>
                </div>
                <div>
                    <sp-checkbox
                        checked={store.data.use_smart_object ? true : undefined}
                        id="chUseSmartObject"
                        onClick={(evt: any) => {
                            store.data.use_smart_object = evt.target.checked
                                ? true
                                : false
                        }}
                    >
                        Smart Object
                    </sp-checkbox>
                </div>
            </div>
        )
    }
}
const containerNode = document.getElementById('reactSettingsContainer')!
const root = ReactDOM.createRoot(containerNode)

root.render(
    //<React.StrictMode>
    <ErrorBoundary>
        <Settings></Settings>
    </ErrorBoundary>
    //</React.StrictMode>
)

progress_store.data.live_progress_image

export default {
    store: store,
}
