import React, { useState } from 'react'
// import ReactDOM from 'react-dom'
import ReactDOM from 'react-dom/client'
import { versions } from 'uxp'
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'sp-picker': any
            'sp-menu': any
            'sp-menu-item': any
            'sp-label': any
            'sp-checkbox': any
            'sp-slider': any
            'sp-radio-group': any
            'sp-radio': any
            'sp-divider': any
            'sp-detail': any
        }
    }
}

interface ScriptArgs {
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

const initialScriptArgs: ScriptArgs = {
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
}

const ScriptArgsForm: React.FC = () => {
    const [scriptArgs, setScriptArgs] = useState<ScriptArgs>(initialScriptArgs)

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target
        setScriptArgs((prevState) => ({ ...prevState, [name]: value }))
    }

    return (
        <form>
            {Object.entries(scriptArgs).map(([key, value]) => (
                <div key={key}>
                    <label htmlFor={key}>{key}</label>
                    <input
                        id={key}
                        name={key}
                        type={typeof value === 'boolean' ? 'checkbox' : 'text'}
                        value={value}
                        onChange={handleInputChange}
                    />
                </div>
            ))}
        </form>
    )
}
const calculatorStore = { num1: 4, num2: 5, result: 10 }
class SpSliderWithLabel extends React.Component {
    handleNum1Change = (event: React.ChangeEvent<HTMLInputElement>) => {
        // calculatorStore.setNum1(Number(event.target.value))
    }

    handleNum2Change = (event: React.ChangeEvent<HTMLInputElement>) => {
        // calculatorStore.setNum2(Number(event.target.value))
    }

    render() {
        return (
            // <div>
            //     <
            //     <sp-detail>VERSIONS</sp-detail>
            //     <div>{versions.plugin}</div>
            // </div>
            <div>
                <sp-slider
                    show-value="false"
                    id="slControlNetWeight_0"
                    class="slControlNetWeight_"
                    min="0"
                    max="100"
                    value="50"
                    title="2 will keep the composition; 0 will allow composition to change"
                >
                    <sp-label slot="label">Weight:</sp-label>
                    <sp-label
                        slot="label"
                        id="lControlNetWeight_0"
                        class="lControlNetWeight_"
                    >
                        1.0
                    </sp-label>
                </sp-slider>
            </div>
        )
    }
}

const domNode = document.getElementById('ultimateSDUpscalerContainer')!
const root = ReactDOM.createRoot(domNode)
root.render(
    <React.StrictMode>
        <Calculator />
    </React.StrictMode>
)
// const myValue = 42
// export default myValue
