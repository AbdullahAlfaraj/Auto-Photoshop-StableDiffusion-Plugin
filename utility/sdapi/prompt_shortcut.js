function find_words_inside_braces(string) {
    const re = /\{(.*?)\}/g
    let keywords = string.match(re)
    // console.log('keywords: ', keywords)
    if (!keywords) {
        //avoid null keywords
        keywords = []
    }
    return keywords
}

function replaceShortcut(text, prompt_shortcut_json) {
    const original_keywords = find_words_inside_braces(text)
    const strip_keywords = original_keywords.map((s) => {
        let content = s.slice(1, -1) //remove '{' and  '}'
        content = content.trim() //remove any space in the beginning  and end of content
        return content
    })

    // original_substrings = list(map(lambda s: '{'+s+'}',raw_keywords))

    // print("strip_keywords: ", strip_keywords)
    // print("original_substrings: ",original_substrings)
    // # print ("text:",text)

    let i = 0
    for (const word of strip_keywords) {
        // # word = word.strip()
        //     print("word: ",word)
        if (word.length > 0 && prompt_shortcut_json.hasOwnProperty(word)) {
            const prompt = prompt_shortcut_json[word]
            console.log('prompt: ', prompt)
            text = text.replace(original_keywords[i], prompt)
        }
    }
    console.log('final text: ', text)
    return text
}
module.exports = {
    find_words_inside_braces,
    replaceShortcut,
}
