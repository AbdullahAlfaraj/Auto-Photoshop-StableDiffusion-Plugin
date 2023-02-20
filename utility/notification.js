const dialog_box = require('../dialog_box')
const psapi = require('../psapi')
const { createBackgroundLayer } = require('./layer')
class Notification {
    static {}
    static async webuiIsOffline() {
        const r1 = await dialog_box.prompt(
            "Automatic1111 is Offline, make sure it's running in the background",
            '',
            ['Cancel', 'How To', 'OK']
        )

        try {
            if (r1 === 'Cancel') {
                /* cancelled or No */
                console.log('cancel')
            } else if (r1 === 'OK') {
                console.log('ok')
            } else if (r1 === 'How To') {
                console.log('How to')
            }
        } catch (e) {
            console.warn(e)
        }
    }
    static async webuiAPIMissing() {
        const r1 = await dialog_box.prompt(
            "Automatic1111 is running, but you've forgotten to add --api flag, so the plugin can communicate with it",
            '',
            ['Cancel', 'How To', 'OK']
        )

        try {
            if (r1 === 'Cancel') {
                /* cancelled or No */
                console.log('cancel')
            } else if (r1 === 'OK') {
                console.log('ok')
            } else if (r1 === 'How To') {
                console.log('How to')
            }
        } catch (e) {
            console.warn(e)
        }
    }
    static async backgroundLayerIsMissing() {
        const r1 = await dialog_box.prompt(
            'You need a white background layer present in your document',
            '',
            ['Cancel', 'Create']
        )

        try {
            if (r1 === 'Cancel') {
                /* cancelled or No */
                console.log('cancel')
                return false
            } else if (r1 === 'Create') {
                //store the selection area and then unselected
                const selectionInfo = await psapi.getSelectionInfoExe()
                await psapi.unSelectMarqueeExe()
                const active_layers = app.activeDocument.activeLayers

                //create a background layer with no selection active
                await createBackgroundLayer()
                console.log('create background layer')
                //reselect the selection area if it exist

                await psapi.reSelectMarqueeExe(selectionInfo)
                await psapi.selectLayersExe(active_layers)
                return true
            }
        } catch (e) {
            console.warn(e)
        }
        return false
    }
}

module.exports = {
    Notification,
}
