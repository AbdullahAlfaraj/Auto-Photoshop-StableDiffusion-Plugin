// import {helloHelper} from 'helper.js'
// helloHelper2 = require('./helper.js')
// for organizational proposes

const helper = require('./helper')
const sdapi = require('./sdapi')
const exportHelper = require('./export_png')
const outpaint = require('./outpaint')
const psapi = require('./psapi')
const app = window.require('photoshop').app

const { batchPlay } = require('photoshop').action
const { executeAsModal } = require('photoshop').core
const dialog_box = require('./dialog_box')
// const {entrypoints} = require('uxp')
const html_manip = require('./html_manip')
const export_png = require('./export_png')
const viewer = require('./viewer')
const selection = require('./selection')
const util_layer = require('./utility/layer') 


// const eventHandler = (event, descriptor) => {
//   // console.log("event got triggered!")
//   console.log(event, descriptor)}
  
// require("photoshop").action.addNotificationListener(['set','move','transform'], eventHandler);

// require("photoshop").action.addNotificationListener(['historyStateChanged'], eventHandler);

// const onSelect = (event, descriptor) => {
//   // console.log(`descriptor._target?.[0]._ref === "layer" : `,descriptor._target?.[0]._ref === "layer" )
//   // console.log(`descriptor._target?.[0]._name === "Mask -- Paint White to Mask -- temporary" : `,descriptor._target?.[0]._name === "Mask -- Paint White to Mask -- temporary" )
//   console.log(event,descriptor)
//   // if(descriptor._target?.[0]._ref === "layer" && descriptor._target?.[0]._name === "Mask -- Paint White to Mask -- temporary") {
//   //   // -> The layer with name "Test Layer 1" was selected
//   //   console.log(" onSelect event got triggered!")
//   //   console.log("descriptor: ",descriptor)
//   //   // console.log()
//   // }
// }

// require("photoshop").action.addNotificationListener(['all'], onSelect);

 

async function getUniqueDocumentId () {
  try {
    uniqueDocumentId = await psapi.readUniqueDocumentIdExe()

    console.log(
      'getUniqueDocumentId():  uniqueDocumentId: ',
      uniqueDocumentId
    )

    // Regular expression to check if string is a valid UUID
    const regexExp =
      /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi

    // String with valid UUID separated by dash
    // const str = 'a24a6ea4-ce75-4665-a070-57453082c256'

    const isValidId = regexExp.test(uniqueDocumentId) // true
    console.log('isValidId: ', isValidId)
    if (isValidId == false) {
      let uuid = self.crypto.randomUUID()
      console.log(uuid) // for example "36b8f84d-df4e-4d49-b662-bcde71a8764f"
      await psapi.saveUniqueDocumentIdExe(uuid)
      uniqueDocumentId = uuid
    }
  } catch (e) {
    console.warn('warning Document Id may not be valid', e)
  }
  return uniqueDocumentId
}

// document
//   .getElementById('btnLinkCurrentDocument')
//   .addEventListener('click', async () => {
//     await getUniqueDocumentId()
//   })

  
// attach event listeners for tabs
Array.from(document.querySelectorAll(".sp-tab")).forEach(theTab => {
  theTab.onclick = () => {
    // localStorage.setItem("currentTab", theTab.getAttribute("id"));
    Array.from(document.querySelectorAll(".sp-tab")).forEach(aTab => {
      if (aTab.getAttribute("id") === theTab.getAttribute("id")) {
        aTab.classList.add("selected");
      } else {
        aTab.classList.remove("selected");
      }
    });
    Array.from(document.querySelectorAll(".sp-tab-page")).forEach(tabPage => {
      if (tabPage.getAttribute("id").startsWith(theTab.getAttribute("id"))) {
        tabPage.classList.add("visible");
      } else {
        tabPage.classList.remove("visible");
      }
    });
  }
});

document.getElementById("sp-viewer-tab").addEventListener('click',()=>{
  moveElementToAnotherTab("batchNumberUi","batchNumberViewerTabContainer")

})
document.getElementById("sp-stable-diffusion-ui-tab").addEventListener('click', ()=>{
  moveElementToAnotherTab("batchNumberUi","batchNumberSdUiTabContainer")

})
// entrypoints.setup({

//   panels:{
//     vanilla: ()=>{
//       console.log("you are in the vanilla panel")
//     },
//     experimental_1: ()=>{
//       console.log("you are in the experimental_1 panel")
      
//     } 
//   }
// }
//   )
// just a number that shouldn't unique enough that we will use when save files.
// each session will get a number from 1 to 1000000
const random_session_id = Math.floor((Math.random() * 1000000) + 1);

function getSelectedText() // JavaScript
{
//     // Obtain the object reference for the <textarea>
    // const txtarea = document.getElementById("taPrompt");
    const promptTextarea = document.querySelector('#taPrompt')
    console.log("promptTextarea: ", promptTextarea.value)
//     // Obtain the index of the first selected character
    var start = promptTextarea.selectionStart;
    console.log("start: ",start)
//     // Obtain the index of the last selected character
//     var finish = txtarea.selectionEnd;
//     console.log("finish: ",finish)

//     // Obtain the selected text
//     var sel = txtarea.value.substring(start, finish);
//     console.log("selected textarea: ", sel)
    

    // Do something with the selected content
}
// setInterval(getSelectedText,2000)
function getCommentedString(){
  // const text = document.getElementById("taPrompt").value
  // let text = `Visit /*W3Schools 
  // cute, girl, painterly   
  // *\\ any text
  // and prompt`;
  // let text = `cute cat /*by greg 

  // and artgerm 
  
  //  */ and famous artist`
  let text = `Visit /*W3Schools 
  cute, girl, painterly   
  */ any text
  and prompt




 cute cat  /*by greg 

  and artgerm 
  
   */ and famous artist`
  console.log("getCommentedString: text: ",text)
 
  // let pattern = /(\/)(\*)(\s|\S)*\*\\/g;
  let pattern = /(\/)(\*)(\s|\S)*?(\*\/)/g;

  let result = text.match(pattern);
  console.log("getCommentedString: ",result)
}

//duplicate the active layer
async function duplication () {
  try {
    console.log('active layer id: ', app.activeDocument.activeLayers[0].id)
    await executeAsModal(async () => {
      let inner_new_layer = await app.activeDocument.activeLayers[0].duplicate()
      console.log('inner_new_layer id: ', inner_new_layer.id)
    })

    console.log('new active layer id: ', app.activeDocument.activeLayers[0].id)
  } catch (e) {
    console.warn('duplication error:', e)
  }
}

function tempDisableElement(element,time){

  element.disabled = true;
  element.style.opacity = "0.65"; 
  element.style.cursor =  "not-allowed";
  setTimeout(function() {
    element.disabled = false;
    element.style.opacity = "1.0"; 
  element.style.cursor =  "default";
  }, time);
}


async function refreshUI(){
  
  await initSamplers()
  await refreshModels()
  await updateVersionUI()
}


async function refreshModels () {
  try{

    g_models = await sdapi.requestGetModels()
    // const models_menu_element = document.getElementById('mModelsMenu')
  // models_menu_element.value = ""
  document.getElementById('mModelsMenu').innerHTML = ''
  
  for (let model of g_models) {
    console.log(model.title)
    const menu_item_element = document.createElement('sp-menu-item')
    menu_item_element.className = "mModelMenuItem"
    menu_item_element.innerHTML = model.title
    menu_item_element.dataset.model_hash = model.hash
    menu_item_element.dataset.model_title = model.title
    document.getElementById('mModelsMenu').appendChild(menu_item_element)
  }
}catch(e){
  console.warn(e)
}
}


async function updateVersionUI(){
  
    try{
      version = await sdapi.getVersionRequest()
    document.getElementById('lVersionNumber').textContent = version
    }
    catch (e){
      console.warn(e)
      document.getElementById('lVersionNumber').textContent = "v0.0.0"
    }
  
}



async function initSamplers () {
 try{

   let sampler_group = document.getElementById('sampler_group')
   sampler_group.innerHTML = ''

  samplers = await sdapi.requestGetSamplers()
  for (sampler of samplers) {
    console.log(sampler)
    // sampler.name
    // <sp-radio class="rbSampler" value="Euler">Euler</sp-radio>
    const rbSampler = document.createElement('sp-radio')
    
    rbSampler.innerHTML = sampler.name
    rbSampler.setAttribute('class', 'rbSampler')
    rbSampler.setAttribute('value', sampler.name)
    

    sampler_group.appendChild(rbSampler)
    //add click event on radio button for Sampler radio button, so that when a button is clicked it change g_sd_sampler globally
    

    //we could delete the click() event 
    rbSampler.addEventListener('click', evt => {
      g_sd_sampler = evt.target.value
      console.log(`You clicked: ${g_sd_sampler}`)
    })
  }
  document.getElementsByClassName('rbSampler')[0].setAttribute('checked', '')
}catch(e){
  console.warn(e)
}
}


function promptShortcutExample(){

  let prompt_shortcut_example = {
    "game_like": "Unreal Engine, Octane Render, arcane card game ui, hearthstone art style, epic fantasy style art",
    "large_building_1": "castle, huge building, large building",
    "painterly_style_1": "A full portrait of a beautiful post apocalyptic offworld arctic explorer, intricate, elegant, highly detailed, digital painting, artstation, concept art, smooth, sharp focus, illustration",
    "ugly": " ((((ugly)))), (((duplicate))), ((morbid)), ((mutilated)), out of frame, extra fingers, mutated hands, ((poorly drawn hands)), ((poorly drawn face)), (((mutation))), (((deformed))), ((ugly)), blurry, ((bad anatomy)), (((bad proportions))), ((extra limbs)), cloned face, (((disfigured))), out of frame, ugly, extra limbs, (bad anatomy), gross proportions, (malformed limbs), ((missing arms)), ((missing legs)), (((extra arms))), (((extra legs))), mutated hands, (fused fingers), (too many fingers), (((long neck)))"
  }
  var JSONInPrettyFormat = JSON.stringify(prompt_shortcut_example, undefined, 7);
  document.getElementById('taPromptShortcut').value = JSONInPrettyFormat
}



function autoFillInSettings(metadata_json){
 try{

   metadata_json1 =  {
     "prompt": "cute cat, A full portrait of a beautiful post apocalyptic offworld arctic explorer, intricate, elegant, highly detailed, digital painting, artstation, concept art, smooth, sharp focus, illustration\nNegative prompt:  ((((ugly)))), (((duplicate))), ((morbid)), ((mutilated)), out of frame, extra fingers, mutated hands, ((poorly drawn hands)), ((poorly drawn face)), (((mutation))), (((deformed))), ((ugly)), blurry, ((bad anatomy)), (((bad proportions))), ((extra limbs)), cloned face, (((disfigured))), out of frame, ugly, extra limbs, (bad anatomy), gross proportions, (malformed limbs), ((missing arms)), ((missing legs)), (((extra arms))), (((extra legs))), mutated hands, (fused fingers), (too many fingers), (((long neck)))",
     "Steps": "20",
     "Sampler": "Euler a",
     "CFG scale": "7.0",
     "Seed": "2300061620",
     "Size": "512x512",
     "Model hash": "3e16efc8",
     "Seed resize from": "-1x-1",
     "Denoising strength": "0",
     "Conditional mask weight": "1.0"
    }
    
    //sometime the negative prompt is stored within the prompt
    function extractNegativePrompt(prompt){
      const splitter = "\nNegative prompt:"
      const prompts = prompt.split(splitter)
      console.log("prompts: ",prompts)
      let negative_prompt = ""
      if(prompts.length > 1)
      {
        negative_prompt = prompts[1].trim()
      }
      //propmt = prompt[0]
      
      return [prompts[0],negative_prompt]
    } 
    let [prompt, negative_prompt] = extractNegativePrompt(metadata_json["prompt"])
    negative_prompt =  metadata_json["Negative prompt"] || negative_prompt
    
    html_manip.autoFillInPrompt(prompt)
    html_manip.autoFillInNegativePrompt(negative_prompt)
    
    document.getElementById('tiNumberOfSteps').value = metadata_json["Steps"]
    
    document.getElementById('slCfgScale').value = metadata_json["CFG scale"]
    document.getElementById('tiSeed').value = metadata_json["Seed"]

    // = metadata_json['Denoising strength']
    html_manip.autoFillInDenoisingStrength(metadata_json['Denoising strength'])
    
    model_title = html_manip.autoFillInModel(metadata_json["Model hash"])
    sdapi.requestSwapModel(model_title)
    
    const [width,height] =  metadata_json['Size'].split('x')
    console.log("width, height: ",width, height)
    html_manip.autoFillInWidth(width)
    html_manip.autoFillInHeight(height)
    html_manip.autoFillInSampler(metadata_json['Sampler'])
    if(metadata_json.hasOwnProperty("First pass size"))
    {
      // chHiResFixs
      const [firstphase_width,firstphase_height] =metadata_json["First pass size"].split('x')
      html_manip.autoFillInHiResFixs(firstphase_width,firstphase_height)
      html_manip.autoFillInSliderUi(metadata_json['Denoising strength'],'hrDenoisingStrength','hDenoisingStrength',100)
    }else{//
     html_manip.setHiResFixs(false)
    }

    // document.getElementById('tiSeed').value = metadata_json["Seed"]
  }
  catch(e){
  console.error(`autoFillInSettings: ${e}`)  
  }
    
    
  }
  //steps to load init_image:
  //duplicate the active layer
// duplication()
// create a mask from marquee selection

// export the layer as png
//load the image from disk to panel as <img /> tag
//store the relative path of the image into init_img_path to be load from the python server (serverMain.py)
//

//**********Start: global variables
let prompt_dir_name = ''
let gImage_paths = []
let g_image_path_to_layer = {}

gCurrentImagePath = ''
let g_init_image_name = ''
// let g_init_mask_layer;
let g_init_image_mask_name =''
let g_mask_related_layers = {}
let g_init_image_related_layers = {}
let numberOfImages = document.querySelector('#tiNumberOfImages').value
let g_sd_mode = 'txt2img'
let g_sd_sampler = 'Euler a'
let g_denoising_strength = 0.7
let g_use_mask_image = false
let g_models = []
let g_model_title = ''
// let gWidth = 512
// let gHeight = 512
let hWidth = 512
let hHeight = 512
let h_denoising_strength = .7
let g_inpainting_fill = 0
let g_last_outpaint_layers = []
let g_last_inpaint_layers = []
let g_last_snap_and_fill_layers = []

let g_metadatas = []
let g_can_request_progress = true
let g_saved_active_layers = []
let g_is_active_layers_stored = false
let g_viewer_objects = {}// {path: viewer_obj}
let g_is_generation_session_active = false
let g_number_generation_per_session = 0
let g_isViewerMenuDisabled = false // disable the viewer menu and viewerImage when we're importing images into the current document
let g_b_mask_layer_exist = false// true if inpaint mask layer exist, false otherwise.
let g_inpaint_mask_layer;
let g_inpaint_mask_layer_history_id; //store the history state id when creating a new inpaint mask layer
let g_selection = {}
const requestState = {
	Generate: "generate",
	Interrupt: "interrupt",
}

let g_request_status = ""//
const generationMode = {
  Txt2Img: "txt2img",
  Img2Img: "img2img",
  Inpaint: "inpaint",
  Outpaint: "outpaint"
}
let g_generation_session_mode = generationMode['Txt2Img']
//********** End: global variables */

//***********Start: init function calls */

refreshModels() // get the models when the plugin loads
displayUpdate()
initSamplers()
updateVersionUI()
promptShortcutExample()
//***********End: init function calls */

//add click event on radio button mode, so that when a button is clicked it change g_sd_mode globally
rbModeElements = document.getElementsByClassName('rbMode')
for (let rbModeElement of rbModeElements) {
  rbModeElement.addEventListener('click', evt => {
    g_sd_mode = evt.target.value
    // console.log(`You clicked: ${g_sd_mode}`)
    displayUpdate()
    postModeSelection()// do things after selection
  })
}
async function postModeSelection(){
//
try{

  if(g_sd_mode === generationMode['Inpaint']){
    //check if the we already have created a mask layer
    if(!g_b_mask_layer_exist){

      //make new layer "Mask -- Paint White to Mask -- temporary"
      // if (g_is_generation_session_active)
      // {//
        // g_generation_session_mode = 
        const name = "Mask -- Paint White to Mask -- temporary"
        g_inpaint_mask_layer = await util_layer.createNewLayerExe(name)
        
        g_b_mask_layer_exist = true
        const index = app.activeDocument.historyStates.length -1
        g_inpaint_mask_layer_history_id =  app.activeDocument.historyStates[index].id
        console.log("g_inpaint_mask_layer_history_id: ",g_inpaint_mask_layer_history_id)
      // }
    }
  }
  else{// if we switch from inpaint mode, delete the mask layer
    // Find all history states after the creation of the inpaint mask and their name brush tool
    console.log("g_inpaint_mask_layer_history_id: ",g_inpaint_mask_layer_history_id)
    const historyBrushTools = app.activeDocument.historyStates.filter(h => (h.id > g_inpaint_mask_layer_history_id) && (h.name === "Brush Tool"))
    console.log(historyBrushTools)
    if(historyBrushTools.length === 0){

      await util_layer.deleteLayers([g_inpaint_mask_layer])
      g_b_mask_layer_exist = false
    }
  }
}
catch(e){
console.warn(e)
}
}
rbMaskContentElements = document.getElementsByClassName('rbMaskContent')

for (let rbMaskContentElement of rbMaskContentElements) {
  rbMaskContentElement.addEventListener('click', evt => {
    g_inpainting_fill = evt.target.value

    // console.log(`You clicked: ${g_inpainting_fill}`)
    displayUpdate()
  })
}

////add tips to element when mouse hover on an element 
// function getToolTipElement(){
//   const tool_tip = document.getElementById("tool_tip")
//   return tool_tip
// }
// function moveTip(x,y){
//   var tool_tip = document.getElementById("tool_tip")

//     tool_tip.style.position =  'absolute';
//     tool_tip.style.left =  x;
//     tool_tip.style.top =  y;
// }
// document.getElementById('rbOutpaintMode').addEventListener("mouseover",(e)=>{

//   console.log("e.shiftKey:",e.shiftKey)
 

//   if(e.shiftKey)
//   {
//     const rect = e.target.getBoundingClientRect()
//     const tool_tip = getToolTipElement()
//     setTimeout(()=>{
//       tool_tip.style.display = "none"
//     },5000)
//     tool_tip.style.display = "inline-block"

//     tool_tip.style["z-index"] =  100;
//     console.log("Use this mode when you want to fill empty areas of the canvas")
//     // var x = e.pageX;
//     // var y = e.pageY;
//     console.log("(e.pageX,e.pageY): ",(e.pageX,e.pageY))
//     const tip_x = e.pageX - (tool_tip.offsetWidth/2)
//     // const tip_y = e.pageY + - tool_tip.offsetHeight
//     const tip_y = rect.top + - tool_tip.offsetHeight
    
//     moveTip(tip_x,tip_y)
//   }
//   else{// rlease the shift key
//     console.log("tip will disappear in 1 second")
//   }

// });    

// document.getElementById('rbOutpaintMode').addEventListener("mouseout",(e)=>{

//   console.log("e.shiftKey:",e.shiftKey)
 

//   console.log("no tip, tip will disappear in 1 second")
//   // getToolTipElement().style.display = "none"

// });    




// show the interface that need to be shown and hide the interface that need to be hidden
function displayUpdate () {
  if (g_sd_mode == 'txt2img') {
    document.getElementById('slDenoisingStrength').style.display = 'none' // hide denoising strength slider
    // document.getElementById("image_viewer").style.display = 'none' // hide images
    document.getElementById('init_image_container').style.display = 'none' // hide init image
    document.getElementById('init_image_mask_container').style.display = 'none' // hide init mask
    document.getElementById('slInpainting_fill').style.display = 'none' // hide inpainting fill mode
    
    // document.getElementById('btnSnapAndFill').style.display = 'none'//"none" will  misaligned the table // hide snap and fill button
  }

  if (g_sd_mode == 'img2img') {
    document.getElementById('slDenoisingStrength').style.display = 'block' // show denoising strength
    // document.getElementById("image_viewer").style.display = 'block'
    document.getElementById('init_image_container').style.display = 'block' // hide init image

    document.getElementById('init_image_mask_container').style.display = 'none' // hide mask
    document.getElementById('slInpainting_fill').style.display = 'none' // hide inpainting fill mode
    // document.getElementById('btnSnapAndFill').style.display = 'inline-flex' // hide snap and fill button mode
  }
  if (g_sd_mode == 'inpaint' || g_sd_mode== 'outpaint') {
    ///fix the misalignment problem in the ui (init image is not aligned with init mask when switching from img2img to inpaint ). note: code needs refactoring   
    // document.getElementById('btnSnapAndFill').style.display = 'none'//"none" will  misaligned the table // hide snap and fill button
    document.getElementById('tableInitImageContainer').style.display = 'none' // hide the table 
    setTimeout(() => {
      document.getElementById('tableInitImageContainer').style.display = 'table' // show the table after some time so it gets rendered. 
    }, 100);
    

    document.getElementById('slDenoisingStrength').style.display = 'block'
    document.getElementById('init_image_mask_container').style.display = 'block'
    document.getElementById('slInpainting_fill').style.display = 'block'
    document.getElementById('init_image_container').style.display = 'block' // hide init image

    // document.getElementById('btnInitOutpaint').style.display = 'inline-flex'
    // document.getElementById('btnInitInpaint').style.display = 'inline-flex'
    // document.getElementById('btnInitOutpaint').style.display = 'none'
    // document.getElementById('btnInitInpaint').style.display = 'none'
  } else {//txt2img or img2img
    // document.getElementById('btnInitOutpaint').style.display = 'none'
    // document.getElementById('btnInitInpaint').style.display = 'none'
  }

  //if a generation session is active but we changed mode. the generate button will reflect that
  if (g_is_generation_session_active ){

  
  if(g_generation_session_mode !== g_sd_mode){
    const generate_btns = Array.from(document.getElementsByClassName('btnGenerateClass'))
    generate_btns.forEach(element =>{
       element.textContent = `Generate ${g_sd_mode}`
    
      }
       )

       html_manip.setGenerateButtonsColor('generate','generate-more')
  }
  else{
    const generate_btns = Array.from(document.getElementsByClassName('btnGenerateClass'))
    generate_btns.forEach(element => {
      element.textContent = 'Generate More'
      
    })

    html_manip.setGenerateButtonsColor('generate-more','generate')
  }
}
else{//session is not active
  html_manip.setGenerateButtonsColor('generate','generate-more')

}
  

}
// function showLayerNames () {
//   const app = window.require('photoshop').app
//   const allLayers = app.activeDocument.layers
//   const allLayerNames = allLayers.map(
//     layer => `${layer.name} (${layer.opacity} %)`
//   )

//   const sortedNames = allLayerNames.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
//   document.getElementById('layers').innerHTML = `
//         <ul>${sortedNames.map(name => `<li>${name}</li>`).join('')}</ul>`
// }




function selectTool () {
  var doc = app.activeDocument
  var activeTool = app.currentTool

  // if (activeTool !== toolName) {
  //   toolName = activeTool;
  //   doc.activeTool = toolName;
  // }
  // const util = require('util')

  // console.log(util.inspect(myObject, {showHidden: false, depth: null, colors: true}))
  console.dir(app, { depth: null })
  console.log('hello this is Abdullah')
  document.getElementById('layers').innerHTML = `<span>
    selectTool was called, ${activeTool}
    </span>`

  //rectanglemarquee
  // await require('photoshop').core.executeAsModal(newNormalLayer);
}

async function testServerPath () {
  // const serverPath = "https://api.github.com/users/abdullah"

  try {
    // const serverPath = 'https://api.weather.gov/points/123.4,342.5'
    // const serverPath = 'https://api.github.com/users/abdullah'
    // const serverPath = "https://api.coindesk.com/v1/bpi/currentprice.json"
    // const serverPath = "http://127.0.0.1:3000"
    // const serverPath = "http://localhost:3000"
    const serverPath = 'http://127.0.0.1:8000/txt2img/random%20prompt'
    // const serverPath = "https://3330-37-106-100-102.eu.ngrok.io"
    console.log('testServerPath function was called')

    let response = await fetch(serverPath)
    console.log('testServerPath finished fetch')

    if (!response.ok) {
      throw new Error(
        `HTTP error fetching weather station; status: ${response.status}`
      )
    }
    let stationJson = await response.json()
    console.dir(stationJson)
  } catch (err) {
    console.error('testServerPath error: ' + err.message)
  }
}

// User picks an image file
// open a explorer for user to select a image file
async function fillImage () {
  const storage = require('uxp').storage
  const fs = storage.localFileSystem
  let imageFile = await fs.getFileForOpening({
    types: storage.fileTypes.images
  })

  // Create ImageFill for this image
  const ImageFill = require('scenegraph').ImageFill
  let fill = new ImageFill(imageFile)

  // Set fill of first selected item
  selection.items[0].fill = fill
}
// fillImage()

function pastImage2Layer () {
  const { batchPlay } = require('photoshop').action
  const { executeAsModal } = require('photoshop').core

  executeAsModal(
    () => {
      // batchPlay([command], {})
      const result = batchPlay(
        [
          {
            _obj: 'paste',
            antiAlias: {
              _enum: 'antiAliasType',
              _value: 'antiAliasNone'
            },
            as: {
              _class: 'pixel'
            },
            _options: {
              dialogOptions: 'dontDisplay'
            }
          }
        ],
        {
          synchronousExecution: true,
          modalBehavior: 'fail'
        }
      )
    },
    {
      commandName: 'Create Label'
    }
  )
}
function sliderToResolution (sliderValue) {
  return sliderValue * 64
}

// document.querySelector('#slHeight').addEventListener('input', evt => {
//   gHeight = sliderToResolution(evt.target.value)
//   document.querySelector('#lHeight').textContent = gHeight
// })


// function getWidthFromSlider(slider_value){
//   // slider_width = document.querySelector('#slWidth').value
//   const width = sliderToResolution(slider_value) 
//   return width 
// }
// //avoid using global width gWidth in "input" incase the slider get changed using autoFillInSettings
// document.querySelector('#slWidth').addEventListener('input', evt => {
//   const width = getWidthFromSlider(evt.target.value)
//   // gWidth = sliderToResolution(evt.target.value)
//   document.querySelector('#lWidth').textContent = width
// })

document.querySelector('#hrHeight').addEventListener('input', evt => {
  hHeight = sliderToResolution(evt.target.value)
  document.querySelector('#hHeight').textContent = hHeight
})
document.querySelector('#hrWidth').addEventListener('input', evt => {
  hWidth = sliderToResolution(evt.target.value)
  document.querySelector('#hWidth').textContent = hWidth
})
document.querySelector('#slInpaintPadding').addEventListener('input', evt => {
  padding = evt.target.value * 4
  document.querySelector('#lInpaintPadding').textContent = padding
})

// document
//   .querySelector('#slDenoisingStrength')
//   .addEventListener('input', evt => {
//     const denoising_string_value = evt.target.value / 100.0
//     g_denoising_strength = denoising_string_value
//     // document.querySelector('#lDenoisingStrength').value= Number(denoising_string_value)
//     document.querySelector('#lDenoisingStrength').textContent =
//       denoising_string_value
//     document.getElementById(
//       'lDenoisingStrength'
//     ).innerHTML = `${denoising_string_value}`
//     // console.log(`New denoising_string_value: ${document.querySelector('#tiDenoisingStrength').value}`)
//   })
// document
//   .querySelector('#hrDenoisingStrength')
//   .addEventListener('input', evt => {
//     const denoising_string_value = evt.target.value / 100.0
//     h_denoising_strength = denoising_string_value

//     document.getElementById(
//       'hDenoisingStrength'
//     ).innerHTML = `${denoising_string_value}`
//     // console.log(`New denoising_string_value: ${document.querySelector('#tiDenoisingStrength').value}`)
//   })
// // document.getElementById('btnPopulate').addEventListener('click', showLayerNames)

async function snapAndFillHandler () {
  try {
    const isSelectionAreaValid = await psapi.checkIfSelectionAreaIsActive()
    if (isSelectionAreaValid) {
      if (!g_is_generation_session_active) {
        // clear the layers related to the last mask operation.
        g_last_snap_and_fill_layers = await psapi.cleanLayers(
          g_last_snap_and_fill_layers
        )
        // create new layers related to the current mask operation.
        await executeAsModal(async () => {
          g_last_snap_and_fill_layers = await outpaint.snapAndFillExe(
            random_session_id
          )
        })
        console.log(
          'outpaint.snapAndFillExe(random_session_id):, g_last_snap_and_fill_layers: ',
          g_last_snap_and_fill_layers
        )
      }
    } else {
      psapi.promptForMarqueeTool()
    }
  } catch (e) {
    console.warn(e)
  }
}

// document
//   .getElementById('btnSnapAndFill')
//   .addEventListener('click', async () => {

//   await snapAndFillHandler()
//   })


async function easyModeOutpaint(){
  try{

    if(!g_is_generation_session_active){
      // clear the layers related to the last mask operation.
      g_last_outpaint_layers = await psapi.cleanLayers(g_last_outpaint_layers)

      // create new layers related to the current mask operation.
      g_last_outpaint_layers = await outpaint.outpaintFasterExe(random_session_id)
    }
      
    

      
    
  }
  catch(e){
   console.warn(e) 
  }
}

async function btnInitInpaintHandler(){
  try{

    
    
    if(!g_is_generation_session_active){
      // delete the layers of the previous mask operation
      g_last_inpaint_layers = await psapi.cleanLayers(g_last_inpaint_layers)
      // store the layer of the current mask operation
      g_last_inpaint_layers =  await outpaint.inpaintFasterExe(random_session_id)
      
      console.log ("outpaint.inpaintFasterExe(random_session_id):, g_last_inpaint_layers: ",g_last_inpaint_layers)
    }
  }
  catch(e){
    console.warn(e)
  }
}
// document
//   .getElementById('btnInitInpaint')
//   .addEventListener('click', async () => {
//  await btnInitInpaintHandler()
//   })

function toggleTwoButtonsByClass(isVisible,first_class,second_class){
  const first_class_btns = Array.from(document.getElementsByClassName(first_class))
  const second_class_btns = Array.from(document.getElementsByClassName(second_class))
  
  if (isVisible) {//show interrup button 
    first_class_btns.forEach(element => element.style.display = 'none')
    second_class_btns.forEach(element => element.style.display = 'inline-block')
    console.log("first_class_btns: ",first_class_btns)

  } else {//show generate or generate more button
    first_class_btns.forEach(element => element.style.display = 'inline-block')
    if(g_is_generation_session_active){//show generate more

      first_class_btns.forEach(element => element.textContent = "Generate More")

    }else{//show generate button
      first_class_btns.forEach(element => element.textContent = "Generate")

    }
    second_class_btns.forEach(element => element.style.display = 'none')

  }
  return isVisible
}

async function acceptAll(){
  try{

    for (const [path, viewer_object] of Object.entries(g_viewer_objects)) {
      try{
      

      viewer_object.setHighlight(true)// mark each layer as accepted 

    } catch (e){
      console.error(e)
    } 
  }
  await discard()// clean viewer tab
}catch(e){
console.warn(e)
}
}

function endGenerationSession(){
  g_is_generation_session_active = false
  sessionStartHtml(g_is_generation_session_active)
}


const accept_class_btns = Array.from(document.getElementsByClassName("acceptClass"))
accept_class_btns.forEach(element => element.addEventListener('click',async ()=>{
  try{

    endGenerationSession()
    await acceptAll()
    
  }catch(e){
    console.warn(e)
  }
}))



function sessionStartHtml(status){
// will toggle the buttons needed when a generation session start 
  const accept_class = "acceptClass"
  const discard_class = "discardClass"

  const accept_class_btns = Array.from(document.getElementsByClassName(accept_class))
  const discard_class_btns = Array.from(document.getElementsByClassName(discard_class))
  const generate_btns = Array.from(document.getElementsByClassName('btnGenerateClass'))
if (status){//session started
  accept_class_btns.forEach(element => element.style.display = 'inline-block')
  discard_class_btns.forEach(element => element.style.display = 'inline-block')
  generate_btns.forEach(element => {element.textContent = "Generate More"
  
}
)
html_manip.setGenerateButtonsColor('generate-more','generate')
  

}else{//session ended
  accept_class_btns.forEach(element => element.style.display = 'none')
  discard_class_btns.forEach(element => element.style.display = 'none')
  generate_btns.forEach(element => {element.textContent = "Generate"
  
})
html_manip.setGenerateButtonsColor('generate','generate-more')
}


}

  function toggleTwoButtons (defaultVal,first_btn_id,second_btn_id) {
    if (defaultVal) {
  
      document.getElementById(first_btn_id).style.display = 'none' // hide generate button
      document.getElementById(second_btn_id).style.display = 'inline-block' // show interrupt button
      
    } else {
      document.getElementById(first_btn_id).style.display = 'inline-block' // hide generate button
      document.getElementById(second_btn_id).style.display = 'none' // show interrupt button

    }
    return defaultVal
  }



document.getElementById('btnRandomSeed').addEventListener('click', async () => {
  document.querySelector('#tiSeed').value = '-1'
})
document.getElementById('btnLastSeed').addEventListener('click', async () => {
  try{
    console.log("click on Last seed")
    let seed = '-1'

    console.log("g_metadatas.length: ",g_metadatas.length)
    if (g_metadatas.length > 0){
      seed = g_metadatas[0].Seed
    } 
    console.log("seed:",seed)
    document.querySelector('#tiSeed').value = seed
  }
  catch(e){
    console.warn(e)
  }
})
async function discard () {
  try{

  
  console.log(
    'click on btnCleanLayers,  g_last_outpaint_layers:',
    g_last_outpaint_layers
  )
  console.log(
    'click on btnCleanLayers,  g_last_inpaint_layers:',
    g_last_inpaint_layers
  )

  console.log(
    'click on btnCleanLayers,  g_last_snap_and_fill_layers:',
    g_last_snap_and_fill_layers
  )

  console.log('g_last_snap_and_fill_layers')
  g_last_snap_and_fill_layers = await psapi.cleanLayers(
    g_last_snap_and_fill_layers
  )

  if (g_last_outpaint_layers.length > 0) {
    g_last_outpaint_layers = await psapi.cleanLayers(g_last_outpaint_layers)
    console.log('g_last_outpaint_layers has 1 layers')
  }
  if (g_last_inpaint_layers.length > 0) {
    g_last_inpaint_layers = await psapi.cleanLayers(g_last_inpaint_layers)
    g_b_mask_layer_exist = false

  }
  const random_img_src ='https://source.unsplash.com/random'
  html_manip.setInitImageSrc(random_img_src)
  html_manip.setInitImageMaskSrc(random_img_src)
  // const last_gen_layers = Object.keys(g_image_path_to_layer).map(
  //   path => g_image_path_to_layer[path]
  // )


  // psapi.cleanLayers(last_gen_layers)
  await deleteNoneSelected(g_viewer_objects)
}
catch(e){
  console.warn(e)
}
}
Array.from(document.getElementsByClassName('discardClass')).forEach(element => {
  element.addEventListener('click', async () => {
    endGenerationSession()
    await discard()
  })
})


async function deleteMaskRelatedLayers(){
  console.log("click on btnCleanLayers,  g_last_outpaint_layers:",g_last_outpaint_layers)
  console.log("click on btnCleanLayers,  g_last_inpaint_layers:",g_last_inpaint_layers)
  
  console.log("click on btnCleanLayers,  g_last_snap_and_fill_layers:",g_last_snap_and_fill_layers)

  
  console.log("g_last_snap_and_fill_layers")
  g_last_snap_and_fill_layers = await psapi.cleanLayers(g_last_snap_and_fill_layers)
  
  if (g_last_outpaint_layers.length > 0){
    g_last_outpaint_layers = await psapi.cleanLayers(g_last_outpaint_layers)
    console.log("g_last_outpaint_layers has 1 layers")

  }
  if (g_last_inpaint_layers.length> 0 ){
    g_last_inpaint_layers = await psapi.cleanLayers(g_last_inpaint_layers)

  }

}
// document.getElementById('btnCleanLayers').addEventListener('click', async () => {
//   await deleteMaskRelatedLayers()

// })

// document.getElementById('btnInterruptMore').addEventListener('click', async () => {
//   try{

//     json = await sdapi.requestInterrupt()
    
 
    
//     g_can_request_progress = toggleTwoButtons(false,'btnGenerateMore','btnInterruptMore')
//   }catch(e)
//   {

//     g_can_request_progress = toggleTwoButtons(false,'btnGenerateMore','btnInterruptMore')
//     console.warn(e)
//   }
// })


document.getElementById('btnInterrupt').addEventListener('click', async () => {
  try{


    json = await sdapi.requestInterrupt()
    
    toggleTwoButtonsByClass(false,'btnGenerateClass','btnInterruptClass')
    g_can_request_progress = false
    g_request_status = requestState['Interrupt']
    
    // g_can_request_progress = toggleTwoButtons(false,'btnGenerate','btnInterrupt')
  }catch(e)
  {

    // g_can_request_progress = toggleTwoButtons(false,'btnGenerate','btnInterrupt')
    toggleTwoButtonsByClass(false,'btnGenerateClass','btnInterruptClass')
    g_can_request_progress = false
    console.warn(e)
  }
})


//store active layers only if they are not stored.
async function storeActiveLayers () {
  setTimeout(async () => {
    
    const layers = await app.activeDocument.activeLayers
    console.log("storeActiveLayers: ", layers.length)
    
    if(layers.length > 0){
      g_saved_active_layers = layers
      await psapi.unselectActiveLayersExe()
    }
  }, 200);

  // if (g_is_active_layers_stored == false) {
  //   g_saved_active_layers = await app.activeDocument.activeLayers
  //   g_is_active_layers_stored = true
  //   await psapi.unselectActiveLayersExe()
  // } else {
  // }
}
async function restoreActiveLayers () {
  
  const layers = await app.activeDocument.activeLayers
  console.log("restoreActiveLayers: ", layers.length)
  if(layers.length == 0){
    await psapi.selectLayersExe(g_saved_active_layers)
    g_saved_active_layers = []
  }
  // if (g_is_active_layers_stored == true) {
  //   // g_saved_active_layers = await app.activeDocument.activeLayers
  //   await psapi.selectLayersExe(g_saved_active_layers)
  //   g_is_active_layers_stored = false
  //   g_saved_active_layers = []
  // } 
}
document.getElementById('btnSdUrl').addEventListener('click', async () => {
  //change the sdUrl in server in proxy server
  console.log("you clicked btnSdUrl")
  let new_sd_url = document.getElementById('tiSdUrl').value
  console.log("new_sd_url: ", new_sd_url)

  new_sd_url = new_sd_url.trim()
  console.log("new_sd_url.trim(): ", new_sd_url)

  if (new_sd_url.length > 0) {
    await sdapi.changeSdUrl(new_sd_url)
  }
})


document.querySelector('#taPrompt').addEventListener('focus', async () => {
  console.log("taPrompt focus")
  // console.log('we are in prompt textarea')
  // console.log("g_is_active_layers_stored: ",g_is_active_layers_stored)
  await storeActiveLayers()
  // await psapi.unselectActiveLayersExe()

})
document.querySelector('#taPrompt').addEventListener('blur', async () => {
  console.log("taPrompt blur")
  // console.log('we are out of prompt textarea')
  // await psapi.unselectActiveLayersExe()
  // console.log("g_is_active_layers_stored: ",g_is_active_layers_stored)
  await restoreActiveLayers()
})

document
  .querySelector('#taNegativePrompt')
  .addEventListener('focus', async () => {
    console.log("taNegativePrompt focus")
    // console.log('we are in prompt textarea')

    await storeActiveLayers()
    // await psapi.unselectActiveLayersExe()
  })
document
  .querySelector('#taNegativePrompt')
  .addEventListener('blur', async () => {
    console.log("taNegativePrompt blur")
    // console.log('we are out of prompt textarea')
    // await psapi.unselectActiveLayersExe()
    await restoreActiveLayers()
  })

function updateMetadata (new_metadata) {
  const metadatas = []
  try {
    for (metadata of new_metadata) {
      metadata_json = JSON.parse(metadata)
      console.log('metadata_json:', metadata_json)
      metadatas.push(metadata_json)
    }
  } catch (e) {
    console.warn(e)
  }
  return metadatas
}


  
async function getSettings(){
  payload = {}
  try{
    

    numberOfImages = document.querySelector('#tiNumberOfImages').value
    numberOfSteps = document.querySelector('#tiNumberOfSteps').value
  const prompt = html_manip.getPrompt()
  const negative_prompt = html_manip.getNegativePrompt()
  const hi_res_fix = html_manip.getHiResFixs()
  // console.log("prompt:",prompt)
  // console.log("negative_prompt:",negative_prompt)
  const model_index = document.querySelector('#mModelsMenu').selectedIndex
  const cfg_scale = document.querySelector('#slCfgScale').value
  //  const model_index = document.querySelector("#")
  const seed = document.querySelector('#tiSeed').value
  const mask_blur = document.querySelector('#slMaskBlur').value
  const inpaint_full_res_padding = document.querySelector('#slInpaintPadding').value

  console.dir(numberOfImages)
  const bUsePromptShortcut = document.getElementById('chUsePromptShortcut').checked
  let prompt_shortcut_ui_dict = {}
  try {
    let prompt_shortcut_string = document.getElementById('taPromptShortcut').value
    prompt_shortcut_ui_dict = JSON.parse(prompt_shortcut_string)
  } catch (e) {
    console.warn(`warning prompt_shortcut_ui_dict is not valid Json obj: ${e}`)
    prompt_shortcut_ui_dict = {}
  }
  
  // const slider_width = document.getElementById("slWidth").value
  // gWidth = getWidthFromSlider(slider_width)
  const width = html_manip.getWidth()
  const height = html_manip.getHeight()
  const hWidth = html_manip.getSliderSdValue('hrWidth',64)
  const hHeight = html_manip.getSliderSdValue('hrHeight',64)
  console.log("Check")
  
  const uniqueDocumentId = await getUniqueDocumentId()
  const h_denoising_strength = html_manip.getSliderSdValue('hrDenoisingStrength',0.01)
  console.log("Check2")
  
  const sampler_name = html_manip.getCheckedSamplerName()
  const mode = html_manip.getMode()
  
  
  let denoising_strength = h_denoising_strength
  if (mode == 'inpaint' || mode == 'outpaint')
  {
    var g_use_mask_image = true
    payload['inpaint_full_res'] =
    document.getElementById('chInpaintFullRes').checked
    payload['inpaint_full_res_padding'] = inpaint_full_res_padding *4
    
    console.log('g_use_mask_image is ', g_use_mask_image)
    console.log('g_init_image_mask_name is ', g_init_image_mask_name)
    payload['init_image_mask_name'] = g_init_image_mask_name
    payload['inpainting_fill'] = g_inpainting_fill
  }
  else if(mode == 'img2img'){
    var g_use_mask_image = false
    delete payload['inpaint_full_res'] //  inpaint full res is not available in img2img mode
    delete payload['inpaint_full_res_padding']
    delete payload['init_image_mask_name']
    delete payload['inpainting_fill']
  }

  if (g_sd_mode == 'img2img' || g_sd_mode == 'inpaint' || g_sd_mode== 'outpaint') {
    

    console.log(`g_use_mask_image:? ${g_use_mask_image}`)

    denoising_strength = html_manip.getDenoisingStrength()
    payload['denoising_strength'] = denoising_strength
    payload['init_image_name'] = g_init_image_name


    
  }






  payload = {...payload,
    prompt: prompt,
    negative_prompt: negative_prompt,
    steps: numberOfSteps,
    // n_iter: numberOfImages,
    sampler_index: sampler_name,
    width: width,
    height: height,
    enable_hr : hi_res_fix,
    firstphase_width: hWidth,
    firstphase_height: hHeight,
    denoising_strength: denoising_strength,
    batch_size: numberOfImages,
    cfg_scale: cfg_scale,
    seed: seed,
    mask_blur: mask_blur,
    use_prompt_shortcut: bUsePromptShortcut,
    prompt_shortcut_ui_dict: prompt_shortcut_ui_dict,
    uniqueDocumentId: uniqueDocumentId,
    mode:mode
  }

}
catch(e){
  console.error(e)
}
  return payload
}

async function generateTxt2Img(settings){
  let json = {}
  try{

    json = await sdapi.requestTxt2Img(payload)
  }catch(e) {
    console.warn(e)
    json = {}
  }
  
  return json
}

async function hasSelectionChanged(new_selection,old_selection){
  
  if (new_selection.left === old_selection.left &&
    new_selection.bottom === old_selection.bottom &&
    new_selection.right === old_selection.right &&
    new_selection.top === old_selection.top)
  {
    return false

  }
  else{
    return true
  }

}
function checkIfSelectionIsValid(selection){
if (
  selection.hasOwnProperty('left') &&
  selection.hasOwnProperty('right') &&
  selection.hasOwnProperty('top') &&
  selection.hasOwnProperty('bottom')
) {
  return true
}

return false
} 
async function easyModeGenerate(){
  
  
  const isSelectionAreaValid = await psapi.checkIfSelectionAreaIsActive()
  if (!isSelectionAreaValid){      
    await psapi.promptForMarqueeTool()        
    return null
  }
    

  const mode = html_manip.getMode()
  // const settings = await getSettings()
  console.log("easyModeGenerate mdoe: ",mode)
  if (checkIfSelectionIsValid(g_selection) ){// check we have an old selection stored
    const new_selection = await psapi.getSelectionInfoExe()
    if(await hasSelectionChanged(new_selection,g_selection))// check the new selection is difference than the old
    {// end current session 
      g_selection = new_selection
      try{

        endGenerationSession()
        await acceptAll()
        
      }catch(e){
        console.warn(e)
      }

      
    }
  }else{// store selection value
    g_selection = await psapi.getSelectionInfoExe()
  }
  
if (g_is_generation_session_active) {
  //active session
  //
  if (g_generation_session_mode !== mode) {
    //active session but it's a new mode

    endGenerationSession()
    await acceptAll()
    //accept all
    g_generation_session_mode = mode
  } 
} else {
  // new session
  g_generation_session_mode = mode
}


  
  
  if(mode === "txt2img"){
    const settings = await getSettings()

    await generate(settings)
  }
  else if (mode === generationMode['Img2Img']){
    const isSelectionAreaValid = await psapi.checkIfSelectionAreaIsActive()
    
    if (isSelectionAreaValid){    
    await snapAndFillHandler()
    const settings = await getSettings()
    await generate(settings)
    }else{
      psapi.promptForMarqueeTool()        

    }
  }
  else if(mode === "inpaint" ){
    if(isSelectionAreaValid){

      await btnInitInpaintHandler()
      const settings = await getSettings()
      await generate(settings)
    }else{
      psapi.promptForMarqueeTool()        
      
    }
  }
  else if(mode === "outpaint"){
    
    const isSelectionAreaValid = await psapi.checkIfSelectionAreaIsActive()
    
    if (isSelectionAreaValid){
      await easyModeOutpaint()
      const settings = await getSettings()
      generate(settings)

    }
    else{
      psapi.promptForMarqueeTool()        

    }

    }

}
async function generate(settings){

  try{
    //pre generation
    // toggleGenerateInterruptButton(true)
    
    const isFistGeneration = !(g_is_generation_session_active) // check if this is the first generation in the session 
    g_is_generation_session_active = true// active
    sessionStartHtml(g_is_generation_session_active)
    // toggleTwoButtons(true,'btnGenerate','btnInterrupt')
    toggleTwoButtonsByClass(true,'btnGenerateClass','btnInterruptClass')
    g_can_request_progress = true
    //wait 2 seconds till you check for progress
    setTimeout(function () {
      progressRecursive()
  
    }, 2000)
  
  
  console.log(settings)

  g_request_status = requestState['Generate']
  let json = {}
  if (g_sd_mode == 'txt2img') {
    json = await generateTxt2Img(settings)
   }
   else if(g_sd_mode == 'img2img' || g_sd_mode =='inpaint'){
     json = await sdapi.requestImg2Img(settings)
 
   } 

   if(g_sd_mode == 'outpaint'){
    // await easyModeOutpaint()
    json = await sdapi.requestImg2Img(settings)
    

    // await setTimeout(async ()=> {
    //   json = await sdapi.requestImg2Img(settings)

    // },5000)

   }
   if(g_request_status === requestState['Interrupt'])
   {
    //when generate request get interrupted. reset progress bar to 0, discard any meta data and images returned from the proxy server by returning from the function.
    updateProgressBarsHtml(0)
    //check whether request was "generate" or "generate more"
    //if it's generate discard the session 
    if(isFistGeneration){
      endGenerationSession()
      //delete all mask related layers
      await discard()// clean viewer tab and the mask related layers
    }
    return null
   }

   // check if json is empty {}, {} means the proxy server didn't return a valid data
   if(Object.keys(json).length === 0)
   {
    if(isFistGeneration){
      endGenerationSession()
      //delete all mask related layers
      await discard()// clean viewer tab and the mask related layers
    }
    return null
   }
    //post generation: will execute only if the generate request doesn't get interrupted  
    //get the updated metadata from json response

  g_metadatas = updateMetadata(json.metadata)

  //finished generating, set the button back to generate
  
  // toggleTwoButtons(false,'btnGenerate','btnInterrupt')
  toggleTwoButtonsByClass(false,'btnGenerateClass','btnInterruptClass')
  g_can_request_progress = false

  gImage_paths = json.image_paths
  //open the generated images from disk and load them onto the canvas
  if(isFistGeneration){//this is new generation session

    g_image_path_to_layer = await ImagesToLayersExe(gImage_paths)
    g_number_generation_per_session = 1
  }
  else{// generation session is active so we will generate more
    const last_images_paths = await ImagesToLayersExe(gImage_paths)
    g_image_path_to_layer = {...g_image_path_to_layer, ...last_images_paths}
    g_number_generation_per_session++
    

  }
  //update the viewer
  await loadViewerImages()


}catch(e){
  console.error(`btnGenerate.click(): `,e)
  
}
}

// async function generateMore(settings){

//   try{
//     //pre generation
//     // toggleGenerateInterruptButton(true)
//     // toggleTwoButtons(true,'btnGenerateMore','btnInterruptMore')
//     toggleTwoButtonsByClass(false,'btnGenerateClass','btnInterruptClass')
//     g_can_request_progress = true

//     //wait 2 seconds till you check for progress
//     setTimeout(function () {
//       progressRecursive()
  
//     }, 2000)
  
  
//   console.log(settings)

  
//   if (g_sd_mode == 'txt2img') {
//     json = await generateTxt2Img(settings)
//    }
//    else if(g_sd_mode == 'img2img' || g_sd_mode =='inpaint' || g_sd_mode =='outpaint'){
//      json = await sdapi.requestImg2Img(settings)
 
//    } 

//   //post generation
//   //get the updated metadata from json response
//   g_metadatas = updateMetadata(json.metadata)
//   //set button to generate
//   // toggleGenerateInterruptButton(false)
//   // toggleTwoButtons(false,'btnGenerateMore','btnInterruptMore')
//   toggleTwoButtonsByClass(false,'btnGenerateClass','btnInterruptClass')
//   g_can_request_progress = false
  
//   gImage_paths = json.image_paths
//   //open the generated images from disk and load them onto the canvas
//   const last_images_paths = await ImagesToLayersExe(gImage_paths)
//   g_image_path_to_layer = {...g_image_path_to_layer, ...last_images_paths}
//   //update the viewer
//   loadViewerImages()

// }catch(e){
//   console.error(`btnGenerate.click(): `,e)
  
// }
// }



Array.from(document.getElementsByClassName('btnGenerateClass')).forEach(btn =>{
  btn.addEventListener('click', async ()=>{
    // const settings = await getSettings()
    // generate(settings)
    easyModeGenerate()
  })
  
})




document
  .getElementById('btnRefreshModels')
  .addEventListener('click', (e)=>{
    refreshUI()
    tempDisableElement(e.target,3000)
  }
    )

document.querySelector('#mModelsMenu').addEventListener('change', evt => {
  const model_index = evt.target.selectedIndex
  console.log(`Selected item: ${evt.target.selectedIndex}`)
  let model = g_models[0]
  if (model_index < g_models.length) {
    model = g_models[model_index]
  }
  // g_model_name = `${model.model_name}.ckpt`
  g_model_title = model.title
  console.log('g_model_title: ', g_model_title)
  sdapi.requestSwapModel(g_model_title)
})

// document.getElementById('btnGetActiveLayer').addEventListener('click', getActiveLayer)
// document.getElementById('btnScaleDown').addEventListener('click', scaleDownLayer)
// document.getElementById('btnSelectionInfo').addEventListener('click', getSelectionInfo)
document
  .getElementById('btnLayerToSelection')
  .addEventListener('click', helper.layerToSelection)

// document.getElementById('bGetInitImage').addEventListener('click', () => {
//   sdapi.getInitImage(g_init_image_name)
// })

// async function setInitImage () {
//   // await exportHelper.exportPng()
//   try {
//     const layer = await app.activeDocument.activeLayers[0]
//     old_name = layer.name 
//     // await psapi.exportPng(random_session_id)
//     image_name = psapi.layerNameToFileName(old_name,layer.id,random_session_id)
//     image_name = `${image_name}.png`
    
    
//     await psapi.newExportPng(layer,image_name)
    
//     // image_name = psapi.layerToFileName(layer,random_session_id)

//     g_init_image_name = image_name
//     console.log(image_name)
//     const image_src = await sdapi.getInitImage(g_init_image_name)
//     let ini_image_element = document.getElementById('init_image')
//     ini_image_element.src = image_src
//   } catch (e) {
//     console.error(`setInitImage error:, ${e}`)
//   }
// }
// document.getElementById('bSetInitImage').addEventListener('click', setInitImage)
document.getElementById('bSetInitImage').addEventListener('click', async ()=>  {
  const layer = await app.activeDocument.activeLayers[0]
  psapi.setInitImage(layer, random_session_id)
})

document.getElementById('bSetInitImageMask').addEventListener('click', async ()=>  {
  const layer = await app.activeDocument.activeLayers[0]
  psapi.setInitImageMask(layer, random_session_id)
})
function moveElementToAnotherTab(elementId, newParentId){
  const element = document.getElementById(elementId)
  document.getElementById(newParentId).appendChild(element)
  
}

// moveElementToAnotherTab("batchNumberUi","batchNumberViewerTabContainer")
function updateProgressBarsHtml(new_value){
  document.querySelectorAll('.pProgressBars').forEach(el =>{
    // id = el.getAttribute("id")
    // console.log("progressbar id:", id)
    el.setAttribute('value',new_value)
  })
  document.querySelector('#pProgressBar').value
}
async function progressRecursive () {
  let json = await sdapi.requestProgress()
  // document.querySelector('#pProgressBar').value = json.progress * 100
  progress_value = json.progress * 100
  updateProgressBarsHtml(progress_value)
  if (json.progress > 0 && g_can_request_progress == true) {
    setTimeout(async ()=>{
      await progressRecursive()
    },500)
    
  }
}

// document
//   .getElementById('bGetProgress')
//   .addEventListener('click', progressRecursive)

function changeImage () {
  let img = document.getElementById('img1')
  img.src = 'https://source.unsplash.com/random'
}

// document.getElementById('btnChangeImage').addEventListener('click', changeImage)

async function imageToSmartObject () {
  const { batchPlay } = require('photoshop').action
  const { executeAsModal } = require('photoshop').core

  try {
    // const file = await fs.getFileForOpening()
    // token = await fs.getEntryForPersistentToken(file);
    // const entry = await fs.getEntryForPersistentToken(token);
    // const session_token = await fs.createSessionToken(entry);
    // // let token = await fs.createSessionToken(entry)
    await executeAsModal(
      async () => {
        console.log('imageToSmartObject():')
        const storage = require('uxp').storage
        const fs = storage.localFileSystem
        let pluginFolder = await fs.getPluginFolder()
        let img = await pluginFolder.getEntry('output- 1672730735.1670313.png')
        const result = await batchPlay(
          [
            {
              _obj: 'placeEvent',
              ID: 95,
              null: {
                _path: img,
                _kind: 'local'
              },
              freeTransformCenterState: {
                _enum: 'quadCenterState',
                _value: 'QCSAverage'
              },
              offset: {
                _obj: 'offset',
                horizontal: {
                  _unit: 'pixelsUnit',
                  _value: 0
                },
                vertical: {
                  _unit: 'pixelsUnit',
                  _value: 0
                }
              },
              replaceLayer: {
                _obj: 'placeEvent',
                from: {
                  _ref: 'layer',
                  _id: 56
                },
                to: {
                  _ref: 'layer',
                  _id: 70
                }
              },
              _options: {
                dialogOptions: 'dontDisplay'
              }
            }
          ],
          {
            synchronousExecution: true,
            modalBehavior: 'execute'
          }
        )
      },
      {
        commandName: 'Create Label'
      }
    )
  } catch (e) {
    console.log('imageToSmartObject() => error: ')
    console.warn(e)
  }
}

// document.getElementById('btnNewLayer').addEventListener('click', imageToSmartObject )

async function fillLayer () {
  // User picks an image file
  const storage = require('uxp').storage
  const fs = storage.localFileSystem
  let imageFile = await fs.getFileForOpening({
    types: storage.fileTypes.images
  })

  // Create ImageFill for this image
  const ImageFill = require('scenegraph').ImageFill
  let fill = new ImageFill(imageFile)

  let layer = getActiveLayer()
  layer.fillImage()
}
//fillLayer()

// Set fill of first selected item
// selection.items[0].fill = fill;

async function placeEmbedded () {
  console.log('placeEmbedded():')

  const { batchPlay } = require('photoshop').action
  const { executeAsModal } = require('photoshop').core

  const storage = require('uxp').storage
  const fs = storage.localFileSystem
  entry = await fs.getFileForOpening()
  let token = fs.createSessionToken(entry)

  try {
    executeAsModal(async () => {
      const result = await batchPlay(
        [
          {
            _obj: 'placeEvent',
            ID: 6,
            null: {
              _path: token,
              _kind: 'local'
            },
            freeTransformCenterState: {
              _enum: 'quadCenterState',
              _value: 'QCSAverage'
            },
            offset: {
              _obj: 'offset',
              horizontal: {
                _unit: 'pixelsUnit',
                _value: 0
              },
              vertical: {
                _unit: 'pixelsUnit',
                _value: 0
              }
            },
            _isCommand: false,
            _options: {
              dialogOptions: 'dontDisplay'
            }
          }
        ],
        {
          synchronousExecution: true,
          modalBehavior: 'fail'
        }
      )
    })
  } catch (e) {
    console.warn(e)
  }
}

// document.getElementById('btnImageFileToLayer').addEventListener('click', placeEmbedded)

// open an image in the plugin folder as new document
async function openImageAction () {
  const storage = require('uxp').storage
  const fs = storage.localFileSystem
  try {
    let pluginFolder = await fs.getPluginFolder()
    // let theTemplate = await pluginFolder.getEntry("/image1.png");
    //directory where all image's request folders are. one folder for each request
    const relative_dir_path = `./server/python_server/`

    const image_path = `${relative_dir_path}/${gCurrentImagePath}`
    // 'C:/Users/abdul/Desktop/photoshop_plugins/my_plugin_1/server/python_server/output- 1670544300.95411.png'
    let theTemplate = await pluginFolder.getEntry(image_path)

    await app.open(theTemplate)
  } catch (e) {
    console.warn("couldn't open image ", e)
  }
}

async function openImageExe () {
  await require('photoshop').core.executeAsModal(openImageAction)
}
// document.getElementById('btnImagesToLayers').addEventListener('click',openImageExe)

// convert a layer to a smart object
async function convertToSmartObjectAction () {
  const batchPlay = require('photoshop').action.batchPlay
  const result = await batchPlay(
    [
      {
        _obj: 'newPlacedLayer',
        _isCommand: true,
        _options: {
          dialogOptions: 'dontDisplay'
        }
      }
    ],
    {}
  )
}
async function convertToSmartObjectExe () {
  await require('photoshop').core.executeAsModal(convertToSmartObjectAction)
}

async function ImagesToLayersExe (images_paths) {
  image_path_to_layer = {}
  console.log("ImagesToLayersExe: images_paths: ",images_paths)
  for (image_path of images_paths) {
    gCurrentImagePath = image_path
    console.log(gCurrentImagePath)
    await openImageExe() //local image to new document
    await convertToSmartObjectExe() //convert the current image to smart object
    await stackLayers() // move the smart object to the original/old document
    await helper.layerToSelection() //transform the new smart object layer to fit selection area
    layer = await app.activeDocument.activeLayers[0]
    image_path_to_layer[image_path] = layer 
    // await reselect(selectionInfo)
  }
  return image_path_to_layer
}

// document.getElementById('btnLoadImages').addEventListener('click',ImagesToLayersExe)

//stack layer to original document
async function stackLayers () {
  //workingDoc is the project you are using stable diffusion in
  const workingDoc = app.documents[0]
  //you should not open two multiple projects this script assume there is only one project opened
  const docsToStack = app.documents.filter(doc => doc._id !== workingDoc._id)
  let docCounter = 0

  // execute as modal is required for functions that change the state of Photoshop or documents
  // think of it as a function that 'wraps' yours and tells Photoshop to go into a modal state and not allow anything to interrupt it from doing whatever is contained in the executeAsModal
  // we also call it with the await keyword to tell JS that we want to wait for it to complete before moving on to later code (in this case there isn't any though)
  await require('photoshop').core.executeAsModal(() => {
    // increment counter
    docCounter++

    // loop through other open docs
    for (const doc of docsToStack) {
      // flatten
      // doc.flatten();

      // rename layer with counter
      doc.layers[0].name = `Layer ${docCounter}`

      // increment counter
      docCounter++

      // duplicate layer to docZero
      doc.layers[0].duplicate(workingDoc)

      // close doc
      doc.closeWithoutSaving()
    }
  })
}
document.getElementById('collapsible').addEventListener('click', function () {
  this.classList.toggle('active')
  var content = this.nextElementSibling
  console.log('content:', content)
  if (content.style.display === 'block') {
    content.style.display = 'none'
    this.textContent = 'Show Samplers'
  } else {
    content.style.display = 'block'
    this.textContent = 'Hide Samplers'
  }
  
})

function removeInitImageFromViewer(){

}
function removeMaskFromViewer(){

}


async function NewViewerImageClickHandler(img,viewer_obj_owner){

    try{

      
  img.addEventListener('click',async (e)=>{
    if(g_isViewerMenuDisabled){
      return g_isViewerMenuDisabled
    }

    // e.target.classList.add("viewerImgSelected")
    // viewer_obj_owner.isAccepted = true
    // console.log("viewer_obj_owner: viewer_obj_owner.layer.name: ",viewer_obj_owner.layerName())
    // e.target.classList.toggle("viewerImgSelected")
    //  e.target.style.border="3px solid #6db579"
    //turn off all layers
    //select the layer this image represent and turn it on 
    

    await executeAsModal(async ()=>{
      // const img = e.target
      // const layer_id = parseInt(img.dataset.image_id)
      // console.log("the layer id = ",layer_id)
      
      // let selectedViewerImageObj
      // Array.isArray(layer)
      
      //turn off all layers linked the viewer tab
      console.log("the current g_viewer_objects is: ",g_viewer_objects)
      for (const [path, viewer_object] of Object.entries(g_viewer_objects)) {
        try{
          if(viewer_object.getHighlight()){
            viewer_object.state = viewer.ViewerObjState["Unlink"]
          }
          else{
            viewer_object.state = viewer.ViewerObjState["Delete"]
          }
          viewer_object.visible(false)
          viewer_object.active(false)
          
          console.log("viewer_object.path: ",viewer_object.path)
          console.log("viewer_object.info(): ")
          viewer_object.info()

        } catch (e){
          console.error("cannot hide a layer: ",e)
        } 
      }
      
      // for(viewerImageObj of viewer_layers){
      //     try{
      //       //viewerImageObj.visible(false)
            
      //       //make all layers of that entry invisible
      //       viewerImageObj.visible(false)
            
      //       //if the layer id of the first layer in the group container
      //       //viewerImageObj.isSameLayer(layer_id)
      //       // if (viewerImageObj.isSameLayer(layer_id)){
      //       //   selectedViewerImageObj = viewerImageObj
      //       // }
      //     } catch (e){
      //       console.error("cannot hide a layer: ",e)
      //     } 
      //   }

    
    
        // selectedViewerImageObj.visible(true)
        // selectedViewerImageObj.select(true) 
        viewer_obj_owner.state = viewer.ViewerObjState['Unlink']
        viewer_obj_owner.visible(true)
        viewer_obj_owner.select(true)
        viewer_obj_owner.active(true)
        console.log("viewer_obj_owner.path: ",viewer_obj_owner.path)
        console.log("viewer_obj_owner.info(): ")
        viewer_obj_owner.info()
        if(e.shiftKey)
        {
          viewer_obj_owner.setHighlight(true)
          // e.target.classList.add("viewerImgSelected")
        }else if(e.altKey){
          viewer_obj_owner.setHighlight(false)
          // e.target.classList.remove("viewerImgSelected")

        }
        
        
        


    })

  })

} catch(e){
  console.warn(e)
} 
}
function createViewerImgHtml(output_dir_relative,image_path){

  const img = document.createElement('img')
  img.src = `${output_dir_relative}/${image_path}`
  img.className = "viewer-image"
  console.log("image_path: ",image_path)
  // img.dataset.image_id = layer_id
  // img.dataset.image_path = image_path // image_path is not the same as src 
  return img
}

function toggleLayerVisibility(layer, b_on){
try{
   layer.visible = b_on
}catch(e){
  console.warn(e)
}
}
async function turnMaskVisible (
  b_mask_group_on,
  b_white_mask_on,
  b_solid_black_mask_on
) {
  //will turn a mask group, white layer mask, and the solid black layer on and off
  try {
    await executeAsModal(() => {
      toggleLayerVisibility(g_mask_group, b_mask_group_on)
      toggleLayerVisibility(g_white_mask, b_white_mask_on)
      toggleLayerVisibility(g_solid_black_mask, b_solid_black_mask_on)
    })
  } catch (e) {
    console.warn(e)
  }
}



async function loadViewerImages(){
  try{
    //get the images path
    console.log("g_image_path_to_layer:", g_image_path_to_layer)

    const output_dir_relative = "./server/python_server/"
    const container = document.getElementById("divViewerImagesContainer")
    
    // while(container.firstChild){
    // container.removeChild(container.firstChild);
    // }
    image_paths = Object.keys(g_image_path_to_layer);
    console.log("image_paths: ",image_paths)
    let i = 0
    
    
   
    const viewer_layers = [] 
    // Object.keys(g_image_path_to_layer).map(path =>  new viewer.OutputImage(g_image_path_to_layer[path],path))

  

    
    if(g_init_image_related_layers.hasOwnProperty('init_image_group') )
     {
      const path =  `./server/python_server/init_images/'${g_init_image_name}`
      
      if (!g_viewer_objects.hasOwnProperty(path)){

        const viewerInitImage= new viewer.InitImage(g_init_image_related_layers['init_image_group'],g_init_image_related_layers['init_image_layer'],g_init_image_related_layers['solid_white'],path)
        
        
        const init_img_html = createViewerImgHtml('./server/python_server/init_images/',g_init_image_name)
        container.appendChild(init_img_html)
        viewerInitImage.setImgHtml(init_img_html)
        g_viewer_objects[path] = viewerInitImage
        await NewViewerImageClickHandler(init_img_html,viewerInitImage)// create click handler for each images 
      }
    }

    
  if (g_mask_related_layers.hasOwnProperty('mask_group')) {
  const path = `./server/python_server/init_images/'${g_init_image_mask_name}`
  if (!g_viewer_objects.hasOwnProperty(path)) {
    const viewerInitMaskImage = new viewer.InitMaskImage(
      g_mask_related_layers['mask_group'],
      g_mask_related_layers['white_mark'],
      g_mask_related_layers['solid_black'],
      path
    )

    const mask_img_html = createViewerImgHtml(
      './server/python_server/init_images/',
      g_init_image_mask_name
    )

    container.appendChild(mask_img_html)
    viewerInitMaskImage.setImgHtml(mask_img_html)
    g_viewer_objects[path] = viewerInitMaskImage
    await NewViewerImageClickHandler(mask_img_html, viewerInitMaskImage) // create click handler for each images ,viewer_layers)// create click handler for each images
    // await viewerImageClickHandler(mask_img_html,viewer_layers)// create click handler for each images
  }
}



    
    
    
    console.log("image_paths: ",image_paths)
    for (image_path of image_paths){
      
      //check if viewer obj already exist by using the path on hard drive 
      if(!g_viewer_objects.hasOwnProperty(image_path)){
        //create viewer object if it doesn't exist 
        const viewer_obj =  new viewer.OutputImage(g_image_path_to_layer[image_path],image_path)
        g_viewer_objects[image_path] = viewer_obj 
        
        //create an html image element and attach it container, and link it to the viewer obj
        const img = createViewerImgHtml(output_dir_relative,image_path,g_image_path_to_layer[image_path].id)
        viewer_obj.setImgHtml(img)
        container.appendChild(img)
        
        
        //add on click event handler to the html img 
        await NewViewerImageClickHandler(img,viewer_obj)
       
      }

      // i++
    }
    
      

    
  }catch(e){
    console.error(`loadViewer images: `,e)
  }

}

async function deleteNoneSelected (viewer_objects) {
  try{

  
  // visible layer
  //delete all hidden layers

await executeAsModal(async ()=>{

  for (const [path, viewer_object] of Object.entries(viewer_objects)) {
    try{

      // if (viewer_object.getHighlight() || viewer_object.is_active){//keep it if it's highlighted
      // const path = viewer_object.path
      if(viewer_object.state ===  viewer.ViewerObjState['Unlink']){
      viewer_object.unlink() // just delete the html image but keep the layer in the layers stack 
      viewer_object.visible(true)//make them visiable on the canvas
    }else if(viewer_object.state === viewer.ViewerObjState['Delete']){// delete it if it isn't  highlighted
      await viewer_object.delete()//delete the layer from layers stack
      
    }
    delete g_image_path_to_layer[path]
    
  }catch(e){
    console.warn(e)
  }
}
g_viewer_objects = {}
g_image_path_to_layer = {}
})
  }
  catch(e){
    console.warn(e)
  }

}

async function deleteNoneSelectedAndReloadViewer(){

  await deleteNoneSelected(g_viewer_objects)
  console.log("g_image_path_to_layer: ",g_image_path_to_layer)
  await loadViewerImages() // maybe we should pass g_image_path_to_layer instead of it been global
}


// document.getElementById('btnLoadViewer').addEventListener('click', loadViewerImages) 

document.getElementById('btnLoadHistory').addEventListener('click',async function(){
  try{

    const output_dir_relative = "./server/python_server/"
    const container = document.getElementById("divHistoryImagesContainer")
    const uniqueDocumentId = await getUniqueDocumentId()
    const [image_paths, metadata_jsons] = await sdapi.loadHistory(uniqueDocumentId)
    
    while(container.firstChild){
    container.removeChild(container.firstChild);
    }
    
    let i = 0
    for (image_path of image_paths){
      
      const img = document.createElement('img')
      img.src = `${output_dir_relative}/${image_path}`
      img.className = "history-image"
      img.dataset.metadata_json_string = JSON.stringify(metadata_jsons[i])
      container.appendChild(img)
      img.addEventListener('click',(e)=>{
        const metadata_json = JSON.parse(e.target.dataset.metadata_json_string)
        console.log("metadata_json: ",metadata_json)
        // document.querySelector('#tiSeed').value = metadata_json.Seed
        document.querySelector('#historySeedLabel').textContent = metadata_json.Seed
        autoFillInSettings(metadata_json)
      })
      i++
    }
    
  }catch(e){
    console.warn(`loadHistory warning: ${e}`)
  }

}) 
document.getElementById('btnLoadPromptShortcut').addEventListener('click',async function(){
  try{

    prompt_shortcut = await sdapi.loadPromptShortcut()
    var JSONInPrettyFormat = JSON.stringify(prompt_shortcut, undefined, 4);
    document.getElementById('taPromptShortcut').value = JSONInPrettyFormat
  }catch(e){
    console.warn(`loadPromptShortcut warning: ${e}`)
  }

}) 


document
  .getElementById('btnSavePromptShortcut')
  .addEventListener('click', async function () {
    try {
      

      const r1 = await dialog_box.prompt(
        'Are you sure you want to save prompt shortcut?',
        "This will override your old prompt shortcut file, you can't undo this operation",
        ['Cancel', 'Save']
      )
      if ((r1 || 'Save') !== 'Save') {
        /* cancelled or No */
        console.log("cancel")
      } else {
        /* Yes */
        console.log("Save")
        
      
      
        prompt_shortcut_string = document.getElementById('taPromptShortcut').value
        let prompt_shortcut =  JSON.parse(prompt_shortcut_string)
  
  
        prompt_shortcut = await sdapi.savePromptShortcut(prompt_shortcut)
        // var JSONInPrettyFormat = JSON.stringify(prompt_shortcut, undefined, 4);
        console.log('prompt_shortcut was saved: ', prompt_shortcut)
      
      }
    } catch (e) {
      console.warn(`savePromptShortcut warning: ${e}`)
    }



     
  })


