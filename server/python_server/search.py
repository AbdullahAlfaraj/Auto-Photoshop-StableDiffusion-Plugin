from duckduckgo_search import ddg_images


async def imageSearch(keywords = 'cute cats'):

    r = ddg_images(keywords, region='wt-wt', safesearch='Off', size=None,
                type_image=None, layout=None, license_image=None, max_results=300)
    
    # print(r)
    return r

