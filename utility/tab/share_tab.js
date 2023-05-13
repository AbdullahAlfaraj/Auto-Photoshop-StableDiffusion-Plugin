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
