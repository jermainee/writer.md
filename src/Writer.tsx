import React, {Component} from 'react';
import ReactMarkdown from 'react-markdown'

interface IAppState {
    keyword: string|null;
    isSubmitted: boolean;
    markdownText: string;
}

export default class Writer extends Component<{}, IAppState> {
    private readonly apiUrl = "https://openai-blog-writer-5c211a15388c.herokuapp.com/";
    public constructor(props: {}) {
        super(props);
        this.state = {
            keyword: null,
            isSubmitted: false,
            markdownText: '',
        };
    }
    public render() {
        if (!this.state.isSubmitted) {
            return (
                <form onSubmit={this.handleFormSubmit}>
                    <div className="field has-addons">
                        <div className="control">
                            <div className="select">
                                <select>
                                    <option value="de">🇩🇪</option>
                                </select>
                            </div>
                        </div>
                        <div className="control">
                            <input onChange={this.handleInputChange} className="input" type="text" placeholder="What is the keyword?"/>
                        </div>
                        <div className="control">
                            <button type="submit" className="button has-text-weight-bold"><span className="is-hidden">create draft</span>›</button>
                        </div>
                    </div>
                </form>
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
        fetch(`${this.apiUrl}/generate/${this.state.keyword}?openai_key=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`)
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

    private handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ keyword: event.target.value });
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
