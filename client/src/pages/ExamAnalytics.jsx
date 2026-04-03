import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Trophy, TrendingDown, Users, Target, CheckCircle, 
  AlertCircle, ArrowLeft, BarChart2 
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
                axios.get(`http://localhost:5001/api/exams/${id}/analytics`),
                axios.get(`http://localhost:5001/api/exams/${id}`)
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
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    if (!data) return <div className="text-center p-8">No analytics available for this exam.</div>;

    const { summary, distribution, topPerformers, atRisk } = data;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <button 
                        onClick={() => navigate(-1)}
                        className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Exams
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <BarChart2 className="w-8 h-8 mr-3 text-primary" />
                        {exam?.title} Performance Analytics
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Course: {exam?.course?.title} ({exam?.course?.code}) • Total Marks: {exam?.totalMarks}
                    </p>
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Average Score', value: `${summary.averageMarks}`, icon: Users, color: 'blue' },
                    { label: 'Pass Percentage', value: `${summary.passPercentage}%`, icon: CheckCircle, color: 'emerald' },
                    { label: 'Highest Marks', value: summary.highestScore, icon: Trophy, color: 'yellow' },
                    { label: 'Lowest Marks', value: summary.lowestScore, icon: TrendingDown, color: 'red' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Grade Distribution Chart */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                        <Target className="w-5 h-5 mr-2 text-primary" />
                        Grade Distribution
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={distribution}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: '#f9fafb' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {distribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Performers */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                        <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                        Top Performers
                    </h3>
                    <div className="space-y-4">
                        {topPerformers.map((student, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-transparent hover:border-gray-200 transition-all">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold mr-4">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{student.name}</p>
                                        <p className="text-xs text-gray-500">Roll No: {student.rollNo}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-primary">{student.marks}</p>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                                        Grade {student.grade}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {atRisk.length > 0 && (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-red-100 bg-red-50/10">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
                        Students Needing Attention ({atRisk.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {atRisk.map((student, i) => (
                            <div key={i} className="flex items-center p-3 rounded-xl bg-white shadow-sm border border-red-100">
                                <div className="p-2 rounded-lg bg-red-50 text-red-600 mr-3">
                                    <TrendingDown className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">{student.name}</p>
                                    <p className="text-xs text-gray-500">Grade: {student.grade}</p>
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
