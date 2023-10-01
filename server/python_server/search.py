import asyncio

try:
    from duckduckgo_search import AsyncDDGS
except ImportError:
    raise ImportError(
        "duckduckgo_search is required to image search. Please install it with `pip install --upgrade duckduckgo_search`."
    )


async def imageSearch(keywords="cute cats"):
    async with AsyncDDGS() as ddgs:
        return [
            x async for x in ddgs.images(keywords, safesearch="off", max_results=50)
        ]


async def main():
    result = await imageSearch()
    print("result: ", result)
    # result = await imageSearch2()
    # print(result)


if __name__ == "__main__":
    asyncio.run(main())
