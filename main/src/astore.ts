import { makeAutoObservable, reaction, toJS } from 'mobx'
// import { Provider, inject, observer } from 'mobx-react'
export class AStore {
    data: any

    constructor(data: any) {
        this.data = data

        makeAutoObservable(this)
    }
    // setIsActive(b_value: boolean) {
    //     this.is_active = b_value
    // }
    // setTestValue(new_value: number) {
    //     this.test_value = new_value
    //     console.log('setTestValue: new_value ', new_value)
    //     console.log('setTestValue: this.test_value: ', this.test_value)
    // }

    updateProperty(key: keyof any, value: any) {
        ;(this.data as any)[key] = value
    }

    toJsFunc() {
        return toJS(this)
    }
}