import ReactDOM from 'react-dom/client'
import React from 'react'
import ControlNetTab from './ControlNetTab'
import store from './store'
import { versionCompare } from './util'
import Collapsible from '../after_detailer/after_detailer'
import Locale from '../locale/locale'
import { ErrorBoundary } from '../util/errorBoundary'

const elem = document.getElementById('sp-control_net-tab-page')
const elem2 = document.getElementById('sp-control_net-tab-page2')

if (elem) {
    const root = ReactDOM.createRoot(elem)
    root.render(
        <ErrorBoundary>
            <ControlNetTab appState={store} />
        </ErrorBoundary>
    )
}

if (elem2) {
    const root = ReactDOM.createRoot(elem2)
    root.render(
        <React.StrictMode>
            <ErrorBoundary>
                <div
                    style={{
                        border: '2px solid #6d6c6c',
                        padding: '3px',
                    }}
                >
                    <Collapsible
                        defaultIsOpen={true}
                        label={Locale('ControlNet Tab')}
                    >
                        <div
                            id="controlNetTabParentContainer"
                            style={{ marginTop: '10px' }}
                        >
                            <ControlNetTab appState={store} />
                        </div>
                    </Collapsible>
                </div>
            </ErrorBoundary>
        </React.StrictMode>
    )
}
function scrollToEnabledControlNetUnit() {}

const button = document.getElementById('scrollToControlNetUnitContainer')!
const button_root = ReactDOM.createRoot(button)
let controlnet_unit_index = 0
button_root.render(
    <ErrorBoundary>
        <button
            className="btnSquare svgButton"
            onClick={() => {
                try {
                    const units = document.querySelectorAll(
                        '#controlNetTabParentContainer .collapsible'
                    )
                    const units_data = store.controlNetUnitData.map(
                        (data, index) => ({
                            enabled: data.enabled,
                            index,
                        })
                    )

                    // Find the next enabled unit
                    let counter = 0
                    while (
                        !units_data[controlnet_unit_index % units.length]
                            .enabled &&
                        counter < units.length
                    ) {
                        controlnet_unit_index += 1
                        counter += 1
                    }

                    if (counter < units.length) {
                        controlnet_unit_index =
                            controlnet_unit_index % units.length
                        units[controlnet_unit_index].scrollIntoView()
                        controlnet_unit_index += 1
                    }
                } catch (e) {
                    console.warn(e)
                }
            }}
            title="Quickly jump to the active ControlNet Unit"
        >
            C
        </button>
    </ErrorBoundary>
)

export { store, versionCompare }
