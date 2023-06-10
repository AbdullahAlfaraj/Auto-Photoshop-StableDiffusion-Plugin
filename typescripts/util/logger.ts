import { format } from 'util'
export function formateLog(data: any, ...optional_param: any[]) {
    const formattedOutput = format(data, ...optional_param)
    return formattedOutput
}
