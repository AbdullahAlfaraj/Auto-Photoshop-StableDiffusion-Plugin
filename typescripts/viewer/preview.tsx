import React from 'react'
import ReactDOM from 'react-dom/client'

import Collapsible from '../after_detailer/after_detailer'
import { observer } from 'mobx-react'
import { AStore } from '../main/astore'
import { progress } from '../entry'
import './style/preview.css'
export const store = new AStore({
    // image: '',
    // progress_value: 0,
})

const Previewer = observer(() => {
    const renderImage = () => {
        let preview_img_html
        if (progress.store.data.progress_image) {
            preview_img_html = (
                <img
                    style={{ maxWidth: '100%' }}
                    src={
                        'data:image/png;base64,' +
                        progress.store.data.progress_image
                    }
                />
            )
        }
        return (
            <div>
                <sp-progressbar
                    class="pProgressBars preview_progress_bar"
                    max="100"
                    value={`${progress.store.data.progress_value}`}
                ></sp-progressbar>
                {progress.store.data.progress_image ? preview_img_html : void 0}
            </div>
        )
    }
    return <div style={{ padding: '4px' }}>{renderImage()}</div>
})

const containers = document.querySelectorAll('.previewContainer')

containers.forEach((container) => {
    const root = ReactDOM.createRoot(container)

    root.render(
        <React.StrictMode>
            <div style={{ border: '2px solid #6d6c6c', padding: '3px' }}>
                <Collapsible defaultIsOpen={true} label={'Preview'}>
                    <Previewer></Previewer>
                </Collapsible>
            </div>
        </React.StrictMode>
    )
})

// // const node = document.getElementById('previewContainer')!
// const root = ReactDOM.createRoot(node)

// root.render(
//     <React.StrictMode>
//         <div style={{ border: '2px solid #6d6c6c', padding: '3px' }}>
//             <Collapsible defaultIsOpen={true} label={'Preview'}>
//                 <Previewer></Previewer>
//             </Collapsible>
//         </div>
//     </React.StrictMode>
// )
