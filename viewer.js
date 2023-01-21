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

const ViewerObjState = {
	Delete: "delete",
	Unlink: "unlink",

}

class ViewerImage {
  constructor () {
    this.img_html = null
    this.is_highlighted = false
    this.can_highlight = true
    this.is_active = false// active is a temporary highlight
    this.state = ViewerObjState['Unlink']
    
    // true will delete the layers from the layer stacks when the session ends,
    // false mean use this.state to determine whither you delete the layer or not
    this.autoDelete = false
  }
  info(){
    console.log("state: ",this.state)
  }
  visible (visibleOn) {}
  select () {
    
  }
  active(isActive){
    if(isActive){
      //unlink it if it's active 
      // this.state = ViewerObjState['Unlink']

      this.img_html.classList.add("viewerImgActive")

    }else{
      if(this.getHighlight() === false){// if it's not active and it's not highlighted
        
        // this.state = ViewerObjState['Delete']
      }else{
        
        // this.state = ViewerObjState['Unlink'] //it's not active but it's highlighted then keep it
      }
      this.img_html.classList.remove("viewerImgActive")
    }
    this.is_active = isActive
    
  }
  setAutoDelete(auto_delete){
    this.autoDelete = auto_delete
  }
  isLayerValid () {}
  isSameLayer (layer_id) {}
  setHighlight(is_highlighted){
    if(this.can_highlight){

      this.is_highlighted = is_highlighted
      if(this.is_highlighted)
      {
        // this.state = ViewerObjState['Unlink']
        this.img_html.classList.add("viewerImgSelected")
        
      }else{
        this.img_html.classList.remove("viewerImgSelected")
        // this.state = ViewerObjState["Delete"]
      }
    }
  }
  getHighlight(){
    return this.is_highlighted
  }
  toggleHighlight(){
    
    const toggle_value = !this.getHighlight()
    this.setHighlight(toggle_value)
    // this.is_highlighted = !this.is_highlighted  
    // this.img_html.classList.toggle("viewerImgSelected")
  }
  setImgHtml(){}
  
  async delete(){
    try{

      this.img_html.remove()//delete the img html element
    
    //1) it's output layer // can_highlight && this.getHighlight()
    //2) it init or mask relate layers // this.autoDelete 
    //3) it output layer that been used as init layer // !can_highlight && !this.autoDelete

    // do 1) and 2) here . test for 3) in InitImage 
    
    //1)
    if (this.can_highlight && (this.getHighlight() || this.is_active))
    {//keep if can be highlighted and either is highlighted or active
    this.state = ViewerObjState['Unlink']
    }else{//
    this.state = ViewerObjState['Delete']

    }
    

    if(this.autoDelete){//remove if it's first automated layer
        this.state = ViewerObjState['Delete']  
    }

  

    
    // else {
    //   //discard only if it's 
    //   if (this.autoDelete){
    //     this.state = ViewerObjState['Delete']
    //   }
    // }
  }catch(e){
    console.warn(e)
  }
  }

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
    try{

      super.visible(visibleOn)
      if (this.isLayerValid()) {
        this.layer.visible = visibleOn
      }
    }catch(e){
      console.warn(e)
    }
  }
  select () {
    super.select()
    if (this.isLayerValid()) {
      psapi.selectLayersExe([this.layer])
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

      await super.delete()
      // this.img_html.remove()//delete the img html element
      if(this.state === ViewerObjState['Delete']){
        await psapi.cleanLayers([this.layer])
      }
    }catch(e){
      console.warn(e)
    }


  }
  info(){
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
  constructor (init_group, init_snapshot, solid_layer, path) {
    super()
    this.init_group = init_group
    this.init_snapshot = init_snapshot
    this.solid_layer = solid_layer

    this.path = path
    this.can_highlight = false
    // if (this.autoDelete === false){
    //   this.state = ViewerObjState['Unlink']
    // }
  }
  visible (visibleOn) {
    try{

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
    }catch(e){
      console.warn(e)
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

    psapi.selectLayersExe(selectLayers)
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
  async delete(){
    try{

      await super.delete()

      // this.img_html.remove()//delete the img html element
      
      if (!this.autoDelete && !this.can_highlight)
      {//don't delete since it's output layer that is been used as init image
      this.state = ViewerObjState['Unlink']
      }

            if(this.state === ViewerObjState['Delete']){
       
              await psapi.cleanLayers([this.init_group,this.init_snapshot,this.solid_layer])
      }
      
    }
    catch(e){
      console.warn(e)
    }
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
      try{

        super.visible(visibleOn)
        //   const isValid = this.isLayerValid()
      let visibleValues = []
      if (visibleOn) {
        visibleValues = [true, true, false]
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
      }catch(e){
        console.warn(e)
      }
    }
  
    select () {
      super.select()
  
      const selectLayers = []
      // if (this.isLayerValid(this.mask_group)) {
        
      //   selectLayers.push(this.mask_group)
      // }
      if (this.isLayerValid(this.white_mark)) {
        
        selectLayers.push(this.white_mark)
      }
      // if (this.isLayerValid(this.solid_layer)) {
      //   selectLayers.push(this.solid_layer)
      // }
  
      psapi.selectLayersExe(selectLayers)
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
    async delete(){
      try{

        await super.delete()
        // this.img_html.remove()//delete the img html element
        if(this.state === ViewerObjState['Delete']){
          await psapi.cleanLayers([this.mask_group,this.white_mark, this.solid_black])
         
        }
      }catch(e){
        console.warn(e)
      }
  
    }
  }

  class initImageLayers{//store info about the init image related layers
    constructor(group,snapshot,solid_background,autoDelete){
      this.group = group
      this.snapshot = snapshot
      this.solid_background = solid_background
      this.autoDelete = autoDelete
    }
  }
  class maskLayers{//store info about the init image related layers
    constructor(group,white_mark,solid_background,autoDelete){
      this.group = group
      this.white_mark = white_mark
      this.solid_background = solid_background
      this.autoDelete = autoDelete
    }
  }
  class ViewerManager{
    //viewer manager will reset after the end of the session
    //it will store 
    constructor(){
      this.outputImages = []
      this.initImages = []
      this.initMaskImage
      this.pathToViewerImage = {}// quick way to check if an link image path on disk to ViewerImage object.
      this.initImageLayersJson ={}//{path: initImageLayers}
      
      this.mask_layer
      this.maskLayersJson ={}//{path: MaskLayers}

      //Note:move initGroup, to GenerationSession
      this.initGroup
      this.init_solid_background
      this.maskGroup
      this.mask_solid_background
    }
    initializeInitImage(group,snapshot,solid_background,path){
      this.initGroup = group
      this.init_solid_background = solid_background
      this.addInitImageLayers(snapshot,path,true)
    }
    initializeMask(group,white_mark,solid_background,path){
      this.maskGroup = group
      this.mask_solid_background = solid_background
      this.addMaskLayers(white_mark,path,true)
    }
    addMaskLayers(white_mark,path,auto_delete){
      if (!this.maskLayersJson.hasOwnProperty(path)){//it's a new mask, mostly for the first time storing the mask

        const mask_layers = new maskLayers(this.maskGroup,white_mark,this.mask_solid_background,auto_delete)
        this.maskLayersJson[path] = mask_layers
      }else{//for updating the mask
        
      }
    }
    updateMaskLayer(){

    }
    addInitImageLayers(snapshot,path,auto_delete){
      if (!this.initImageLayersJson.hasOwnProperty(path)){
        //if this is a new init image
        //store it all of layers in a container object
        const init_image_layers = new initImageLayers(this.initGroup,snapshot,this.init_solid_background,auto_delete)
        this.initImageLayersJson[path] = init_image_layers

      }

    }

    hasViewerImage(path){
      if (this.pathToViewerImage.hasOwnProperty(path)){
        return true
      }
      return false 
    }
    addOutputImage(layer,path){
      
      const outputImage =  new OutputImage(layer,path)
       
      this.outputImages.push(outputImage)
      this.pathToViewerImage[path] = outputImage// 
      return outputImage
    }
    addInitImage(group,snapshot,solid_background,path,auto_delete){
      const initImage =  new InitImage(group,snapshot,solid_background,path)
      initImage.setAutoDelete(auto_delete)
      this.initImages.push(initImage)
      this.pathToViewerImage[path] = initImage
      return initImage
    }
    addMask(group,white_mark,solid_background,path){
      const mask =  new InitMaskImage(group,white_mark,solid_background,path)
      
      this.initMaskImage = mask
      this.pathToViewerImage[path] = mask
      return mask
    }
    deleteAll(){

    }
    keepAll(){

    }
    keepSelected(){

    }
    deleteSelected(){

    }
    deleteInitImages(){

    }
    deleteMask(){

    }
  }

module.exports = {
  OutputImage,
  InitImage,
  InitMaskImage,
  ViewerObjState,
  ViewerManager
}
