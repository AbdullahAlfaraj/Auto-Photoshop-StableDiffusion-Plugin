import React from 'react'
import ReactDOM from 'react-dom/client'
import { observer } from 'mobx-react'
import { AStore } from '../main/astore'
import { SpMenu } from '../util/elements'

import { api, python_replacement } from '../util/oldSystem'
const { getExtensionUrl } = python_replacement
import '../locale/locale-for-old-html'
import { ErrorBoundary } from '../util/errorBoundary'

declare let g_sd_url: string

export const store = new AStore({
    vae_model_list: [] as string[],
    current_vae: '' as string,
})

@observer
export class VAEComponent extends React.Component<{
    // store: AStore
}> {
    componentDidMount(): void {}
    changeVAEModel(vae_model: string) {
        try {
            const full_url = `${g_sd_url}/sdapi/v1/options`
            api.requestPost(full_url, { sd_vae: vae_model })
        } catch (e) {
            console.warn('changeVAEModel: vae_model: ', vae_model, e)
        }
    }
    handleRefresh() {
        populateVAE()
    }
    render(): React.ReactNode {
        return (
            <div style={{ display: 'flex' }}>
                <SpMenu
                    title="vae models"
                    items={store.data.vae_model_list}
                    // style="width: 199px; margin-right: 5px"
                    label_item="Select A VAE"
                    // id={'model_list'}
                    selected_index={store.data.vae_model_list.indexOf(
                        store.data.current_vae
                    )}
                    onChange={(id: any, value: any) => {
                        // script_store.setSelectedScript(value.item)
                        console.log('onChange value: ', value)
                        this.changeVAEModel(value.item)
                    }}
                ></SpMenu>
                <button
                    className="btnSquare refreshButton"
                    title="Refresh VAE Models List"
                    onClick={this.handleRefresh}
                ></button>
            </div>
        )
    }
}
const vaeContainerNode = document.getElementById('settingsVAEContainer')!
const vaeRoot = ReactDOM.createRoot(vaeContainerNode)

async function requestGetVAE() {
    const full_url = `${g_sd_url}/sdapi/v1/options`

    const options = await api.requestGet(full_url)
    return options?.sd_vae
}
export async function populateVAE() {
    try {
        const extension_url = getExtensionUrl()

        const full_url = `${extension_url}/vae/list`
        const vae_models = (await api.requestGet(full_url)) || []

        console.log('populateVAE vae_models: ', vae_models)
        store.updateProperty('vae_model_list', vae_models)

        const current_vae = await requestGetVAE()
        if (current_vae && vae_models.includes(current_vae)) {
            store.updateProperty('current_vae', current_vae)
        }
    } catch (e) {
        console.warn('populateVAE():', e)
    }
}

vaeRoot.render(
    //<React.StrictMode>
    <ErrorBoundary>
        <VAEComponent></VAEComponent>
    </ErrorBoundary>
    //</React.StrictMode>
)

export default {
    store,
    populateVAE,
}
