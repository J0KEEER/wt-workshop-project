export function FeeStatusBadge({ status }) {
    const config = {
        paid:    { bg: 'rgba(34,197,94,0.15)', color: '#22c55e', label: 'Paid' },
        pending: { bg: 'rgba(234,179,8,0.15)',  color: '#eab308', label: 'Pending' },
        partial: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', label: 'Partial' },
        overdue: { bg: 'rgba(239,68,68,0.15)',  color: '#ef4444', label: 'Overdue' },
    };
    const c = config[status] || config.pending;

    return (
        <span style={{
            padding: '4px 10px', borderRadius: '12px', fontSize: '12px',
            fontWeight: 600, background: c.bg, color: c.color,
        }}>
            {c.label}
        </span>
    );
}

export function AttendancePercent({ value }) {
    const color = value >= 90 ? 'var(--success, #22c55e)'
        : value >= 75 ? 'var(--warning, #eab308)'
        : 'var(--danger, #ef4444)';

    return (
        <span style={{ color, fontWeight: 700, fontSize: '14px' }}>
            {value.toFixed(1)}%
        </span>
    );
}

export function AvailabilityBar({ available, total }) {
    const pct = total > 0 ? (available / total) * 100 : 0;
    const color = pct > 50 ? 'var(--success, #22c55e)'
        : pct > 20 ? 'var(--warning, #eab308)'
        : 'var(--danger, #ef4444)';

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px', color: 'var(--text-muted, #888)' }}>
                <span>{available} available</span>
                <span>{total} total</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--border-color, #333)', borderRadius: '3px' }}>
                <div style={{
                    width: `${pct}%`, height: '100%', borderRadius: '3px',
                    background: color, transition: 'width 0.3s ease',
                }} />
            </div>
        </div>
    );
}

export function StudentAvatar({ name }) {
    const initials = name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const color = `hsl(${name.charCodeAt(0) * 7 % 360}, 60%, 45%)`;

    return (
        <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: color, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 700,
        }}>
            {initials}
        </div>
    );
}
