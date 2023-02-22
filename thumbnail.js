class Thumbnail {
    static wrapImgInContainer(img, container_style_class) {
        const container = document.createElement('div')
        container.className = container_style_class
        container.appendChild(img)
        return container
    }

    static addSPButtonToContainer(
        container,
        button_id,
        title,
        callbackFunction,
        param1
    ) {
        const elem = document.getElementById(button_id)
        const clone = elem.cloneNode(true)
        const button = clone
        button.style.display = null
        button.removeAttribute('id')
        button.setAttribute('title', title)

        // Create button element
        button.className = 'thumbnail-image-button'
        if (callbackFunction.constructor.name === 'AsyncFunction') {
            button.addEventListener(
                'click',
                async () => await callbackFunction(param1)
            )
        } else {
            button.addEventListener('click', () => callbackFunction(param1))
        }

        container.appendChild(button)
    }
}

module.exports = {
    Thumbnail,
}
