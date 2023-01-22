const { cleanLayers } = require("../psapi")

const SessionState = {
	Active : "active",
	Inactive: "inactive",

}
const GarbageCollectionState = {
	Accept : "accept", // accept all generated images
	Discard: "discard",//discard all generated images
    DiscardSelected: "discard_selected",
    AcceptSelected: "accept_selected"//accept_selected only chosen images

}

class GenerationSession{
    constructor(){
        //this should be unique session id and it also should act as the total number of sessions been created in the project
        this.id = 0
        this.state = SessionState['Inactive'] 
        this.mode = "txt2img"
        this.selectionInfo = null
        this.isFirstGeneration = true // only before the first generation is requested should this be true
        this.outputGroup
    }
    isActive(){
        return this.state === SessionState['Active']
    }
    isInactive(){
        return this.state === SessionState['Inactive']
    }
    activate(){
        this.state = SessionState['Active']
    }
    deactivate(){
        this.state = SessionState['Inactive']
    }
    name(){
        return `session - ${this.id}`
    }
    async startSession(){
    
    this.id += 1//increment the session id for each session we start
    this.activate()
    this.isFirstGeneration = true // only before the first generation is requested should this be true
    
    console.log("current session id: ", this.id)
    try{
        
        const session_name = this.name()
        const activeLayers = await app.activeDocument.activeLayers 
        await psapi.unselectActiveLayersExe() // unselect all layer so the create group is place at the top of the document 
        const outputGroup = await psapi.createEmptyGroup(session_name)
        this.outputGroup = outputGroup
        await psapi.selectLayersExe(activeLayers)
    }catch(e){
        console.warn(e)
    }
    }
    async endSession(garbage_collection_state){
        try{
            this.state = SessionState['Inactive']// end the session by deactivate it

            // endGenerationSession()//end session
            
                this.deactivate()
                
            if(garbage_collection_state === GarbageCollectionState['Accept']){
                
            await acceptAll()
        }else if(garbage_collection_state === GarbageCollectionState['Discard']){
            //this should be discardAll()
            
            await discardAll()
        }else if(garbage_collection_state === GarbageCollectionState['DiscardSelected'])
        {
            //this should be discardAllExcept(selectedLayers)
            await discardSelected()//this will discard what is not been highlighted
            
        }
        else if(garbage_collection_state === GarbageCollectionState['AcceptSelected'])
        {
            //this should be discardAllExcept(selectedLayers)
            await discard()//this will discard what is not been highlighted
            
        }
        
        
        this.isFirstGeneration = true // only before the first generation is requested should this be true
        
        await util_layer.collapseFolderExe([this.outputGroup],false)// close the folder group

    }catch(e){
        console.warn(e)
    }

          
    }
    isSameMode(selected_mode){
        if (this.mode === selected_mode){
            return true
        }
        return false
    }
    loadLastSession(){
        //load the last session from the server
        
    }
    saveCurrentSession(){
        //all session info will be saved in a json file in the project folder
        }
    async moveToTopOfOutputGroup(layer){
        const output_group_id = await this.outputGroup.id
        let group_index = await psapi.getLayerIndex(output_group_id)
        const indexOffset = 1 //1 for background, 0 if no background exist
        await executeAsModal(async ()=>{
          await psapi.moveToGroupCommand(group_index - indexOffset, layer.id)
    
        })
    }
}


module.exports ={
    GenerationSession,
    GarbageCollectionState,
    SessionState
}