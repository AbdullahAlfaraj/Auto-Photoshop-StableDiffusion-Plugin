// output image class: one image to one layer
// 	* path:
// 	* image layer
// 	* viewer()
// 	* select()

// * init image class: has three layers
// 	* path :
// 	* init image group layer
// 	* init image layer
// 	* background layer

// * mask class:
// 	* path
// 	* mask group
// 	* white mask
// 	* balck layer
// 	* select()
// 	* viewe()
const general = require('./utility/general')
const Enum = require('./enum')
const psapi = require('./psapi')
const layer_util = require('./utility/layer')
const session = require('./utility/session')
const thumbnail = require('./thumbnail')
const html_manip = require('./utility/html_manip')
const file_util = require('./utility/file_util')
const app_events = require('./utility/app_events')
const ViewerObjState = {
    Delete: 'delete',
    Unlink: 'unlink',
}
const { executeAsModal } = require('photoshop').core

class ViewerImage {
    constructor() {
        this.img_html = null //
        this.thumbnail_container = null
        this.is_highlighted = false
        this.can_highlight = true
        this.is_active = false // active is a temporary highlight , the yellow/orang highlight
        this.state = ViewerObjState['Unlink']

        // true will delete the layers from the layer stacks when the session ends,
        // false mean use this.state to determine whither you delete the layer or not
        this.autoDelete = false
        this.viewerManager = null // store link to the viewer manager of this document
        this.viewerObjectType
        this.objectId
    }
    info() {
        console.log('state: ', this.state)
    }
    visible(visibleOn) {}
    select() {}
    isActive() {
        return this.is_active
    }
    active(isActive) {
        if (isActive) {
            //unlink it if it's active
            // this.state = ViewerObjState['Unlink']

            this.img_html.classList.add('viewerImgActive')
        } else {
            if (this.getHighlight() === false) {
                // if it's not active and it's not highlighted
                // this.state = ViewerObjState['Delete']
            } else {
                // this.state = ViewerObjState['Unlink'] //it's not active but it's highlighted then keep it
            }
            this.img_html.classList.remove('viewerImgActive')
        }
        this.is_active = isActive
    }
    setAutoDelete(auto_delete) {
        this.autoDelete = auto_delete
    }

    isSameLayer(layer_id) {}
    setHighlight(is_highlighted) {
        if (this.can_highlight) {
            this.is_highlighted = is_highlighted
            if (this.is_highlighted) {
                // this.state = ViewerObjState['Unlink']
                this.img_html.classList.add('viewerImgSelected')
            } else {
                this.img_html.classList.remove('viewerImgSelected')
                // this.state = ViewerObjState["Delete"]
            }
        }
    }
    getHighlight() {
        return this.is_highlighted
    }
    toggleHighlight() {
        const toggle_value = !this.getHighlight()
        this.setHighlight(toggle_value)
        // this.is_highlighted = !this.is_highlighted
        // this.img_html.classList.toggle("viewerImgSelected")
    }
    setImgHtml() {}

    async delete() {
        try {
            if (this.img_html) {
                this.img_html.remove() //delete the img html element
            }
            if (this.thumbnail_container) {
                this.thumbnail_container.remove()
            }

            //1) it's output layer // can_highlight && this.getHighlight()
            //2) it init or mask relate layers // this.autoDelete
            //3) it output layer that been used as init layer // !can_highlight && !this.autoDelete

            // do 1) and 2) here . test for 3) in InitImage

            //1)
            if (this.can_highlight && (this.getHighlight() || this.is_active)) {
                //keep if can be highlighted and either is highlighted or active
                this.state = ViewerObjState['Unlink']
            } else {
                //
                this.state = ViewerObjState['Delete']
            }

            if (this.autoDelete) {
                //remove if it's first automated layer
                this.state = ViewerObjState['Delete']
            }

            // else {
            //   //discard only if it's
            //   if (this.autoDelete){
            //     this.state = ViewerObjState['Delete']
            //   }
            // }
        } catch (e) {
            console.warn(e)
        }
    }

    unlink() {
        //keep the layer but unlink it from the ui
        try {
            this.img_html.remove() //delete the img html element
        } catch (e) {
            console.warn(e)
        }
    }

    createThumbnailNew(img, _) {
        this.img_html = img
        this.thumbnail_container = thumbnail.Thumbnail.wrapImgInContainer(
            img,
            'viewer-image-container'
        )
        thumbnail.Thumbnail.addSPButtonToContainer(
            this.thumbnail_container,
            'svg_sp_btn',
            'Use this as an initial image',

            this.useOutputImageAsInitImage,
            img
        )
    }
    useOutputImageAsInitImage = async () => {
        //set init image event listener, use when settion is active
        // const layer = await app.activeDocument.activeLayers[0]
        try {
            // console.log('this.img_html:', this.img_html)
            // await executeAsModal(() => {
            //     this.visible(true)
            // })
            // await this.select(true) //select() does take arguments
            // this.active(true)
            await executeAsModal(async () => {
                //FIXME unresolved function
                await this.click(Enum.clickTypeEnum['Click'])
            })

            const layer = layer_util.Layer.doesLayerExist(this.layer)
                ? this.layer
                : await app.activeDocument.activeLayers[0]

            // const layer = this.layer
            const image_info =
                await session.GenerationSession.instance().silentSetInitImage(
                    layer,
                    session.GenerationSession.instance().random_session_id
                )
            const image_name = image_info['name']
            const path = `./server/python_server/init_images/${image_name}`
            ViewerManager.instance().addInitImageLayers(layer, path, false)
            await ViewerManager.instance().loadInitImageViewerObject(path)
        } catch (e) {
            console.warn(e)
        }
    }
    createThumbnail(img, b_button_visible = true) {
        this.img_html = img
        // Create new container element
        this.thumbnail_container = document.createElement('div')

        this.thumbnail_container.className = 'viewer-image-container'

        const elem = document.getElementById('svg_sp_btn')

        // Create a copy of it
        const clone = elem.cloneNode(true)
        const button = clone
        button.style.display = null
        button.setAttribute(
            'title',
            'use this image to generate more variance like it'
        )

        // Create button element
        // const button = document.createElement('sp-button');
        button.className = 'viewer-image-button'
        // button.innerHTML = "Button";
        if (!b_button_visible) {
            button.style.display = 'none'
        }
        button.addEventListener('click', async () => {
            //FIXME unresolved function
            await useOutputImageAsInitImage()
        })

        // Append elements to container
        this.thumbnail_container.appendChild(this.img_html)
        this.thumbnail_container.appendChild(button)

        // this.img_html = container
    }
}

class OutputImage extends ViewerImage {
    constructor(layer, path, viewer_manager) {
        super()
        this.layer = layer
        this.path = path
        this.img_html = null
        this.viewerManager = viewer_manager
        this.viewerObjectType = Enum.ViewerObjectTypeEnum['OutputImage']
        this.objectId = path // the path is unique, so we will use it as an id
    }
    async click(click_type) {
        console.log('click_type: ', click_type)
        // if (this.isActive() && click_type === Enum.clickTypeEnum['Click']) {
        //     //convert consecutive clicks to AltClick
        //     click_type = Enum.clickTypeEnum['SecondClick']
        //     console.log('converted click_type: ', click_type)
        // }

        if (click_type === Enum.clickTypeEnum['Click']) {
            //select layer
            //turn the layer visible
            //set the layer to active
            this.visible(true)
            await this.select(true) //select() does take arguments
            this.active(true)
        } else if (click_type === Enum.clickTypeEnum['ShiftClick']) {
            this.visible(true)
            await this.select(true) //select() does take arguments
            this.setHighlight(true)
            this.active(true)
            // if (this.viewerManager.last_selected_viewer_obj) {
            //     //if the last selected layer is valid then converted last selected layer into highlight layer
            //     this.viewerManager.last_selected_viewer_obj.setHighlight(true)
            // }
        } else if (click_type === Enum.clickTypeEnum['AltClick']) {
            // this.viewerManager.last_selected_viewer_obj = null
            this.setHighlight(false)
            this.visible(false)
            this.active(false)

            await psapi.unselectActiveLayersExe() //Note:can we move to ViewerManager.click()
        } else if (click_type === Enum.clickTypeEnum['SecondClick']) {
            //select layer
            //turn the layer visible
            //set the layer to active
            this.visible(false)
            await this.select(false) //select() does take arguments
            this.active(false)
        }
        this.viewerManager.replaceLastSelection(click_type, this) //pass the click_type and this object
    }
    visible(visibleOn) {
        //turn the visibility for the layer
        try {
            super.visible(visibleOn)
            if (layer_util.Layer.doesLayerExist(this.layer)) {
                this.layer.visible = visibleOn
            }
        } catch (e) {
            console.warn(e)
        }
    }
    async select() {
        //select the layer
        super.select()
        if (layer_util.Layer.doesLayerExist(this.layer)) {
            await psapi.selectLayersExe([this.layer])
            //   console.log(`${this.layer.id} got selected`);
        }
    }

    isSameLayer(layer_id) {
        super.isSameLayer(layer_id)
        const is_same = this.layer.id == layer_id
        return is_same
    }
    isSameObject(object) {
        if (
            layer_util.Layer.doesLayerExist(this.layer) &&
            layer_util.Layer.doesLayerExist(object.layer)
        ) {
            return this.layer.id === object.layer.id
        }
        return false
    }

    setImgHtml(img_html) {
        super.setImgHtml()
        this.img_html = img_html
    }
    async delete() {
        try {
            await super.delete()
            // this.img_html.remove()//delete the img html element
            if (this.state === ViewerObjState['Delete']) {
                await layer_util.cleanLayers([this.layer])
            }
        } catch (e) {
            console.warn(e)
        }
    }
    info() {
        super.info()
    }
    // unlink(){
    //   //keep the layer but unlink it from the ui
    //   try{

    //     super.unlink()
    //     this.img_html.remove()//delete the img html element

    //   }catch(e){
    //     console.warn(e)
    //   }
    // }
}

class InitImage extends ViewerImage {
    constructor(init_group, init_snapshot, solid_layer, path, viewer_manager) {
        super()
        this.init_group = init_group
        this.init_snapshot = init_snapshot
        this.solid_layer = solid_layer

        this.path = path
        this.can_highlight = false
        this.viewerManager = viewer_manager
        this.viewerObjectType = Enum.ViewerObjectTypeEnum['InitImage']
        this.objectId = path // the path is unique, so we will use it as an id
        // if (this.autoDelete === false){
        //   this.state = ViewerObjState['Unlink']
        // }
    }
    async click(click_type) {
        if (click_type === Enum.clickTypeEnum['Click']) {
            //select layer
            //turn the layer visible
            //set the layer to active
            this.visible(true)
            await this.select(true) //select() does take arguments
            this.active(true)
            click_type = Enum.clickTypeEnum['Click'] // convert all click to Click
            this.viewerManager.replaceLastSelection(click_type, this) //pass the click_type and this object
        } else if (click_type === Enum.clickTypeEnum['ShiftClick']) {
            this.visible(true)
            await this.select(true) //select() does take arguments
            this.active(true)
            // if (this.viewerManager.last_selected_viewer_obj) {
            //     //if the last selected layer is valid then converted last selected layer into highlight layer
            //     this.viewerManager.last_selected_viewer_obj.setHighlight(true)
            // }
            click_type = Enum.clickTypeEnum['Click'] // convert all click to Click
            this.viewerManager.replaceLastSelection(click_type, this) //pass the click_type and this object
        }
        // else if (click_type === Enum.clickTypeEnum['AltClick']) {
        //     // this.viewerManager.last_selected_viewer_obj = null
        //     this.setHighlight(false)
        //     this.visible(false)
        //     this.active(false)

        //     await psapi.unselectActiveLayersExe() //Note:can we move to ViewerManager.click()
        // }
        // this.viewerManager.replaceLastSelection(click_type, this) //pass the click_type and this object
    }
    visible(visibleOn) {
        try {
            super.visible(visibleOn)

            let visibleValues = []
            if (visibleOn) {
                visibleValues = [true, true, true]
            } else {
                visibleValues = [false, false, false]
            }

            if (layer_util.Layer.doesLayerExist(this.init_group)) {
                this.init_group.visible = visibleValues[0]
            }
            if (layer_util.Layer.doesLayerExist(this.init_snapshot)) {
                this.init_snapshot.visible = visibleValues[1]
            }

            if (layer_util.Layer.doesLayerExist(this.solid_layer)) {
                this.solid_layer.visible = visibleValues[2]
            }

            if (!this.autoDelete) {
                //means it's not the first init image

                if (layer_util.Layer.doesLayerExist(this.solid_layer)) {
                    this.solid_layer.visible = false //turn it off sense the init group is above the output group, and the white solid will hide the init image reference located in the output group
                }
            }
        } catch (e) {
            console.warn(e)
        }
    }

    async select() {
        super.select()

        const selectLayers = []
        if (layer_util.Layer.doesLayerExist(this.init_group)) {
            selectLayers.push(this.init_group)
        }

        await psapi.selectLayersExe(selectLayers)
        //   console.log(`${this.layer.id} got selected`);
    }

    isSameLayer(layer_id) {
        super.isSameLayer(layer_id)
        let is_same = false
        if (layer_util.Layer.doesLayerExist(this.init_group)) {
            is_same = this.init_group.id == layer_id
        }
        return is_same
    }
    setImgHtml(img_html) {
        super.setImgHtml()
        this.img_html = img_html
    }
    async delete() {
        try {
            await super.delete()

            // this.img_html.remove()//delete the img html element

            if (!this.autoDelete && !this.can_highlight) {
                //don't delete since it's output layer that is been used as init image
                this.state = ViewerObjState['Unlink']
            }

            if (this.state === ViewerObjState['Delete']) {
                await layer_util.cleanLayers([
                    this.init_group,
                    this.init_snapshot,
                    this.solid_layer,
                ])
            }
        } catch (e) {
            console.warn(e)
        }
    }
}

class InitMaskImage extends ViewerImage {
    constructor(mask_group, white_mark, solid_black, path, viewer_manager) {
        super()
        this.mask_group = mask_group
        this.white_mark = white_mark
        this.solid_black = solid_black

        this.path = path
        this.can_highlight = false
        this.viewerManager = viewer_manager
        this.viewerObjectType = Enum.ViewerObjectTypeEnum['MaskImage']
        this.objectId = path // the path is unique, so we will use it as an id
    }
    async click(click_type) {
        if (click_type === Enum.clickTypeEnum['Click']) {
            //select layer
            //turn the layer visible
            //set the layer to active
            this.visible(true)
            await this.select(true) //select() does take arguments
            this.active(true)
            click_type = Enum.clickTypeEnum['Click'] // convert all click to Click
            this.viewerManager.replaceLastSelection(click_type, this) //pass the click_type and this object
        } else if (click_type === Enum.clickTypeEnum['ShiftClick']) {
            this.visible(true)
            await this.select(true) //select() does take arguments
            this.active(true)
            // if (this.viewerManager.last_selected_viewer_obj) {
            //     //if the last selected layer is valid then converted last selected layer into highlight layer
            //     this.viewerManager.last_selected_viewer_obj.setHighlight(true)
            // }
            click_type = Enum.clickTypeEnum['Click'] // convert all click to Click
            this.viewerManager.replaceLastSelection(click_type, this) //pass the click_type and this object
        }
    }
    visible(visibleOn) {
        try {
            super.visible(visibleOn)

            let visibleValues = []
            if (visibleOn) {
                visibleValues = [true, true, false]
            } else {
                visibleValues = [false, false, false]
            }

            if (layer_util.Layer.doesLayerExist(this.mask_group)) {
                this.mask_group.visible = visibleValues[0]
            }
            if (layer_util.Layer.doesLayerExist(this.white_mark)) {
                this.white_mark.visible = visibleValues[1]
            }
            if (layer_util.Layer.doesLayerExist(this.solid_black)) {
                this.solid_black.visible = visibleValues[2]
            }
        } catch (e) {
            console.warn(e)
        }
    }

    async select() {
        super.select()

        const selectLayers = []

        if (layer_util.Layer.doesLayerExist(this.white_mark)) {
            selectLayers.push(this.white_mark)
        }

        await psapi.selectLayersExe(selectLayers)
        //   console.log(`${this.layer.id} got selected`);
    }

    isSameLayer(layer_id) {
        super.isSameLayer(layer_id)
        let is_same = false
        if (layer_util.Layer.doesLayerExist(this.mask_group)) {
            is_same = this.mask_group.id == layer_id
        }
        return is_same
    }
    setImgHtml(img_html) {
        super.setImgHtml()
        this.img_html = img_html
    }
    async delete() {
        try {
            await super.delete()
            // this.img_html.remove()//delete the img html element
            if (this.state === ViewerObjState['Delete']) {
                await layer_util.cleanLayers([
                    this.mask_group,
                    this.white_mark,
                    this.solid_black,
                ])
            }
        } catch (e) {
            console.warn(e)
        }
    }
    createThumbnailNew(img, _) {
        this.img_html = img
        this.thumbnail_container = thumbnail.Thumbnail.wrapImgInContainer(
            img,
            'viewer-image-container'
        )
        thumbnail.Thumbnail.addSPButtonToContainer(
            this.thumbnail_container,
            'svg_sp_btn',
            'update the mask',
            ViewerManager.instance().setMaskViewer,
            img
        )
    }
}

class initImageLayers {
    //store info about the init image related layers
    constructor(group, snapshot, solid_background, autoDelete) {
        this.group = group
        this.snapshot = snapshot
        this.solid_background = solid_background
        this.autoDelete = autoDelete
    }
}
class maskLayers {
    //store info about the init image related layers
    constructor(group, white_mark, solid_background, autoDelete) {
        this.group = group
        this.white_mark = white_mark
        this.solid_background = solid_background
        this.autoDelete = autoDelete
    }
}
class ViewerManager {
    static #instance = null

    static instance() {
        if (!ViewerManager.#instance) {
            ViewerManager.#instance = new ViewerManager()
        }
        return ViewerManager.#instance
    }
    //viewer manager will reset after the end of the session
    //it will store
    constructor() {
        if (!ViewerManager.#instance) {
            ViewerManager.#instance = this
        }
        this.outputImages = []
        this.initImages = []
        this.initMaskImage
        this.pathToViewerImage = {} // quick way to check if an link image path on disk to ViewerImage object.
        this.initImageLayersJson = {} //{path: initImageLayers}

        this.selectedOutputImages = {} //store the selected output images {path: outputImage}

        this.mask_layer
        this.maskLayersJson = {} //{path: MaskLayers}

        //Note:move initGroup, to GenerationSession
        this.initGroup
        this.init_solid_background
        this.maskGroup
        this.mask_solid_background

        //last_selected_obj
        this.last_selected_viewer_obj
        this.thumbnail_scaler = 1
        this.isSquareThumbnail = false
        this.init_image_container = document.getElementById(
            'divInitImageViewerContainer'
        )
        app_events.endSessionEvent.subscribe(this.onSessionEnd.bind(this))
        app_events.acceptAllEvent.subscribe(this.acceptAll.bind(this))
        app_events.discardAllEvent.subscribe(this.discardAll.bind(this))
        app_events.discardSelectedEvent.subscribe(
            this.discardSelected.bind(this)
        )
        app_events.discardEvent.subscribe(this.discard.bind(this))
        return ViewerManager.#instance
    }

    replaceLastSelection(click_type, clicked_object) {
        if (
            this.last_selected_viewer_obj && // is valid last selected object
            this.last_selected_viewer_obj.objectId !== clicked_object.objectId // not the same object

            // clicked_object instanceof OutputImage &&
            // !clicked_object.isSameObject(this.last_selected_viewer_obj)
        ) {
            //if the current selection and the last selection are different

            this.last_selected_viewer_obj.visible(false)
            this.last_selected_viewer_obj.active(false)
        }
        if (click_type === Enum.clickTypeEnum['Click']) {
            this.last_selected_viewer_obj = clicked_object
        } else if (click_type === Enum.clickTypeEnum['ShiftClick']) {
            if (this.last_selected_viewer_obj) {
                //if the last selected layer is valid then converted last selected layer into highlight layer
                this.last_selected_viewer_obj.setHighlight(true)
            }
            this.last_selected_viewer_obj = clicked_object
        } else if (click_type === Enum.clickTypeEnum['AltClick']) {
            this.last_selected_viewer_obj = null
        } else if (click_type === Enum.clickTypeEnum['SecondClick']) {
            this.last_selected_viewer_obj = null
        }
    }
    initializeInitImage(group, snapshot, solid_background, path) {
        console.warn('this method is deprecated, use the session.js method ')
        this.initGroup = group
        this.init_solid_background = solid_background
        this.addInitImageLayers(snapshot, path, true)
    }
    initializeMask(group, white_mark, solid_background, path, base64) {
        this.maskGroup = group
        this.mask_solid_background = solid_background
        this.addMaskLayers(white_mark, path, true, base64)
    }
    addMaskLayers(white_mark, path, auto_delete, base64) {
        try {
            if (!this.maskLayersJson.hasOwnProperty(path)) {
                //it's a new mask, mostly for the first time storing the mask

                const mask_layers = new maskLayers(
                    this.maskGroup,
                    white_mark,
                    this.mask_solid_background,
                    auto_delete
                )
                this.maskLayersJson[path] = mask_layers
            } else {
                //for updating the mask

                //just update the html
                const new_path = `${path}?t=${new Date().getTime()}`
                console.log('new mask path: ', new_path)
                // this.maskLayersJson[path].img_html.src = new_path

                // this.pathToViewerImage[path].img_html.src = new_path
                this.pathToViewerImage[path].img_html.src =
                    file_util.base64ToSrc(base64)
            }
        } catch (e) {
            console.warn(e)
        }
    }
    updateMaskLayer() {}
    addInitImageLayers(snapshot, path, auto_delete) {
        try {
            if (!this.initImageLayersJson.hasOwnProperty(path)) {
                //if this is a new init image
                //store it all of layers in a container object
                const init_image_layers = new initImageLayers(
                    this.initGroup,
                    snapshot,
                    this.init_solid_background,
                    auto_delete
                )
                this.initImageLayersJson[path] = init_image_layers
            }
        } catch (e) {
            console.warn(e)
        }
    }

    hasViewerImage(path) {
        if (this.pathToViewerImage.hasOwnProperty(path)) {
            return true
        }
        return false
    }
    addOutputImage(layer, path) {
        console.log('addOutputImage' + path)
        const outputImage = new OutputImage(layer, path, this)

        this.outputImages.push(outputImage)
        this.pathToViewerImage[path] = outputImage //
        return outputImage
    }
    addInitImage(group, snapshot, solid_background, path, auto_delete) {
        console.log('addInitImage' + path)
        const initImage = new InitImage(
            group,
            snapshot,
            solid_background,
            path,
            this
        )
        initImage.setAutoDelete(auto_delete)
        this.initImages.push(initImage)
        this.pathToViewerImage[path] = initImage
        return initImage
    }
    addMask(group, white_mark, solid_background, path) {
        console.log('add mask' + path)
        const mask = new InitMaskImage(
            group,
            white_mark,
            solid_background,
            path,
            this
        )

        this.initMaskImage = mask
        this.pathToViewerImage[path] = mask
        return mask
    }

    scaleThumbnails(
        original_width,
        original_height,
        min_width,
        min_height,
        scaler
    ) {
        //calculate the new width and height

        const image_width = this.isSquareThumbnail
            ? 100
            : session.GenerationSession.instance().last_settings.width
        const image_height = this.isSquareThumbnail
            ? 100
            : session.GenerationSession.instance().last_settings.height

        const [new_width, new_height] = general.scaleToClosestKeepRatio(
            image_width,
            image_height,
            100,
            100
        )
        const [scaled_width, scaled_height] = [
            new_width * scaler,
            new_height * scaler,
        ]

        for (let outputImage of this.outputImages) {
            //get the image and it's container
            const img = outputImage.img_html
            const img_container = img.parentElement

            if (img_container === null) {
                console.warn(
                    'ViewerManager scaleThumbnails - img has no parentElement',
                    img
                )
                continue
            }

            img_container.style.width = scaled_width
            img_container.style.height = scaled_height
            img.style.width = scaled_width
            img.style.height = scaled_height
            //scale them to the new dimensions
        }
    }
    onSessionEnd() {
        console.log('ViewerManager onSessionEnd')
        this.outputImages = []
        this.initImages = []
        this.initMaskImage = null

        this.pathToViewerImage = {} // quick way to check if an link image path on disk to ViewerImage object.
        this.initImageLayersJson = {} //{path: initImageLayers}

        this.selectedOutputImages = {} //store the selected output images {path: outputImage}

        this.mask_layer = null
        this.maskLayersJson = {} //{path: MaskLayers}

        //Note:move initGroup, to GenerationSession
        this.initGroup = null
        this.init_solid_background = null
        this.maskGroup = null
        this.mask_solid_background = null

        //last_selected_obj
        this.last_selected_viewer_obj = null
        // this.thumbnail_scaler = 1
        // this.isSquareThumbnail = false
    }

    async loadInitImageViewerObject(path) {
        if (!ViewerManager.instance().hasViewerImage(path)) {
            const group = this.initImageLayersJson[path].group
            const snapshot = this.initImageLayersJson[path].snapshot
            const solid_background =
                this.initImageLayersJson[path].solid_background
            const auto_delete = this.initImageLayersJson[path].autoDelete
            const base64_image =
                session.GenerationSession.instance().base64initImages[path]
            //FIXME: unresolved function
            await loadInitImageViewerObject(
                group,
                snapshot,
                solid_background,
                path,
                auto_delete,
                base64_image
            )
        }
    }

    async setMaskViewer() {
        try {
            await executeAsModal(async () => {
                if (this.mask_solid_background) {
                    this.mask_solid_background.visible = true
                }
            })
            const layer = this.maskGroup
            // const layer = await app.activeDocument.activeLayers[0]
            const mask_info =
                await session.GenerationSession.instance().silentSetInitImageMask(
                    layer,
                    this.random_session_id
                )
            const image_name = mask_info['name']
            const path = `./server/python_server/init_images/${image_name}`
            this.addMaskLayers(layer, path, false, mask_info['base64']) //can be autodeleted?
            await psapi.unselectActiveLayersExe()
        } catch (e) {
            console.warn(e)
        }
    }
    async acceptAll() {
        //accept all generated images by highlighting them
        //then call discard() to garbage collect the mask related layers
        try {
            for (const [path, viewer_image_obj] of Object.entries(
                ViewerManager.instance().pathToViewerImage
            )) {
                try {
                    if (
                        viewer_image_obj.isActive() &&
                        viewer_image_obj instanceof viewer.OutputImage
                    ) {
                        //check if the active viewer_image_obj is a type of OutputImage and move it to the top of the output group folder
                        //this is so when we accept all layers the canvas will look the same. otherwise the image could be cover by another generated image
                        if (
                            layer_util.Layer.doesLayerExist(
                                viewer_image_obj.layer
                            )
                        ) {
                            await session.GenerationSession.instance().moveToTopOfOutputGroup(
                                viewer_image_obj.layer
                            )
                        }
                    }
                    viewer_image_obj.setHighlight(true) // mark each layer as accepted
                } catch (e) {
                    console.error(e)
                }
            }
            await ViewerManager.instance().discard() // clean viewer tab
        } catch (e) {
            console.warn(e)
        }
    }
    async discardAll() {
        //discard all generated images setting highlight to false
        //then call discard() to garbage collect the mask related layers
        try {
            for (const [path, viewer_image_obj] of Object.entries(
                ViewerManager.instance().pathToViewerImage
            )) {
                try {
                    viewer_image_obj.active(false) //deactivate the layer
                    viewer_image_obj.setHighlight(false) // mark each layer as discarded
                } catch (e) {
                    console.error(e)
                }
            }
            await ViewerManager.instance().discard() // clean viewer tab
        } catch (e) {
            console.warn(e)
        }
    }
    async discardSelected() {
        //discard all generated images setting highlight to false
        //then call discard() to garbage collect the mask related layers
        try {
            for (const [path, viewer_image_obj] of Object.entries(
                ViewerManager.instance().pathToViewerImage
            )) {
                try {
                    if (viewer_image_obj.is_active) {
                        viewer_image_obj.active(false) //convert active to highlight
                        viewer_image_obj.setHighlight(true) //highlight the active image, since active images are not highlighted in the viewer
                    }

                    viewer_image_obj.toggleHighlight() // if invert the highlights on all images
                } catch (e) {
                    console.error(e)
                }
            }
            await ViewerManager.instance().discard() // delete the images that currently highlighted
        } catch (e) {
            console.warn(e)
        }
    }

    async discard() {
        try {
            const random_img_src = 'https://source.unsplash.com/random'
            html_manip.setInitImageSrc(random_img_src)
            html_manip.setInitImageMaskSrc(random_img_src)
            // psapi.cleanLayers(last_gen_layers)
            await ViewerManager.instance().deleteNoneSelected(
                ViewerManager.instance().pathToViewerImage
            )
        } catch (e) {
            console.warn(e)
        }
    }

    async deleteNoneSelected(viewer_objects) {
        try {
            // visible layer
            //delete all hidden layers

            await executeAsModal(async () => {
                for (const [path, viewer_object] of Object.entries(
                    viewer_objects
                )) {
                    try {
                        viewer_object.visible(true) //make them visiable on the canvas

                        await viewer_object.delete() //delete the layer from layers stack

                        delete session.GenerationSession.instance()
                            .image_paths_to_layers[path]
                    } catch (e) {
                        console.warn(e)
                    }
                }

                //Refactor: move to viewerManager.onSessionEnd() - done
                // ViewerManager.instance().pathToViewerImage = {}
                // ViewerManager.instance().initImageLayersJson = {}
                // ViewerManager.instance().outputImages = []
                //

                session.GenerationSession.instance().image_paths_to_layers = {}
            })
        } catch (e) {
            console.warn(e)
        }
    }

    deleteAll() {}
    keepAll() {}
    keepSelected() {}
    deleteSelected() {}
    deleteInitImages() {}
    deleteMask() {}
}

module.exports = {
    OutputImage,
    InitImage,
    InitMaskImage,
    ViewerObjState,
    ViewerManager,
}
