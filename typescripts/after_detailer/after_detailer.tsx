import React, { ReactPropTypes } from 'react'
import ReactDOM from 'react-dom/client'

// import { action, makeAutoObservable, reaction, toJS } from 'mobx'
import { observer, useObserver } from 'mobx-react'

import {
    SliderType,
    SpCheckBox,
    SpMenu,
    SpSliderWithLabel,
} from '../util/elements'
import { Collapsible } from '../util/collapsible'
// import * as sdapi from '../../sdapi_py_re'
import { api } from '../util/oldSystem'
import { AStore } from '../main/astore'
import { ui_config, model_list } from './config'
const { requestGet } = api
import { requestControlNetModelList } from '../controlnet/entry'
import { ErrorBoundary } from '../util/errorBoundary'
import { ScriptMode } from '../util/ts/enum'

import './style/after_detailer.css'

declare let g_sd_url: string

export let script_mode = [
    ScriptMode.Img2Img,
    ScriptMode.Inpaint,
    ScriptMode.Outpaint,
]

// const configValues = Object.entries(ui_config).reduce(
//     (acc, [key, value]) => ({ ...acc, [key]: value.value }),
//     {}
// )
// const default_values: any = {
//     _: '',
//     ...configValues,
// }

// export const ultimate_sd_upscaler_store = new UltimateSDUpscalerStore(
//     default_values
// )

export const store = new AStore({
    model_list: ui_config.ad_model.choices,
    ad_model: ui_config.ad_model.value,
    ad_conf: ui_config.ad_conf.value,
    prompt: '',
    negativePrompt: '',
    controlnet_model: 'None',
    controlnet_models: [] as string[],
    controlNetWeight: 1,
    script_name: 'adetailer',

    is_installed: false,
    is_enabled: false,
    refresh: false,
})

@observer
export class AfterDetailerComponent extends React.Component<{
    // store: AStore
}> {
    // slider1Ref = React.createRef<SpSliderWithLabel>()
    // slider2Ref = React.createRef<SpSliderWithLabel>()
    // state = {
    //     items: ['Item 1', 'Item 2', 'Item 3'],
    //     sd_upscalers: [],
    // }

    async componentDidMount(): Promise<void> {
        // this.getUpscalers()

        try {
            if (await this.isInstalled()) {
                await this.getInpaintModels()
                store.updateProperty('refresh', false)
            }
        } catch (e) {
            console.error(e)
        }
    }

    async componentDidUpdate(
        prevProps: ReactPropTypes,
        prevState: ReactPropTypes
    ) {}
    handleRefresh = async () => {
        if (await this.isInstalled()) {
            await this.getInpaintModels()
        }
    }
    async isInstalled() {
        try {
            const full_url = `${g_sd_url}/sdapi/v1/scripts`

            const scripts = await requestGet(full_url)
            const is_installed =
                scripts?.txt2img?.includes(store.data.script_name) ||
                scripts?.img2img?.includes(store.data.script_name) ||
                false

            console.log('is_installed: ', is_installed)
            store.updateProperty('is_installed', is_installed)
            return is_installed
        } catch (e) {
            console.error(e)
        }
    }
    async getInpaintModels() {
        try {
            const controlnet_model_list =
                (await requestControlNetModelList()) ?? []
            let inpaint_models = controlnet_model_list.filter((name: string) =>
                name.includes('inpaint')
            )
            inpaint_models = ['None'].concat(inpaint_models)
            store.updateProperty('controlnet_models', inpaint_models)
            // return inpaint_models
        } catch (e) {
            console.warn('getInpaintModels():', e)
        }
    }

    render() {
        if (!store.data.is_installed) {
            return (
                <div>
                    <sp-label class="missing-error">
                        Script is not available; Make sure to install it from
                        Automatic1111 webui
                    </sp-label>
                    <button
                        className="btnSquare refreshButton"
                        id="btnResetSettings"
                        title="Refresh the ADetailer Extension"
                        onClick={this.handleRefresh}
                    ></button>
                </div>
            )
        }

        return (
            <div>
                <sp-checkbox
                    checked={store.data.is_enabled ? true : undefined}
                    onClick={(event: React.ChangeEvent<HTMLInputElement>) => {
                        store.updateProperty('is_enabled', event.target.checked)
                    }}
                >
                    {'Activate'}
                </sp-checkbox>
                <SpMenu
                    title="model"
                    items={store.data.model_list}
                    // disabled={script_store.disabled}
                    // style="width: 199px; margin-right: 5px"
                    label_item="Select a ADetailer Model"
                    // id={'model_list'}
                    selected_index={store.data.model_list.indexOf(
                        store.data.ad_model
                    )}
                    onChange={(id: any, value: any) => {
                        console.log('onChange value: ', value)

                        store.updateProperty('ad_model', value.item)
                    }}
                ></SpMenu>
                <sp-textarea
                    placeholder="ADetailer Prompt"
                    value={store.data.prompt}
                    onInput={(
                        event: React.ChangeEvent<HTMLTextAreaElement>
                    ) => {
                        store.updateProperty('prompt', event.target.value)
                    }}
                ></sp-textarea>
                <sp-textarea
                    placeholder="ADetailer Negative Prompt"
                    value={store.data.negativePrompt}
                    onInput={(
                        event: React.ChangeEvent<HTMLTextAreaElement>
                    ) => {
                        store.updateProperty(
                            'negativePrompt',
                            event.target.value
                        )
                    }}
                ></sp-textarea>
                <SpSliderWithLabel
                    // id={id}
                    show-value={false}
                    steps={ui_config.ad_conf.step}
                    out_min={ui_config.ad_conf.minimum}
                    out_max={ui_config.ad_conf.maximum}
                    output_value={store.data['ad_conf']}
                    // title={ui_config[id].label}
                    label="Detection Confidence Threshold %:"
                    onSliderInput={(new_value: number) => {
                        // console.log('slider_change: ', new_value)
                        store.updateProperty('ad_conf', new_value)
                    }}
                />
                {/* <SpSliderWithLabel
                    // id={id}
                    show-value={false}
                    steps={1}
                    out_min={0}
                    out_max={100}
                    // output_value={this.props.store.data[id]}
                    // title={ui_config[id].label}
                    label="Mask min area ratio"
                    onSliderChange={(new_value: number) => {
                        console.log('slider_change: ', new_value)
                    }}
                /> */}
                <SpMenu
                    title="controlnet inpaint model"
                    items={store.data.controlnet_models}
                    // disabled={script_store.disabled}
                    // style="width: 199px; margin-right: 5px"
                    label_item="Select a ControlNet Model"
                    // id={'model_list'}
                    selected_index={store.data.controlnet_models.indexOf(
                        store.data.controlnet_model
                    )}
                    onChange={(id: any, value: any) => {
                        // console.log('onChange value: ', value)
                        store.updateProperty('controlnet_model', value.item)
                    }}
                ></SpMenu>
                <SpSliderWithLabel
                    // id={id}
                    show-value={false}
                    steps={ui_config.ad_controlnet_weight.step}
                    out_min={ui_config.ad_controlnet_weight.minimum}
                    out_max={ui_config.ad_controlnet_weight.maximum}
                    output_value={store.data.controlNetWeight}
                    // output_value={this.props.store.data[id]}
                    // title={ui_config[id].label}
                    label="ControlNet Weight"
                    slider_type={
                        Number.isInteger(ui_config['ad_controlnet_weight'].step)
                            ? SliderType.Integer
                            : SliderType.Float
                    }
                    onSliderInput={(new_value: number) => {
                        // console.log('slider_change: ', new_value)
                        store.updateProperty('controlNetWeight', new_value)
                    }}
                />
            </div>
        )
    }
}

const domNode = document.getElementById('alwaysOnScriptsContainer')!
const root = ReactDOM.createRoot(domNode)

root.render(
    //<React.StrictMode>
    <ErrorBoundary>
        <div style={{ border: '2px solid #6d6c6c', padding: '3px' }}>
            <Collapsible label={'ADetailer'}>
                <AfterDetailerComponent />
            </Collapsible>
        </div>
    </ErrorBoundary>
    //</React.StrictMode>
)
