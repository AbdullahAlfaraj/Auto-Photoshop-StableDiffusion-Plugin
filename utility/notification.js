const dialog_box = require('../dialog_box')
const psapi = require('../psapi')
const { createBackgroundLayer } = require('./layer')
class Notification {
    static {}
    static async webuiIsOffline() {
        const r1 = await dialog_box.prompt(
            'Automatic1111 is Offline',
            "make sure Automatic1111 is running in the background, or select the 'native horde' option from the horde tab",
            ['Cancel', 'OK']
        )

        try {
            if (r1 === 'Cancel') {
                /* cancelled or No */
                console.log('cancel')
            } else if (r1 === 'OK') {
                console.log('ok')
            }
        } catch (e) {
            console.warn(e)
        }
    }
    static async webuiAPIMissing() {
        const r1 = await dialog_box.prompt(
            "The Plugin can't communicate with Automatic1111",
            'Automatic1111 is running, but you forgot to add --api flag to the webui command flags',
            ['Cancel', 'OK']
        )

        try {
            if (r1 === 'Cancel') {
                /* cancelled or No */
                console.log('cancel')
            } else if (r1 === 'OK') {
                console.log('ok')
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
    static async inactiveSelectionArea(is_active_session) {
        let buttons = ['Cancel', 'Rectangular Marquee']
        if (is_active_session) {
            buttons.push('Continue Session')
        }
        const r1 = await dialog_box.prompt(
            'Please Select a Rectangular Area',
            'You Forgot to select a Rectangular Area',
            buttons
        )
        if (r1 === 'Cancel') {
            /* cancelled or No */
            console.log('cancel')
            return false
        } else if (r1 === 'Rectangular Marquee') {
            console.log('Rectangular Marquee')
            psapi.selectMarqueeRectangularToolExe()
            return false // should this be false?! what does true and false means in this context?! Yes: it should be false since boolean value represent wither we have an active selection area or not
        } else if (r1 === 'Continue Session') {
            await activateSessionSelectionArea()
            return true
        }
        return false
    }
}

module.exports = {
    Notification,
}
