import React, {Component} from 'react';
import ReactMarkdown from 'react-markdown'

interface IAppState {
    keyword: string|null;
    isSubmitted: boolean;
    markdownText: string;
}

export default class App extends Component<{}, IAppState> {
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
                <div>
                    <input onChange={this.handleInputChange} type="text" placeholder="What is the keyword?"/>
                    <button onClick={this.handleButtonClick}>write</button>
                </div>
            );
        }

        return (
            <ReactMarkdown>{this.state.markdownText}</ReactMarkdown>
        );
    }

    private fetchWriterResponse = () => {
        fetch(`http://127.0.0.1:5001/generate/${this.state.keyword}?openai_key=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`)
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
    private handleButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
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
