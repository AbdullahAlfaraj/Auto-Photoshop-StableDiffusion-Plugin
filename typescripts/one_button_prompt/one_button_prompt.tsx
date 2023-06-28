import React from 'react'
import ReactDOM from 'react-dom/client'

import Collapsible from '../after_detailer/after_detailer'
import { observer } from 'mobx-react'
import { AStore } from '../main/astore'

import { requestPost } from '../util/ts/api'

declare let g_sd_url: string
export const store = new AStore({
    prompts: [],
    number: 3,
})

export async function requestRandomPrompts(number_of_prompts: number = 1) {
    const payload = {
        numberofprompts: number_of_prompts,
        insanitylevel: 5,
        forcesubject: 'all',
        artists: 'all',
        imagetype: 'all',
        onlyartists: false,
        antivalues: '',
        prefixprompt: '',
        suffixprompt: '',
        promptcompounderlevel: '1',
        seperator: 'comma',
        givensubject: '',
        smartsubject: true,
        giventypeofimage: '',
        imagemodechance: 20,
    }
    try {
        const full_url = `${g_sd_url}/one_button_prompt/prompt/random`

        const randomPrompts = (await requestPost(full_url, payload))?.prompts
        return randomPrompts
    } catch (e) {
        console.warn(e)
    }
}

function autoResize(textarea: any) {
    // const textarea = event.target
    let measure = document.getElementById('measure')!
    if (!measure) {
        measure = document.createElement('div')
        measure.setAttribute('id', 'measure')
        measure.style.visibility = 'hidden'
        measure.style.whiteSpace = 'pre-wrap'
        measure.style.position = 'absolute'
        measure.style.fontSize = '14px'
        // measure.style.paddingBottom = '10px'
        // measure.style.paddingTop = '10px'
        // measure.style.lineHeight = '14px'

        document.body.appendChild(measure)
    }
    measure.style.width = textarea.offsetWidth + 'px'
    // getComputedStyle(textarea).width

    measure.textContent = textarea.value
    try {
        clearTimeout(g_style_timeout)
        g_style_timeout = setTimeout(() => {
            let height = measure.offsetHeight
            //height between [60,450]
            height = Math.max(60, height)
            height = Math.min(450, height)
            textarea.style.height = height + 'px'
        }, 300)
    } catch (e) {
        console.warn(e)
    }
}
let g_timeout: any
let g_style_timeout: any
function handleInput(event: any) {
    try {
        // clearTimeout(g_timeout)
        // g_timeout = setTimeout(() => autoResize(event.target), 1000)
        autoResize(event.target)
    } catch (e) {
        console.warn(e)
    }
}

const OneButtonPrompt = observer(() => {
    const renderContainer = () => {
        return (
            <div>
                <div>
                    {/* <sp-textfield
                        style="width: 100%"
                        title="the number of random prompts"
                        type="number"
                        placeholder="1"
                        value="1"
                    ></sp-textfield> */}
                    <button
                        className="btnSquare"
                        onClick={async () => {
                            store.data.prompts = await requestRandomPrompts(3)
                        }}
                    >
                        Random Prompts
                    </button>
                </div>
                {store.data.prompts.map((prompt: string, index: number) => {
                    return (
                        <div
                            key={`prompt-area-${index}`}
                            style={{
                                border: '2px solid #6d6c6c',
                                padding: '3px',
                            }}
                        >
                            <button
                                className="btnSquare"
                                style={{ textAlign: 'right' }}
                                onClick={() => {
                                    //@ts-ignore
                                    document.querySelector('#taPrompt').value =
                                        prompt
                                }}
                            >
                                use
                            </button>
                            <sp-textarea
                                onInput={(event: any) => {
                                    handleInput(event)
                                    store.data.prompts[index] =
                                        event.target.value
                                }}
                                placeholder={`random prompt ${index}`}
                                value={prompt}
                            ></sp-textarea>
                        </div>
                    )
                })}
            </div>
        )
    }
    return <div style={{ padding: '4px' }}>{renderContainer()}</div>
})

const containers = document.querySelectorAll('.oneButtonPromptContainer')!

containers.forEach((container) => {
    const root = ReactDOM.createRoot(container)

    root.render(
        <React.StrictMode>
            <div style={{ border: '2px solid #6d6c6c', padding: '3px' }}>
                <Collapsible defaultIsOpen={false} label={'One Button Prompt'}>
                    <OneButtonPrompt />
                </Collapsible>
            </div>
        </React.StrictMode>
    )
})
