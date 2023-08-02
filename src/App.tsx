import {Component} from "react";
import Writer from "./Writer";

export default class App extends Component {
    public render() {
        return (
            <>
                <div className="hero">
                    <div className="hero-body">
                        <div className="container">
                            <div className="title">writer.md</div>
                            <div className="subtitle">Create SEO optimized blog post drafts using AI</div>
                            <Writer/>
                        </div>
                    </div>
                </div>
            </>
        );
    }
}
