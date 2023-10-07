import React, { ReactEventHandler } from 'react'
import ReactDOM from 'react-dom/client'

import { action, makeAutoObservable, reaction, toJS } from 'mobx'
import { Provider, inject, observer } from 'mobx-react'

import { SliderType, SpMenu, SpSliderWithLabel } from '../util/elements'

import { ui_config } from './config'
import { api } from '../util/oldSystem'

const { requestGet } = api
declare let g_sd_url: string

export let script_name: string = 'ultimate sd upscale'
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
interface UltimateSDUpscalerData {
    _: string
    tile_width: number
    tile_height: number
    mask_blur: number
    padding: number
    seams_fix_width: number
    seams_fix_denoise: number
    seams_fix_padding: number
    upscaler_index: number
    save_upscaled_image: boolean
    redraw_mode: number
    save_seams_fix_image: boolean
    seams_fix_mask_blur: number
    seams_fix_type: number
    target_size_type: number
    custom_width: number
    custom_height: number
    custom_scale: number
    is_installed: boolean
}
export const script_args_ordered = [
    '_',
    'tile_width',
    'tile_height',
    'mask_blur',
    'padding',
    'seams_fix_width',
    'seams_fix_denoise',
    'seams_fix_padding',
    'upscaler_index',
    'save_upscaled_image',
    'redraw_mode',
    'save_seams_fix_image',
    'seams_fix_mask_blur',
    'seams_fix_type',
    'target_size_type',
    'custom_width',
    'custom_height',
    'custom_scale',
]

//for some reason oldSystem.sdapi is empty {}, could be caused by a circular dependency
//so I've copy pasted requestGetUpscalers() to the ultimate sd upscaler module, as a temporary solution
async function requestGetUpscalers() {
    console.log('requestGetUpscalers: ')
    let json = []
    const full_url = `${g_sd_url}/sdapi/v1/upscalers`
    try {
        let request = await fetch(full_url)
        json = await request.json()
        console.log('upscalers json:')
        console.dir(json)
    } catch (e) {
        console.warn(`issues requesting from ${full_url}`, e)
    }
    return json
}

class UltimateSDUpscalerStore {
    data: UltimateSDUpscalerData

    is_active: boolean
    constructor(data: UltimateSDUpscalerData) {
        this.data = data

        this.is_active = false
        makeAutoObservable(this)
    }
    setIsActive(b_value: boolean) {
        this.is_active = b_value
    }

    updateProperty(key: keyof UltimateSDUpscalerData, value: any) {
        ;(this.data as any)[key] = value
    }

    isInstalled() {
        return this.data?.is_installed ?? false
    }
    toJsFunc() {
        return toJS(this)
    }
}

const configValues = Object.entries(ui_config).reduce(
    (acc, [key, value]) => ({ ...acc, [key]: value.value }),
    {}
)
const default_values: any = {
    _: '',
    ...configValues,
    is_installed: false,
}
export const ultimate_sd_upscaler_store = new UltimateSDUpscalerStore(
    default_values
)

@observer
export class UltimateSDUpscalerForm extends React.Component<{
    store: UltimateSDUpscalerStore
}> {
    // slider1Ref = React.createRef<SpSliderWithLabel>()
    // slider2Ref = React.createRef<SpSliderWithLabel>()
    state = {
        items: ['Item 1', 'Item 2', 'Item 3'],
        sd_upscalers: [],
    }
    async componentDidMount(): Promise<void> {
        if (await this.isInstalled()) {
            await this.getUpscalers()
        }
    }
    handleUpdateItems = () => {
        this.setState({
            items: ['New Item 1', 'New Item 2', 'New Item 3'],
        })
    }

    handleSliderChange = (key: any, newValue: any) => {
        this.props.store.updateProperty(key, newValue)
    }
    handleMenuChange = (key: any, new_index_value_pair: any) => {
        let config = ui_config[key as keyof typeof ui_config] as any
        if ('type' in config) {
            let value =
                config.type === 'index'
                    ? new_index_value_pair['index']
                    : new_index_value_pair['item']
            this.props.store.updateProperty(key, value)
        }
    }

    async getUpscalers() {
        try {
            const sd_upscalers_json = await requestGetUpscalers()
            const sd_upscalers = sd_upscalers_json.map(
                (upscaler: any) => upscaler.name
            )
            this.setState({ sd_upscalers: sd_upscalers })
            return sd_upscalers
        } catch (e) {
            console.warn('ultimate sd upscaler getUpscalers(): ', e)
        }
    }

    handleRefresh = async () => {
        if (await this.isInstalled()) {
            await this.getUpscalers()
        }
    }
    async isInstalled() {
        const full_url = `${g_sd_url}/sdapi/v1/scripts`
        const scripts = await requestGet(full_url)
        const is_installed =
            scripts?.txt2img?.includes(script_name) ||
            scripts?.img2img?.includes(script_name) ||
            false

        console.log('is_installed: ', is_installed)
        this.props.store.updateProperty('is_installed', is_installed)
        return is_installed
    }

    renderScaleSlider() {
        switch (this.props.store.data.target_size_type) {
            case ui_config.target_size_type.choices.indexOf(
                'Scale from image size'
            ):
                return (
                    <SpSliderWithLabel
                        label={ui_config.custom_scale.label}
                        output_value={this.props.store.data.custom_scale}
                        id={'custom_scale'}
                        out_min={ui_config.custom_scale.minimum}
                        out_max={ui_config.custom_scale.maximum}
                        onSliderInput={this.handleSliderChange}
                        steps={0.01}
                        slider_type={SliderType.Float}
                    />
                )
            case ui_config.target_size_type.choices.indexOf('Custom size'):
                return (
                    <>
                        <SpSliderWithLabel
                            label={ui_config.custom_width.label}
                            output_value={this.props.store.data.custom_width}
                            id={'custom_width'}
                            out_min={ui_config.custom_width.minimum}
                            out_max={ui_config.custom_width.maximum}
                            onSliderInput={this.handleSliderChange}
                            steps={ui_config.custom_width.step}
                            slider_type={SliderType.Integer}
                        />
                        <SpSliderWithLabel
                            label={ui_config.custom_height.label}
                            output_value={this.props.store.data.custom_height}
                            id={'custom_height'}
                            out_min={ui_config.custom_height.minimum}
                            out_max={ui_config.custom_height.maximum}
                            onSliderInput={this.handleSliderChange}
                            steps={ui_config.custom_height.step}
                            slider_type={SliderType.Integer}
                        />
                    </>
                )
            default:
                return void 0
        }
    }

    render() {
        if (!this.props.store.data.is_installed) {
            return (
                <div>
                    <sp-label class="missing-error">
                        Script is not available; Make sure to install it from
                        Automatic1111 webui
                    </sp-label>
                    <button
                        className="btnSquare refreshButton"
                        title="Refresh the Ultimte SD Upscale script"
                        onClick={this.handleRefresh}
                    ></button>
                </div>
            )
        }

        const ids = [
            'tile_width',
            'tile_height',
            'mask_blur',
            'padding',
        ] as const
        // let config = ui_config[ids as keyof typeof ui_config] as any
        const group_1_sliders = ids.map((id) => (
            <SpSliderWithLabel
                key={id}
                id={id}
                show-value={false}
                steps={ui_config[id].step}
                out_min={ui_config[id].minimum}
                out_max={ui_config[id].maximum}
                output_value={this.props.store.data[id]}
                title={ui_config[id].label}
                label={ui_config[id].label}
                onSliderInput={this.handleSliderChange}
            />
        ))
        const seamfix_ids = [
            'seams_fix_denoise',
            'seams_fix_width',
            'seams_fix_mask_blur',
            'seams_fix_padding',
        ] as const
        const seamfix_sliders = seamfix_ids.map((id) => (
            <SpSliderWithLabel
                key={id}
                id={id}
                show-value={false}
                steps={ui_config[id].step}
                out_min={ui_config[id].minimum}
                out_max={ui_config[id].maximum}
                output_value={this.props.store.data[id]}
                title={ui_config[id].label}
                label={ui_config[id].label}
                onSliderInput={this.handleSliderChange}
                slider_type={
                    Number.isInteger(ui_config[id].step)
                        ? SliderType.Integer
                        : SliderType.Float
                }
            />
        ))
        return (
            <div>
                <SpMenu
                    title="Stable Diffusion Upscalers"
                    items={this.state.sd_upscalers}
                    label_item="Select Upscaler"
                    id={'upscaler_index'}
                    onChange={this.handleMenuChange}
                    selected_index={this.props.store.data.upscaler_index}
                />
                <SpMenu
                    title={ui_config.target_size_type.label}
                    id={'target_size_type'}
                    items={ui_config.target_size_type.choices}
                    label_item={'Select ' + ui_config.target_size_type.label}
                    onChange={this.handleMenuChange}
                    selected_index={this.props.store.data.target_size_type}
                />
                {this.renderScaleSlider()}
                <div>
                    <sp-checkbox
                        checked={
                            this.props.store.data.save_upscaled_image
                                ? true
                                : undefined
                        }
                        onClick={(
                            event: React.ChangeEvent<HTMLInputElement>
                        ) => {
                            this.props.store.updateProperty(
                                'save_upscaled_image',
                                event.target.checked
                            )
                        }}
                    >
                        {ui_config.save_upscaled_image.label}
                    </sp-checkbox>
                    <sp-checkbox
                        checked={
                            this.props.store.data.save_seams_fix_image
                                ? true
                                : undefined
                        }
                        onClick={(
                            event: React.ChangeEvent<HTMLInputElement>
                        ) => {
                            this.props.store.updateProperty(
                                'save_seams_fix_image',
                                event.target.checked
                            )
                        }}
                    >
                        {ui_config.save_seams_fix_image.label}
                    </sp-checkbox>
                </div>
                {group_1_sliders}
                <SpMenu
                    title={'Seams Fix Type'}
                    id={'seams_fix_type'}
                    items={ui_config.seams_fix_type.choices}
                    label_item="Select Seams Fix Type"
                    onChange={this.handleMenuChange}
                    selected_index={this.props.store.data.seams_fix_type}
                />
                {seamfix_sliders}
            </div>
        )
    }
}
