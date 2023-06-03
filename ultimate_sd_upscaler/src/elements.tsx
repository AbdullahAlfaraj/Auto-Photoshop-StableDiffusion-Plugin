import React, { ReactEventHandler, useState } from 'react'
// import ReactDOM from 'react-dom'
import ReactDOM from 'react-dom/client'
// import { versions } from 'uxp'
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
            'sp-textarea': any
        }
    }
}
function mapRange(
    x: number,
    in_min: number,
    in_max: number,
    out_min: number,
    out_max: number
) {
    const mappedValue =
        ((x - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min
    return mappedValue
}
export enum SliderType {
    Integer = 'integer',
    Float = 'float',
}
export class SpSliderWithLabel extends React.Component<{
    onSliderChange?: any
    id?: string
    'show-value'?: boolean
    steps?: number
    in_min?: number
    in_max?: number
    out_min: number
    out_max: number
    // value?: number
    title?: string
    label?: string
    output_value?: number // can be use to represent sd value
    // slider_value?: number // it's slider value can be from 1 to 100
    slider_type?: SliderType
}> {
    // const [sliderValue,setSliderValue] = useState<number>(0)
    state = { output_value: this.props.output_value || 0, slider_value: 0 }
    steps: number
    in_min: number
    in_max: number
    out_min: number
    out_max: number
    slider_type: SliderType
    constructor(props: any) {
        super(props)
        this.steps = this.props.steps || 1
        // this.out_min = this.props.out_min || this.in_min
        this.out_min = this.props.out_min
        this.out_max = this.props.out_max

        // const temp_out_max = this.props.out_max || this.props.in_max || 99
        this.in_min = this.props.in_min || 0
        this.in_max = Math.round((this.out_max - this.out_min) / this.steps)
        this.slider_type = this.props.slider_type || SliderType.Integer
    }

    componentDidMount(): void {
        const slider_value = this.outputValueToStep(this.state.output_value)
        this.setState({ slider_value: slider_value })
    }
    stepToOutputValue(slider_step: number) {
        let to_value = mapRange(
            slider_step,
            this.in_min,
            this.in_max,
            this.out_min,
            this.out_max
        )
        if (this.slider_type === SliderType.Integer)
            to_value = Math.round(to_value)

        return to_value
    }
    outputValueToStep(output_value: number) {
        let slider_step = mapRange(
            output_value,
            this.out_min,
            this.out_max,
            this.in_min,
            this.in_max
        )
        // if (this.slider_type === SliderType.Integer)
        slider_step = Math.round(slider_step)
        return slider_step
    }
    setSliderValue(newValue: any) {
        let to_value = mapRange(
            newValue,
            this.in_min,
            this.in_max,
            this.out_min,
            this.out_max
        )

        if (this.slider_type === SliderType.Integer)
            to_value = Math.round(to_value)

        this.setState({ output_value: to_value })
    }

    onSliderValueChangeHandler(event: React.ChangeEvent<HTMLInputElement>) {
        const newValue: string = event.target.value
        console.log('onSliderValueChangeHandler value: ', newValue)
        this.setState({ output_value: newValue })

        console.log({
            in_min: this.in_min,
            in_max: this.in_max,
            out_min: this.out_min,
            out_max: this.out_max,
        })

        let output_value = this.stepToOutputValue(parseInt(newValue))
        this.setState({ output_value: output_value })
        if (this.props.onSliderChange && this.props.id) {
            this.props.onSliderChange(this.props.id, output_value)
        } else if (this.props.onSliderChange) {
            this.props.onSliderChange(output_value)
        }
    }

    handleNum2Change = (event: React.ChangeEvent<HTMLInputElement>) => {}

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
                    // id="slControlNetWeight_0"
                    class="slControlNetWeight_"
                    min={this.in_min}
                    max={this.in_max}
                    value={this.state.slider_value}
                    title="2 will keep the composition; 0 will allow composition to change"
                    onInput={this.onSliderValueChangeHandler.bind(this)}
                >
                    <sp-label slot="label">{this.props.label}:</sp-label>
                    <sp-label
                        slot="label"
                        // id="lControlNetWeight_0"
                        class="lControlNetWeight_"
                    >
                        {this.state.output_value}
                    </sp-label>
                </sp-slider>
            </div>
        )
    }
}

export class SpMenu extends React.Component<{
    id?: string

    title?: string
    style?: string
    items?: string[]
    disabled?: boolean[]
    label_item?: string
    onChange?: any
    selected_index?: number
}> {
    state = {
        selectedItem: this.props.items ? this.props.items[0] : undefined,
    }

    componentDidUpdate(prevProps: any) {
        // console.log('prevProps.items: ', prevProps.items)
        // console.log('this.props.items: ', this.props.items)
        // if (prevProps.items !== this.props.items) {
        //     const spMenu = this.spMenuRef.current
        //     if (spMenu) {
        //         spMenu.innerHTML = ''
        //     }
        // }
    }
    handleItemClick = (item: string, index: number) => {
        console.log('clicked item: ', item)
        console.log('clicked index: ', index)
        this.setState({ selectedItem: item })
        if (this.props.onChange && this.props.id) {
            this.props.onChange(this.props.id, { index: index, item: item })
        } else if (this.props.onChange) {
            this.props.onChange(null, { index: index, item: item })
        }
    }
    handleMakeSelection = (item: string) => {
        console.log('handleMakeSelection: item ', item)
        this.setState({ selectedItem: item })
    }

    render() {
        return (
            <div>
                <sp-picker
                    title={this.props.title}
                    size="m"
                    style={{ width: '199px', marginRight: '5px' }}
                >
                    <sp-menu id={this.props.id} slot="options">
                        {this.props.label_item && (
                            <sp-menu-item
                                disabled="disabled"
                                key={-1}
                                data-index={-1}
                                selected
                            >
                                {this.props.label_item}
                            </sp-menu-item>
                        )}
                        {this.props.items?.map((item, index: number) => (
                            <sp-menu-item
                                key={item}
                                data-index={index}
                                selected={
                                    this.props.selected_index !== undefined &&
                                    this.props.selected_index !== null &&
                                    this.props.selected_index === index
                                        ? 'selected'
                                        : undefined
                                }
                                disabled={
                                    this.props.disabled?.[index]
                                        ? 'disabled'
                                        : undefined
                                }
                                onClick={() => {
                                    this.handleItemClick(item, index)
                                }}
                            >
                                {item}
                            </sp-menu-item>
                        ))}
                    </sp-menu>
                </sp-picker>
            </div>
        )
    }
}
