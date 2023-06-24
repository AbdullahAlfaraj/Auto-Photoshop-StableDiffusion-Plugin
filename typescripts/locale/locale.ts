import globalStore from "../globalstore"
import zhHans from './zh_CN/zh_Hans.json';
import zhHansForPSPlugin from "./zh_CN/zh_Hans_PS.json"

export default function Locale(key: keyof typeof zhHans | keyof typeof zhHansForPSPlugin): string
{
    const locale = globalStore.Locale;
    let res = '';
    if (locale == 'zh_CN')
    {
        //@ts-ignore
        if (key in zhHansForPSPlugin) res = zhHansForPSPlugin[key];
        //@ts-ignore
        if (key in zhHans) res = zhHans[key];
    }
    res = res || key
    return res;
}