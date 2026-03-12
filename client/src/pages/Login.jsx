import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(username, password);
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="brand-icon">E</div>
                <h2>Welcome Back</h2>
                <p className="login-subtitle">Sign in to College ERP</p>

                {error && <div className="login-error" role="alert" aria-live="polite">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            className="form-control"
                            type="text"
                            placeholder="Enter username…"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            id="login-username"
                            spellCheck={false}
                            autoComplete="username"
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            className="form-control"
                            type="password"
                            placeholder="Enter password…"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            id="login-password"
                            autoComplete="current-password"
                        />
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={loading} id="login-submit" aria-label="Sign in to College ERP">
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                <div className="login-hint">
                    <strong>Demo Credentials:</strong><br />
                    Admin: admin / admin123<br />
                    Faculty: dr.smith / fac123<br />
                    Student: alice / stu123<br />
                    Librarian: librarian / lib123
                </div>
            </div>
        </div>
    );
}
