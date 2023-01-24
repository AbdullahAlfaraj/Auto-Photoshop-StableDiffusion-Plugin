class UI {
  constructor () {}

  onStartSessionUI () {
    // will toggle the buttons needed when a generation session start

    const accept_class_btns = Array.from(
      document.getElementsByClassName('acceptClass')
    )

    const discard_class_btns = Array.from(
      document.getElementsByClassName('discardClass')
    )
    
    
    const discard_selected_class_btns = Array.from(
      document.getElementsByClassName('discardSelectedClass')
    )
  
    const accept_selected_class_btns = Array.from(
        document.getElementsByClassName('acceptSelectedClass')
      )
    
    
    //show the accept and discard buttons when a new session is active
    accept_class_btns.forEach(
      element => (element.style.display = 'inline-block')
    )
    discard_class_btns.forEach(
      element => (element.style.display = 'inline-block')
    )
    discard_selected_class_btns.forEach(element => (element.style.display = 'inline-block'))
    accept_selected_class_btns.forEach(
        element => (element.style.display = 'inline-block')
      )
    
      this.generateMoreUI()
  }
onActiveSessionUI(){

}
generateModeUI(mode){
  const generate_btns = Array.from(
    document.getElementsByClassName('btnGenerateClass')
  )
  generate_btns.forEach(element => {
    element.textContent = `Generate ${mode}`
  })
  html_manip.setGenerateButtonsColor('generate', 'generate-more')
}
generateMoreUI(){
  const generate_btns = Array.from(
    document.getElementsByClassName('btnGenerateClass')
  )
  generate_btns.forEach(element => {
    element.textContent = `Generate More`
  })
  html_manip.setGenerateButtonsColor('generate-more','generate')
}

  onEndSessionUI () {
    const accept_class_btns = Array.from(
      document.getElementsByClassName('acceptClass')
    )

    const discard_class_btns = Array.from(
      document.getElementsByClassName('discardClass')
    )
    const discard_selected_class_btns = Array.from(
      document.getElementsByClassName('discardSelectedClass')
    )
  

    const accept_selected_class_btns = Array.from(//Node: change customClass to acceptSelectedClass
        document.getElementsByClassName('acceptSelectedClass')
      )

    

    accept_class_btns.forEach(element => (element.style.display = 'none'))
    discard_class_btns.forEach(element => (element.style.display = 'none'))
    discard_selected_class_btns.forEach(element => (element.style.display = 'none'))

    accept_selected_class_btns.forEach(
        element => (element.style.display = 'none')
      )

    this.generateModeUI(g_sd_mode)
  }
  
  setGenerateBtnText(textContent){
    const generate_btns = Array.from(
  document.getElementsByClassName('btnGenerateClass')
)
generate_btns.forEach(element => {
  element.textContent = textContent
})

  }

}

module.exports = {
  UI
}
