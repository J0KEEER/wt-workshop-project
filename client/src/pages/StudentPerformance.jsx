import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip 
} from 'recharts';
import { 
    Trophy, Target, BookOpen, Award, 
    TrendingUp, Star, ChevronRight
} from 'lucide-react';

const StudentPerformance = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/performance/summary')
            .then(res => setData(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading"><div className="spinner"></div></div>;
    if (!data) return <div className="error-state">Error loading performance data</div>;

    return (
        <div className="fade-in space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card glass stats-card">
                    <div className="stats-icon bg-primary/10 text-primary">
                        <Award size={24} />
                    </div>
                    <div className="stats-info">
                        <p className="stats-label">Current GPA</p>
                        <h3>{data.gpa}</h3>
                    </div>
                </div>
                <div className="card glass stats-card">
                    <div className="stats-icon bg-emerald/10 text-emerald">
                        <BookOpen size={24} />
                    </div>
                    <div className="stats-info">
                        <p className="stats-label">Credits Earned</p>
                        <h3>{data.totalCredits}</h3>
                    </div>
                </div>
                <div className="card glass stats-card">
                    <div className="stats-icon bg-warning/10 text-warning">
                        <Star size={24} />
                    </div>
                    <div className="stats-info">
                        <p className="stats-label">Total Exams</p>
                        <h3>{data.results.length}</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card glass">
                    <div className="card-header">
                        <h3><Target size={18} className="mr-2" /> Subject Strengths</h3>
                    </div>
                    <div style={{ height: '300px', width: '100%', marginTop: '20px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.subjectStrengths}>
                                <PolarGrid stroke="var(--border)" opacity={0.3} />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Performance"
                                    dataKey="score"
                                    stroke="var(--accent)"
                                    fill="var(--accent)"
                                    fillOpacity={0.6}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card glass">
                    <div className="card-header">
                        <h3><TrendingUp size={18} className="mr-2" /> GPA Trend</h3>
                    </div>
                    <div style={{ height: '300px', width: '100%', marginTop: '20px' }}>
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '100px' }}>
                            Historical GPA data will appear after the first semester.
                        </p>
                    </div>
                </div>
            </div>

            <div className="card glass">
                <div className="card-header">
                    <h3>Recent Exam Results</h3>
                </div>
                <div className="table-wrapper" style={{ marginTop: '20px' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Exam</th>
                                <th>Course</th>
                                <th>Score</th>
                                <th>Grade</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.results.map(r => (
                                <tr key={r.id}>
                                    <td style={{ fontWeight: 600 }}>{r.exam}</td>
                                    <td>{r.course}</td>
                                    <td>{r.marks} / {r.total}</td>
                                    <td>
                                        <span className={`badge ${r.grade === 'F' ? 'badge-danger' : r.grade?.startsWith('A') ? 'badge-success' : 'badge-info'}`}>
                                            {r.grade}
                                        </span>
                                    </td>
                                    <td className="text-secondary">{r.date}</td>
                                </tr>
                            ))}
                            {data.results.length === 0 && (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>No exam results available yet</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StudentPerformance;
