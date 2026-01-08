import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                    <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl border border-red-200">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">⚠️</span>
                        </div>
                        <h1 className="text-2xl font-bold text-center mb-2">เกิดข้อผิดพลาด</h1>
                        <p className="text-gray-600 text-center mb-4">
                            แอปพลิเคชันเกิดข้อผิดพลาด กรุณาลองรีเฟรชหน้าใหม่
                        </p>
                        <div className="bg-red-50 rounded-lg p-4 mb-4">
                            <p className="text-sm font-mono text-red-800 break-all">
                                {this.state.error?.message}
                            </p>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            รีเฟรชหน้า
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
