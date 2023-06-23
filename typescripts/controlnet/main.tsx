import ReactDOM from 'react-dom/client'
import React from 'react'
import ControlNetTab from './ControlNetTab'
import store from './store'
import { versionCompare } from './util'
import Collapsible from '../after_detailer/after_detailer'

const elem = document.getElementById('sp-control_net-tab-page')
const elem2 = document.getElementById('sp-control_net-tab-page2')

if (elem) {
    const root = ReactDOM.createRoot(elem)
    root.render(<ControlNetTab appState={store} />)
}

if (elem2) {
    const root = ReactDOM.createRoot(elem2)
    root.render(
        <React.StrictMode>
            <div
                style={{
                    border: '2px solid #6d6c6c',
                    padding: '3px',
                }}
            >
                <Collapsible defaultIsOpen={true} label={'ControlNet Tab'}>
                    <div
                        id="controlNetTabParentContainer"
                        style={{ marginTop: '10px' }}
                    >
                        <ControlNetTab appState={store} />
                    </div>
                </Collapsible>
            </div>
        </React.StrictMode>
    )
}
export { store, versionCompare }
