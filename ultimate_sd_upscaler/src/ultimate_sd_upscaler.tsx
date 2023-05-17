import React from 'react'
import ReactDOM from 'react-dom/client'

import { makeAutoObservable } from 'mobx'
import { observer } from 'mobx-react'

import { SpMenu, SpSliderWithLabel } from './elements'

import * as sdapi from '../../sdapi_py_re'

let ui_config = {
    tile_width: {
        minimum: 0,
        maximum: 2048,
        step: 64,
        label: 'Tile width',
        value: 512,
    },
    tile_height: {
        minimum: 0,
        maximum: 2048,
        step: 64,
        label: 'Tile height',
        value: 0,
    },
    mask_blur: {
        minimum: 0,
        maximum: 64,
        step: 1,
        label: 'Mask blur',
        value: 8,
    },
    padding: { minimum: 0, maximum: 128, step: 1, label: 'Padding', value: 32 },

    seams_fix_denoise: {
        label: 'Denoise',
        minimum: 0,
        maximum: 1,
        step: 0.01,
        value: 0.35,
        visible: false,
        interactive: true,
    },

    seams_fix_width: {
        label: 'Width',
        minimum: 0,
        maximum: 128,
        step: 1,
        value: 64,
        visible: false,
        interactive: true,
    },
    seams_fix_mask_blur: {
        label: 'Mask blur',
        minimum: 0,
        maximum: 64,
        step: 1,
        value: 4,
        visible: false,
        interactive: true,
    },
    seams_fix_padding: {
        label: 'Padding',
        minimum: 0,
        maximum: 128,
        step: 1,
        value: 16,
        visible: false,
        interactive: true,
    },
}

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
}

class UltimateSDUpscalerStore {
    data: UltimateSDUpscalerData

    constructor(data: UltimateSDUpscalerData) {
        makeAutoObservable(this)
        this.data = data
    }

    static create(data: UltimateSDUpscalerData) {
        return new UltimateSDUpscalerStore(data)
    }
}

const ultimate_sd_upscaler_store = UltimateSDUpscalerStore.create({
    _: '',
    tile_width: 512,
    tile_height: 0,
    mask_blur: 8,
    padding: 32,
    seams_fix_width: 64,
    seams_fix_denoise: 0.275,
    seams_fix_padding: 32,
    upscaler_index: 3,
    save_upscaled_image: false,
    redraw_mode: 0,
    save_seams_fix_image: true,
    seams_fix_mask_blur: 8,
    seams_fix_type: 3,
    target_size_type: 2,
    custom_width: 1080,
    custom_height: 1440,
    custom_scale: 1.875,
})

export let script_args: (string | number | boolean)[] = Object.values(
    ultimate_sd_upscaler_store.data
)
export let script_name: string = 'Ultimate SD upscale'

// class UltimateSDUpscalerStore {
//     slider1Value = 0
//     slider2Value = 0

//     constructor() {
//         makeAutoObservable(this)
//     }

//     setSlider1Value(newValue: any) {
//         this.slider1Value = newValue
//     }

//     setSlider2Value(newValue: any) {
//         this.slider2Value = newValue
//     }
// }

// const scriptFormStore = new UltimateSDUpscalerStore()

@observer
class UltimateSDUpscalerForm extends React.Component {
    slider1Ref = React.createRef<SpSliderWithLabel>()
    slider2Ref = React.createRef<SpSliderWithLabel>()
    state = {
        items: ['Item 1', 'Item 2', 'Item 3'],
        sd_upscalers: [],
    }
    componentDidMount(): void {
        this.getUpscalers()
    }
    handleUpdateItems = () => {
        this.setState({
            items: ['New Item 1', 'New Item 2', 'New Item 3'],
        })
    }
    handleSlider1ValueChange = (newValue: any) => {
        // scriptFormStore.setSlider1Value(newValue)
    }

    handleSlider2ValueChange = (newValue: any) => {
        // scriptFormStore.setSlider2Value(newValue)
    }

    autoFillSliders = (newValue: any) => {
        // scriptFormStore.setSlider1Value(newValue)
        if (this.slider1Ref.current) {
            this.slider1Ref.current.setSliderValue(newValue)
        }
        if (this.slider2Ref.current) {
            this.slider2Ref.current.setSliderValue(newValue)
        }
        // scriptFormStore.setSlider2Value(newValue)
    }

    async getUpscalers() {
        const sd_upscalers_json = await sdapi.requestGetUpscalers()
        const sd_upscalers = sd_upscalers_json.map(
            (upscaler: any) => upscaler.name
        )
        this.setState({ sd_upscalers: sd_upscalers })
        return sd_upscalers
    }

    render() {
        return (
            <div>
                <SpSliderWithLabel
                    ref={this.slider1Ref}
                    // onSliderValueChangeCallback={this.handleSlider1ValueChange}
                    id="slider_1"
                    show-value={false}
                    min={0}
                    max={100}
                    value={30}
                    title="this is a title"
                    label={ui_config.tile_width.label}
                />
                <SpSliderWithLabel
                    ref={this.slider2Ref}
                    label={ui_config.tile_height.label}
                    // onSliderValueChangeCallback={this.handleSlider2ValueChange}
                />
                <SpSliderWithLabel
                    ref={this.slider2Ref}
                    label={ui_config.mask_blur.label}
                    // onSliderValueChangeCallback={this.handleSlider2ValueChange}
                />
                <SpSliderWithLabel
                    ref={this.slider2Ref}
                    label={ui_config.padding.label}
                    // onSliderValueChangeCallback={this.handleSlider2ValueChange}
                />
                <SpSliderWithLabel
                    ref={this.slider2Ref}
                    label={ui_config.seams_fix_denoise.label}
                />
                <SpSliderWithLabel
                    ref={this.slider2Ref}
                    label={ui_config.seams_fix_mask_blur.label}
                />
                <SpSliderWithLabel
                    ref={this.slider2Ref}
                    label={ui_config.seams_fix_padding.label}
                />
                <SpSliderWithLabel
                    ref={this.slider2Ref}
                    label={ui_config.seams_fix_denoise.label}
                />
                <SpMenu
                    title="Stable Diffusion Upscalers"
                    items={this.state.sd_upscalers}
                    // style="width: 199px; margin-right: 5px"
                />

                <button onClick={() => this.autoFillSliders(50)}>
                    Auto-fill sliders
                </button>
                <button onClick={this.handleUpdateItems}>
                    Update Menu Items
                </button>
            </div>
        )
    }
}

@observer
class SliderValuesDisplay extends React.Component {
    render() {
        return (
            <div>
                <p>
                    Slider 1 value: {ultimate_sd_upscaler_store.data.tile_width}
                </p>
                <p>
                    Slider 2 value:{' '}
                    {ultimate_sd_upscaler_store.data.tile_height}
                </p>
            </div>
        )
    }
}

function MyComponent() {
    return (
        <div>
            <UltimateSDUpscalerForm />
            <SliderValuesDisplay />
            {/* ... */}
        </div>
    )
}

const domNode = document.getElementById('ultimateSDUpscalerContainer')!
const root = ReactDOM.createRoot(domNode)
root.render(
    <React.StrictMode>
        {/* <SpSliderWithLabel onSliderValueChange={handleSliderValueChange} /> */}
        <UltimateSDUpscalerForm />
        <SliderValuesDisplay />
    </React.StrictMode>
)
