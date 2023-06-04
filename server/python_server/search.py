from itertools import islice

try:
    from duckduckgo_search import DDGS
except ImportError:
    raise ImportError(
        "duckduckgo_search is required to image search. Please install it with `pip install --upgrade duckduckgo_search`."
    )


async def imageSearch(keywords="cute cats"):
    with DDGS() as ddgs:
        return [x for x in islice(ddgs.images(keywords), 30)]


if __name__ == "__main__":

    async def main():
        result = await imageSearch()
        print("result: ",result)
        # result = await imageSearch2()
        # print(result)
    import asyncio

    asyncio.run(main())
