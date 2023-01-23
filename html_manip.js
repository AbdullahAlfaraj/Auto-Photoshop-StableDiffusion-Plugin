////// Start Prompt//////////

function getPrompt(){
  const prompt = document.getElementById('taPrompt').value
  return prompt
}

function autoFillInPrompt(prompt_value){
  document.getElementById('taPrompt').value = prompt_value
}

////// End Prompt//////////

////// Start Negative Prompt//////////

function getNegativePrompt(){
  const negative_prompt = document.getElementById('taNegativePrompt').value
  return negative_prompt
}

function autoFillInNegativePrompt(negative_prompt_value){
  document.getElementById('taNegativePrompt').value = negative_prompt_value
}

////// End Negative Prompt//////////



////// Start Width//////////


document.getElementById('slWidth').addEventListener('input', evt => {
  const width = evt.target.value * 64
  document.getElementById('lWidth').textContent = width
})

function getWidth(){
  slider_width = document.getElementById('slWidth').value
  const width = slider_width * 64
  return width 
}

function autoFillInWidth(width_value){
  document.getElementById('slWidth').value = `${width_value / 64}`
  //update the label
  document.getElementById('lWidth').innerHTML = `${width_value}`
}
////// End Width//////////

////// Start Height//////////


document.getElementById('slHeight').addEventListener('input', evt => {
  const height = evt.target.value * 64
  document.getElementById('lHeight').textContent = height
})

function getHeight(){
  slider_value = document.getElementById('slHeight').value
  const height = slider_value * 64
  return height 
}

function autoFillInHeight(height_value){
  document.getElementById('slHeight').value = `${height_value / 64}`
  //update the label
  document.getElementById('lHeight').innerHTML = `${height_value}`
}
////// End Height//////////


////// Start Denoising Strength//////////
document.querySelector('#slDenoisingStrength').addEventListener('input', evt => {
  const label_value = evt.target.value / 100
  // console.log("label_value: ", label_value)
  document.getElementById('lDenoisingStrength').innerHTML = `${label_value}`

})

//get the value that is relevant to stable diffusion
function getDenoisingStrength () {
  const slider_value = document.getElementById('slDenoisingStrength').value
  const denoising_strength_value = slider_value / 100.0
  return denoising_strength_value
}

// display the value the user need to see in all elements related to denoising strength attribute
function autoFillInDenoisingStrength (denoising_strength_value) {
  //update the slider
  document.getElementById('slDenoisingStrength').value = `${
    denoising_strength_value / 100
  }`
  //update the label
  document.getElementById(
    'lDenoisingStrength'
  ).innerHTML = `${denoising_strength_value}`
}

////// End Denoising Strength//////////


////// Start Hi Res Fix//////////


document.getElementById('chHiResFixs').addEventListener('input', evt => {
  const label_value = evt.target.value / 100
  // console.log("label_value: ", label_value)
  document.getElementById('lDenoisingStrength').innerHTML = `${label_value}`

})

//binds visibility of hi res sliders to hi res checkbox
document.getElementById('chHiResFixs').addEventListener("change", function() {
  if (document.getElementById('chHiResFixs').checked) {
    document.getElementById('hrWidth').style.display = "block";
    document.getElementById('hrHeight').style.display = "block";
    } else {
      document.getElementById('hrWidth').style.display = "none";
      document.getElementById('hrHeight').style.display = "none";
    }
});


//get the value that is relevant to stable diffusion
function getHiResFixs() {
  const isChecked = document.getElementById('chHiResFixs').checked
  return isChecked
}

function setHiResFixs(isChecked) {
  document.getElementById('chHiResFixs').checked = isChecked
}


function sliderAddEventListener(slider_id,label_id,multiplier){
  document.getElementById(slider_id).addEventListener('input', evt => {
    const sd_value = evt.target.value * multiplier // convert slider value to SD ready value
    document.getElementById(label_id).textContent = sd_value
  })
}

//get the stable diffusion ready value from the slider with  "slider_id"
function getSliderSdValue(slider_id,multiplier){
  const slider_value = document.getElementById(slider_id).value
  const sd_value = slider_value * multiplier
  return sd_value 
}
function autoFillInSliderUi(sd_value,slider_id,label_id,multiplier){
  //update the slider
  document.getElementById(slider_id).value = `${sd_value * multiplier}`
  //update the label
  document.getElementById(label_id).innerHTML = `${sd_value}`
}

//hrWidth is from [1 to 32] * 64 => [64 to 2048]  
sliderAddEventListener('hrWidth', 'hWidth',64)
sliderAddEventListener('hrHeight', 'hHeight',64)

//convert hrDenoisingStrength  from  [1, 100] * 0.01 => [0.01 to 1]
sliderAddEventListener('hrDenoisingStrength','hDenoisingStrength',0.01)



function autoFillInHiResFixs(firstphase_width,firstphase_height) {
  setHiResFixs(true)
  //update the firstphase width slider and label
  autoFillInSliderUi(firstphase_width,'hrWidth','hWidth',1.0/64)
  //update the firstphase height slider and label
  autoFillInSliderUi(firstphase_height,'hrHeight','hHeight',1.0/64)
}
////// End Hi Res Fix//////////


////// Start Samplers//////////
function unCheckAllSamplers () {
  document.getElementsByClassName('rbSampler').forEach(e => e.removeAttribute('checked'))
}

function getSamplerElementByName(sampler_name){
  try{

    //assume the sampler_name is valid
    //return the first 
    //convert htmlCollection into an array, then user filter to get the radio button with the value equals to sampler_name
   const sampler_element = [...document.getElementsByClassName('rbSampler')].filter(e => e.value == sampler_name)[0]
  return sampler_element  
  }catch(e){
    console.warn(`Sampler '${sampler_name}' not found ${e}`)
  }

}

function getCheckedSamplerName(){
  //we assume that the samplers exist and loaded in html
  //return the name of the first checked sampler
  return  [...document.getElementsByClassName('rbSampler')].filter(e => e.checked == true)[0].value
}
function getMode(){
  return [...document.getElementsByClassName('rbMode')].filter(e => e.checked == true)[0].value
}

function checkSampler(sampler_name){
  sampler_element = getSamplerElementByName(sampler_name)
  sampler_element.checked = true
}
function autoFillInSampler(sampler_name){
  // unCheckAllSamplers()
  checkSampler(sampler_name)
}
////// End Samplers//////////

////// Start Models//////////


function getModelElementByHash(model_hash){
  try{

    //assume the model_hash is valid
    //return the first model menu item element with model_hash 
   const model_element = [...document.getElementsByClassName('mModelMenuItem')].filter(e => e.dataset.model_hash == model_hash)[0]
  return model_element  
  }catch(e){
    console.warn(`Model '${model_hash}' not found ${e}`)
  }
}
function getSelectedModelHash(){
  //return the hash of the first selected model menu item
  return  [...document.getElementsByClassName('mModelMenuItem')].filter(e => e.selected == true)[0].dataset.model_hash
}

function selectModelUi(model_hash){
  
  model_element = getModelElementByHash(model_hash)
  model_element.selected = true
}
function autoFillInModel(model_hash){
  // unCheckAllSamplers()
  model_element = getModelElementByHash(model_hash)
  selectModelUi(model_hash)
  // model_element.
  const model_title = model_element.dataset.model_title
  return model_title
}
////// End Models//////////

module.exports = {
  getPrompt,
  autoFillInPrompt,
  getNegativePrompt,
  autoFillInNegativePrompt,
  getDenoisingStrength,
  autoFillInDenoisingStrength,
  getWidth,
  autoFillInWidth,
  getHeight,
  autoFillInHeight,
  getSliderSdValue,
  autoFillInHiResFixs,
  getHiResFixs,
  setHiResFixs,
  autoFillInSliderUi,
  getCheckedSamplerName,
  autoFillInSampler,
  autoFillInModel,
  getMode

}