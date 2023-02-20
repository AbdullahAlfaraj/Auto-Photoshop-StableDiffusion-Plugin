const dialog_box = require('../dialog_box')
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
}

module.exports = {
    Notification,
}
