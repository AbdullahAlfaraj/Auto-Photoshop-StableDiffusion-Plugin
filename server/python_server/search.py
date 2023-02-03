
try:
    from duckduckgo_search import ddg_images
except ImportError:
    raise ImportError(
        "duckduckgo_search is required to image search. Please install it with `pip install duckduckgo_search`."
    )



async def imageSearch(keywords = 'cute cats'):

    r = ddg_images(keywords, region='wt-wt', safesearch='Off', size=None,
                type_image=None, layout=None, license_image=None, max_results=30)
    
    # print(r)
    return r

