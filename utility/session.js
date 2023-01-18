const { cleanLayers } = require("../psapi")

const SessionState = {
	Active : "active",
	Inactive: "inactive",

}
const GarbageCollectionState = {
	Accept : "accept", // accept all generated images
	Discard: "discard",//discard all generated images
    Custom: "custom"//accept only chosen images

}

class GenerationSession{
    constructor(){
        //this should be unique session id and it also should act as the total number of sessions been created in the project
        this.id = 0
        this.state = SessionState['Inactive'] 
        this.mode = "txt2img"
        this.selectionInfo = null
    }
    
    startSession(){
    this.id += 1//increment the session id for each session we start
    SessionState['Active'] 
    }
    async endSession(garbage_collection_state){
        try{

            endGenerationSession()//end session
            if(garbage_collection_state === GarbageCollectionState['Accept']){
                
            await acceptAll()
        }else if(garbage_collection_state === GarbageCollectionState['Discard']){
            //this should be discardAll()
            // await discard()
            await discardAll()
        }else if(garbage_collection_state === GarbageCollectionState['Custom'])
        {
            //this should be discardAllExcept(selectedLayers)
            await discard()//this will discard what is not been highlighted
            
        }
        this.state = SessionState['Inactive']// end the session by deactivate it
        
    }catch(e){
        console.warn(e)
    }

          
    }
    loadLastSession(){
        //load the last session from the server
        
    }
    saveCurrentSession(){
        //all session info will be saved in a json file in the project folder
        }
}


module.exports ={
    GenerationSession,
    GarbageCollectionState,
    SessionState
}