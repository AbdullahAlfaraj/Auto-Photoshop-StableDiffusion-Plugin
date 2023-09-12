import React from 'react'
import ReactDOM from 'react-dom/client'

import { observer } from 'mobx-react'

// import { sd_tab_ts, session_ts, viewer } from '../entry'
import { store as session_store } from '../session/session_store'
import { Session } from '../session/session'
// import * as sd_tab_ts from '../sd_tab/sd_tab'
import { store as sd_tab_store } from '../sd_tab/util'
import * as viewer from '../viewer/viewer'

import './style/generate.css'
import { io, note, psapi, selection } from '../util/oldSystem'
import { GenerationModeEnum } from '../util/ts/enum'
import { initializeBackground } from '../util/ts/document'
import Locale from '../locale/locale'
import { ErrorBoundary } from '../util/errorBoundary'
import {
    store as viewer_store,
    mask_store as viewer_mask_store,
    // init_store as viewer_init_store,
} from '../viewer/viewer_util'
declare let g_automatic_status: any
declare let g_current_batch_index: number
//example: take 'oI' in 'LassoInpaint' and replace it with 'o I' thus creating 'Lasso Inpaint'
const modeDisplayNames = Object.fromEntries(
    Object.entries(GenerationModeEnum).map(([key, value]) => [
        value,
        key.replace(/([a-z])([A-Z])/g, '$1 $2'),
    ])
)

export const GenerateButtons = observer(() => {
    return (
        <div>
            <button
                id="btnNewGenerate"
                className="btnSquare generateButtonMargin generateColor"
                onClick={handleGenerateBatch}
                style={{
                    display: session_store.data.can_generate ? void 0 : 'none',
                }}
            >
                Generate {modeDisplayNames[sd_tab_store.data.mode]}
            </button>
            {session_store.data.can_generate ? (
                <button
                    onClick={handleGenerateMoreBatch}
                    disabled={
                        session_store.data.can_generate_more ? void 0 : true
                    }
                    id="btnNewGenerateMore"
                    className={
                        'btnSquare generateButtonMargin generateMoreColor' +
                        (session_store.data.can_generate_more
                            ? ''
                            : 'disableBtn')
                    }
                    style={{
                        display: session_store.data.can_generate_more
                            ? 'inline-block'
                            : 'none',
                    }}
                >
                    Generate more
                </button>
            ) : (
                void 0
            )}
            {!session_store.data.can_generate ? (
                <button
                    onClick={handleInterrupt}
                    id="btnNewInterrupt"
                    className="btnSquare generateButtonMargin"
                >
                    Interrupt
                </button>
            ) : (
                void 0
            )}
        </div>
    )
})

const ToolbarGenerateButtons = observer(() => {
    const button_style: any = {
        width: '30px',
        height: '30px',
        marginBottom: '3px',
    }
    const generate_display = session_store.data.can_generate
        ? 'inline-flex'
        : 'none'
    const generate_more_display =
        session_store.data.can_generate && session_store.data.can_generate_more
            ? 'inline-flex'
            : 'none'
    const interrupt_display = session_store.data.can_generate
        ? 'none'
        : 'inline-flex'
    return (
        <div>
            <button
                title={Locale('Generate')}
                className="btnSquare generateColor"
                onClick={handleGenerate}
                style={{ ...button_style, display: generate_display }}
            >
                G
            </button>
            <button
                title={Locale('Generate More')}
                onClick={handleGenerateMore}
                className={'btnSquare generateMoreColor'}
                style={{
                    ...button_style,
                    display: generate_more_display,
                }}
            >
                M
            </button>
            <button
                title={Locale('Interrupt')}
                onClick={handleInterrupt}
                className="btnSquare"
                style={{
                    ...button_style,
                    display: interrupt_display,
                }}
            >
                I
            </button>
        </div>
    )
})
const canStartSession = async () => {
    // check for automatic1111 connection: fail if false
    // check for automatic1111 api: fail if false
    // check for having a background layer: create if false
    // check for artboard: fail if true
    // check for selection: fail if false
    let can_start_session = false
    try {
        const selection_info = await psapi.getSelectionInfoExe()

        if (selection_info) {
            Session.endSession()

            can_start_session = true
        } else {
            can_start_session = await note.Notification.inactiveSelectionArea(
                session_store.data.is_active,
                'Reuse Selection'
            )
            if (can_start_session) {
                //end current session and start a new one
                Session.endSession()
                await psapi.reSelectMarqueeExe(session_store.data.selectionInfo)
            }
        }
        //@ts-ignore
        g_automatic_status = await checkAutoStatus()
        //@ts-ignore
        await displayNotification(g_automatic_status)
    } catch (e) {
        console.warn(e)
    }

    return can_start_session
}

const resetBatch = () => {
    g_current_batch_index = -1
    session_store.data.is_interrupted = false
}

const handleGenerate = async () => {
    //save user input for later
    //1) save selection as channel
    await selection.selectionToChannel('mask')

    await initializeBackground() //fix background if there is a need
    console.log('mode: ', sd_tab_store.data.mode)
    try {
        if (!(await canStartSession())) {
            return void 0
        }
        var { output_images, response_json, ui_settings } =
            await Session.generate(sd_tab_store.data.mode)

        if (session_store.data.is_interrupted) {
            return void 0
        }

        const thumbnail_list = []
        for (const base64 of output_images) {
            const thumbnail = await io.createThumbnail(base64, 300)
            thumbnail_list.push(thumbnail)
        }

        viewer_store.updateProperty('thumbnails', thumbnail_list)
        viewer_store.updateProperty('images', output_images)
        if (
            [
                GenerationModeEnum.Inpaint,
                GenerationModeEnum.LassoInpaint,
                GenerationModeEnum.Outpaint,
            ].includes(session_store.data.mode)
        ) {
            viewer_mask_store.updateProperty(
                'output_images_masks',
                Array(output_images.length).fill(ui_settings['mask'])
            )
        }
        console.log('session_store.toJsFunc(): ', session_store.toJsFunc())
    } catch (e) {
        console.error(e)
        console.warn('output_images: ', output_images)
        console.warn('response_json: ', response_json)
    }
}

const handleGenerateMore = async () => {
    try {
        var { output_images, response_json, ui_settings } =
            await Session.generateMore()

        if (session_store.data.is_interrupted) {
            return void 0
        }

        const thumbnail_list = []
        for (const base64 of output_images) {
            const thumbnail = await io.createThumbnail(base64, 300)
            thumbnail_list.push(thumbnail)
        }
        viewer_store.data.thumbnails = [
            ...viewer_store.data.thumbnails,
            ...thumbnail_list,
        ]

        viewer_store.data.images = [
            ...viewer_store.data.images,
            ...output_images,
        ]

        if (
            [
                GenerationModeEnum.Inpaint,
                GenerationModeEnum.LassoInpaint,
                GenerationModeEnum.Outpaint,
            ].includes(session_store.data.mode)
        ) {
            const new_masks: string[] = Array(output_images.length).fill(
                ui_settings['mask']
            )
            viewer_mask_store.data.output_images_masks = [
                ...viewer_mask_store.data.output_images_masks,
                ...new_masks,
            ]
            // viewer_mask_store.updatePropertyArray(
            //     'output_images_masks',
            //     Array(output_images.length).fill(
            //         session_store.data.expanded_mask
            //     )
            // )
        }
        // viewer.store.updateProperty('images', output_images)
        // console.log(
        //     'session_store.toJsFunc(): ',
        //     session_store.toJsFunc()
        // )
    } catch (e) {
        console.error(e)
        console.warn('output_images: ', output_images)
        console.warn('response_json: ', response_json)
    }
}

const handleGenerateBatch = async () => {
    try {
        const numberOfBatchCount: number = Math.floor(
            sd_tab_store.data.batch_count
        )

        await handleGenerate() //first generation is always use handleGenerate
        for (
            let i = 1;
            i < numberOfBatchCount && !session_store.data.is_interrupted;
            i++
        ) {
            // if (g_batch_count_interrupt_status === true) {
            //     break
            // }
            // g_current_batch_index = i
            await handleGenerateMore()
        }
        resetBatch()
        // g_batch_count_interrupt_status = false // reset for next generation
        // g_current_batch_index = 0 // reset curent_batch_number
    } catch (e) {
        console.error(e)
    }
}
const handleGenerateMoreBatch = async () => {
    try {
        const numberOfBatchCount: number = Math.floor(
            sd_tab_store.data.batch_count
        )

        // await handleGenerateMore() //first generation is always use handleGenerate
        for (
            let i = 0;
            i < numberOfBatchCount && !session_store.data.is_interrupted;
            i++
        ) {
            // if (g_batch_count_interrupt_status === true) {
            //     break
            // }
            // g_current_batch_index = i
            await handleGenerateMore()
        }

        // g_batch_count_interrupt_status = false // reset for next generation
        // g_current_batch_index = 0 // reset curent_batch_number
        resetBatch()
    } catch (e) {
        console.error(e)
    }
}
const handleInterrupt = async () => {
    try {
        await Session.interrupt()
    } catch (e) {
        console.error(e)
    }
}

const toolBarButtonsContainer = document.getElementById(
    'toolbarGenerateButtonsContainer'
)!
const toolBarButtonsContainerRoot = ReactDOM.createRoot(toolBarButtonsContainer)
toolBarButtonsContainerRoot.render(
    <React.StrictMode>
        <ErrorBoundary>
            <ToolbarGenerateButtons></ToolbarGenerateButtons>
        </ErrorBoundary>
    </React.StrictMode>
)
