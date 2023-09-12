import ReactDOM from 'react-dom/client'
import React from 'react'
import ControlNetTab from './ControlNetTab'
import store from './store'
import { versionCompare } from './util'
import { Collapsible } from '../util/collapsible'
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

// const button = document.getElementById('scrollToControlNetUnitContainer')!
// const button_root = ReactDOM.createRoot(button)

// button_root.render(<ErrorBoundary></ErrorBoundary>)

export { versionCompare }
