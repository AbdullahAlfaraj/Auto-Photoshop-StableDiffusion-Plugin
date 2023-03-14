async function requestModelsHorde() {
    //get the models list from url
    // https://stablehorde.net/api/v2/status/models

    console.log('requestModelsHorde: ')

    const full_url = 'https://stablehorde.net/api/v2/status/models'
    let request = await fetch(full_url)
    let json = await request.json()
    console.log('hordes models json:')
    console.dir(json)

    return json
}

function addHordeModelMenuItem(model_title, model_name) {
    // console.log(model_title,model_name)
    const menu_item_element = document.createElement('sp-menu-item')
    menu_item_element.className = 'mModelMenuItemHorde'
    menu_item_element.innerHTML = model_title

    menu_item_element.dataset.name = model_name
    return menu_item_element
}

async function refreshModelsHorde() {
    try {
        let g_models_horde = await requestModelsHorde()
        // const models_menu_element = document.getElementById('mModelsMenu')
        // models_menu_element.value = ""
        //(optional): sort the models

        g_models_horde.sort(function (a, b) {
            return b.count - a.count
        })
        // g_models_horde = g_models_horde.sort( compareModelCounts );
        document.getElementById('mModelsMenuHorde').innerHTML = ''
        let model_item_random = addHordeModelMenuItem('Random', 'Random')
        // model_item_random.selected = true
        document
            .getElementById('mModelsMenuHorde')
            .appendChild(model_item_random)
        for (let model of g_models_horde) {
            // console.log(model.name, model.count) //Log
            const model_html_tile = `${model.name}: ${model.count}`
            const model_item_element = addHordeModelMenuItem(
                model_html_tile,
                model.name
            )
            if (model.name === 'stable_diffusion') {
                // TODO: refactor this code outside the for loop
                // maybe call it in an init function
                //selection the stable diffusion model by default
                model_item_element.selected = true
            }
            document
                .getElementById('mModelsMenuHorde')
                .appendChild(model_item_element)
        }
    } catch (e) {
        console.warn(e)
    }
}
function getModelHorde() {
    return [...document.getElementsByClassName('mModelMenuItemHorde')].filter(
        (e) => e.selected == true
    )[0].dataset.name
}

function getScriptArgs() {
    const model = getModelHorde()
    const b_nsfw = document.getElementById('chUseNSFW').checked
    const b_shared_laion = document.getElementById('chUseSharedLaion').checked

    let seed_variation = document.getElementById('slSeedVariation').value
    seed_variation = parseInt(seed_variation)
    const script_args_json = {
        model: model,
        nsfw: b_nsfw,
        shared_laion: b_shared_laion,
        seed_variation: seed_variation,
        post_processing_1: 'None',
        post_processing_2: 'None',
        post_processing_3: 'None',
    }
    const script_args = Object.values(script_args_json)
    return script_args
}

document
    .getElementById('btnRefreshModelsHorde')
    .addEventListener('click', async () => {
        await refreshModelsHorde()
    })

const script_name = 'Run on Stable Horde'

refreshModelsHorde() //refresh the model when importing the script

module.exports = {
    requestModelsHorde,
    refreshModelsHorde,
    getModelHorde,

    getScriptArgs,
    script_name,
}
