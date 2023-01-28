const sdapi = require('../../sdapi')

class SdConfig {
   constructor () {
    
    this.config //store sd options
   
  }
  
  async getConfig () {
    try {
    
      this.config = await sdapi.requestGetConfig()
      return this.config
    } catch (e) {
      console.warn(e)
    }
  }
  getUpscalerModels(){
    try{

        // const upscaler_comp = this.config.components.filter(comp =>comp.props.elem_id === "txt2img_hr_upscaler")[0]
        let upscaler_comp
        console.log("this.config: ",this.config)
        for(let comp of this.config.components){
            if(comp?.props?.elem_id){
                const elem_id = comp?.props?.elem_id
                if (elem_id ===  "txt2img_hr_upscaler"){
                    
                    console.log("elem_id: ",elem_id)
                    upscaler_comp = comp
                    break;
                }
            }
        }
        console.log("upscaler_comp: ",upscaler_comp)
        const upscalers = upscaler_comp.props.choices
        
        
        
        return upscalers
    }catch(e){
        console.warn(e)
    }
  }
  
}

module.exports = {
  SdConfig
}
