import { makeAutoObservable, reaction, toJS } from 'mobx'
export { toJS } from 'mobx'
// import { Provider, inject, observer } from 'mobx-react'
interface AStoreData {
    [key: string]: any
}
export class AStore<T extends AStoreData> {
    data: T

    constructor(data: T) {
        this.data = data

        makeAutoObservable(this)
    }

    updateProperty(key: keyof T, value: any) {
        this.data[key] = value
    }
    updatePropertyArray(key: keyof T, value: any) {
        this.data[key] = this.data[key].concat(value)
    }
    updatePropertyArrayRemove(key: keyof T, valueToRemove: any) {
        this.data[key] = this.data[key].filter(
            (item: any) => item !== valueToRemove
        )
    }

    toJsFunc() {
        return toJS(this)
    }
}
