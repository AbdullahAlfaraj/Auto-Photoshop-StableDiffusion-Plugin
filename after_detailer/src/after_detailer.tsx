import React, { ReactPropTypes } from 'react'
import ReactDOM from 'react-dom/client'

// import { action, makeAutoObservable, reaction, toJS } from 'mobx'
import { observer } from 'mobx-react'

import {
    SliderType,
    SpMenu,
    SpSliderWithLabel,
} from '../../ultimate_sd_upscaler/src/elements'

import { AStore } from '../../main/src/astore'
import { ui_config, model_list } from './config'
import { requestGet } from '../../utility/api'
import { requestControlNetModelList } from '../../utility/tab/control_net'

import './style/after_detailer.css'

declare let g_sd_url: string

export enum ScriptMode {
    Txt2Img = 'txt2img',
    Img2Img = 'img2img',
    Inpaint = 'inpaint',
    Outpaint = 'outpaint',
}

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
    controlnet_models: [],
    controlNetWeight: 1,
    script_name: 'after detailer',

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
    ) {
        // if (store.data.refresh) {
        //     if (await this.isInstalled()) {
        //         await this.getInpaintModels()
        //         store.updateProperty('refresh', false)
        //     }
        // }
    }
    handleRefresh = async () => {
        if (await this.isInstalled()) {
            await this.getInpaintModels()
            // store.updateProperty('refresh', false)
        }
    }
    async isInstalled() {
        const full_url = `${g_sd_url}/sdapi/v1/scripts`

        const scripts = await requestGet(full_url)
        const is_installed =
            scripts?.txt2img?.includes(store.data.script_name) ||
            scripts?.img2img?.includes(store.data.script_name) ||
            false

        console.log('is_installed: ', is_installed)
        store.updateProperty('is_installed', is_installed)
        return is_installed
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
                        title="Refresh the After Detailer Extension"
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
                    onSliderChange={(new_value: number) => {
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
                    onSliderChange={(new_value: number) => {
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

import { useState, ReactNode } from 'react'

interface CollapsibleProps {
    label: string
    children: ReactNode
}
const Collapsible = ({ label, children }: CollapsibleProps) => {
    const [isOpen, setIsOpen] = useState(false)

    const handleToggle = () => {
        setIsOpen(!isOpen)
    }

    return (
        <div>
            <div className="collapsible" onClick={handleToggle}>
                <span>{label}</span>
                <span style={{ float: 'right' }} className="triangle">
                    {isOpen ? '∨' : '<'}
                </span>
            </div>
            {/* {isOpen && <div>{children}</div>} */}
            <div style={{ display: isOpen ? 'block' : 'none' }}>{children}</div>
        </div>
    )
}

export default Collapsible

root.render(
    <React.StrictMode>
        <div style={{ border: '2px solid #6d6c6c', padding: '3px' }}>
            {/* <button>test</button> */}
            {/* <div
                // type="button"
                className="collapsible"
                onClick={(event: any) => {
                    console.log('clicked')
                    event.target.classList.toggle('collapsible-active')

                    let content = event.target.nextElementSibling
                    console.log('collapsible content: ', content)
                    let triangle =
                        event.target.getElementsByClassName('triangle')[0]
                    if (content.style.display === 'block') {
                        content.style.display = 'none'
                        triangle.innerText = '<'
                    } else {
                        content.style.display = 'block'
                        triangle.innerText = '∨'
                    }
                }}
            >
                <span>After Detailer</span>
                <span style={{ float: 'right' }} className="triangle">
                    {'<'}
                </span>
            </div> */}

            {/* <AfterDetailerComponent></AfterDetailerComponent> */}
            <Collapsible label={'After Detailer'}>
                <AfterDetailerComponent />
            </Collapsible>
        </div>
    </React.StrictMode>
)
