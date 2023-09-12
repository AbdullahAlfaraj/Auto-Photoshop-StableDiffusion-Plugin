//TODO: delete lexical_tab.js and lexica tab from html
import { observer } from 'mobx-react'
import React from 'react'

@observer
export class Lexical extends React.Component {
    componentDidMount(): void {}
    componentWillUnmount(): void {}

    render() {
        return (
            <div>
                <div className="subTabOptionsContainer"></div>

                <div className="flexContainer">
                    <sp-label slot="label">
                        Explore Lexica for prompts and inspiration
                    </sp-label>
                </div>
                <div></div>
                <div>
                    <sp-textfield
                        id="LexicaSearchField"
                        type="text"
                        placeholder="cute cats"
                        value=""
                    >
                        <sp-label slot="label">Search:</sp-label>
                    </sp-textfield>

                    <button
                        className="btnSquare search-button"
                        id="btnSearchLexica"
                        title="user prompt(text) to Search Lexica"
                    ></button>

                    <button
                        className="btnSquare reverse_image_serach"
                        id="btnReverseSearchLexica"
                        title="User the selected area (image) on canvas to Search Lexica"
                    ></button>
                </div>
                <sp-textarea
                    id="lexicaPrompt"
                    style="margin-bottom: 3px"
                ></sp-textarea>
                <div className="viewer-container" id="divLexicaImagesContainer">
                    <img
                        className="history-image"
                        id="history_image_test"
                        data-metadata_json_string='{"a":1}'
                        src="https://source.unsplash.com/random"
                    />
                </div>
            </div>
        )
    }
}
