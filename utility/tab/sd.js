const general = require('../general')

//REFACTOR: move to notification.js
async function promptForUpdate(header_message, long_message) {
    const shell = require('uxp').shell

    ;(async () => {
        const buttons = ['Cancel', 'OK']
        const r1 = await dialog_box.prompt(
            header_message,
            long_message,
            buttons
            // 'Please Update you Plugin. it will take about 10 seconds to update',
            // 'update from discord, update from github'[
            // ['Cancel', 'Discord', 'Github']
            // ('Cancel', 'OK')
            // ]
        )
        try {
            let url
            if (r1 === 'Cancel') {
                /* cancelled or No */
                console.log('cancel')
            } else if (r1 === 'Github') {
                url =
                    'https://github.com/AbdullahAlfaraj/Auto-Photoshop-StableDiffusion-Plugin'
                // await py_re.openUrlRequest(url)
            } else if (r1 === 'Discord') {
                console.log('Discord')
                // url = 'https://discord.gg/3mVEtrddXJ'
                // url = 'https://discord.gg/YkUJXYWK3c'
                // await py_re.openUrlRequest(url)
            } else if (r1 === 'Ok') {
            }
            // console.log('url: ', url)
        } catch (e) {
            console.warn(e, url)
        }
    })()
}

async function updateClickEventHandler(current_version) {
    try {
        const online_data = await general.requestOnlineData()
        const b_need_update = general.compareVersions(
            current_version,
            online_data.new_version
        )

        let header_message = "You're Plugin is up to date."
        let long_message = ''
        if (b_need_update) {
            header_message = `New Version is Available (${online_data.new_version})`
            long_message = online_data.update_message
        }

        await promptForUpdate(header_message, long_message)
    } catch (e) {
        console.warn(e)
    }
}

document.getElementById('btnUpdate').addEventListener('click', async () => {
    await updateClickEventHandler(g_version)
})

module.exports = { updateClickEventHandler }
