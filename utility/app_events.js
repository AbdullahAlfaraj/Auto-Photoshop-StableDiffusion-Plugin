function createEvent(eventName) {
    return {
        handlers: [],
        subscribe(fn) {
            this.handlers.push(fn)
        },
        unsubscribe(fn) {
            this.handlers = this.handlers.filter((handler) => handler !== fn)
        },
        async raise(data) {
            await Promise.all(
                this.handlers.map(async (handler) => {
                    await handler(data)
                })
            )
        },
        get name() {
            return eventName
        },
    }
}

const endSessionEvent = createEvent('endSession')
const acceptAllEvent = createEvent('acceptAll')
const discardAllEvent = createEvent('discardAll')
const discardSelectedEvent = createEvent('discardAll')
const discardEvent = createEvent('discardAll')
const selectionModeChangedEvent = createEvent('selectionModeChanged')
const generateMoreEvent = createEvent('generateMore')
const resolutionSizeChangedEvent = createEvent('resolutionSizeChanged')

module.exports = {
    endSessionEvent,
    acceptAllEvent,
    discardAllEvent,
    discardSelectedEvent,
    discardEvent,
    selectionModeChangedEvent,
    generateMoreEvent,
    resolutionSizeChangedEvent,
}
