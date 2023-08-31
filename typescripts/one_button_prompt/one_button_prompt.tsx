import React from 'react'
import ReactDOM from 'react-dom/client'

import { Collapsible } from '../util/collapsible'
import { observer } from 'mobx-react'
import { AStore } from '../main/astore'

import { requestPost, requestGet, isScriptInstalled } from '../util/ts/api'
import {
    ScriptInstallComponent,
    SpMenu,
    SpSliderWithLabel,
} from '../util/elements'
import { ErrorBoundary } from '../util/errorBoundary'
import { setPrompt } from '../multiTextarea'

declare let g_sd_url: string
export const store = new AStore({
    prompts: [] as string[],
    number: 3,
    prompt_complexity: 5,
    subjects: [] as string[],
    artists: [] as string[],
    imagetypes: [] as string[],
    subject: 'all',
    artist: 'all',
    imagetype: 'all',
    script_name: 'one button prompt',
    is_installed: false,
})

export async function requestRandomPrompts(
    number_of_prompts: number = 1,
    insanitylevel: number = 5,
    subject: string = 'all',
    artist: string = 'all',
    imagetype: string = 'all'
) {
    const payload = {
        numberofprompts: number_of_prompts,
        insanitylevel: insanitylevel,
        forcesubject: subject,
        artists: artist,
        imagetype: imagetype,
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
export async function requestConfig() {
    try {
        const full_url = `${g_sd_url}/one_button_prompt/config`

        const ui_config = await requestGet(full_url)

        if (ui_config) {
            store.data.subjects = ui_config?.subjects ?? []
            store.data.artists = ui_config?.artists ?? []
            store.data.imagetypes = ui_config?.imagetypes ?? []
        }

        return ui_config
    } catch (e) {
        console.warn(e)
    }
}

@observer
class OneButtonPrompt extends React.Component {
    async initScript() {
        const is_installed = await isScriptInstalled(store.data.script_name)
        await store.updateProperty('is_installed', is_installed)
    }

    async componentDidMount() {
        await requestConfig()
        await this.initScript()
    }

    renderContainer() {
        return (
            <div>
                <div>
                    <SpSliderWithLabel
                        show-value={false}
                        steps={1}
                        out_min={1}
                        out_max={10}
                        output_value={store.data.prompt_complexity}
                        title={`Higher levels increases complexity and randomness of generated
                            prompt`}
                        label={`Prompt Complexity`}
                        onSliderInput={(output_value: number) => {
                            store.data.prompt_complexity = output_value
                        }}
                    />
                    <div>
                        <SpMenu
                            title="subjects"
                            items={store.data.subjects}
                            label_item="Select a Subject"
                            selected_index={store.data.subjects.indexOf(
                                store.data.subject
                            )}
                            onChange={(id: any, value: any) => {
                                // console.log('onChange value: ', value)
                                store.updateProperty('subject', value.item)
                            }}
                        ></SpMenu>
                        <sp-label style={{ marginLeft: '3px' }}>
                            Subject
                        </sp-label>
                    </div>
                    <div>
                        <SpMenu
                            title="artists"
                            items={store.data.artists}
                            label_item="Select an Artist"
                            selected_index={store.data.artists.indexOf(
                                store.data.artist
                            )}
                            onChange={(id: any, value: any) => {
                                // console.log('onChange value: ', value)
                                store.updateProperty('artist', value.item)
                            }}
                        ></SpMenu>
                        <sp-label style={{ marginLeft: '3px' }}>
                            Artist
                        </sp-label>
                    </div>
                    <div>
                        <SpMenu
                            title="image types"
                            items={store.data.imagetypes}
                            label_item="Select an Image Type"
                            selected_index={store.data.imagetypes.indexOf(
                                store.data.imagetype
                            )}
                            onChange={(id: any, value: any) => {
                                // console.log('onChange value: ', value)
                                store.updateProperty('imagetype', value.item)
                            }}
                        ></SpMenu>
                        <sp-label style={{ marginLeft: '3px' }}>
                            Image Type
                        </sp-label>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            width: '100%',
                            marginTop: '5px',
                        }}
                    >
                        <button
                            style={{ float: 'right' }}
                            className="btnSquare"
                            onClick={async () => {
                                const prompt_complexity =
                                    store.data.prompt_complexity ?? 5
                                const subject = store.data.subject ?? 'all'
                                const artist = store.data.artist ?? 'all'
                                const imagetype = store.data.imagetype ?? 'all'
                                store.data.prompts = await requestRandomPrompts(
                                    3,
                                    prompt_complexity,
                                    subject,
                                    artist,
                                    imagetype
                                )
                            }}
                        >
                            Random Prompts
                        </button>
                    </div>
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
                                    setPrompt({
                                        positive: prompt,
                                    })
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

    render() {
        return (
            <div>
                {store.data.is_installed ? (
                    <div style={{ padding: '4px' }}>
                        {this.renderContainer()}
                    </div>
                ) : (
                    <ScriptInstallComponent
                        onRefreshHandler={async (event: any) => {
                            console.log(`Refresh ${store.data.script_name}`)
                            await requestConfig()
                            await this.initScript()
                        }}
                    ></ScriptInstallComponent>
                )}
            </div>
        )
    }
}

const containers = document.querySelectorAll('.oneButtonPromptContainer')!

containers.forEach((container) => {
    const root = ReactDOM.createRoot(container)

    root.render(
        <React.StrictMode>
            <ErrorBoundary>
                <div style={{ border: '2px solid #6d6c6c', padding: '3px' }}>
                    <Collapsible
                        defaultIsOpen={false}
                        label={'One Button Prompt'}
                    >
                        <OneButtonPrompt />
                    </Collapsible>
                </div>
            </ErrorBoundary>
        </React.StrictMode>
    )
})
