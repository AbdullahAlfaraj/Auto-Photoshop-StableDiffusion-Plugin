import { observable } from 'mobx'
import { host } from 'uxp'

interface GlobalStore {
    Locale: 'zh_CN' | 'en_US'
}

const initialLocale =
    localStorage.getItem('last_selected_locale') || host.uiLocale
var globalStore = observable<GlobalStore>({
    Locale: initialLocale == 'zh_CN' ? initialLocale : 'en_US',
})

export default globalStore
