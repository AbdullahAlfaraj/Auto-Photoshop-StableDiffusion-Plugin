// output image class: one image to one layer
// 	* path:
// 	* image layer
// 	* viewer()
// 	* select()
// 	* isLayerValid()
// * init image class: has three layers
// 	* path :
// 	* init image group layer
// 	* init image layer
// 	* background layer
// 	* isLayerValid()
// * mask class:
// 	* path
// 	* mask group
// 	* white mask
// 	* balck layer
// 	* select()
// 	* viewe()
// 	* isLayerValid()

const psapi = require('./psapi')

class ViewerImage {
  constructor () {
    this.img_html = null
    this.is_highlighted = false
    this.can_highlight = true
    this.is_active = false
  }
  visible (visibleOn) {}
  select () {
    
  }
  active(isActive){
    if(isActive){
      
      this.img_html.classList.add("viewerImgActive")

    }else{
      this.img_html.classList.remove("viewerImgActive")
    }
    this.is_active = isActive
    
  }
  isLayerValid () {}
  isSameLayer (layer_id) {}
  setHighlight(is_highlighted){
    if(this.can_highlight){

      this.is_highlighted = is_highlighted
      if(this.is_highlighted)
      {
        this.img_html.classList.add("viewerImgSelected")
        
      }else{
        this.img_html.classList.remove("viewerImgSelected")
      }
    }
  }
  getHighlight(){
    return this.is_highlighted
  }
  toggleHighlight(){
    this.is_highlighted = !this.is_highlighted  
    this.img_html.classList.toggle("viewerImgSelected")
  }
  setImgHtml(){}
  delete(){}
  unlink(){
    //keep the layer but unlink it from the ui
    try{

   
      this.img_html.remove()//delete the img html element
      
    }catch(e){
      console.warn(e)
    }
  }
}

class OutputImage extends ViewerImage {
  constructor (layer, path) {
    super()
    this.layer = layer
    this.path = path
    this.img_html = null;
  }
  visible (visibleOn) {
    super.visible(visibleOn)
    if (this.isLayerValid()) {
      this.layer.visible = visibleOn
    }
  }
  select () {
    super.select()
    if (this.isLayerValid()) {
      psapi.selectLayers([this.layer])
      //   console.log(`${this.layer.id} got selected`);
    }
  }
  isLayerValid () {
    super.isLayerValid()
    //check if layer is defined or not
    //true if the layer is defined
    //false otherwise
    let isValid = false
    if (typeof this.layer !== 'undefined') {
      isValid = true
    }
    return isValid
  }
  isSameLayer (layer_id) {
    super.isSameLayer(layer_id)
    const is_same = this.layer.id == layer_id
    return is_same
  }

  setImgHtml(img_html){
    super.setImgHtml()
    this.img_html = img_html
  }
  async delete(){
    try{

      super.delete()
      this.img_html.remove()//delete the img html element
      
      await psapi.cleanLayers([this.layer])
    }catch(e){
      console.warn(e)
    }

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
  constructor (init_group, init_snapshot, solid_layer, path) {
    super()
    this.init_group = init_group
    this.init_snapshot = init_snapshot
    this.solid_layer = solid_layer

    this.path = path
    this.can_highlight = false
  }
  visible (visibleOn) {
    super.visible(visibleOn)
    //   const isValid = this.isLayerValid()
    let visibleValues = []
    if (visibleOn) {
      visibleValues = [true, true, true]
    } else {
      visibleValues = [false, false, false]
    }

    if (this.isLayerValid(this.init_group)) {
      this.init_group.visible = visibleValues[0]
    }
    if (this.isLayerValid(this.init_snapshot)) {
      this.init_snapshot.visible = visibleValues[1]
    }
    if (this.isLayerValid(this.solid_layer)) {
      this.solid_layer.visible = visibleValues[2]
    }
  }

  select () {
    super.select()

    const selectLayers = []
    if (this.isLayerValid(this.init_group)) {
      
      selectLayers.push(this.init_group)
    }
    // if (this.isLayerValid(this.init_snapshot)) {
      
    //   selectLayers.push(this.init_snapshot)
    // }
    // if (this.isLayerValid(this.solid_layer)) {
    //   selectLayers.push(this.solid_layer)
    // }

    psapi.selectLayers(selectLayers)
    //   console.log(`${this.layer.id} got selected`);
  }

  isLayerValid (layer) {
    super.isLayerValid()
    //check if layer is defined or not
    //true if the layer is defined
    //false otherwise
    //   let isValid = [false,false,false]
    let isValid = false
    if (typeof layer !== 'undefined') {
      isValid = true
    }

    return isValid
  }
  isSameLayer (layer_id) {
    super.isSameLayer(layer_id)
    let is_same = false 
    if(this.isLayerValid(this.init_group)){
        is_same = this.init_group.id == layer_id

    }
    return is_same
  }
  setImgHtml(img_html){
    super.setImgHtml()
    this.img_html = img_html
  }
  delete(){
    super.delete()
    this.img_html.remove()//delete the img html element

    

    psapi.cleanLayers([this.init_group,this.init_snapshot,this.solid_layer])

  }
}

class InitMaskImage extends ViewerImage {
    constructor (mask_group, white_mark, solid_black, path) {
      super()
      this.mask_group = mask_group 
      this.white_mark = white_mark
      this.solid_black = solid_black
  
      this.path = path
      this.can_highlight = false
    }
    visible (visibleOn) {
      super.visible(visibleOn)
      //   const isValid = this.isLayerValid()
      let visibleValues = []
      if (visibleOn) {
        visibleValues = [true, true, true]
      } else {
        visibleValues = [false, false, false]
      }
  
      if (this.isLayerValid(this.mask_group)) {
        this.mask_group.visible = visibleValues[0]
      }
      if (this.isLayerValid(this.white_mark)) {
        this.white_mark.visible = visibleValues[1]
      }
      if (this.isLayerValid(this.solid_black)) {
        this.solid_black.visible = visibleValues[2]
      }
    }
  
    select () {
      super.select()
  
      const selectLayers = []
      if (this.isLayerValid(this.mask_group)) {
        
        selectLayers.push(this.mask_group)
      }
      // if (this.isLayerValid(this.init_snapshot)) {
        
      //   selectLayers.push(this.init_snapshot)
      // }
      // if (this.isLayerValid(this.solid_layer)) {
      //   selectLayers.push(this.solid_layer)
      // }
  
      psapi.selectLayers(selectLayers)
      //   console.log(`${this.layer.id} got selected`);
    }
  
    isLayerValid (layer) {
      super.isLayerValid()
      //check if layer is defined or not
      //true if the layer is defined
      //false otherwise
      //   let isValid = [false,false,false]
      let isValid = false
      if (typeof layer !== 'undefined') {
        isValid = true
      }
  
      return isValid
    }
    isSameLayer (layer_id) {
      super.isSameLayer(layer_id)
      let is_same = false 
      if(this.isLayerValid(this.mask_group)){
          is_same = this.mask_group.id == layer_id
  
      }
      return is_same
    }
    setImgHtml(img_html){
      super.setImgHtml()
      this.img_html = img_html
    }
    delete(){
      super.delete()
      this.img_html.remove()//delete the img html element
  
      psapi.cleanLayers([this.mask_group,this.white_mark, this.solid_black])
  
    }
  }
  

module.exports = {
  OutputImage,
  InitImage,
  InitMaskImage,
}
