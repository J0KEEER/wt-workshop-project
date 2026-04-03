import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { 
    MessageSquare, Send, Smile, Frown, Meh, Loader2, 
    BookOpen, Heart, ShieldCheck, Info, Sparkles, MessageCircle
} from 'lucide-react';

export default function Feedback() {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Simple local sentiment engine to preview before submission
  const [previewSentiment, setPreviewSentiment] = useState('neutral');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/courses');
        setCourses(res.data);
        setLoading(false);
      } catch (err) {
        toast.error("Failed to load courses");
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    // Quick heuristic for preview sentiment
    const positiveWords = ['good', 'great', 'excellent', 'awesome', 'nice', 'happy', 'love', 'amazing', 'best', 'helpful', 'clear'];
    const negativeWords = ['bad', 'poor', 'terrible', 'worst', 'unhappy', 'hate', 'boring', 'difficult', 'hard', 'unclear', 'confused'];
    
    const words = content.toLowerCase().split(/\s+/);
    let score = 0;
    words.forEach(w => {
      if (positiveWords.includes(w)) score++;
      if (negativeWords.includes(w)) score--;
    });

    if (score > 0) setPreviewSentiment('positive');
    else if (score < 0) setPreviewSentiment('negative');
    else setPreviewSentiment('neutral');
  }, [content]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourseId || !content.trim()) {
      toast.warning("Please select a course and provide feedback");
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/feedback', {
        courseId: parseInt(selectedCourseId),
        content
      });
      toast.success("Feedback submitted successfully. Thank you!");
      setContent('');
      setSelectedCourseId('');
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="loading-container" style={{ height: '60vh' }}>
      <Loader2 className="spinner" size={48} />
      <p style={{ marginTop: '16px' }}>Preparing Student Voice Portal...</p>
    </div>
  );

  return (
    <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Student Voice Hero */}
      <div className="card hero-card shadow-accent" style={{ marginBottom: '32px' }}>
          <div className="card-body" style={{ padding: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                      <div className="badge badge-info" style={{ marginBottom: '12px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                          <ShieldCheck size={12} style={{ marginRight: '6px' }} /> ANONYMOUS RESPONSE
                      </div>
                      <h1 style={{ margin: 0, fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                          Institutional Feedback
                      </h1>
                      <p style={{ margin: '12px 0 0 0', fontSize: '1.1rem', opacity: 0.9, maxWidth: '550px', lineHeight: '1.6' }}>
                          Your voice shapes the future of learning. Share your honest insights on academic courses and faculty interaction.
                      </p>
                  </div>
                  <div className="glass-morph" style={{ padding: '24px', borderRadius: '50%', color: 'var(--accent-light)' }}>
                      <Sparkles size={48} />
                  </div>
              </div>
          </div>
      </div>

      <div className="card glass-morph" style={{ padding: '40px', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, var(--accent-light), transparent)' }}></div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
            <div className="form-group">
              <label style={{ fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={18} className="text-accent" /> Targeted Academic Course
              </label>
              <div className="input-with-icon">
                <select
                  className="form-control glass-morph"
                  style={{ height: '56px', fontSize: '1rem', paddingLeft: '16px' }}
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Course for Review --</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      [{course.code}] {course.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={18} className="text-accent" /> Elaborated Insight
              </label>
              <div style={{ position: 'relative' }}>
                <textarea
                  className="form-control glass-morph"
                  style={{ minHeight: '200px', paddingTop: '20px', paddingLeft: '20px', fontSize: '1.05rem', lineHeight: '1.6' }}
                  placeholder="Share your detailed experience regarding teaching methodologies, materials, and overall engagement..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
                
                {/* Real-time Sentiment Intelligence Preview */}
                <div className="glass-morph sentiment-intelligence" style={{ 
                    position: 'absolute', 
                    bottom: '16px', 
                    right: '16px',
                    padding: '8px 16px',
                    borderRadius: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(12px)'
                }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.7 }}>Analysis:</span>
                  <div className="sentiment-visualization">
                    {previewSentiment === 'positive' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4ade80' }}>
                           <Smile size={18} /> <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Positive Reception</span>
                        </div>
                    )}
                    {previewSentiment === 'negative' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171' }}>
                           <Frown size={18} /> <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Critical Insight</span>
                        </div>
                    )}
                    {previewSentiment === 'neutral' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
                           <Meh size={18} /> <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Awaiting Depth</span>
                        </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={submitting}
              style={{ padding: '16px', borderRadius: '14px', fontSize: '1.1rem', fontWeight: 700, justifyContent: 'center', gap: '12px' }}
            >
              {submitting ? <Loader2 className="spinner" size={22} /> : <Send size={22} />}
              <span>{submitting ? 'Encrypting Submission...' : 'Transmit Anonymous Feedback'}</span>
            </button>
          </div>
        </form>
      </div>

      <div className="card glass-morph" style={{ marginTop: '32px', padding: '24px 32px', display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{ height: '56px', width: '56px', borderRadius: '16px', background: 'rgba(var(--primary-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-light)', flexShrink: 0 }}>
            <Info size={28} />
        </div>
        <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>Integrity & Transparency</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, lineHeight: '1.5' }}>
               Feedback is processed through an automated NLP engine for sentiment aggregation. Individual identities are never exposed to faculty members; results are strictly course-level metadata.
            </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .sentiment-intelligence {
          animation: slideUp 0.4s ease-out forwards;
        }
        @keyframes slideUp {
          0% { transform: translateY(10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .sentiment-visualization {
          animation: pulseFade 2s infinite ease-in-out;
        }
        @keyframes pulseFade {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
      `}} />
    </div>
  );
}
