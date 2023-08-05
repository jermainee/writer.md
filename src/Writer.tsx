import React, {Component} from 'react';
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize from "rehype-sanitize";
import {remark} from 'remark'
import strip from 'strip-markdown'

interface IAppState {
    keyword: string|null;
    language: string|null;
    apiKey: string;
    isSubmitted: boolean;
    markdownText: string;
    plainText: string;
    isFinished: boolean;
    hasError: boolean;
    errorMessage: string;
}

export default class Writer extends Component<{}, IAppState> {
    private readonly apiUrl = "https://api.writer.md";
    public constructor(props: {}) {
        super(props);
        this.state = {
            keyword: null,
            language: 'en',
            apiKey: localStorage.getItem("api_key") ?? '',
            isSubmitted: false,
            markdownText: '',
            plainText: '',
            isFinished: false,
            hasError: false,
            errorMessage: '',
        };
    }
    public render() {
        if (!this.state.isSubmitted) {
            return this.renderParameterForm();
        }

        return this.renderMarkdownEditor();
    }

    private renderParameterForm = () => {
        return (<>
            <div className="hero">
                <div className="hero-body">
                    <div className="container is-small">
                        <div className="title">📝 writer.md</div>
                        <div className="subtitle">Create SEO optimized blog post drafts using AI</div>

                        <div className="notification">
                            <form onSubmit={this.handleFormSubmit}>
                                <div className="field">
                                    <label className="label">Target keyword</label>
                                    <div className="control">
                                        <input onChange={this.handleKeywordChange} className="input" type="text" placeholder="What is the keyword or topic?" required={true} autoFocus={true}/>
                                    </div>
                                </div>

                                <div className="field">
                                    <label className="label">Language</label>
                                    <div className="control">
                                        <div className="select is-fullwidth">
                                            <select onChange={this.handleLanguageChange}>
                                                <option value="en">English (US)</option>
                                                <option value="de">German (DE)</option>
                                                <option value="nl">Dutch (NL)</option>
                                                <option value="es">Spanish (ES)</option>
                                                <option value="it">Italian (IT)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="field">
                                    <label className="label">API key</label>
                                    <div className="control">
                                        <input onChange={this.handleApiKeyChange} className="input" type="text" value={this.state.apiKey} placeholder="Enter your OpenAI API key" required={true}/>
                                    </div>
                                    <div className="is-size-7">The API key will only be stored locally in your browser. <a href="https://platform.openai.com/account/api-keys" target="_blank noreferrer">You find your API key in the OpenAI dashboard.</a></div>
                                </div>

                                <div className="field">
                                    <div className="control">
                                        <button type="submit" className="button has-text-weight-bold is-fullwidth">Create draft</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>);
    }

    private renderMarkdownEditor = () => {
        return (
            <div className="writerContainer">
                <header className="writerHeader">
                    <div className="columns is-mobile is-vcentered">
                        <div className="column">
                            <span className="writerHeader__logo" onClick={() => window.location.reload()}>writer.md</span>
                        </div>
                        <div className="column is-narrow">

                            <span className="buttons">
                                <span className="button is-text is-dummy is-small">
                                    Status:&nbsp;{this.state.isFinished ? 'finished' : (<span>generating <span className="loading">◇</span></span>)}
                                </span>
                                <span className="button is-text is-dummy is-small">{this.state.plainText.split(' ').length-1} words</span>
                                <a className="button is-small" href={`data:text/plain;charset=utf-8, ${encodeURIComponent(this.state.plainText)}`} download={`${this.state.keyword}.txt`}>download plaintext</a>
                                <a className="button is-small" href={`data:text/plain;charset=utf-8, ${encodeURIComponent(this.state.markdownText)}`} download={`${this.state.keyword}.md`}>download markdown</a>
                            </span>
                        </div>
                    </div>
                </header>

                <section className="writerEditor">
                    <MDEditor
                        value={this.state.markdownText}
                        onChange={markdownText => this.updateText(markdownText ?? '', false)}
                        height="100%"
                        visibleDragbar={false}
                        overflow={false}
                        previewOptions={{
                            rehypePlugins: [[rehypeSanitize]],
                        }}
                    />
                </section>

                {this.state.hasError && (
                    <div className="modal is-active">
                        <div className="modal-background"></div>
                        <div className="modal-content">
                            <div className="notification is-danger">
                                <strong>An error occurred:</strong> {this.state.errorMessage}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    private fetchWriterResponse = () => {
        fetch(`${this.apiUrl}/generate/${this.state.keyword}?openai_key=${this.state.apiKey}&language=${this.state.language}`, { keepalive: true })
            .then(async (response) => {
                // response.body is a ReadableStream
                // @ts-ignore
                const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
                for await (const chunk of this.readChunks(reader)) {
                    this.updateText(chunk, true);
                }

                this.setState({ isFinished: true });
            })
            .catch(error => this.setState({ hasError: true, errorMessage: error.message }));
    }

    private updateText = (text: string, isChunk: boolean) => {
        this.setState({ markdownText: isChunk ? this.state.markdownText + text : text });

        remark()
            .use(strip)
            .process(this.state.markdownText)
            .then((file) => {
                this.setState({ plainText: String(file) })
            });
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
