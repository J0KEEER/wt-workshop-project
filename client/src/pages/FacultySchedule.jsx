import { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar, Clock, BookOpen, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function FacultySchedule() {
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        api.get('/faculty/my-schedule')
            .then(res => setSchedule(res.data))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loading"><div className="spinner"></div></div>;
    if (error) return <div className="error-state"><p>{error}</p></div>;

    // Group schedule by day
    const groupedSchedule = schedule.reduce((acc, item) => {
        const day = item.dayOfWeek;
        if (!acc[day]) acc[day] = [];
        acc[day].push(item);
        return acc;
    }, {});

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return (
        <div className="fade-in">
            <div className="section-header">
                <div>
                    <h1>My Weekly Schedule</h1>
                    <p className="text-secondary">View and manage your teaching assignments across the week.</p>
                </div>
            </div>

            <div className="schedule-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                {DAYS.map((dayName, index) => {
                    const dayClasses = groupedSchedule[index] || [];
                    const isToday = index === currentDay;

                    return (
                        <div key={dayName} className={`card ${isToday ? 'border-accent' : ''}`} style={{ 
                            position: 'relative',
                            opacity: dayClasses.length === 0 ? 0.6 : 1,
                            minHeight: '200px'
                        }}>
                            <div className="card-header" style={{ 
                                background: isToday ? 'var(--accent-glow)' : 'transparent',
                                borderBottom: '1px solid var(--border-color)',
                                padding: '16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <h3 style={{ margin: 0, fontSize: '18px', color: isToday ? 'var(--accent-light)' : 'inherit' }}>
                                    {dayName}
                                    {isToday && <span className="badge badge-primary" style={{ marginLeft: '8px', fontSize: '10px' }}>TODAY</span>}
                                </h3>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{dayClasses.length} {dayClasses.length === 1 ? 'Class' : 'Classes'}</span>
                            </div>
                            <div className="card-body" style={{ padding: '16px' }}>
                                {dayClasses.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {dayClasses.map((cl, i) => {
                                            const isLive = isToday && currentTime >= cl.startTime && currentTime <= cl.endTime;
                                            return (
                                                <div key={i} className="" style={{ 
                                                    padding: '12px', 
                                                    borderRadius: 'var(--radius-md)',
                                                    borderLeft: `4px solid ${isLive ? 'var(--success)' : 'var(--accent)'}`,
                                                    position: 'relative'
                                                }}>
                                                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
                                                        {cl.course?.title}
                                                        {isLive && <span className="badge badge-success badge-pulse" style={{ marginLeft: '8px', fontSize: '9px' }}>LIVE</span>}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {cl.startTime} - {cl.endTime}</span>
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {cl.room || 'TBA'}</span>
                                                    </div>
                                                    {isLive && (
                                                        <div style={{ marginTop: '8px' }}>
                                                            <a href={`/attendance?courseId=${cl.course?.id}`} className="btn btn-primary btn-sm" style={{ width: '100%', fontSize: '11px', padding: '6px' }}>
                                                                Mark Attendance
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                                        No classes scheduled
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
