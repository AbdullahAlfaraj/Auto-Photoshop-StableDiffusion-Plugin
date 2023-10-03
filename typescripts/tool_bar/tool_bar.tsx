import { observer } from 'mobx-react'
import React from 'react'
import ReactDOM from 'react-dom/client'

import { general, html_manip, io, psapi } from '../util/oldSystem'
import {
    default_preset,
    loadPresetSettings,
    store as sd_tab_store,
} from '../sd_tab/util'
import { requestPost } from '../util/ts/api'
import ControlNetStore from '../controlnet/store'
import { AStore } from '../main/astore'

import { ErrorBoundary } from '../util/errorBoundary'
import './style/tool_bar.css'
import { presetToStore } from '../util/ts/io'
import { multiPrompts } from '../entry'
import { activateSessionSelectionArea } from '../util/ts/selection'
declare let g_sd_url: string

export const store = new AStore({
    at_controlnet_unit_index: 0,
})
async function clipInterrogate() {
    try {
        const width = sd_tab_store.data.width
        const height = sd_tab_store.data.height
        const selectionInfo = await psapi.getSelectionInfoExe()

        const base64 = await io.IO.getSelectionFromCanvasAsBase64Interface_New(
            width,
            height,
            selectionInfo,
            true
        )

        const url = `${g_sd_url}/sdapi/v1/interrogate`

        const payload = {
            image: base64,
            model: 'clip',
        }
        const result_json = await requestPost(url, payload)
        console.log(result_json)
        return result_json
    } catch (e) {
        console.warn(e)
    }
}

async function onInterrogate(evt: any) {
    // start sudo timer after 1 seconds delay
    let sudo_timer_id
    setTimeout(() => {
        sudo_timer_id = general.sudoTimer('Interrogate')
    }, 1000)
    const interrogate_result = await clipInterrogate()

    if (interrogate_result.caption) {
        html_manip.autoFillInPrompt(interrogate_result.caption)
    }

    // after the clipInterrogate finish stop the timer

    html_manip.updateProgressBarsHtml(0, 'No work in progress')
    clearInterval(sudo_timer_id)
    sudo_timer_id = null
}

function scrollToPreview() {
    try {
        document
            .querySelector('#search_second_panel > div.previewContainer')!
            .scrollIntoView()
        // document.getElementById('taPrompt').scrollIntoView()
    } catch (e) {
        console.error(e)
    }
}
function scrollToHistory() {
    try {
        document
            .querySelector('#search_second_panel > div#historyImagesContainer')!
            .scrollIntoView()
    } catch (e) {
        console.error(e)
    }
}
function scrollToLexica() {
    try {
        document
            .querySelector('#search_second_panel > div.lexicaContainer')!
            .scrollIntoView()
    } catch (e) {
        console.error(e)
    }
}

@observer
class ToolBar extends React.Component<{}> {
    componentDidMount(): void {
        console.log('ToolBar did mount')
    }
    render() {
        return (
            <div id="_tool_bar_container">
                <button
                    className="btnSquare layerToSelection btnLayerToSelection"
                    title="Move and reSize the highlighted layer to fit into the Selection Area "
                    style={{ marginRight: '3px' }}
                    onClick={async (evt: any) => {
                        try {
                            const isSelectionAreaValid =
                                await psapi.checkIfSelectionAreaIsActive()
                            if (isSelectionAreaValid) {
                                const validSelection = isSelectionAreaValid
                                await psapi.layerToSelection(validSelection)
                            } else {
                                await psapi.promptForMarqueeTool()
                            }
                        } catch (e) {
                            console.error(e)
                        }
                    }}
                ></button>
                <button
                    title="create a snapshot of what you see on the canvas and place on a new layer"
                    className="btnSquare snapshotButton"
                    style={{ marginRight: '3px' }}
                    onClick={async (evt: any) => {
                        try {
                            await psapi.snapshot_layerExe()
                        } catch (e) {
                            console.warn(e)
                        }
                    }}
                ></button>
                <button
                    className="btnSquare resetButton"
                    id="btnResetSettings"
                    title="reset the ui settings to their default values"
                    style={{ marginRight: '3px' }}
                    onClick={(evt: any) => {
                        try {
                            multiPrompts.setPrompt({
                                positive: '',
                                negative: '',
                            })
                            loadPresetSettings(default_preset)
                        } catch (e) {
                            console.warn(e)
                        }
                    }}
                ></button>
                <button
                    className="btnSquare interrogateButton"
                    id="btnInterrogate"
                    title="Interrogate the selected area, convert Image to Prompt"
                    style={{ marginRight: '3px' }}
                    onClick={onInterrogate}
                ></button>
                <button
                    className="btnSquare svgButton selectionAreaButton"
                    id="btnSelectionArea"
                    style={{ marginRight: '3px' }}
                    title="Reselect the selection area for the current session"
                    onClick={activateSessionSelectionArea}
                ></button>
                <button
                    id="scrollToPreview"
                    className="btnSquare svgButton"
                    title="Quickly jump to the preview section"
                    onClick={scrollToPreview}
                >
                    P
                </button>
                <div id="scrollToControlNetUnitContainer">
                    <button
                        className="btnSquare svgButton"
                        onClick={() => {
                            try {
                                const units = document.querySelectorAll(
                                    '#controlNetTabParentContainer .collapsible'
                                )
                                const units_data =
                                    ControlNetStore.controlNetUnitData.map(
                                        (data, index) => ({
                                            enabled: data.enabled,
                                            index,
                                        })
                                    )

                                // Find the next enabled unit
                                let counter = 0
                                while (
                                    !units_data[
                                        store.data.at_controlnet_unit_index %
                                            units.length
                                    ].enabled &&
                                    counter < units.length
                                ) {
                                    store.data.at_controlnet_unit_index += 1
                                    counter += 1
                                }

                                if (counter < units.length) {
                                    store.data.at_controlnet_unit_index =
                                        store.data.at_controlnet_unit_index %
                                        units.length
                                    units[
                                        store.data.at_controlnet_unit_index
                                    ].scrollIntoView()
                                    store.data.at_controlnet_unit_index += 1
                                }
                            } catch (e) {
                                console.warn(e)
                            }
                        }}
                        title="Quickly jump to the active ControlNet Unit"
                    >
                        C
                    </button>
                    <button
                        id=""
                        className="btnSquare svgButton"
                        title="Quickly jump to the History Panel"
                        onClick={scrollToHistory}
                    >
                        H
                    </button>
                    <button
                        id=""
                        className="btnSquare svgButton"
                        title="Quickly jump to the Lexica Panel"
                        onClick={scrollToLexica}
                    >
                        L
                    </button>
                </div>
            </div>
        )
    }
}

const container = document.getElementById('toolBarContainer')!
const root = ReactDOM.createRoot(container)

root.render(
    //<React.StrictMode>
    <ErrorBoundary>
        <ToolBar></ToolBar>
    </ErrorBoundary>
    //</React.StrictMode>
)
