import React from 'react'
import ReactDOM from 'react-dom/client'
import Collapsible from '../after_detailer/after_detailer'
import { observer } from 'mobx-react'

import { api, general, io, psapi, selection } from '../util/oldSystem'
import { Grid } from '../util/grid'
import { AStore } from '../main/astore'
import { MoveToCanvasSvg, PenSvg } from '../util/elements'
declare let g_sd_url: string

export async function getSamMap(base64: string, prompt: string) {
    // const full_url = `${g_sd_url}/sam/dino-predict`
    // const payload = {
    //     dino_model_name: 'GroundingDINO_SwinT_OGC (694MB)',
    //     input_image: base64,
    //     text_prompt: 'the dog',
    //     box_threshold: 0.3,
    // }
    const full_url = `${g_sd_url}/sam/sam-predict`

    const payload = {
        sam_model_name: 'sam_vit_h_4b8939.pth',
        input_image: base64,
        sam_positive_points: [],
        sam_negative_points: [],
        dino_enabled: true,
        dino_model_name: 'GroundingDINO_SwinT_OGC (694MB)',
        dino_text_prompt: prompt,
        dino_box_threshold: 0.3,
        dino_preview_checkbox: false,
        dino_preview_boxes_selection: [0],
    }
    const result = await api.requestPost(full_url, payload)
    return result
}
export const store = new AStore({
    thumbnails: [],
    selection_info_list: [],
    prompt: '',
    width: 85,
    height: 85,
})
const Sam = observer(() => {
    return (
        <div>
            <sp-textarea
                placeholder="Segment Anything Prompt"
                value={store.data.prompt}
                onInput={(event: any) => {
                    store.data.prompt = event.target.value
                }}
            ></sp-textarea>
            <button
                onClick={async () => {
                    const selection_info = await psapi.getSelectionInfoExe()
                    const base64 = await io.getImageFromCanvas()
                    const result = await getSamMap(base64, store.data.prompt)
                    const masks = result?.masks ?? []
                    const masks_urls = []
                    for (const mask of masks) {
                        const url =
                            await io.convertBlackAndWhiteImageToRGBChannels3(
                                mask
                            )
                        masks_urls.push(url)
                    }

                    store.updateProperty('thumbnails', masks_urls)
                    store.updateProperty(
                        'selection_info_list',
                        Array(masks_urls.length).fill(selection_info)
                    )
                }}
            >
                Generate Mask
            </button>
            <Grid
                // thumbnails_data={store.data.images?.map((base64: string) =>
                //     base64
                //         ? 'data:image/png;base64,' + base64
                //         : 'https://source.unsplash.com/random'
                // )}
                thumbnails={store.data.thumbnails}
                width={store.data.width}
                height={store.data.height}
                action_buttons={[
                    {
                        ComponentType: PenSvg,
                        callback: async (index: number) => {
                            try {
                                const base64 = general.base64UrlToBase64(
                                    store.data.thumbnails[index]
                                )
                                await selection.base64ToLassoSelection(
                                    base64,
                                    store.data.selection_info_list[index]
                                )
                            } catch (e) {
                                console.warn(e)
                            }
                        },
                    },
                    {
                        ComponentType: MoveToCanvasSvg,
                        callback: async (index: number) => {
                            try {
                                const to_x =
                                    store.data.selection_info_list[index]?.left
                                const to_y =
                                    store.data.selection_info_list[index]?.top
                                const width =
                                    store.data.selection_info_list[index]?.width
                                const height =
                                    store.data.selection_info_list[index]
                                        ?.height
                                debugger
                                await io.IO.base64ToLayer(
                                    general.base64UrlToBase64(
                                        store.data.thumbnails[index]
                                    ),
                                    'segment_anything_mask.png',
                                    to_x,
                                    to_y,
                                    width,
                                    height
                                )
                            } catch (e) {
                                console.warn(e)
                            }
                        },
                    },
                ]}
            ></Grid>
        </div>
    )
})
const containers = document.querySelectorAll('.samContainer')

containers.forEach((container) => {
    const root = ReactDOM.createRoot(container)
    root.render(
        <React.StrictMode>
            <div style={{ border: '2px solid #6d6c6c', padding: '3px' }}>
                <Collapsible defaultIsOpen={false} label={'Segment Anything'}>
                    <Sam></Sam>
                </Collapsible>
            </div>
        </React.StrictMode>
    )
})
