const api = require('../api')
const html_manip = require('../html_manip')
async function requestControlNetModelList() {
    const control_net_json = await api.requestGet(
        `${g_sd_url}/controlnet/model_list`
    )
    const model_list = control_net_json?.model_list
    return model_list
}

async function populateModelMenu() {
    try {
        const models = await requestControlNetModelList()

        html_manip.populateMenu(
            'mModelsMenuControlNet',
            'mModelsMenuItemControlNet',
            models,
            (item, item_html_element) => {
                item_html_element.innerHTML = item
            }
        )
    } catch (e) {
        console.warn(e)
    }
}
async function initializeControlNetTab() {
    await populateModelMenu()
}

module.exports = {
    requestControlNetModelList,
    populateModelMenu,
    initializeControlNetTab,
}
