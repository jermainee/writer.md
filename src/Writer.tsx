import React, {Component} from 'react';
import ReactMarkdown from 'react-markdown'

interface IAppState {
    keyword: string|null;
    language: string|null;
    apiKey: string;
    isSubmitted: boolean;
    markdownText: string;
}

export default class Writer extends Component<{}, IAppState> {
    private readonly apiUrl = "https://openai-blog-writer-5c211a15388c.herokuapp.com/";
    public constructor(props: {}) {
        super(props);
        this.state = {
            keyword: null,
            language: 'de',
            apiKey: localStorage.getItem("api_key") ?? '',
            isSubmitted: false,
            markdownText: '',
        };
    }
    public render() {
        if (!this.state.isSubmitted) {
            return (
                <div className="notification">
                    <form onSubmit={this.handleFormSubmit}>
                        <div className="field">
                            <label className="label">Target keyword</label>
                            <div className="control">
                                <input onChange={this.handleKeywordChange} className="input" type="text" placeholder="What is the keyword?"/>
                            </div>
                        </div>

                        <div className="field">
                            <label className="label">Language</label>
                            <div className="control">
                                <div className="select is-fullwidth">
                                    <select onChange={this.handleLanguageChange}>
                                        <option value="de">German (DE)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="field">
                            <label className="label">API key</label>
                            <div className="control">
                                <input onChange={this.handleApiKeyChange} className="input" type="text" value={this.state.apiKey} placeholder="Enter your OpenAI API key"/>
                            </div>
                            <div className="is-size-7">The API key will only be stored locally in your browser. <a href="https://platform.openai.com/account/api-keys" target="_blank">You find your API key in the OpenAI dashboard.</a></div>
                        </div>

                        <div className="field">
                            <div className="control">
                                <button type="submit" className="button has-text-weight-bold is-fullwidth">Create draft</button>
                            </div>
                        </div>
                    </form>
                </div>
            );
        }

        return (
            <>
                <hr/>
                <div className="content">
                    <ReactMarkdown>{this.state.markdownText}</ReactMarkdown>
                </div>
            </>
        );
    }

    private fetchWriterResponse = () => {
        fetch(`${this.apiUrl}/generate/${this.state.keyword}?openai_key=${this.state.apiKey}&language=${this.state.language}`)
            .then(async (response) => {
                // response.body is a ReadableStream
                // @ts-ignore
                const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
                for await (const chunk of this.readChunks(reader)) {
                    this.setState({ markdownText: this.state.markdownText + chunk });
                }
            })
            .catch((err) => console.error(err));
    }

    private handleKeywordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ keyword: event.target.value });
    }

    private handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        this.setState({ language: event.target.value });
    }

    private handleApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        localStorage.setItem("api_key", event.target.value);
        this.setState({ apiKey: event.target.value });
    }

    private handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        console.log(this.state.keyword);
        this.setState({ isSubmitted: true });

        this.fetchWriterResponse();
    }

    private readChunks(reader: ReadableStreamDefaultReader) {
        return {
            async* [Symbol.asyncIterator]() {
                let readResult = await reader.read();
                while (!readResult.done) {
                    yield readResult.value;
                    readResult = await reader.read();
                }
            },
        };
    }
}
