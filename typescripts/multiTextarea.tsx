import { observer } from 'mobx-react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { AStore } from './main/astore'
import { ErrorBoundary } from './util/errorBoundary'
import { Collapsible } from './util/collapsible'
import { autoResize } from './util/ts/general'

interface AStoreData {
    positivePrompts: string[]
    negativePrompts: string[]
    current_index: number
}

const defaultPositivePrompt = 'cute cat, {painterly_style_1}'
const defaultNegativePrompt = '{ugly}'
export const store = new AStore({
    positivePrompts: [defaultPositivePrompt, ...Array(3).fill('')],
    negativePrompts: [defaultNegativePrompt, ...Array(3).fill('')],

    current_index: 0,
})
export function getPrompt(): { positive: string; negative: string } {
    const index: number = store.data.current_index
    return {
        positive: store.data.positivePrompts[index],
        negative: store.data.negativePrompts[index],
    }
}
export function setPrompt({
    positive,
    negative,
}: {
    positive?: string
    negative?: string
}) {
    const index: number = store.data.current_index
    if (positive !== void 0 && positive !== null)
        store.data.positivePrompts[index] = positive
    if (negative !== void 0 && negative !== null)
        store.data.negativePrompts[index] = negative
}
@observer
export class MultiTextArea extends React.Component {
    componentDidMount(): void {
        const taPrompt = document.querySelector('#taPrompt')

        taPrompt?.addEventListener('focus', this.handleFocus)
        taPrompt?.addEventListener('blur', this.handleBlur)
    }
    componentWillUnmount(): void {
        const taPrompt = document.querySelector('#taPrompt')

        taPrompt?.removeEventListener('focus', this.handleFocus)
        taPrompt?.removeEventListener('blur', this.handleBlur)
    }
    handleFocus = () => {
        // handle focus event here
    }

    handleBlur = () => {
        // handle blur event here
    }
    switchTextArea(index: number) {
        store.data.current_index = index
        return store.data.current_index
    }
    handleInput(event: any) {
        this.changePositivePrompt(event.target.value, store.data.current_index)
    }
    changePositivePrompt(text: string, index: number) {
        try {
            store.data.positivePrompts[index] = text
        } catch (e) {
            console.warn(e)
        }
    }
    changeNegativePrompt(text: string, index: number) {
        try {
            // store.data.negativePrompt = text
            store.data.negativePrompts[index] = text
        } catch (e) {
            console.warn(e)
        }
    }
    render() {
        return (
            <div>
                <sp-radio-group selected={store.data.current_index}>
                    {store.data.positivePrompts.map(
                        (text: string, index: number) => {
                            return (
                                <sp-radio
                                    key={index}
                                    onClick={() => {
                                        try {
                                            this.switchTextArea(index)

                                            autoResize(
                                                document.getElementById(
                                                    'taPrompt'
                                                ),
                                                store.data.positivePrompts[
                                                    store.data.current_index
                                                ],
                                                10
                                            )

                                            autoResize(
                                                document.getElementById(
                                                    'taNegativePrompt'
                                                ),
                                                store.data.negativePrompts[
                                                    store.data.current_index
                                                ],
                                                10
                                            )
                                        } catch (e) {
                                            console.warn(e)
                                        }
                                    }}
                                    value={index}
                                    checked={
                                        store.data.current_index === index
                                            ? true
                                            : void 0
                                    }
                                >{`${index + 1}`}</sp-radio>
                            )
                        }
                    )}
                </sp-radio-group>
                <sp-textarea
                    id="taPrompt"
                    onInput={(event: any) => {
                        try {
                            this.changePositivePrompt(
                                event.target.value,
                                store.data.current_index
                            )
                            autoResize(
                                event.target,
                                store.data.positivePrompts[
                                    store.data.current_index
                                ]
                            )
                        } catch (e) {
                            console.warn(e)
                        }
                    }}
                    placeholder={`prompt ${store.data.current_index + 1}`}
                    value={store.data.positivePrompts[store.data.current_index]}
                ></sp-textarea>
                <sp-textarea
                    id="taNegativePrompt"
                    onInput={(event: any) => {
                        try {
                            this.changeNegativePrompt(
                                event.target.value,
                                store.data.current_index
                            )

                            autoResize(
                                event.target,
                                store.data.negativePrompts[
                                    store.data.current_index
                                ]
                            )
                        } catch (e) {
                            console.warn(e)
                        }
                    }}
                    placeholder={`negative prompt ${
                        store.data.current_index + 1
                    }`}
                    value={store.data.negativePrompts[store.data.current_index]}
                ></sp-textarea>
            </div>
        )
    }
}

// const containers = document.querySelectorAll('.multiPromptsContainer')!

// containers.forEach((container) => {
//     const root = ReactDOM.createRoot(container)

//     root.render(
//         //<React.StrictMode>
//             <ErrorBoundary>
//                 <div style={{ border: '2px solid #6d6c6c', padding: '3px' }}>
//                     <Collapsible defaultIsOpen={true} label={'Prompts'}>
//                         <MultiTextArea />
//                     </Collapsible>
//                 </div>
//             </ErrorBoundary>
//         //</React.StrictMode>
//     )
// })
