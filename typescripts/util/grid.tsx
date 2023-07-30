import React from 'react'
import { ActionButtonSVG, Thumbnail } from './elements'

export class Grid extends React.Component<{
    // thumbnails_data?: any[]
    thumbnails?: string[]
    width?: number
    height?: number
    action_buttons?: any[]
    children?: React.ReactNode
    callback?: any
    clicked_index?: number
    permanent_indices?: number[]
    thumbnails_styles?: string[]
}> {
    static defaultProps = {
        width: 100,
        height: 100,
        thumbnails: [],
        thumbnails_styles: [],
    }

    render() {
        const img_style = {
            width: `${this.props.width}px`,
            // height: `${this.props.height}px`,
            height: 'auto',
        }
        return (
            <div className="viewer-container">
                {this.props?.thumbnails?.map((thumbnail, index: number) => {
                    // const thumbnail = this.props?.thumbnails
                    // thumbnail
                    //     ? this.props?.thumbnails[index]
                    //     : 'https://source.unsplash.com/random'
                    const thumbnail_class = this.props?.thumbnails_styles
                        ? this.props?.thumbnails_styles[index]
                        : ''
                    return (
                        <Thumbnail style={img_style} key={`thumbnail-${index}`}>
                            <img
                                style={img_style}
                                onClick={async (event: any) => {
                                    try {
                                        console.log('image clicked')
                                        if (this.props.callback) {
                                            if (
                                                this.props.callback.constructor
                                                    .name === 'AsyncFunction'
                                            ) {
                                                await this.props?.callback(
                                                    index,
                                                    event
                                                )
                                            } else {
                                                this.props?.callback(
                                                    index,
                                                    event
                                                )
                                            }
                                            this.props?.callback(index, event) //todo: is this a typo why do we call callback twice?
                                        }
                                    } catch (e) {
                                        console.warn(
                                            'error was thrown while calling a callback method'
                                        )
                                        console.warn(e)
                                    }
                                }}
                                src={
                                    thumbnail ??
                                    'https://source.unsplash.com/random'
                                }
                                className={`viewer-image-container ${thumbnail_class}`}
                            />

                            {this.props?.action_buttons?.map((button, i) => {
                                return (
                                    i < 4 && (
                                        <ActionButtonSVG
                                            key={`action-button-${i}`}
                                            ComponentType={button.ComponentType}
                                            onClick={() => {
                                                button.callback(index)
                                            }}
                                            title={button?.title}
                                        ></ActionButtonSVG>
                                    )
                                )
                            })}
                        </Thumbnail>
                    )
                })}

                {/* <div className="viewer-image-container">
                    {this.props?.children}
                </div> */}
            </div>
        )
    }
}
