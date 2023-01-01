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
  autoFillInHeight

}