////// Start Prompt//////////

function getPrompt() {
  const prompt = document.getElementById("taPrompt").value
  return prompt
}

function autoFillInPrompt(prompt_value) {
  document.getElementById("taPrompt").value = prompt_value
}

////// End Prompt//////////

////// Start Negative Prompt//////////

function getNegativePrompt() {
  const negative_prompt = document.getElementById("taNegativePrompt").value
  return negative_prompt
}

function autoFillInNegativePrompt(negative_prompt_value) {
  document.getElementById("taNegativePrompt").value = negative_prompt_value
}

////// End Negative Prompt//////////

////// Start Width//////////

document.getElementById("slWidth").addEventListener("input", (evt) => {
  const width = evt.target.value * 64
  document.getElementById("lWidth").textContent = width
})

function getWidth() {
  slider_width = document.getElementById("slWidth").value
  const width = slider_width * 64
  return width
}

function getHrWidth() {
  slider_width = document.getElementById("hrWidth").value
  const width = slider_width * 64
  return width
}

function getHrHeight() {
  slider_width = document.getElementById("hrHeight").value
  const width = slider_width * 64
  return width
}
function autoFillInWidth(width_value) {
  document.getElementById("slWidth").value = `${width_value / 64}`
  //update the label
  document.getElementById("lWidth").innerHTML = `${width_value}`
}
////// End Width//////////

////// Start Height//////////

document.getElementById("slHeight").addEventListener("input", (evt) => {
  const height = evt.target.value * 64
  document.getElementById("lHeight").textContent = height
})

function getHeight() {
  slider_value = document.getElementById("slHeight").value
  const height = slider_value * 64
  return height
}

function autoFillInHeight(height_value) {
  document.getElementById("slHeight").value = `${height_value / 64}`
  //update the label
  document.getElementById("lHeight").innerHTML = `${height_value}`
}

function autoFillInHRHeight(height_value) {
  document.getElementById("hrHeight").value = `${height_value / 64}`
  //update the label
  document.getElementById("hHeight").innerHTML = `${height_value}`
}

function autoFillInHRWidth(height_value) {
  document.getElementById("hrWidth").value = `${height_value / 64}`
  //update the label
  document.getElementById("hWidth").innerHTML = `${height_value}`
}

////// End Height//////////

////// Start Denoising Strength//////////
document
  .querySelector("#slDenoisingStrength")
  .addEventListener("input", (evt) => {
    const label_value = evt.target.value / 100
    // console.log("label_value: ", label_value)
    document.getElementById("lDenoisingStrength").innerHTML = `${label_value}`
  })

//get the value that is relevant to stable diffusion
function getDenoisingStrength() {
  const slider_value = document.getElementById("slDenoisingStrength").value
  const denoising_strength_value = slider_value / 100.0
  return denoising_strength_value
}

// display the value the user need to see in all elements related to denoising strength attribute
function autoFillInDenoisingStrength(denoising_strength_value) {
  //sd denoising strength value range from [0,1] slider range from [0, 100]
  //update the slider
  document.getElementById("slDenoisingStrength").value = `${
    denoising_strength_value * 100
  }`
  //update the label
  document.getElementById(
    "lDenoisingStrength"
  ).innerHTML = `${denoising_strength_value}`
}

////// End Denoising Strength//////////

////// Start Hi Res Fix//////////

document.getElementById("chInpaintFullRes").addEventListener("click", (ev) => {
  const inpaint_padding_slider = document.getElementById("slInpaintPadding")

  if (ev.target.checked) {
    inpaint_padding_slider.style.display = "block"
  } else {
    inpaint_padding_slider.style.display = "none"
  }
})
document.getElementById("chHiResFixs").addEventListener("click", (ev) => {
  const container = document.getElementById("hi-res-sliders-container")

  if (ev.target.checked) {
    container.style.display = "flex"
  } else {
    container.style.display = "none"
  }
})
//get the value that is relevant to stable diffusion
function getHiResFixs() {
  const isChecked = document.getElementById("chHiResFixs").checked
  return isChecked
}

function setHiResFixs(isChecked) {
  document.getElementById("chHiResFixs").checked = isChecked
}

function sliderAddEventListener(slider_id, label_id, multiplier) {
  document.getElementById(slider_id).addEventListener("input", (evt) => {
    const sd_value = evt.target.value * multiplier // convert slider value to SD ready value
    document.getElementById(label_id).textContent = Number(sd_value).toFixed(2)
  })
}

//get the stable diffusion ready value from the slider with  "slider_id"
function getSliderSdValue(slider_id, multiplier) {
  const slider_value = document.getElementById(slider_id).value
  const sd_value = slider_value * multiplier
  return sd_value
}
function autoFillInSliderUi(sd_value, slider_id, label_id, multiplier) {
  //update the slider
  document.getElementById(slider_id).value = `${sd_value * multiplier}`
  //update the label
  document.getElementById(label_id).innerHTML = `${sd_value}`
}

//hrWidth is from [1 to 32] * 64 => [64 to 2048]
sliderAddEventListener("hrWidth", "hWidth", 64)
sliderAddEventListener("hrHeight", "hHeight", 64)

//convert hrDenoisingStrength  from  [1, 100] * 0.01 => [0.01 to 1]
sliderAddEventListener("hrDenoisingStrength", "hDenoisingStrength", 0.01)

function autoFillInHiResFixs(firstphase_width, firstphase_height) {
  //update the firstphase width slider and label
  autoFillInSliderUi(firstphase_width, "hrWidth", "hWidth", 1.0 / 64)
  //update the firstphase height slider and label
  autoFillInSliderUi(firstphase_height, "hrHeight", "hHeight", 1.0 / 64)
}
////// End Hi Res Fix//////////

////// Start Inpaint Mask Weight//////////
function autoFillInInpaintMaskWeight(sd_value) {
  //update the inpaint mask weight
  autoFillInSliderUi(
    sd_value,
    "slInpaintingMaskWeight",
    "lInpaintingMaskWeight",
    100
  )
}
////// End Inpaint Mask Weight//////////

////// Start Samplers//////////
function unCheckAllSamplers() {
  document
    .getElementsByClassName("rbSampler")
    .forEach((e) => e.removeAttribute("checked"))
}

function getSamplerElementByName(sampler_name) {
  try {
    //assume the sampler_name is valid
    //return the first
    //convert htmlCollection into an array, then user filter to get the radio button with the value equals to sampler_name
    const sampler_element = [
      ...document.getElementsByClassName("rbSampler"),
    ].filter((e) => e.value == sampler_name)[0]
    return sampler_element
  } catch (e) {
    console.warn(`Sampler '${sampler_name}' not found ${e}`)
  }
}

function getCheckedSamplerName() {
  //we assume that the samplers exist and loaded in html
  //return the name of the first checked sampler
  return [...document.getElementsByClassName("rbSampler")].filter(
    (e) => e.checked == true
  )[0].value
}
function getMode() {
  return [...document.getElementsByClassName("rbMode")].filter(
    (e) => e.checked == true
  )[0].value
}

function checkSampler(sampler_name) {
  sampler_element = getSamplerElementByName(sampler_name)
  sampler_element.checked = true
}
function autoFillInSampler(sampler_name) {
  // unCheckAllSamplers()
  checkSampler(sampler_name)
}
////// End Samplers//////////

////// Start Models//////////

function getModelElementByHash(model_hash) {
  try {
    //assume the model_hash is valid
    //return the first model menu item element with model_hash
    const model_element = [
      ...document.getElementsByClassName("mModelMenuItem"),
    ].filter((e) => e.dataset.model_hash == model_hash)[0]
    return model_element
  } catch (e) {
    console.warn(`Model '${model_hash}' not found ${e}`)
  }
}
function getModelHashByTitle(model_title) {
  //return find the model hash by it's title
  try {
    return [...document.getElementsByClassName("mModelMenuItem")].filter(
      (e) => e.dataset.model_title == model_title
    )[0].dataset.model_hash
  } catch (e) {
    console.warn(e)
  }
}

function getSelectedModelHash() {
  //return the hash of the first selected model menu item
  try {
    return [...document.getElementsByClassName("mModelMenuItem")].filter(
      (e) => e.selected == true
    )[0].dataset.model_hash
  } catch (e) {
    console.warn(e)
  }
}

function selectModelUi(model_hash) {
  model_element = getModelElementByHash(model_hash)
  model_element.selected = true
}

function autoFillInModel(model_hash) {
  // unCheckAllSamplers()
  model_element = getModelElementByHash(model_hash)
  selectModelUi(model_hash)
  // model_element.
  const model_title = model_element.dataset.model_title
  return model_title
}
////// End Models//////////

////// Start Init Image && Init Image Mask//////////

function getInitImageElement() {
  const ini_image_element = document.getElementById("init_image")
  return ini_image_element
}
function setInitImageSrc(image_src) {
  const ini_image_element = getInitImageElement()
  ini_image_element.src = image_src
}

function getInitImageMaskElement() {
  const ini_image_mask_element = document.getElementById("init_image_mask")
  return ini_image_mask_element
}
function setInitImageMaskSrc(image_src) {
  const ini_image_mask_element = getInitImageMaskElement()
  ini_image_mask_element.src = image_src
}
////// End Init Image && Init Image Mask//////////

////// Start Generate Buttons //////////

function getGenerateButtonsElements() {
  generate_buttons = [...document.getElementsByClassName("btnGenerateClass")]
  return generate_buttons
}
function setGenerateButtonsColor(addClassName, removeClassName) {
  const buttons = getGenerateButtonsElements()
  buttons.forEach((button) => {
    button.classList.add(addClassName)
    button.classList.remove(removeClassName)
  })
}

////// End Generate Buttons //////////

////// Start Servers Status //////////

function setAutomaticStatus(newStatusClass, oldStatusClass) {
  document.getElementById("automaticStatus").classList.add(newStatusClass)
  document.getElementById("automaticStatus").classList.remove(oldStatusClass)
}
function setProxyServerStatus(newStatusClass, oldStatusClass) {
  document.getElementById("proxyServerStatus").classList.add(newStatusClass)
  document.getElementById("proxyServerStatus").classList.remove(oldStatusClass)
}
////// End Servers Status //////////

////// Start Reset Settings Button //////////

const defaultSettings = {
  model: null,
  prompt_shortcut: null,
  positive_prompt: "",
  negative_prompt: "",
  selection_mode: null,
  batch_number: 1,
  steps: 20,
  width: 512,
  height: 512,
  firstphase_width: 512,
  firstphase_height: 512,
  cfg: 7,
  denoising_strength: 0.7,
  hi_res_denoising_strength: 0.7,
  mask_blur: 8,
  inpaint_at_full_res: false,
  hi_res_fix: false,
  inpaint_padding: 0,
  seed: -1,
  samplers: null,
  mask_content: null,
}

document.getElementById("btnResetSettings").addEventListener("click", () => {
  autoFillDefaultSettings(defaultSettings)
})
document.getElementById("btnSnapshot").addEventListener("click", async () => {
  await psapi.snapshot_layerExe()
})

function getBatchNumber() {
  return document.getElementById("tiNumberOfImages").value
}
function autoFillInBatchNumber(batch_number) {
  document.getElementById("tiNumberOfImages").value = String(batch_number)
}

function getSteps() {
  return document.getElementById("tiNumberOfSteps").value
}
function autoFillInSteps(steps) {
  document.getElementById("tiNumberOfSteps").value = String(steps)
}
function autoFillDefaultSettings(default_settings) {
  autoFillSettings(default_settings)
}

function setCFG(cfg_value) {
  document.getElementById("slCfgScale").value = cfg_value
}
function getCFG() {
  return document.getElementById("slCfgScale").value
}

function autoFillSettings(settings) {
  try {
    //reset all UI settings except model selection and sampler selection
    autoFillInPrompt(settings["positive_prompt"])
    autoFillInNegativePrompt(settings["negative_prompt"])
    autoFillInBatchNumber(settings["batch_number"])
    autoFillInSteps(settings["steps"])
    autoFillInWidth(settings["width"])
    autoFillInHeight(settings["height"])
    autoFillInHiResFixs(
      settings["firstphase_width"],
      settings["firstphase_height"]
    )
    document.getElementById("slCfgScale").value = settings["cfg"]
    autoFillInDenoisingStrength(settings["denoising_strength"])
    autoFillInSliderUi(
      settings["hi_res_denoising_strength"],
      "hrDenoisingStrength",
      "hDenoisingStrength",
      100
    )
    document.getElementById("slMaskBlur").value = settings["mask_blur"]
    document.getElementById("chInpaintFullRes").checked =
      settings["inpaint_at_full_res"]
    setHiResFixs(settings["hi_res_fix"])
    document.getElementById("tiSeed").value = String(settings["seed"])
  } catch (e) {
    console.warn(e)
  }
}
////// End Reset Settings Button //////////

function getMaskBlur() {
  const isDisabled = document
    .getElementById("slMaskBlur")
    .hasAttribute("disabled")
  let mask_blur = 0
  if (isDisabled) {
    mask_blur = 0
  } else {
    mask_blur = document.getElementById("slMaskBlur").value
  }
  return mask_blur
}
function getUseSharpMask() {
  const isChecked = document.getElementById("chUseSharpMask").checked
  return isChecked
}
document.getElementById("chUseSharpMask").addEventListener("change", (ev) => {
  const isChecked = ev.target.checked
  if (isChecked) {
    document.getElementById("slMaskBlur").setAttribute("disabled")
  } else {
    document.getElementById("slMaskBlur").removeAttribute("disabled")
  }
})

document.getElementById("chUseSmartObject").addEventListener("change", (ev) => {
  const isChecked = ev.target.checked
  if (isChecked) {
    g_b_use_smart_object = true
  } else {
    g_b_use_smart_object = false
  }
})

function getPromptShortcut() {
  //read json string
  //converted into json object
  const prompt_shortcut_string =
    document.getElementById("taPromptShortcut").value
  const prompt_shortcut = JSON.parse(prompt_shortcut_string)
  return prompt_shortcut
}
function setPromptShortcut(prompt_shortcut) {
  //prompt_shortcut is json object
  //convert it into pretty json string and save it in the prompt shortcut textarea
  var JSONInPrettyFormat = JSON.stringify(prompt_shortcut, undefined, 7)
  document.getElementById("taPromptShortcut").value = JSONInPrettyFormat
}

////start selection mode/////
function getSelectionMode() {
  return [...document.getElementsByClassName("rbSelectionMode")].filter(
    (e) => e.checked == true
  )[0].value
}
function getMaskContent() {
  return [...document.getElementsByClassName("rbMaskContent")].filter(
    (e) => e.checked == true
  )[0].value
}
function setMaskContent(value) {
  try {
    //assume the sampler_name is valid
    //return the first
    //convert htmlCollection into an array, then user filter to get the radio button with the value equals to sampler_name
    const mask_content_element = [
      ...document.getElementsByClassName("rbMaskContent"),
    ].filter((e) => e.value == value)[0]
    mask_content_element.checked = true
    return mask_content_element
  } catch (e) {
    console.warn(e)
  }
}

///end selection mode////
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
  getMode,
  setInitImageSrc,
  setInitImageMaskSrc,
  setGenerateButtonsColor,
  setAutomaticStatus,
  setProxyServerStatus,
  defaultSettings,
  autoFillDefaultSettings,
  autoFillSettings,
  getMaskBlur,
  getUseSharpMask,
  autoFillInHRHeight,
  autoFillInHRWidth,
  getPromptShortcut,
  setPromptShortcut,
  getModelHashByTitle,
  getSelectionMode,
  autoFillInInpaintMaskWeight,
  autoFillInSteps,
  getSteps,
  getBatchNumber,
  autoFillInBatchNumber,
  getHrWidth,
  getHrHeight,
  setCFG,
  getCFG,
  getMaskContent,
  setMaskContent,
}
