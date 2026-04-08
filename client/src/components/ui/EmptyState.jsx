export default function EmptyState({ icon: Icon, title, message, action }) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '60px 24px',
            color: 'var(--text-muted)', textAlign: 'center',
        }}>
            {Icon && <Icon size={48} style={{ opacity: 0.4, marginBottom: '16px' }} />}
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary, var(--text))' }}>
                {title || 'No data yet'}
            </h3>
            <p style={{ fontSize: '14px', maxWidth: '400px', marginBottom: '20px' }}>
                {message || 'Data will appear here once records are created.'}
            </p>
            {action}
        </div>
    );
}
