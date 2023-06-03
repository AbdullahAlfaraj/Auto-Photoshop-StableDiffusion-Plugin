
try:
    # from duckduckgo_search import ddg_images
    from duckduckgo_search import DDGS

except ImportError:
    raise ImportError(
        "duckduckgo_search is required to image search. Please install it with `pip install duckduckgo_search`."
    )



# async def imageSearch(keywords = 'cute cats'):

#     r = ddg_images(keywords, region='wt-wt', safesearch='Off', size=None,
#                 type_image=None, layout=None, license_image=None, max_results=30)
    
#     # print(r)
#     return r



async def imageSearch(keywords = 'cute cats'):

    from duckduckgo_search import DDGS

    ddgs = DDGS(timeout=60)

    
    ddgs_images_gen = ddgs.images(
        keywords,
        region="wt-wt",
        safesearch="Off",
        size=None,
        # color="Monochrome",
        type_image=None,
        layout=None,
        license_image=None,
    )
    # for r in ddgs_images_gen:
    #     print(r)
    return list(ddgs_images_gen)


if __name__ == "__main__":


    async def main():
        result = await imageSearch()
        print("result: ",result)
        # result = await imageSearch2()
        # print(result)
    import asyncio
    asyncio.run(main())
    