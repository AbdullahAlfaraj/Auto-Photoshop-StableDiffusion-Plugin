async function requestGet(url) {
    let json = null
    // const full_url = `${g_sd_url}/sdapi/v1/options`
    const full_url = url
    try {
        let request = await fetch(full_url)
        if (request.status === 404) {
            return null
        }

        json = await request.json()

        console.log('json: ', json)
    } catch (e) {
        console.warn(`issues requesting from ${full_url}`, e)
    }
    return json
}

module.exports = {
    requestGet,
}
