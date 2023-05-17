import React, { ReactEventHandler, useState } from 'react'
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

export class SpSliderWithLabel extends React.Component<{
    onSliderValueChangeCallback?: any
    id?: string
    'show-value'?: boolean
    min?: number
    max?: number
    value?: number
    title?: string
    label?: string
}> {
    // const [sliderValue,setSliderValue] = useState<number>(0)
    state = { sliderValue: 0 }

    setSliderValue(newValue: any) {
        this.setState({ sliderValue: newValue })
    }
    onSliderValueChangeHandler(event: React.ChangeEvent<HTMLInputElement>) {
        const newValue: string = event.target.value
        console.log('onSliderValueChangeHandler value: ', newValue)
        this.setState({ sliderValue: newValue })

        if (this.props.onSliderValueChangeCallback) {
            this.props.onSliderValueChangeCallback(newValue)
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
                    min="0"
                    max="100"
                    value={this.state.sliderValue}
                    title="2 will keep the composition; 0 will allow composition to change"
                    onInput={this.onSliderValueChangeHandler.bind(this)}
                >
                    <sp-label slot="label">{this.props.label}:</sp-label>
                    <sp-label
                        slot="label"
                        // id="lControlNetWeight_0"
                        class="lControlNetWeight_"
                    >
                        {this.state.sliderValue}
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
}> {
    state = { selectedItem: this.props.items ? this.props.items[0] : undefined }
    spMenuRef = React.createRef<HTMLDivElement>()

    componentDidUpdate(prevProps: any) {
        console.log('prevProps.items: ', prevProps.items)
        console.log('this.props.items: ', this.props.items)
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
                        {this.props.items?.map((item, index) => (
                            <sp-menu-item
                                key={item}
                                data-index={index}
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

function handleSliderValueChange(newValue: Event) {
    console.log('handleSliderValueChange: newValue', newValue)
}

// const domNode = document.getElementById('ultimateSDUpscalerContainer')!
// const root = ReactDOM.createRoot(domNode)
// root.render(
//     <React.StrictMode>
//         <SpSliderWithLabel onSliderValueChange={handleSliderValueChange} />
//     </React.StrictMode>
// )
// const myValue = 42
// export default myValue
