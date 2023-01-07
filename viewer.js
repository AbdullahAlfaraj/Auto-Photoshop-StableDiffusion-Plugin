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
  constructor () {}
  visible (visibleOn) {}
  select () {}
  isLayerValid () {}
  isSameLayer (layer_id) {}
}

class OutputImage extends ViewerImage {
  constructor (layer, path) {
    super()
    this.layer = layer
    this.path = path
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
}

class InitImage extends ViewerImage {
  constructor (init_group, init_snapshot, solid_layer, path) {
    super()
    this.init_group = init_group
    this.init_snapshot = init_snapshot
    this.solid_layer = solid_layer

    this.path = path
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
}

class InitMaskImage extends ViewerImage {
    constructor (mask_group, white_mark, solid_black, path) {
      super()
      this.mask_group = mask_group 
      this.white_mark = white_mark
      this.solid_black = solid_black
  
      this.path = path
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
  }
  

module.exports = {
  OutputImage,
  InitImage,
  InitMaskImage,
}
