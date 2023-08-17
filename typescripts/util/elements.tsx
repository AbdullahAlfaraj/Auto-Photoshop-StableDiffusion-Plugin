import React, { CSSProperties, ComponentType } from 'react'
// import ReactDOM from 'react-dom'
import ReactDOM from 'react-dom/client'
import Locale from '../locale/locale'
import { observer } from 'mobx-react'
// import { versions } from 'uxp'
export { ReactComponent as MoveToCanvasSvg } from '../../icon/move_to_canvas.svg'
export { ReactComponent as PenSvg } from '../../icon/pen.svg'
export { ReactComponent as PreviewSvg } from '../../icon/preview.svg'

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
            'sp-textfield': any
            'sp-action-button': any
            'sp-progressbar': any
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
@observer
export class SpSliderWithLabel extends React.Component<{
    onSliderChange?: any
    onSliderInput?: any
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

    onSliderValueInputHandler(event: React.ChangeEvent<HTMLInputElement>) {
        const newValue: string = event.target.value

        let output_value = this.stepToOutputValue(parseInt(newValue))
        this.setState({ output_value: output_value })
        if (this.props.onSliderInput && this.props.id) {
            this.props.onSliderInput(this.props.id, output_value)
        } else if (this.props.onSliderInput) {
            this.props.onSliderInput(output_value)
        }
    }
    onSliderValueChangeHandler(event: React.ChangeEvent<HTMLInputElement>) {
        const newValue: string = event.target.value

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
                <SpSlider
                    show-value="false"
                    // id="slControlNetWeight_0"
                    class="slControlNetWeight_"
                    min={this.in_min}
                    max={this.in_max}
                    value={this.state.slider_value}
                    title={this.props?.title ?? ''}
                    onInput={
                        this.props.onSliderInput
                            ? this.onSliderValueInputHandler.bind(this)
                            : void 0
                    }
                    onChange={this.onSliderValueChangeHandler.bind(this)}
                >
                    <sp-label slot="label">
                        {Locale(this.props.label as any)}:
                    </sp-label>
                    <sp-label
                        slot="label"
                        // id="lControlNetWeight_0"
                        class="lControlNetWeight_"
                    >
                        {this.state.output_value}
                    </sp-label>
                </SpSlider>
            </div>
        )
    }
}

export class SpMenu extends React.Component<{
    id?: string

    title?: string
    style?: CSSProperties
    items?: string[]
    disabled?: boolean[]
    label_item?: string
    onChange?: any
    selected_index?: number
    size?: string
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
            <sp-picker
                title={this.props.title}
                size={this.props.size || 'm'}
                style={this.props.style}
                // style={{ width: '199px', marginRight: '5px' }}
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
        )
    }
}
class PhotoshopElem extends React.Component<{ [key: string]: any }, {}> {
    protected elem: Element | null = null

    protected curEvents: { [key: string]: (evt: Event) => any } = {}

    componentDidMount(): void {
        this.updateEventListener()
    }

    // componentDidUpdate(): void {
    //     this.updateEventListener()
    // }

    updateEventListener() {
        if (!this.elem) throw new Error('elem is not rendered with ref')

        const [, newEvent] = this.splitProps(this.props)

        Object.keys(this.curEvents).forEach((evkey) => {
            if (this.curEvents[evkey] != newEvent[evkey]) {
                this.elem?.removeEventListener(evkey, this.curEvents[evkey])
            }
        })
        Object.keys(newEvent).forEach((evkey) => {
            this.elem?.addEventListener(evkey, newEvent[evkey])
        })
    }

    componentWillUnmount(): void {
        Object.keys(this.curEvents).forEach((evkey) => {
            this.elem?.removeEventListener(evkey, this.curEvents[evkey])
        })
    }
    splitProps(props: any): [any, any] {
        const attr: any = {}
        const event: any = {}
        Object.keys(props).forEach((propKey: string) => {
            if (propKey.startsWith('on')) {
                const key = propKey[2].toLocaleLowerCase() + propKey.slice(3)
                event[key] = props[propKey]
            } else {
                attr[propKey] = props[propKey]
            }
        })
        return [attr, event]
    }
}
export class SpPicker extends PhotoshopElem {
    render() {
        const [attr] = this.splitProps(this.props)
        return (
            <sp-picker
                ref={(elem: Element) => (this.elem = elem)}
                {...attr}
            ></sp-picker>
        )
    }
}
export class SpMenuComponent extends PhotoshopElem {
    render() {
        const [attr] = this.splitProps(this.props)
        return (
            <sp-menu
                ref={(elem: Element) => (this.elem = elem)}
                {...attr}
            ></sp-menu>
        )
    }
}
export class SpMenuItem extends PhotoshopElem {
    render() {
        const [attr] = this.splitProps(this.props)
        return (
            <sp-menu-item
                ref={(elem: Element) => (this.elem = elem)}
                {...attr}
            ></sp-menu-item>
        )
    }
}
export class SpLabel extends PhotoshopElem {
    render() {
        const [attr] = this.splitProps(this.props)
        return (
            <sp-label
                ref={(elem: Element) => (this.elem = elem)}
                {...attr}
            ></sp-label>
        )
    }
}
export class SpCheckBox extends PhotoshopElem {
    render() {
        const [attr] = this.splitProps(this.props)
        if (!attr['checked']) delete attr['checked']
        return (
            <sp-checkbox
                ref={(elem: Element) => (this.elem = elem)}
                {...attr}
            ></sp-checkbox>
        )
    }
}
export class SpSlider extends PhotoshopElem {
    render() {
        const [attr] = this.splitProps(this.props)
        return (
            <sp-slider
                ref={(elem: Element) => (this.elem = elem)}
                {...attr}
            ></sp-slider>
        )
    }
}
export class SpTextfield extends PhotoshopElem {
    render() {
        const [attr] = this.splitProps(this.props)
        return (
            <sp-textfield
                ref={(elem: Element) => (this.elem = elem)}
                {...attr}
            ></sp-textfield>
        )
    }
}
export class SpRadioGroup extends PhotoshopElem {
    render() {
        const [attr] = this.splitProps(this.props)
        return (
            <sp-radio-group
                ref={(elem: Element) => (this.elem = elem)}
                {...attr}
            ></sp-radio-group>
        )
    }
}
export class SpRadio extends PhotoshopElem {
    render() {
        const [attr] = this.splitProps(this.props)
        return (
            <sp-radio
                ref={(elem: Element) => (this.elem = elem)}
                {...attr}
            ></sp-radio>
        )
    }
}
export class SpDivider extends PhotoshopElem {
    render() {
        const [attr] = this.splitProps(this.props)
        return (
            <sp-divider
                ref={(elem: Element) => (this.elem = elem)}
                {...attr}
            ></sp-divider>
        )
    }
}

export class Thumbnail extends React.Component<{
    style?: any
    children: React.ReactNode
}> {
    render() {
        return (
            <div style={this.props?.style} className="viewer-image-container">
                {this.props.children}
            </div>
        )
    }
}

export class ActionButtonSVG extends React.Component<{
    onClick?: any
    ComponentType: ComponentType
    title?: string
}> {
    render() {
        if (!this.props.ComponentType) {
            return null
        }

        return (
            <sp-action-button
                onClick={this.props?.onClick}
                style={{
                    padding: 0,
                    maxWidth: '32px',
                    maxHeight: '32px' /* display: none; */,
                }}
                class="thumbnail-image-button"
                title={this.props.title ?? void 0}
            >
                <div slot="icon" style={{ fill: 'currentColor' }}>
                    {<this.props.ComponentType />}
                </div>
            </sp-action-button>
        )
    }
}

interface ScriptInstallComponentProps {
    onRefreshHandler: any
}
export const ScriptInstallComponent = observer(
    ({ onRefreshHandler }: ScriptInstallComponentProps) => {
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
                    onClick={onRefreshHandler}
                ></button>
            </div>
        )
    }
)
