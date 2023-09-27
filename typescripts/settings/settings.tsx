import React from 'react'
import ReactDOM from 'react-dom/client'
import { observer } from 'mobx-react'
import { AStore } from '../main/astore'

import { SpCheckBox, SpLabel, SpMenu, SpTextfield } from '../util/elements'
import Locale from '../locale/locale'
import globalStore from '../globalstore'
import { io, settings } from '../util/oldSystem'
import { reaction } from 'mobx'
//@ts-ignore
import { storage } from 'uxp'
import { ErrorBoundary } from '../util/errorBoundary'
import { MaskModeEnum, ScriptMode } from '../util/ts/enum'
import { store as progress_store } from '../session/progress'
import { checkServerType } from 'diffusion-chain'

// import { Jimp } from '../util/oldSystem'
declare const Jimp: any // make sure you import jimp before importing settings.tsx
declare let g_sd_url: string;

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

@observer
export class Settings extends React.Component<{}, { TempServerUrl: string, urlLabelHovering: boolean }> {
    state = {
        TempServerUrl: '',
        urlLabelHovering: false
    }

    componentDidMount(): void {
        this.setState({
            TempServerUrl: globalStore.ServerUrl
        });

        reaction(() => {
            return globalStore.ServerUrl
        }, (gsurl: string) => {
            this.setState({
                TempServerUrl: gsurl
            })
        })
    }

    async changeSdUrl(url: string) {
        let sd_url = url.trim()

        if (sd_url.length > 0) {
            //check if the last character of the url has "/" or '\' and remove it

            let last_index = sd_url.length - 1

            if (sd_url[last_index] === '/' || sd_url[last_index] === '\\') {
                sd_url = sd_url.slice(0, -1)
            }

            //submit the change
            checkServerType(url).then(type => {
                g_sd_url = url
                globalStore.ServerUrl = url;
                globalStore.ServerType = type;
                this.setState({
                    TempServerUrl: url
                })

                settings.saveSettings(url);
            })
        }
    }

    getServerTypeLabel() {
        if (this.state.TempServerUrl != globalStore.ServerUrl) return 'Save URL'
        if (this.state.urlLabelHovering) return 'Clear';
        if (globalStore.ServerType == 'A1111') return "A1111 WebUI"
        if (globalStore.ServerType == 'Comfy') return "ComfyUI"
        return globalStore.ServerType
    }

    onLabelClick() {
        if (this.state.TempServerUrl != globalStore.ServerUrl && this.state.TempServerUrl) return this.changeSdUrl(this.state.TempServerUrl);
        else this.setState({TempServerUrl: ''})
    }

    render() {
        return (
            <div style={{ width: '100%' }}>
                <sp-label>Server Setting:</sp-label>
                <div className="sdServerRect"
                    onMouseOver={() => { this.setState({'urlLabelHovering': true}) }}
                    onMouseOut={() => { this.setState({'urlLabelHovering': false}) }}
                >
                    <div className="sdServerUrlText">
                        <SpTextfield
                            type="text"
                            placeholder="put your a1111/comfy server url here"
                            value={this.state.TempServerUrl}
                            onInput={(e: any) => { this.setState({ TempServerUrl: e.target.value }) }}
                        >
                        </SpTextfield>
                    </div>
                    <SpLabel
                        onClick={this.onLabelClick.bind(this)}
                        class={"serverTypeLabel label" + (this.state.TempServerUrl == globalStore.ServerUrl && !this.state.urlLabelHovering ? globalStore.ServerType : 'Button')}>
                        {this.getServerTypeLabel()}
                    </SpLabel>
                </div>
                <sp-divider style={{ marginBottom: 5 }}></sp-divider>
                <SpMenu
                    style={{display: globalStore.ServerType == 'A1111' ? 'flex': 'none'}}
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
                <div 
                    style={{
                        display: globalStore.ServerType == 'A1111' ? 'flex': 'none'
                    }}
                >
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
                    style={{
                        display: globalStore.ServerType == 'A1111' ? 'flex': 'none'
                    }}
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
                        display: globalStore.ServerType == 'A1111' ? 'flex': 'none'
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
                <div
                    style={{
                        display: globalStore.ServerType == 'A1111' ? 'flex': 'none'
                    }}
                >
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
                <div
                    style={{
                        display: globalStore.ServerType == 'A1111' ? 'flex': 'none'
                    }}
                >
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
                <div
                    style={{
                        display: globalStore.ServerType == 'A1111' ? 'flex': 'none'
                    }}
                >
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
            </div>
        )
    }
}
const containerNode = document.getElementById('reactSettingsContainer')!
const root = ReactDOM.createRoot(containerNode)

root.render(
    <React.StrictMode>
        <ErrorBoundary>
            <Settings></Settings>
        </ErrorBoundary>
    </React.StrictMode>
)

progress_store.data.live_progress_image
