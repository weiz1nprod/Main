import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { getForumPosts, addForumPost, addCommentToPost } from '../lib/db';
import { ForumPost } from '../types';
import { MessageCircle, Send } from 'lucide-react';

export default function Forum({ user }: { user: User }) {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await getForumPosts();
    setPosts(data.sort((a, b) => b.createdAt - a.createdAt));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handlePost = async () => {
    if (!newPostContent.trim()) return;
    await addForumPost({
      authorId: user.uid,
      authorName: user.displayName || 'Aluno',
      content: newPostContent,
      createdAt: Date.now(),
      comments: []
    });
    setNewPostContent('');
    load();
  };

  const handleReply = async (postId: string, currentComments: any) => {
    const text = replyContent[postId];
    if (!text?.trim()) return;
    await addCommentToPost(postId, {
      authorId: user.uid,
      authorName: user.displayName || 'Aluno',
      content: text,
      createdAt: Date.now()
    }, currentComments);
    setReplyContent({ ...replyContent, [postId]: '' });
    load();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 h-full flex flex-col">
      <header className="mb-2">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Fórum de Dúvidas</h2>
        <p className="text-slate-500">Conecte-se com outros estudantes de mecânica.</p>
      </header>

      {/* New Post */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex space-x-3">
        <img src={user.photoURL || ''} alt="User" className="w-10 h-10 rounded-full" />
        <div className="flex-1 flex flex-col space-y-3">
          <textarea
            value={newPostContent}
            onChange={e => setNewPostContent(e.target.value)}
            placeholder="Qual é a sua dúvida?"
            className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
            rows={3}
          />
          <div className="flex justify-end">
            <button
              onClick={handlePost}
              disabled={!newPostContent.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <span>Publicar</span>
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-6 pb-20">
        {loading ? (
          <p className="text-center text-slate-500">Carregando discussões...</p>
        ) : posts.length === 0 ? (
          <p className="text-center text-slate-500 p-8 border border-slate-200 border-dashed rounded-2xl">Nenhuma discussão ainda. Seja o primeiro a perguntar!</p>
        ) : (
          posts.map(post => (
            <div key={post.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                  {post.authorName[0]}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">{post.authorName}</h4>
                  <p className="text-xs text-slate-400">{new Date(post.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <p className="text-slate-700 whitespace-pre-wrap">{post.content}</p>
              
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center space-x-2 text-slate-500 mb-4">
                  <MessageCircle size={18} />
                  <span className="text-sm font-medium">{post.comments?.length || 0} respostas</span>
                </div>
                
                {post.comments?.map((comment, i) => (
                  <div key={i} className="ml-4 md:ml-12 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm text-slate-800">{comment.authorName}</span>
                      <span className="text-[10px] text-slate-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-slate-600">{comment.content}</p>
                  </div>
                ))}
                
                <div className="ml-4 md:ml-12 flex space-x-2 mt-4">
                  <input
                    type="text"
                    value={replyContent[post.id] || ''}
                    onChange={e => setReplyContent({ ...replyContent, [post.id]: e.target.value })}
                    placeholder="Adicionar resposta..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleReply(post.id, post.comments);
                    }}
                  />
                  <button 
                    onClick={() => handleReply(post.id, post.comments)}
                    className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
