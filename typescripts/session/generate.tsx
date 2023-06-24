import React from 'react'
import ReactDOM from 'react-dom/client'

import { observer } from 'mobx-react'

import { sd_tab_ts, session_ts, viewer } from '../entry'
import './style/generate.css'
import { io } from '../util/oldSystem'
import { GenerationModeEnum } from '../util/ts/enum'

//example: take 'oI' in 'LassoInpaint' and replace it with 'o I' thus creating 'Lasso Inpaint'
const modeDisplayNames = Object.fromEntries(
    Object.entries(GenerationModeEnum).map(([key, value]) => [
        value,
        key.replace(/([a-z])([A-Z])/g, '$1 $2'),
    ])
)

const GenerateButtons = observer(() => {
    return (
        <div>
            <button
                id="btnNewGenerate"
                className="btnSquare generateButtonMargin"
                onClick={handleGenerate}
            >
                Generate {modeDisplayNames[sd_tab_ts.store.data.mode]}
            </button>
            {session_ts.store.data.can_generate ? (
                <button
                    onClick={handleGenerateMore}
                    disabled={
                        session_ts.store.data.can_generate_more ? void 0 : true
                    }
                    id="btnNewGenerateMore"
                    className={
                        'btnSquare generateButtonMargin ' +
                        (session_ts.store.data.can_generate_more
                            ? ''
                            : 'disableBtn')
                    }
                    style={{
                        display: session_ts.store.data.can_generate_more
                            ? 'inline-block'
                            : 'none',
                    }}
                >
                    Generate more
                </button>
            ) : (
                void 0
            )}
            {!session_ts.store.data.can_generate ? (
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

// declare let g_sd_mode: any
const handleGenerate = async () => {
    console.log('mode: ', sd_tab_ts.store.data.mode)
    try {
        const { output_images, response_json } =
            await session_ts.Session.generate(sd_tab_ts.store.data.mode)

        if (session_ts.store.data.is_interrupted) {
            return void 0
        }

        const thumbnail_list = []
        for (const base64 of output_images) {
            const thumbnail = await io.createThumbnail(base64, 300)
            thumbnail_list.push(thumbnail)
        }

        viewer.store.updateProperty('thumbnails', thumbnail_list)
        viewer.store.updateProperty('images', output_images)
        console.log(
            'session_ts.store.toJsFunc(): ',
            session_ts.store.toJsFunc()
        )
    } catch (e) {
        console.error(e)
    }
}

const handleGenerateMore = async () => {
    try {
        const { output_images, response_json } =
            await session_ts.Session.generateMore()

        if (session_ts.store.data.is_interrupted) {
            return void 0
        }

        const thumbnail_list = []
        for (const base64 of output_images) {
            const thumbnail = await io.createThumbnail(base64, 300)
            thumbnail_list.push(thumbnail)
        }
        viewer.store.data.thumbnails = [
            ...viewer.store.data.thumbnails,
            ...thumbnail_list,
        ]

        viewer.store.data.images = [
            ...viewer.store.data.images,
            ...output_images,
        ]

        // viewer.store.updateProperty('images', output_images)
        console.log(
            'session_ts.store.toJsFunc(): ',
            session_ts.store.toJsFunc()
        )
    } catch (e) {
        console.error(e)
    }
}

const handleInterrupt = async () => {
    try {
        // debugger
        await session_ts.Session.interrupt()
    } catch (e) {
        console.error(e)
    }
}

const container = document.getElementById('generateButtonsContainer')!
const root = ReactDOM.createRoot(container)

root.render(
    <React.StrictMode>
        <GenerateButtons></GenerateButtons>
    </React.StrictMode>
)
