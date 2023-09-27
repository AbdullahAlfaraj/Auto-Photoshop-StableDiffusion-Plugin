import React from 'react'
import ReactDOM from 'react-dom/client'
import { observer } from 'mobx-react'
import { AStore, toJS } from '../main/astore'
import { Grid } from '../util/grid'
import { io, python_replacement, settings_tab } from '../util/oldSystem'
import { MoveToCanvasSvg, PenSvg } from '../util/elements'
import { ErrorBoundary } from '../util/errorBoundary'
import Locale from '../locale/locale'
import { addWithHistory } from '../viewer/viewer'
import { Collapsible } from '../util/collapsible'
//@ts-ignore
import { storage } from 'uxp'
import { _arrayBufferToBase64 } from '../util/ts/io'
import { sd_tab_store } from '../stores'
import { postPng } from '../util/ts/api'
import { setPrompt } from '../multiTextarea'
import sd_tab_util from '../sd_tab/util'

declare let g_ui_settings_object: any
export const store = new AStore({
    images: [] as string[], //full resloution images
    thumbnails: [] as string[], //small resolution images useful to preview inside html
    refresh: false,
    width: 50,
    height: 50,
    scale: 1,
    metadata_jsons: [] as any[],
})

async function getMetaDataForOutputEntry(doc_entry: any, output_entry: any) {
    const json_file_name = `${output_entry.name.split('.')[0]}.json`

    try {
        const json_entry = await doc_entry.getEntry(json_file_name)
        if (json_entry) {
            // await json_entry.read()

            const json = JSON.parse(
                await json_entry.read({
                    format: storage.formats.utf8,
                })
            )
            return json
        }
    } catch (e) {
        console.warn(e)
    }
    return {}
}

async function getOutputImagesEntries(doc_entry: any) {
    let entries = await doc_entry.getEntries()
    const output_images_entries = entries.filter(
        (e: any) => e.isFile && e.name.toLowerCase().includes('.png') // must be a file and has the of the type .png
    )
    console.log('output_images_entries: ', output_images_entries)
    // .forEach((e) => console.log(e.name))
    return output_images_entries
}

async function loadHistory(payload: any) {
    //  {'image_paths','metadata_setting'}
    const history: any = {}

    // const uniqueDocumentId = payload['uniqueDocumentId']
    // const uniqueDocumentId = await getUniqueDocumentId()

    const uuid = await io.getUniqueDocumentId()
    const doc_entry = await io.IOFolder.getDocFolder(uuid)
    const output_images_entries = await getOutputImagesEntries(doc_entry)
    history['image_paths'] = []
    history['metadata_jsons'] = []
    history['base64_images'] = []
    for (const output_entry of output_images_entries) {
        history['image_paths'].push(output_entry.name)
        const metadata_json = await getMetaDataForOutputEntry(
            doc_entry,
            output_entry
        )
        history['metadata_jsons'].push(metadata_json)

        const arrayBuffer = await output_entry.read({
            format: storage.formats.binary,
        })
        const base64_image = _arrayBufferToBase64(arrayBuffer) //convert the buffer to base64

        // const base64 =
        history['base64_images'].push(base64_image)
    }

    //     image_paths = glob.glob(f'./output/{uniqueDocumentId}/*.png')
    //     settings_paths = glob.glob(f'./output/{uniqueDocumentId}/*.json')#note: why is we are not using settings_paths?
    //     print("loadHistory: image_paths:", image_paths)

    //     history['image_paths'] = image_paths
    //     history['metadata_jsons'] = []
    //     history['base64_images'] = []
    //     for image_path in image_paths:
    //         print("image_path: ", image_path)
    //         metadata_dict = metadata_to_json.createMetadataJsonFileIfNotExist(image_path)
    //         history['metadata_jsons'].append(metadata_dict)

    //         img = Image.open(image_path)
    //         base64_image = img_2_b64(img)
    //         history['base64_images'].append(base64_image)

    // except:

    //     print(f'{request}')

    // #reverse the order so that newer generated images path will be shown first

    // history['image_paths'].reverse()
    // history['metadata_jsons'].reverse()
    // history['base64_images'].reverse()
    return {
        image_paths: history['image_paths'],
        metadata_jsons: history['metadata_jsons'],
        base64_images: history['base64_images'],
    }
}

async function moveHistoryImageToLayer(
    base64_image: string,
    selection_info: any,
    metadata: any
) {
    try {
        // const to_x = selection_info?.left
        // const to_y = selection_info?.top
        // const width = selection_info?.width
        // const height = selection_info?.height
        // await io.IO.base64ToLayer(
        //     base64_image,
        //     'History Image',
        //     to_x,
        //     to_y,
        //     width,
        //     height
        // )

        const layer = await addWithHistory(
            base64_image,
            metadata?.expanded_mask ?? void 0,
            selection_info,
            metadata.mode
        )
    } catch (e) {
        console.warn(e)
    }
}

function historyMetadataToPreset(metadata: any) {}
function getHistoryMetadata(metadata_json: any) {
    //auto fill the ui with metadata
    // const metadata_json = JSON.parse(img.dataset.metadata_json_string)

    console.log('metadata_json: ', metadata_json)

    //extract auto_metadata into the preset metadata
    function convertAutoMetadataToPreset(metadata_json: any) {
        metadata_json['seed'] = metadata_json?.auto_metadata?.Seed
    }
    convertAutoMetadataToPreset(metadata_json)

    const b_use_original_prompt = settings_tab.getUseOriginalPrompt()
    if (b_use_original_prompt) {
        metadata_json['prompt'] = metadata_json?.original_prompt
            ? metadata_json['original_prompt']
            : metadata_json['prompt']

        metadata_json['negative_prompt'] =
            metadata_json?.original_negative_prompt
                ? metadata_json['original_negative_prompt']
                : metadata_json['negative_prompt']
    } else {
        metadata_json['prompt'] = metadata_json['prompt']

        metadata_json['negative_prompt'] = metadata_json['negative_prompt']
    }
    // document.querySelector('#historySeedLabel').textContent =
    //     metadata_json?.seed

    g_ui_settings_object.autoFillInSettings(toJS(metadata_json))
}

interface Auto111Metadata {
    prompt?: string
    negative_prompt?: string
    Steps?: string
    Sampler?: string
    'CFG scale'?: string
    Seed?: string
    Size?: string
    'Model hash'?: string
    Model?: string
    'Denoising strength'?: string
    'Mask blur'?: string
    Version?: string
}
function ChangeSettingsFromAuto1111Metadata(metadata: Auto111Metadata) {
    if (metadata?.prompt)
        setPrompt({
            positive: metadata.prompt,
            negative: metadata?.negative_prompt,
        })

    if (metadata?.Steps) sd_tab_util.store.data.steps = Number(metadata.Steps)

    if (metadata?.Sampler)
        sd_tab_util.store.data.sampler_name = metadata.Sampler
    if (metadata?.['CFG scale'])
        sd_tab_util.store.data.cfg = Number(metadata['CFG scale'])
    if (metadata?.Seed) sd_tab_util.store.data.seed = metadata.Seed
    if (metadata?.Size)
        [sd_tab_util.store.data.width, sd_tab_util.store.data.height] =
            metadata.Size.split('x').map((dim) => Number(dim))
    if (metadata?.['Denoising strength'])
        sd_tab_util.store.data.denoising_strength = Number(
            metadata['Denoising strength']
        )
}
interface CombinedElement {
    thumbnail: string
    image: string
    metadata_json: any
}

function combineAndSortArrays(
    thumbnails: string[],
    images: string[],
    metadata_jsons: any[]
) {
    // Set session_id to 0 if undefined
    metadata_jsons.forEach((metadata) => {
        if (metadata.session_id === undefined) {
            metadata.session_id = 0
        }
    })

    // Combine arrays into one array of objects
    const combinedArray: CombinedElement[] = thumbnails.map(
        (thumbnail, index) => ({
            thumbnail,
            image: images[index],
            metadata_json: metadata_jsons[index],
        })
    )

    // Sort combined array by session_id
    combinedArray.sort(
        (a, b) =>
            // a.metadata_json.session_id.localeCompare(b.metadata_json.session_id)
            a.metadata_json.session_id - b.metadata_json.session_id
    )

    return combinedArray
}

function segmentCombinedArray(combinedArray: CombinedElement[]) {
    const segmentedArray: CombinedElement[][] = []
    let currentSessionId = combinedArray[0].metadata_json.session_id
    let currentSegment: CombinedElement[] = []

    for (const element of combinedArray) {
        if (element.metadata_json.session_id === currentSessionId) {
            currentSegment.push(element)
        } else {
            segmentedArray.push(currentSegment)
            currentSessionId = element.metadata_json.session_id
            currentSegment = [element]
        }
    }

    if (currentSegment.length > 0) {
        segmentedArray.push(currentSegment)
    }

    return segmentedArray
}

@observer
class History extends React.Component<{}> {
    componentDidMount(): void {
        const loadHistoryBtn = document.querySelector('#btnLoadHistory')
        const clearHistoryCacheBtn = document.getElementById(
            'btnClearHistoryCache'
        )
        loadHistoryBtn?.addEventListener('click', this.onLoadHistory)

        clearHistoryCacheBtn?.addEventListener(
            'click',
            this.onClearHistoryCache
        )
    }
    componentWillUnmount(): void {
        const loadHistoryBtn = document.querySelector('#btnLoadHistory')
        const clearHistoryCacheBtn = document.getElementById(
            'btnClearHistoryCache'
        )
        loadHistoryBtn?.removeEventListener('click', this.onLoadHistory)
        clearHistoryCacheBtn?.removeEventListener(
            'click',
            this.onClearHistoryCache
        )
    }

    onClearHistoryCache() {
        store.updateProperty('images', [])
        store.updateProperty('thumbnails', [])
        store.updateProperty('metadata_jsons', [])
    }
    async onLoadHistory() {
        try {
            const uniqueDocumentId = await io.getUniqueDocumentId()
            const { image_paths, metadata_jsons, base64_images } =
                await loadHistory(uniqueDocumentId)

            store.updateProperty('images', base64_images)
            store.updateProperty('thumbnails', base64_images)
            store.updateProperty('metadata_jsons', metadata_jsons)
        } catch (e) {
            console.warn(`loadHistory warning: ${e}`)
        }
    }
    createGrids(
        thumbnails: string[],
        images: string[],
        metadata_jsons: string[]
    ) {
        const combinedArray = combineAndSortArrays(
            thumbnails,
            images,
            metadata_jsons
        )
        const sessionArray = segmentCombinedArray(combinedArray)
        // console.log('sessionArray:', sessionArray)
        const GridsComponent = sessionArray.map(
            (session: CombinedElement[], i) => {
                const thumbnails = session.map(
                    (generated_image_data: CombinedElement, j) => {
                        return generated_image_data.thumbnail
                    }
                )
                const images = session.map(
                    (generated_image_data: CombinedElement, j) => {
                        return generated_image_data.image
                    }
                )
                const metadata_jsons = session.map(
                    (generated_image_data: CombinedElement, j) => {
                        return generated_image_data.metadata_json
                    }
                )
                return (
                    <div
                        key={i}
                        style={{ border: '2px solid #6d6c6c', padding: '3px' }}
                    >
                        <sp-label style={{}}>
                            {metadata_jsons?.[0]?.session_id}{' '}
                            {metadata_jsons?.[0]?.mode}
                        </sp-label>
                        {this.createGrid(thumbnails, images, metadata_jsons)}
                    </div>
                )
                // return createGrid(thumbnails, images, metadata_jsons)
            }
        )
        return GridsComponent
    }
    createGrid(thumbnails: string[], images: string[], metadata_jsons: any[]) {
        return (
            <Grid
                thumbnails={thumbnails?.map((base64: string) =>
                    base64
                        ? 'data:image/png;base64,' + base64
                        : 'https://source.unsplash.com/random'
                )}
                width={store.data.width}
                height={store.data.height}
                action_buttons={[
                    {
                        ComponentType: PenSvg,
                        callback: (index: number) => {
                            try {
                                // console.log(
                                //     store.toJsFunc().data.metadata_jsons[index]
                                // )
                                getHistoryMetadata(metadata_jsons[index])
                            } catch (e) {
                                console.warn(e)
                            }
                        },
                        title: Locale('Copy Metadata to Settings'),
                    },
                    {
                        ComponentType: MoveToCanvasSvg,
                        callback: (index: number) => {
                            moveHistoryImageToLayer(
                                images[index],
                                metadata_jsons[index]['selection_info'],
                                metadata_jsons[index]
                            )
                        },
                        title: Locale('Copy Image to Canvas'),
                    },
                ]}
            ></Grid>
        )
    }

    render(): React.ReactNode {
        return (
            <div style={{ border: '2px solid #6d6c6c', padding: '3px' }}>
                <Collapsible defaultIsOpen={true} label={Locale('History')}>
                    <div style={{ width: '100%' }}>
                        {/* {store.data.refresh} */}
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
                            value={100}
                        >
                            <sp-label slot="label">Image Size:</sp-label>
                        </sp-slider>
                        <div>
                            <button
                                style={{ marginBottom: '3px' }}
                                className="btnSquare"
                                onClick={async () => {
                                    try {
                                        const response_json = await postPng()
                                        if (
                                            response_json?.metadata?.parameters
                                        ) {
                                            const auto_metadata =
                                                python_replacement.convertMetadataToJson(
                                                    response_json.metadata
                                                        .parameters
                                                )
                                            console.log(
                                                'auto_metadata: ',
                                                auto_metadata
                                            )
                                            ChangeSettingsFromAuto1111Metadata(
                                                auto_metadata
                                            )
                                        }
                                    } catch (e) {
                                        console.warn(e)
                                    }
                                }}
                            >
                                Load Metadata from Image
                            </button>
                        </div>
                        <div>
                            <button
                                className="btnSquare"
                                id="btnLoadHistory"
                                style={{ marginRight: '3px' }}
                            >
                                Load Previous Generations
                            </button>
                            <button
                                className="btnSquare"
                                id="btnClearHistoryCache"
                            >
                                Clear Results
                            </button>
                        </div>
                        {store.data.metadata_jsons.length > 0
                            ? this.createGrids(
                                  store.data.thumbnails,
                                  store.data.images,
                                  store.data.metadata_jsons
                              )
                            : void 0}
                    </div>
                </Collapsible>
            </div>
        )
    }
}

const gridContainerNode = document.getElementById('historyImagesContainer')!
const gridRoot = ReactDOM.createRoot(gridContainerNode)

gridRoot.render(
    //<React.StrictMode>
    <ErrorBoundary>
        <History></History>
    </ErrorBoundary>
    //</React.StrictMode>
)
