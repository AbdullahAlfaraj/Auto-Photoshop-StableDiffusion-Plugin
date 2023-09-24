//TODO: delete lexical_tab.js and lexica tab from html
import { observer } from 'mobx-react'
import React, { TextareaHTMLAttributes } from 'react'
import ReactDOM from 'react-dom/client'
import { AStore } from '../main/astore'
import {
    ImageSearchSvg,
    MoveToCanvasSvg,
    PenSvg,
    SpTextfield,
} from '../util/elements'
import { ErrorBoundary } from '../util/errorBoundary'
import { requestGet } from '../util/ts/api'
import { Grid } from '../util/grid'
import { urlToCanvas } from '../util/ts/general'
import sd_tab_util from '../sd_tab/util'
import { setPrompt } from '../multiTextarea'
import { Collapsible } from '../util/collapsible'
import Locale from '../locale/locale'

interface LexicaItem {
    id: string
    gallery: string
    src: string
    srcSmall: string
    prompt: string
    width: number
    height: number
    seed: string
    grid: boolean
    model: string
    guidance: number
    promptid: string
    nsfw: boolean
}

export const store = new AStore({
    search_query: 'cute cats' as string,
    lexica_items: [] as LexicaItem[],
    height: 100,
    width: 100,
    thumbnails: [] as string[],
    images: [] as string[],
    lexica_prompt: '' as string,
    textarea_position: 'static' as 'static' | 'fixed',
    textarea_display: 'none' as 'none' | undefined,
})

async function requestLexica(search_query: string) {
    const lexica_url = `https://lexica.art/api/v1/search?q=${search_query}`
    const url_encoded = encodeURI(lexica_url)
    const result = await requestGet(url_encoded)
    console.log('result:', result)
    return result
}

async function loadSettingsToUI(lexica_item: LexicaItem) {
    try {
        setPrompt({ positive: lexica_item.prompt })
        sd_tab_util.store.data.width = lexica_item.width
        sd_tab_util.store.data.height = lexica_item.height
        sd_tab_util.store.data.seed = lexica_item.seed
        sd_tab_util.store.data.cfg = lexica_item.guidance
    } catch (e) {
        console.warn(e)
    }
}

const windowEventListener = document
    .querySelector('#search_second_panel')!
    .addEventListener('scroll', () => {
        const taLexicaPromptElement = document.querySelector(
            '#lexicaPrompt'
        ) as any
        const originalPosition = taLexicaPromptElement.offsetTop

        const currentPosition =
            //@ts-ignore
            document.querySelectorAll('.lexicaContainer')[0].offsetTop

        store.data.textarea_display = 'none'
    })

function onThumbnailClick(lexical_item: LexicaItem) {
    store.data.lexica_prompt = lexical_item.prompt

    const taLexicaPromptElement = document.querySelector('#lexicaPrompt') as any
    const originalPosition = taLexicaPromptElement.offsetTop

    const containerPosition =
        //@ts-ignore
        document.querySelectorAll('.lexicaContainer')[0].offsetTop

    const isScrolledPast = containerPosition < originalPosition

    store.data.textarea_display = undefined
}

async function searchForSimilarImage(lexica_item: LexicaItem) {
    try {
        store.data.search_query = lexica_item.src
        const result_json = await requestLexica(store.data.search_query)

        const lexica_items = result_json.images

        store.data.lexica_items = lexica_items
    } catch (e) {
        console.warn(e)
    }
}

@observer
export class Lexical extends React.Component {
    componentDidMount(): void {}
    componentWillUnmount(): void {}

    render() {
        return (
            <div>
                <div className="subTabOptionsContainer"></div>

                <div className="flexContainer">
                    <sp-label slot="label">
                        Explore Lexica for prompts and inspiration
                    </sp-label>
                </div>
                <div></div>
                <div>
                    {/* <sp-label slot="label">Search:</sp-label> */}
                    <sp-textfield
                        id="LexicaSearchField"
                        type="text"
                        // placeholder="cute cats"
                        value={store.data.search_query}
                        onInput={(event: any) => {
                            store.data.search_query = event.target.value
                        }}
                    ></sp-textfield>

                    <button
                        className="btnSquare search-button"
                        id="btnSearchLexica"
                        title="user prompt(text) to Search Lexica"
                        onClick={async () => {
                            const search_query = store.data.search_query
                            const result_json = await requestLexica(
                                search_query
                            )

                            const lexica_items = result_json.images
                            store.data.lexica_items = lexica_items
                        }}
                    ></button>

                    <button
                        className="btnSquare reverse_image_serach"
                        id="btnReverseSearchLexica"
                        title="User the selected area (image) on canvas to Search Lexica"
                    ></button>
                </div>
                <sp-textarea
                    id="lexicaPrompt"
                    style={{
                        marginBottom: '3px',
                        position: 'fixed',
                        display: store.data.textarea_display,
                    }}
                    value={store.data.lexica_prompt}
                ></sp-textarea>
                <div className="viewer-container" id="divLexicaImagesContainer">
                    <img
                        className="history-image"
                        id="history_image_test"
                        data-metadata_json_string='{"a":1}'
                        src="https://source.unsplash.com/random"
                    />
                </div>
                <div>
                    <sp-slider
                        min={85}
                        max={300}
                        onInput={(
                            event: React.ChangeEvent<HTMLInputElement>
                        ) => {
                            const new_value = event.target.value
                            store.updateProperty('height', new_value)
                            store.updateProperty('width', new_value)
                        }}
                        show-value="true"
                    >
                        <sp-label slot="label">Image Size:</sp-label>
                    </sp-slider>
                    <Grid
                        thumbnails={store.data.lexica_items.map(
                            (item: LexicaItem) => {
                                return item.srcSmall
                            }
                        )}
                        width={store.data.width}
                        height={store.data.height}
                        callback={(index: number, evt: any) => {
                            onThumbnailClick(store.data.lexica_items[index])
                        }}
                        action_buttons={[
                            {
                                ComponentType: MoveToCanvasSvg,
                                callback: (index: number) => {
                                    urlToCanvas(
                                        store.data.lexica_items[index].src,
                                        'lexica.png'
                                    )
                                },
                                title: 'Copy Image to Canvas',
                            },
                            {
                                ComponentType: PenSvg,
                                callback: (index: number) => {
                                    loadSettingsToUI(
                                        store.data.lexica_items[index]
                                    )
                                },
                                title: 'Apply Settings',
                            },
                            {
                                ComponentType: ImageSearchSvg,
                                callback: (index: number) => {
                                    searchForSimilarImage(
                                        store.data.lexica_items[index]
                                    )
                                },
                                title: 'Search For Similar Images',
                            },
                        ]}
                    ></Grid>
                </div>
            </div>
        )
    }
}

const containers = document.querySelectorAll('.lexicaContainer')!

containers.forEach((container) => {
    const root = ReactDOM.createRoot(container)

    root.render(
        //<React.StrictMode>
        <ErrorBoundary>
            <div style={{ border: '2px solid #6d6c6c', padding: '3px' }}>
                <Collapsible defaultIsOpen={true} label={Locale('Lexical')}>
                    <Lexical></Lexical>
                </Collapsible>
            </div>
        </ErrorBoundary>
        //</React.StrictMode>
    )
})

export default {
    store: store,
}
