import ReactDOM from 'react-dom/client'
import React from 'react'
import ControlNetTab from './ControlNetTab'
import store from './store'
import { versionCompare } from './util'

const elem = document.getElementById('sp-control_net-tab-page')
if (elem) {
    const root = ReactDOM.createRoot(elem)
    root.render(<ControlNetTab appState={store} />)
}

export { store, versionCompare }
