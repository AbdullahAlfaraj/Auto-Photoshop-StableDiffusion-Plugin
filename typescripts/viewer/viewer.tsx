import React from 'react'
import ReactDOM from 'react-dom/client'
// import ReactDOM from 'react-dom'
import { observer } from 'mobx-react'
import { AStore } from '../main/astore'
import { Grid } from '../util/grid'
import {
    MoveToCanvasSvg,
    SpCheckBox,
    SpSlider,
    SpSliderWithLabel,
} from '../util/elements'
import { moveImageToLayer } from '../util/ts/io'
import { io, layer_util, selection } from '../util/oldSystem'
import Collapsible from '../after_detailer/after_detailer'
import { session_ts } from '../entry'
import { reaction } from 'mobx'
import { GenerationModeEnum } from '../util/ts/enum'
import { base64ToLassoSelection } from '../../selection'
import { core } from 'photoshop'
import Locale from '../locale/locale'
const executeAsModal = core.executeAsModal

declare let g_generation_session: any

enum ClickTypeEnum {
    Click = 'click',
    ShiftClick = 'shift_click',
    AltClick = 'alt_click',
    SecondClick = 'second_click', //when we click a thumbnail that is active/ has orange border
}

enum OutputImageStateEnum {
    Add = 'add',
    remove = 'remove',
}
enum ClassNameEnum {
    Green = 'viewerImgSelected',
    Orange = 'viewerImgActive',
    None = '',
}
function findClickType(event: any) {
    let click_type: ClickTypeEnum = ClickTypeEnum.Click

    if (event.shiftKey) {
        click_type = ClickTypeEnum.ShiftClick
    } else if (event.altKey) {
        click_type = ClickTypeEnum.AltClick
    }
    return click_type
}

export const store = new AStore({
    images: [],
    thumbnails: [],
    metadata: [], // metadata for each image
    width: 50,
    height: 50,

    prev_layer: null,
    clicked_index: null,

    permanent_indices: [],

    prev_index: -1,
    output_image_obj_list: [],
    is_stored: [],
    layers: [],
    class_name: [],
    can_click: true,
    auto_mask: true,
})

//when a generation is done, add the last generated image from the viewer to tha canvas
reaction(
    () => {
        return store.data.images
    },
    async (images: string[]) => {
        try {
            images.length > 0
                ? await handleOutputImageThumbnailClick(images.length - 1)
                : void 0
        } catch (e) {
            console.warn(e)
        }
    }
)
export const init_store = new AStore({
    images: [],
    thumbnails: [],

    width: 50,
    height: 50,

    prev_layer: null,
    clicked_index: null,

    permanent_indices: [],

    prev_index: -1,
    output_image_obj_list: [],
    is_stored: [],
    layers: [],
    class_name: [],
    can_click: true,
})
export const mask_store = new AStore({
    images: [],
    thumbnails: [],

    width: 50,
    height: 50,

    prev_layer: null,
    clicked_index: null,

    permanent_indices: [],

    prev_index: -1,
    output_image_obj_list: [],
    is_stored: [],
    layers: [],
    class_name: [],
    can_click: true,
})

export async function updateViewerStoreImageAndThumbnail(
    store: AStore,
    images: string[]
) {
    try {
        if (typeof images === 'undefined' || !images) {
            return null
        }
        store.data.images = images
        const thumbnail_list = []
        for (const base64 of images) {
            const thumbnail = await io.createThumbnail(base64, 300)
            thumbnail_list.push(thumbnail)
        }

        store.data.thumbnails = thumbnail_list
    } catch (e) {
        console.warn(e)
        console.warn('images: ', images)
    }
}

const add = async (base64: string) => {
    //change the color of thumbnail border
    //add image to the canvas
    const layer = await moveImageToLayer(
        base64,
        session_ts.store.data.selectionInfo
    )

    // create channel if the generated mode support masking
    if (
        [
            GenerationModeEnum.Inpaint,
            GenerationModeEnum.LassoInpaint,
            GenerationModeEnum.Outpaint,
        ].includes(session_ts.store.data.mode) &&
        store.data.auto_mask
    ) {
        // const base64_monochrome_mask = await io.convertGrayscaleToMonochrome(
        //     session_ts.store.data.selected_mask
        // )

        const mask_monochrome = await io.convertGrayscaleToMonochrome(
            session_ts.store.data.expanded_mask
        )
        const channel_mask = mask_monochrome
        const selectionInfo = session_ts.store.data.selectionInfo
        // await selection.base64ToChannel(channel_mask, selectionInfo, 'mask')

        const mask_layer = await moveImageToLayer(
            channel_mask,
            session_ts.store.data.selectionInfo
        )

        await selection.black_white_layer_to_mask_multi_batchplay(
            mask_layer.id,
            layer.id,
            'mask'
        )
        await layer_util.deleteLayers([mask_layer])
    }

    return layer
}
const remove = async (layer: any) => {
    await layer_util.deleteLayers([layer]) // delete previous layer
}

export const resetViewer = () => {
    store.updateProperty('images', [])
    store.data.thumbnails = []
    store.data.prev_index = -1
    store.data.is_stored = []
    store.data.layers = []
    store.data.class_name = []
    store.data.can_click = true

    mask_store.data.images = []
    mask_store.data.thumbnails = []
    init_store.data.images = []
    init_store.data.thumbnails = []
}

const addAll = async () => {
    let i = 0
    for (let i = 0; i < store.data.images.length; i++) {
        if (store.data.is_stored[i]) {
            continue
        }
        await add(store.data.images[i])
    }

    session_ts.Session.endSession()
}
const discardAll = async () => {
    for (let i = 0; i < store.data.images.length; i++) {
        await remove(store.data.layers[i])
    }

    session_ts.Session.endSession()
}
const onlySelected = () => {
    session_ts.Session.endSession()
}
export const handleOutputImageThumbnailClick = async (
    index: number,
    event?: any
) => {
    try {
        if (!store.data.can_click) return null

        store.data.can_click = false
        const prev_index = store.data.prev_index
        const image = store.data.images[index] || ''
        const is_stored = store.data.is_stored[index] || false
        const is_prev_stored = store.data.is_stored[prev_index] || false
        const prev_layer = store.data.layers[prev_index] || null
        const prev_image = store.data.images[prev_index] || ''

        console.log('prev_index:', prev_index)
        console.log('is_stored:', is_stored)
        console.log('is_prev_stored:', is_prev_stored)
        console.log('prev_layer:', prev_layer)

        // store.updateProperty('clicked_index', index)

        let click_type: ClickTypeEnum = event
            ? findClickType(event)
            : ClickTypeEnum.Click
        if (
            index === store.data.prev_index &&
            click_type === ClickTypeEnum.Click
        ) {
            click_type = ClickTypeEnum.SecondClick
            //toggle functionality
        }

        console.log('click_type:', click_type)
        if (click_type === ClickTypeEnum.Click) {
            //1) modify layer stacks

            const layer = await add(image)
            await remove(store.data.layers[index])
            console.log('layer:', layer)
            store.data.layers[index] = layer

            if (is_prev_stored) {
            } else {
                await remove(prev_layer)
            }
            //2)change style
            store.data.class_name[prev_index] = is_prev_stored
                ? ClassNameEnum.Green
                : ClassNameEnum.None

            store.data.class_name[index] = is_stored
                ? ClassNameEnum.Green
                : ClassNameEnum.Orange

            //3)modify index
            store.data.prev_index = index
        } else if (click_type === ClickTypeEnum.ShiftClick) {
            //1) modify layer stacks
            if (prev_index === index) {
                store.data.class_name[index] = ClassNameEnum.Green
            } else {
                if (is_prev_stored) {
                } else {
                    // await remove(prev_layer)
                }

                const layer = await add(image)
                await remove(store.data.layers[index])
                store.data.layers[index] = layer
                //2)change style
                store.data.class_name[prev_index] = ClassNameEnum.Green
                store.data.class_name[index] = ClassNameEnum.Green

                //3)store index
                store.data.is_stored[prev_index] = true
                store.data.is_stored[index] = true
                store.data.prev_index = index
            }
        } else if (click_type === ClickTypeEnum.AltClick) {
            //1) modify layer stacks
            if (is_prev_stored) {
            } else {
                await remove(prev_layer)
            }
            await remove(store.data.layers[index])
            //2)change style
            store.data.class_name[prev_index] = is_prev_stored
                ? ClassNameEnum.Green
                : ClassNameEnum.None
            store.data.class_name[index] = ClassNameEnum.None

            //3)store index
            store.data.prev_index = -1
            store.data.is_stored[index] = false
        } else if (click_type === ClickTypeEnum.SecondClick) {
            //1) modify layer stacks
            if (is_prev_stored) {
            } else {
                await remove(prev_layer)
            }

            //2)change style
            store.data.class_name[prev_index] = is_prev_stored
                ? ClassNameEnum.Green
                : ClassNameEnum.None

            //3)store index
            store.data.prev_index = -1
        }
        store.data.class_name = [...store.data.class_name]
    } catch (e) {
        console.warn(e)
    }
    store.data.can_click = true
}
const Viewer = observer(() => {
    // console.log('rendered', store.toJsFunc())
    const display_button: Boolean =
        session_ts.store.data.is_active && session_ts.store.data.can_generate
    const button_style = {
        display: display_button ? 'block' : 'none',
        marginRight: '3px',
    }
    return (
        <div>
            <SpSliderWithLabel
                out_min={50}
                out_max={300}
                in_min={1}
                in_max={10}
                // min={85}
                // max={300}

                onSliderChange={(new_value: number) =>
                    // event: React.ChangeEvent<HTMLInputElement>
                    {
                        try {
                            console.log('change event triggered!')
                            // const new_value = event.target.value
                            // const base_width = 100
                            // const scale_ratio = new_value / base_width

                            // store.updateProperty('height', scale_ratio)
                            store.updateProperty('width', new_value)
                            init_store.updateProperty('width', new_value)
                        } catch (e) {
                            console.warn(e)
                        }
                    }
                }
                show-value={false}
                steps={1}
                output_value={store.data.width}
                label="Thumbnail Size"
            ></SpSliderWithLabel>

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-evenly',
                    paddingTop: '3px',
                }}
            >
                <button
                    title={Locale("Keep all generated images on the canvas")}
                    className="btnSquare acceptClass acceptAllImgBtn"
                    style={button_style}
                    onClick={addAll}
                ></button>
                <button
                    title={Locale("Delete all generated images from the canvas")}
                    className="btnSquare discardClass discardAllImgBtn"
                    style={button_style}
                    onClick={discardAll}
                ></button>
                <button
                    title={Locale("Keep only the highlighted images")}
                    className="btnSquare acceptSelectedClass acceptSelectedImgBtn"
                    style={button_style}
                    onClick={onlySelected}
                ></button>
            </div>
            <div>
                <SpCheckBox
                    style={{
                        display: [
                            GenerationModeEnum.Inpaint,
                            GenerationModeEnum.LassoInpaint,
                            GenerationModeEnum.Outpaint,
                        ].includes(session_ts.store.data.mode)
                            ? void 0
                            : 'none',
                        marginRight: '10px',
                    }}
                    onChange={(event: any) => {
                        store.data.auto_mask = event.target.checked
                    }}
                    checked={store.data.auto_mask}
                >
                    {
                        //@ts-ignore
                        Locale('Apply Auto Masking')
                    }
                </SpCheckBox>
            </div>
            <div style={{ border: '2px solid #6d6c6c', padding: '3px' }}>
                <Grid
                    // images={init_store.data.images}
                    thumbnails={init_store.data.thumbnails}
                    thumbnails_styles={init_store.data.class_name}
                    callback={(index: number, event: any) => {
                        console.log(index)
                    }}
                    width={init_store.data.width}
                    height={init_store.data.height}
                    // clicked_index={init_store.data.clicked_index}
                    // permanent_indices={init_store.data.permanent_indices}
                ></Grid>
            </div>
            <div style={{ border: '2px solid #6d6c6c', padding: '3px' }}>
                <Grid
                    // images={mask_store.data.images}
                    thumbnails={mask_store.data.thumbnails}
                    thumbnails_styles={mask_store.data.class_name}
                    callback={(index: number, event: any) => {
                        console.log(index)
                    }}
                    width={mask_store.data.width}
                    height={mask_store.data.height}
                    // clicked_index={init_store.data.clicked_index}
                    // permanent_indices={init_store.data.permanent_indices}
                    action_buttons={[
                        {
                            ComponentType: MoveToCanvasSvg,
                            callback: async (index: number) => {
                                await moveImageToLayer(
                                    mask_store.data.images[index],
                                    session_ts.store.data.selectionInfo,
                                    'mask'
                                )
                            },
                        },
                    ]}
                ></Grid>
            </div>
            <div style={{ border: '2px solid #6d6c6c', padding: '3px' }}>
                <Grid
                    // images={store.data.images}
                    thumbnails={store.data.thumbnails}
                    thumbnails_styles={store.data.class_name}
                    callback={handleOutputImageThumbnailClick}
                    width={store.data.width}
                    height={store.data.height}
                    clicked_index={store.data.clicked_index}
                    permanent_indices={store.data.permanent_indices}
                    // action_buttons={[
                    //     {
                    //         ComponentType: MoveToCanvasSvg,
                    //         callback: (index: number) => {
                    //             console.log(
                    //                 'viewer callback:',
                    //                 store.data.images[index],
                    //                 g_generation_session.selectionInfo
                    //             )
                    //             moveImageToLayer(
                    //                 store.data.images[index],
                    //                 g_generation_session.selectionInfo
                    //             )
                    //         },
                    //     },
                    // ]}
                ></Grid>
            </div>
        </div>
    )
})

const ToolbarViewerButtons = observer(() => {
    const display_button: Boolean =
        session_ts.store.data.is_active && session_ts.store.data.can_generate
    const button_style = {
        display: display_button ? 'block' : 'none',

        marginRight: '3px',
        marginBottom: '3px',
    }
    return (
        <div
        // style={{
        //     display: 'flex',
        //     justifyContent: 'space-evenly',
        //     paddingTop: '3px',
        // }}
        >
            <button
                title={Locale("Keep all generated images on the canvas")}
                className="btnSquare acceptClass acceptAllImgBtn"
                style={button_style}
                onClick={addAll}
            ></button>
            <button
                title={Locale("Delete all generated images from the canvas")}
                className="btnSquare discardClass discardAllImgBtn"
                style={button_style}
                onClick={discardAll}
            ></button>
            <button
                title={Locale("Keep only the highlighted images")}
                className="btnSquare acceptSelectedClass acceptSelectedImgBtn" 
                style={button_style}
                onClick={onlySelected}
            ></button>
        </div>
    )
}) 

// const node = document.getElementById('reactViewerContainer')!
const containers = document.querySelectorAll('.reactViewerContainer')

containers.forEach((container) => {
    const root = ReactDOM.createRoot(container)
    root.render(
        <React.StrictMode>
            <div style={{ border: '2px solid #6d6c6c', padding: '3px' }}>
                <Collapsible defaultIsOpen={true} label={Locale('Viewer')}>
                    <Viewer></Viewer>
                </Collapsible>
            </div>
        </React.StrictMode>
    )
})

const button_container = document.getElementById('viewerButtonContainer')!
const root = ReactDOM.createRoot(button_container)
root.render(
    <React.StrictMode>
        <ToolbarViewerButtons />
    </React.StrictMode>
)
