async function prompt(
    heading,
    body,
    buttons = ['Cancel', 'Ok'],
    options = { title: heading, size: { width: 360, height: 280 } }
) {
    const [dlgEl, formEl, headingEl, dividerEl, bodyEl, footerEl] = [
        'dialog',
        'form',
        'sp-heading',
        'sp-divider',
        'sp-body',
        'footer',
    ].map((tag) => document.createElement(tag))
    ;[headingEl, dividerEl, bodyEl, footerEl].forEach((el) => {
        el.style.margin = '6px'
        el.style.width = 'calc(100% - 12px)'
    })

    formEl.setAttribute('method', 'dialog')
    formEl.addEventListener('submit', () => dlgEl.close())

    footerEl.style.marginTop = '26px'

    dividerEl.setAttribute('size', 'large')

    headingEl.textContent = heading

    bodyEl.textContent = body

    buttons.forEach((btnText, idx) => {
        const btnEl = document.createElement('sp-button')
        btnEl.setAttribute(
            'variant',
            idx === buttons.length - 1 ? btnText.variant || 'cta' : 'secondary'
        )
        if (idx === buttons.length - 1)
            btnEl.setAttribute('autofocus', 'autofocus')
        if (idx < buttons.length - 1) btnEl.setAttribute('quiet')
        btnEl.textContent = btnText.text || btnText
        btnEl.style.marginLeft = '12px'
        btnEl.addEventListener('click', () =>
            dlgEl.close(btnText.text || btnText)
        )
        footerEl.appendChild(btnEl)
    })
    ;[headingEl, dividerEl, bodyEl, footerEl].forEach((el) =>
        formEl.appendChild(el)
    )
    dlgEl.appendChild(formEl)
    document.body.appendChild(dlgEl)

    return dlgEl.uxpShowModal(options)
}

// const r1 = await prompt(
//   'Upload Large File',
//   'This is a large file (over 100MB) -- it may take a few moments to upload.',
//   ['Skip', 'Upload']
// )
// if ((r1 || 'Upload') !== 'Upload') {
//   /* cancelled or No */
// } else {
//   /* Yes */
// }

// const r2 = await prompt(
//   'Delete File',
//   'Are you sure you wish to delete this file? This action cannot be undone.',
//   ['Cancel', { variant: 'warning', text: 'Delete' }]
// )
// if (r2 !== 'Delete') {
//   /* nope, don't do it! */
// } else {
//   /* Do the delete */
// }

module.exports = { prompt }
