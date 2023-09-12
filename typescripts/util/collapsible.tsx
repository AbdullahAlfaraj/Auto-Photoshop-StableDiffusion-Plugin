import React, { CSSProperties, ComponentType } from 'react'
// import ReactDOM from 'react-dom'

import { useState, ReactNode } from 'react'
import Locale from '../locale/locale'
interface CollapsibleProps {
    label: string
    labelStyle?: React.CSSProperties
    containerStyle?: React.CSSProperties
    defaultIsOpen?: boolean
    checked?: boolean
    checkboxCallback?: (checked: boolean) => void
    children: ReactNode
}

export function Collapsible({
    label,
    labelStyle,
    containerStyle,
    defaultIsOpen = false,
    checkboxCallback,
    checked,
    children,
}: CollapsibleProps) {
    const [isOpen, setIsOpen] = useState(defaultIsOpen)

    const handleToggle = () => {
        setIsOpen(!isOpen)
    }

    return (
        /*useObserver(()=>*/ <div>
            <div
                className="collapsible"
                style={containerStyle}
                onClick={handleToggle}
            >
                <span className="truncate" style={labelStyle}>
                    {label}
                </span>

                <span
                    style={{ float: 'right', display: 'flex' }}
                    className="triangle"
                >
                    {checkboxCallback && checked !== void 0 ? (
                        <input
                            type="checkbox"
                            className="minimal-checkbox"
                            onClick={(event) => {
                                event.stopPropagation()
                            }}
                            onChange={(event: any) => {
                                checkboxCallback(event.target.checked)
                            }}
                            checked={checked}
                        />
                    ) : (
                        void 0
                    )}

                    <span>{isOpen ? '∨' : '<'}</span>
                </span>
            </div>
            {/* {isOpen && <div>{children}</div>} */}
            <div style={{ display: isOpen ? 'block' : 'none' }}>{children}</div>
        </div>
    )
}
