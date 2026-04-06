import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Trophy, TrendingDown, Users, Target, CheckCircle, 
  AlertCircle, ArrowLeft, BarChart2, BookOpen
} from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#6366f1', '#ec4899'];

const ExamAnalytics = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [exam, setExam] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, [id]);

    const fetchAnalytics = async () => {
        try {
            const [analyticsRes, examRes] = await Promise.all([
                api.get(`/exams/${id}/analytics`),
                api.get(`/exams/${id}`)
            ]);
            setData(analyticsRes.data);
            setExam(examRes.data);
        } catch (err) {
            console.error('Error fetching analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="p-xl text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto"></div>
            <p className="mt-4 text-text-muted">Analyzing results...</p>
        </div>
    );

    if (!data) return (
        <div className="empty-state">
            <AlertCircle size={48} className="opacity-30" />
            <h3>No Analytics Data</h3>
            <p>We couldn't find any performance data for this assessment yet.</p>
            <button onClick={() => navigate(-1)} className="btn btn-primary mt-6">
                Go Back
            </button>
        </div>
    );

    const { summary, distribution, topPerformers, atRisk } = data;

    return (
        <div className="page-container fade-in">
            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                    { label: 'Average Score', value: `${summary.averageMarks}`, icon: Users, color: 'var(--accent-light)' },
                    { label: 'Pass Ratio', value: `${summary.passPercentage}%`, icon: CheckCircle, color: 'var(--success)' },
                    { label: 'Highest Marks', value: summary.highestScore, icon: Trophy, color: 'var(--warning)' },
                    { label: 'Lowest Marks', value: summary.lowestScore, icon: TrendingDown, color: 'var(--danger)' },
                ].map((stat, i) => (
                    <div key={i} className="p-6 flex items-center justify-between">
                        <div>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{stat.label}</p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 600, margin: '4px 0 0 0' }}>{stat.value}</p>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: 'var(--radius-sm)', color: stat.color }}>
                            <stat.icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Grade Distribution Chart */}
                <div className="p-8">
                    <h3 className="mb-6 flex items-center gap-3" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                        <Target size={20} className="var(--accent-light)" />
                        Grade Distribution
                    </h3>
                    <div className="h-[300px] ">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={distribution}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                <Tooltip 
                                    contentStyle={{ background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                    {distribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Performers */}
                <div className="p-8">
                    <h3 className="mb-6 flex items-center gap-3" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                        <Trophy size={20} className="text-warning" />
                        Top Performers
                    </h3>
                    <div className="space-y-4">
                        {topPerformers.map((student, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-md  border   ">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-md var(--bg-card) var(--accent-light) flex items-center justify-center font-bold">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 600, margin: 0 }}>{student.name}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Roll No: {student.rollNo}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--accent-light)', margin: 0 }}>{student.marks}</p>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', background: 'rgba(16,185,129,0.1)', color: 'var(--success)', padding: '2px 8px', borderRadius: '4px' }}>
                                        Grade {student.grade}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {atRisk.length > 0 && (
                <div style={{ border: '1px solid rgba(239, 68, 68, 0.2)', background: 'var(--danger-bg)', padding: '32px', borderRadius: 'var(--radius-lg)' }}>
                    <h3 className="mb-6 flex items-center gap-3 text-danger" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                        <AlertCircle size={20} />
                        Performance Alerts ({atRisk.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {atRisk.map((student, i) => (
                            <div key={i} className="flex items-center p-4 rounded-md  border border-red-500/10">
                                <div className="p-2 rounded-lg bg-red-500/10 text-danger mr-3">
                                    <TrendingDown size={20} />
                                </div>
                                <div>
                                    <p style={{ fontWeight: 600, margin: 0 }}>{student.name}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Low Grade: {student.grade}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExamAnalytics;
