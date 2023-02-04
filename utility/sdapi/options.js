class SdOptions {
    constructor() {
        // this.status = false // true if we have a valid copy of sd options, false otherwise
        this.options //store sd options
    }

    async getOptions() {
        try {
            // if (this.status) {
            //   return this.options
            // } else {
            //   this.options = await sdapi.requestGetOptions()
            //   if (this.options) {
            //     this.status = true
            //   }
            // }
            this.options = await sdapi.requestGetOptions()
            return this.options
        } catch (e) {
            console.warn(e)
        }
    }
    getCurrentModel() {
        const current_model = this.options?.sd_model_checkpoint
        return current_model
    }
    getInpaintingMaskWeight() {
        const inpainting_mask_weight = this.options?.inpainting_mask_weight
        return inpainting_mask_weight
    }
}
// const sd_options = new SdOptions()
// sd_options.option?.sd_model_checkpoint

module.exports = {
    SdOptions,
}
