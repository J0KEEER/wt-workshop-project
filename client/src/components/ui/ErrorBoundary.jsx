import { Component } from 'react';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '40px', textAlign: 'center',
                    background: 'var(--bg-card)', borderRadius: '12px',
                    border: '1px solid var(--border-color, #333)', margin: '24px',
                }}>
                    <h3 style={{ color: 'var(--danger, #ef4444)', marginBottom: '12px' }}>
                        Something went wrong
                    </h3>
                    <p style={{ color: 'var(--text-muted, #888)', marginBottom: '20px' }}>
                        {this.state.error?.message || 'An unexpected error occurred.'}
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={() => this.setState({ hasError: false, error: null })}
                    >
                        Try Again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
