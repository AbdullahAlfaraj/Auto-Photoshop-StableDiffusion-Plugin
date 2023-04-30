const chLiveProgressImageElements = document.getElementsByClassName(
    'chLiveProgressImageClass'
)

const default_preview_value = document.getElementById(
    'chLiveProgressImage'
).checked

chLiveProgressImageElements.forEach((element) => {
    element.checked = default_preview_value
    element.addEventListener('click', (event) => {
        value = element.checked
        chLiveProgressImageElements.forEach((element) => {
            element.checked = value
        })
    })
})

document
    .getElementById('slMultiControlNetSize')
    .addEventListener('change', async (event) => {
        await control_net.initializeControlNetTab(event.target.value)
    })
