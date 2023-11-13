import React, { Component, ErrorInfo, ReactNode } from 'react'
import { refreshUI } from '../sd_tab/util'

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
    key: number
}
interface State {
    hasError: boolean
    key: number
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        key: 0,
    }

    public static getDerivedStateFromError(_: Error): Partial<State> {
        // When an error occurs, we update state so the next render will show the fallback UI.
        return { hasError: true }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo)
    }

    handleRefresh = () => {
        this.setState((prevState) => ({
            hasError: false, // reset the error state
            key: prevState.key + 1, // increment key to remount children
        }))
        // await refreshUI()
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div>
                    <h1>Sorry.. there was an error</h1>
                    <button onClick={this.handleRefresh}>Refresh</button>
                </div>
            )
        }

        // The key prop causes a remount of children when it changes
        return <div key={this.state.key}>{this.props.children}</div>
    }
}
