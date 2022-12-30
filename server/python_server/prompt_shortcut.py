import re
import json
prompt_shortcut_dict ={}


def readToJson():
    return load()

def writeToJson(file_name,data_dict):
    with open(file_name, "w") as outfile:
        json.dump(data_dict, outfile,indent=4)


def load(): 
    global prompt_shortcut_dict
    try:
        with open('prompt_shortcut.json') as f_obj:
            data = json.load(f_obj)
            prompt_shortcut_dict = data
            print(data)
    except IOError:
        print("prompt_shortcut.json is not found")
    return prompt_shortcut_dict
def find_words_inside_braces(string):
    result = ""
    pattern ="\{(.*?)\}"
    keywords = []
    for match in re.findall(pattern, string):
        keywords.append(match)
        result += match
    return keywords

# text = "a beautiful girl holding a cute cat {style_1} on sunny day"
# text = "a beautiful girl holding a cute cat {    style_1 } on sunny day"
text = "a beautiful girl{    }, {char1}, {painterly_style} holding a cute cat {    style_1 } on sunny day"
# text = "a beautiful girl {char1 } holding a cute cat on sunny day"



def replaceShortcut(text,prompt_shortcut_dict):
    raw_keywords = find_words_inside_braces(text)
    strip_keywords = list(map(lambda s: s.strip(),raw_keywords))

    original_substrings = list(map(lambda s: '{'+s+'}',raw_keywords)) 

    print("raw_keywords: ", raw_keywords)
    print("strip_keywords: ", strip_keywords)
    print("original_substrings: ",original_substrings)
    # print ("text:",text)

    for i, word in enumerate(strip_keywords):
        # word = word.strip()
        print("word: ",word)
        if len(word) > 0 and word in prompt_shortcut_dict:
            prompt = prompt_shortcut_dict[word]
            print("prompt: ",prompt)
            text = text.replace(original_substrings[i],prompt)
        # else:
            # text = text.replace(word,word.strip())
    print ("final text: ",text) 
    return text