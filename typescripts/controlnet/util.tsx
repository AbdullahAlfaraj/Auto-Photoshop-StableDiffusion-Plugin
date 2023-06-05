
export function mapRange(x: number, in_min: number, in_max: number, out_min: number, out_max: number, step: number) {
    return Math.round(
        (
            ((x - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min
        ) / step
    ) * step
}

export function versionCompare(to: string, from: string) {
    const vTo = to.split('.')
    const vFrom = from.split('.')

    for (let i = 0; i < Math.max(vTo.length, vFrom.length); i++) {
        const vFromI = +(vFrom[i] || 0)
        const vToI = +(vTo[i] || 0)
        if (isNaN(vFromI) || isNaN(vToI)) { throw new Error(`invalid version ${vTo} or ${vFrom} `) }

        if (vFromI > vToI) {
            return -1
        } else if (vFromI < vToI) { 
            return 1;
        }
    }
    return 0;
}