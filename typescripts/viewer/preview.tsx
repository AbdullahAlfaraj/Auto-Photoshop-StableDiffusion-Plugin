import React from 'react'
import ReactDOM from 'react-dom/client'

import { Collapsible } from '../util/collapsible'
import { observer } from 'mobx-react'
import { AStore } from '../main/astore'
// import { progress } from '../entry'
import * as progress from '../session/progress'

import './style/preview.css'
import { reaction } from 'mobx'
import Locale from '../locale/locale'
import { ErrorBoundary } from '../util/errorBoundary'
export const store = new AStore({
    // image: '',
    // progress_value: 0,
})
// update all progress bar when progress store progress_value update
reaction(
    () => {
        return progress.store.data.progress_value
    },
    (value: number) => {
        document.querySelectorAll('.pProgressBars').forEach((progress: any) => {
            progress.value = value?.toFixed(2)
        })
    }
)
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
            <div
                className="progressImageContainer"
                style={{
                    minHeight: progress.store.data.progress_image_height,
                }}
            >
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

const PreviewerContainer = observer(() => {
    return (
        <div style={{ border: '2px solid #6d6c6c', padding: '3px' }}>
            <Collapsible
                defaultIsOpen={true}
                label={
                    Locale('Preview') +
                    ' ' +
                    (progress.store.data.progress_value
                        ? `: ${
                              progress.store.data.progress_label
                          } ${progress.store.data.progress_value?.toFixed(2)}%`
                        : '')
                }
            >
                <Previewer></Previewer>
            </Collapsible>
        </div>
    )
})
containers.forEach((container) => {
    const root = ReactDOM.createRoot(container)

    root.render(
        //<React.StrictMode>
        <ErrorBoundary>
            <PreviewerContainer />
        </ErrorBoundary>
        //</React.StrictMode>
    )
})
