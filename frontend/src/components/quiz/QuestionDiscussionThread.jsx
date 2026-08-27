import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Flag, MessageCircle, ShieldCheck, ThumbsDown, ThumbsUp } from 'lucide-react';
import API from '../../services/api';
import MathMarkdownEditor from '../common/MathMarkdownEditor';
import MathRenderer from '../common/MathRenderer';

function CommentNode({ comment, onReply, onVote, onFlag, onVerify }) {
  const [expanded, setExpanded] = useState(true);
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState('');
  const replies = comment.replies || [];

  const submitReply = async () => {
    if (!reply.trim()) return;
    await onReply(comment.id, reply);
    setReply('');
    setReplying(false);
  };

  return (
    <article className={`border-l-2 pl-3 ${comment.isVerifiedSolution ? 'border-emerald-500' : 'border-slate-200 dark:border-slate-700'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200">{comment.author?.name || 'Learner'}</span>
            <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
            {comment.isVerifiedSolution && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"><ShieldCheck className="h-3.5 w-3.5" /> Verified Solution</span>}
          </div>
          <div className="mt-2 text-sm text-slate-700 dark:text-slate-200"><MathRenderer text={comment.content} />{comment.latexContent && <MathRenderer text={`\n\n${comment.latexContent}`} />}</div>
        </div>
        {replies.length > 0 && <button type="button" aria-label={expanded ? 'Collapse replies' : 'Expand replies'} onClick={() => setExpanded((value) => !value)} className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">{expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button>}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <button type="button" onClick={() => onVote(comment.id, 'up')} className={`inline-flex items-center gap-1 rounded-md px-2 py-1 ${comment.userVote === 'up' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><ThumbsUp className="h-3.5 w-3.5" /> {comment.upvotes}</button>
        <button type="button" onClick={() => onVote(comment.id, 'down')} className={`inline-flex items-center gap-1 rounded-md px-2 py-1 ${comment.userVote === 'down' ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><ThumbsDown className="h-3.5 w-3.5" /> {comment.downvotes}</button>
        {comment.depth < 2 && <button type="button" onClick={() => setReplying((value) => !value)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950/40"><MessageCircle className="h-3.5 w-3.5" /> Reply</button>}
        <button type="button" onClick={() => onFlag(comment.id)} aria-label="Report comment" className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"><Flag className="h-3.5 w-3.5" /></button>
        {onVerify && <button type="button" onClick={() => onVerify(comment.id, !comment.isVerifiedSolution)} className="ml-auto text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-300">{comment.isVerifiedSolution ? 'Remove verification' : 'Verify solution'}</button>}
      </div>
      {replying && <div className="mt-3 space-y-2"><textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={3} placeholder="Add a reply..." className="w-full rounded-lg border border-slate-300 bg-transparent p-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-700" /><button type="button" onClick={submitReply} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700">Post reply</button></div>}
      {expanded && replies.length > 0 && <div className="mt-4 space-y-4">{replies.map((child) => <CommentNode key={child.id} comment={child} onReply={onReply} onVote={onVote} onFlag={onFlag} onVerify={onVerify} />)}</div>}
    </article>
  );
}

export default function QuestionDiscussionThread({ questionId, userRole = 'student' }) {
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const canVerify = ['admin', 'contributor', 'educator', 'mentor', 'teaching_assistant'].includes(String(userRole).toLowerCase());

  const loadComments = useCallback(async () => {
    if (!questionId) return;
    setLoading(true);
    try {
      const response = await API.get(`/questions/${questionId}/comments`);
      setComments(response.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load the discussion.');
    } finally {
      setLoading(false);
    }
  }, [questionId]);

  useEffect(() => {
    if (!open) return undefined;
    const loadTimer = setTimeout(() => loadComments(), 0);
    return () => clearTimeout(loadTimer);
  }, [loadComments, open]);

  const postComment = async (parentCommentId = null, content = draft) => {
    if (!content.trim()) return;
    setPosting(true);
    setError('');
    try {
      await API.post(`/questions/${questionId}/comments`, { content, parentCommentId });
      setDraft('');
      await loadComments();
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to post your comment.');
    } finally {
      setPosting(false);
    }
  };

  const vote = async (commentId, value) => {
    try { await API.post(`/comments/${commentId}/vote`, { value }); await loadComments(); } catch (err) { setError(err.response?.data?.error || 'Unable to record your vote.'); }
  };
  const flag = async (commentId) => {
    try { await API.post(`/comments/${commentId}/flag`, { reason: 'other' }); await loadComments(); } catch (err) { setError(err.response?.data?.error || 'Unable to report this comment.'); }
  };
  const verify = async (commentId, verified) => {
    try { await API.put(`/comments/${commentId}/verify`, { verified }); await loadComments(); } catch (err) { setError(err.response?.data?.error || 'Unable to update verification.'); }
  };

  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/70"><span className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white"><MessageCircle className="h-4 w-4 text-indigo-500" /> Discuss this question</span>{open ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}</button>
      {open && <div className="border-t border-slate-200 p-4 dark:border-slate-700">
        {error && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
        <div className="mb-5"><MathMarkdownEditor value={draft} onChange={setDraft} label="Add a peer solution or question" id={`discussion-editor-${questionId}`} rows={4} /><button type="button" onClick={() => postComment()} disabled={posting || !draft.trim()} className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">{posting ? 'Posting...' : 'Post comment'}</button></div>
        {loading ? <p className="py-6 text-center text-sm text-slate-500">Loading discussion...</p> : comments.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">No discussion yet. Start the first thread.</p> : <div className="space-y-5">{comments.map((comment) => <CommentNode key={comment.id} comment={comment} onReply={postComment} onVote={vote} onFlag={flag} onVerify={canVerify ? verify : null} />)}</div>}
      </div>}
    </section>
  );
}
