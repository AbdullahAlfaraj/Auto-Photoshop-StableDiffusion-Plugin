import globalStore from '../globalstore'
import type zhHans from '../../i18n/zh_CN/sd-official.json'
import type zhHansForPSPlugin from '../../i18n/zh_CN/ps-plugin.json'
import { lstatSync, readFileSync } from 'fs'

const localeFileCache: any = {}

function isExists(path: string): boolean {
    try {
        lstatSync(path)
        // console.log(path, 'exists')
        return true
    } catch (e) {
        // console.log(path, 'not exists')
        return false
    }
}

export default function Locale(
    key: keyof typeof zhHans | keyof typeof zhHansForPSPlugin
): string {
    const locale = globalStore.Locale

    const sdOfficialJSONPath = `plugin:/i18n/${locale}/sd-official.json`
    let sdOfficialTranslate = localeFileCache[sdOfficialJSONPath]
    if (!localeFileCache[sdOfficialJSONPath] && isExists(sdOfficialJSONPath)) {
        console.log('readFile')
        sdOfficialTranslate = JSON.parse(
            readFileSync(sdOfficialJSONPath, 'utf-8')
        )
        localeFileCache[sdOfficialJSONPath] = sdOfficialTranslate
    }

    const psPluginJSONPath = `plugin:/i18n/${locale}/ps-plugin.json`
    let psPluginTranslate = localeFileCache[psPluginJSONPath]
    if (!localeFileCache[psPluginJSONPath] && isExists(psPluginJSONPath)) {
        console.log('readFile')
        psPluginTranslate = JSON.parse(readFileSync(psPluginJSONPath, 'utf-8'))
        localeFileCache[psPluginJSONPath] = psPluginTranslate
    }

    let res = ''
    //@ts-ignore
    if (sdOfficialTranslate && key in sdOfficialTranslate)
        res = sdOfficialTranslate[key]
    //@ts-ignore
    if (psPluginTranslate && key in psPluginTranslate)
        res = psPluginTranslate[key]

    res = res || key
    return res
}
