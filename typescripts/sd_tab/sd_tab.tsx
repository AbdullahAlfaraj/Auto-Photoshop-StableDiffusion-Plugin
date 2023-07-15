import React from 'react'
import ReactDOM from 'react-dom/client'

import { observer } from 'mobx-react'

import { AStore } from '../main/astore'
import { GenerationModeEnum } from '../util/ts/enum'
import { reaction } from 'mobx'
import { SpCheckBox } from '../util/elements'
import { ErrorBoundary } from '../util/errorBoundary'

export const store = new AStore({
    is_lasso_mode: false,
    mode: GenerationModeEnum.Txt2Img,
} as { is_lasso_mode: boolean; mode: GenerationModeEnum })
reaction(
    () =>
        [store.data.is_lasso_mode, store.data.mode] as [
            boolean,
            GenerationModeEnum
        ],
    ([is_lasso_mode, mode]: [boolean, GenerationModeEnum]) => {
        if (is_lasso_mode && mode === GenerationModeEnum.Inpaint) {
            store.data.mode = GenerationModeEnum.LassoInpaint
        } else if (!is_lasso_mode && mode === GenerationModeEnum.LassoInpaint) {
            store.data.mode = GenerationModeEnum.Inpaint
        }
        // if (is_lasso_mode && mode === GenerationModeEnum.Outpaint) {
        //     store.data.mode = GenerationModeEnum.LassoOutpaint
        // } else if (
        //     !is_lasso_mode &&
        //     mode === GenerationModeEnum.LassoOutpaint
        // ) {
        //     store.data.mode = GenerationModeEnum.Outpaint
        // }
        console.log('store.data.is_lasso_mode:', store.data.is_lasso_mode)
        console.log('store.data.mode:', store.data.mode)
    }
)

const handleLassoModeChange = (event: any) => {
    store.updateProperty('is_lasso_mode', event.target.checked)
}
const Modes = observer(() => {
    const renderLassoModeElement = () => {
        if (
            [
                GenerationModeEnum.Inpaint,
                // GenerationModeEnum.Outpaint,
                GenerationModeEnum.LassoInpaint,
                // GenerationModeEnum.LassoOutpaint,
            ].includes(store.data.mode)
        ) {
            return (
                <SpCheckBox
                    // style={{ marginRight: '10px' }}
                    onChange={handleLassoModeChange}
                    checked={store.data.is_lasso_mode}
                    // id={`chEnableControlNet_${this.props.index}`}
                    value={store.data.is_lasso_mode}
                >
                    Lasso Mode
                </SpCheckBox>

                // <sp-checkbox checked={store.data.is_lasso_mode ? true : void 0}>
                //     lasso mode
                // </sp-checkbox>
            )
        }
    }
    return <div>{renderLassoModeElement()}</div>
})

const container = document.getElementById('reactModesContainer')!
const root = ReactDOM.createRoot(container)

root.render(
    <React.StrictMode>
        <ErrorBoundary>
            <Modes />
        </ErrorBoundary>
    </React.StrictMode>
)
