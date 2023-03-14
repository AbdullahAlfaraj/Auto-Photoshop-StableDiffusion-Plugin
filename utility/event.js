const updatePresetMenuEvent = new CustomEvent('updatePresetMenuEvent', {
    detail: {},
    bubbles: true,
    cancelable: true,
    composed: false,
})
function triggerEvent(query_selector, event) {
    document.querySelector(query_selector).dispatchEvent(event)
}
module.exports = {
    updatePresetMenuEvent,
    triggerEvent,
}
