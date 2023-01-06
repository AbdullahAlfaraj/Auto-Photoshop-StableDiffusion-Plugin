
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

class ViewerImage{
    constructor(){

    }
    visible(visibleOn)
    {
    
    }
    select() {
     
    }
    isLayerValid(){
     
    }
    isSameLayer(layer_id){
     
    }
}

class OutputImage extends ViewerImage {
    constructor(layer, path) {
      super()
        this.layer = layer
        this.path = path;
        
      

    }
    visible(visibleOn)
    {
    super.visible(visibleOn)
    if(this.isLayerValid()){
        this.layer.visible = visibleOn
    }
    }
    select() {
        super.select()
      if(this.isLayerValid()){
        psapi.selectLayers([this.layer])
        //   console.log(`${this.layer.id} got selected`);
        }
    }
    isLayerValid(){
        super.isLayerValid()
        //check if layer is defined or not
        //true if the layer is defined
        //false otherwise 
        let isValid = false
        if (typeof this.layer !== "undefined")
        {
            isValid = true
        }
        return isValid
    }
    isSameLayer(layer_id){
        super.isSameLayer(layer_id)
        const is_same = this.layer.id == layer_id
        return is_same
    }
  }
  
  class InitImage extends OutputImage {
    constructor(name) {
      super(name); // call the super class constructor and pass in the name parameter
    }
  
    // speak() {
    //   console.log(`${this.name} barks.`);
    // }
  }
  

  module.exports = {
    OutputImage,
    InitImage
  }
  
