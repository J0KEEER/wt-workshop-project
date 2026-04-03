import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { UserPlus, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function Register() {
    const navigate = useNavigate();
    const toast = useToast();
    const [step, setStep] = useState(1); // 1: Role, 2: Info, 3: Success
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        role: 'student'
    });

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleNext = (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            return toast.error("Passwords don't match");
        }
        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/register', form);
            setStep(3);
            toast.success("Registration request submitted!");
        } catch (err) {
            toast.error(err.response?.data?.error || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    if (step === 3) {
        return (
            <div className="login-page">
                <div className="login-card fade-in" style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="success-icon" style={{ color: 'var(--success)', marginBottom: '20px' }}>
                        <CheckCircle2 size={64} />
                    </div>
                    <h2 style={{ marginBottom: '16px' }}>Registration Received</h2>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
                        Your account request has been submitted to the administration for review. 
                        You will be able to log in once an admin approves your request.
                    </p>
                    <button className="btn btn-primary" onClick={() => navigate('/login')}>
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="login-page">
            <div className="login-card fade-in">
                <div className="brand-icon"><UserPlus size={24} /></div>
                <h2>Create Account</h2>
                <p className="login-subtitle">Join the College ERP Portal</p>

                <div className="register-steps" style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                    <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: step >= 1 ? 'var(--accent-primary)' : 'var(--border-color)' }}></div>
                    <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: step >= 2 ? 'var(--accent-primary)' : 'var(--border-color)' }}></div>
                </div>

                <form onSubmit={step === 1 ? handleNext : handleSubmit}>
                    {step === 1 ? (
                        <>
                            <div className="form-group">
                                <label>I am a...</label>
                                <div className="role-selector" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                                    <button 
                                        type="button" 
                                        className={`btn ${form.role === 'student' ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setForm({...form, role: 'student'})}
                                    >Student</button>
                                    <button 
                                        type="button" 
                                        className={`btn ${form.role === 'faculty' ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setForm({...form, role: 'faculty'})}
                                    >Faculty</button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Username</label>
                                <input className="form-control" name="username" value={form.username} onChange={handleChange} required placeholder="e.g. jdoe2024" />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} required placeholder="email@college.edu" />
                            </div>
                            <button className="btn btn-primary" type="submit">
                                Next Step <ArrowRight size={16} />
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>First Name</label>
                                    <input className="form-control" name="firstName" value={form.firstName} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Last Name</label>
                                    <input className="form-control" name="lastName" value={form.lastName} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input className="form-control" type="password" name="password" value={form.password} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Confirm Password</label>
                                <input className="form-control" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required />
                            </div>
                            
                            <div className="form-footer" style={{ display: 'flex', gap: '12px' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>Back</button>
                                <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2 }}>
                                    {loading ? 'Submitting...' : 'Register'}
                                </button>
                            </div>
                        </>
                    )}
                </form>

                <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Sign In</Link>
                </p>
            </div>
        </div>
    );
}
