import React from 'react'
import ReactDOM from 'react-dom/client'
import { observer } from 'mobx-react'
import { AStore, toJS } from '../main/astore'
import { Grid } from '../util/grid'
import { io, settings_tab } from '../util/oldSystem'
import { MoveToCanvasSvg, PenSvg } from '../util/elements'
import { ErrorBoundary } from '../util/errorBoundary'
import Locale from '../locale/locale'

declare let g_ui_settings_object: any
export const store = new AStore({
    images: [],
    refresh: false,
    width: 50,
    height: 50,
    scale: 1,
    metadata_jsons: [],
})

async function moveHistoryImageToLayer(
    base64_image: string,
    selection_info: any
) {
    try {
        const to_x = selection_info?.left
        const to_y = selection_info?.top
        const width = selection_info?.width
        const height = selection_info?.height
        await io.IO.base64ToLayer(
            base64_image,
            'History Image',
            to_x,
            to_y,
            width,
            height
        )
    } catch (e) {
        console.warn(e)
    }
}

function getHistoryMetadata(metadata_json: any) {
    //auto fill the ui with metadata
    // const metadata_json = JSON.parse(img.dataset.metadata_json_string)

    console.log('metadata_json: ', metadata_json)
    // document.querySelector('#tiSeed').value = metadata_json.Seed

    //extract auto_metadata into the preset metadata
    function convertAutoMetadataToPresset(metadata_json: any) {
        metadata_json['seed'] = metadata_json?.auto_metadata?.Seed
    }
    convertAutoMetadataToPresset(metadata_json)

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

const History = observer(() => {
    return (
        <div style={{ width: '100%' }}>
            {/* {store.data.refresh} */}
            <sp-slider
                min={85}
                max={300}
                onInput={(event: React.ChangeEvent<HTMLInputElement>) => {
                    const new_value = event.target.value
                    store.updateProperty('height', new_value)
                    store.updateProperty('width', new_value)
                }}
                show-value="true"
                value={100}
            >
                <sp-label slot="label">Image Size:</sp-label>
            </sp-slider>
            <Grid
                // thumbnails_data={store.data.images?.map((base64: string) =>
                //     base64
                //         ? 'data:image/png;base64,' + base64
                //         : 'https://source.unsplash.com/random'
                // )}
                thumbnails={store.data.thumbnails?.map((base64: string) =>
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
                                console.log(
                                    store.toJsFunc().data.metadata_jsons[index]
                                )
                                getHistoryMetadata(
                                    store.data.metadata_jsons[index]
                                )
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
                                store.data.images[index],
                                store.data.metadata_jsons[index][
                                    'selection_info'
                                ]
                            )
                        },
                        title: Locale('Copy Image to Canvas'),
                    },
                ]}
            ></Grid>
        </div>
    )
})

const gridContainerNode = document.getElementById('divHistoryImagesContainer')!
const gridRoot = ReactDOM.createRoot(gridContainerNode)

gridRoot.render(
    <React.StrictMode>
        <ErrorBoundary>
            <History></History>
        </ErrorBoundary>
    </React.StrictMode>
)
