"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  Lightbulb,
  Plus,
  Trash2,
  Send,
  X,
  User,
} from "lucide-react";

interface PostUser {
  id: string;
  name: string | null;
  department: string | null;
  image: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  post: PostUser; // user relation named 'post' in schema
}

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  user: PostUser;
  comments: Comment[];
}

export default function IdeasPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/ideas");
      if (!res.ok) throw new Error();
      const { data } = await res.json();
      setPosts(data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    // 현재 사용자 정보 가져오기
    fetch("/api/users/me")
      .then((r) => r.json())
      .then(({ data }) => {
        setCurrentUserId(data?.id || null);
        setCurrentUserRole(data?.role || null);
      })
      .catch(() => {});
  }, [fetchPosts]);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast({ title: "제목과 내용을 모두 입력해주세요.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });
      if (!res.ok) throw new Error();
      setTitle("");
      setContent("");
      setShowForm(false);
      toast({ title: "아이디어가 등록되었습니다!" });
      fetchPosts();
    } catch {
      toast({ title: "등록 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("이 게시글을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/ideas/${postId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "게시글이 삭제되었습니다." });
      fetchPosts();
    } catch {
      toast({ title: "삭제 중 오류가 발생했습니다.", variant: "destructive" });
    }
  };

  const handleComment = async (postId: string) => {
    const text = commentTexts[postId] || "";
    if (!text.trim()) return;
    setCommentSubmitting(true);
    try {
      const res = await fetch(`/api/ideas/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim() }),
      });
      if (!res.ok) throw new Error();
      setCommentTexts((prev) => ({ ...prev, [postId]: "" }));
      // 댓글 다시 로드
      const detailRes = await fetch(`/api/ideas/${postId}`);
      const { data } = await detailRes.json();
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, comments: data.comments }
            : p
        )
      );
    } catch {
      toast({ title: "댓글 등록 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string, postId: string) => {
    if (!confirm("이 댓글을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/ideas/comments/${commentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      // 댓글 다시 로드
      const detailRes = await fetch(`/api/ideas/${postId}`);
      const { data } = await detailRes.json();
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, comments: data.comments }
            : p
        )
      );
    } catch {
      toast({ title: "댓글 삭제 중 오류가 발생했습니다.", variant: "destructive" });
    }
  };

  const canDelete = (userId: string) =>
    userId === currentUserId || currentUserRole === "ADMIN";

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-6 w-6 text-yellow-500" />
          <h2 className="text-2xl font-bold">업무 자동화 아이디어 수집함</h2>
        </div>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="gap-2"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "취소" : "새 아이디어"}
        </Button>
      </div>

      {/* 작성 폼 */}
      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <Input
              placeholder="제목 (예: 주간보고서 자동 생성)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              placeholder="불편한 점이나 자동화 아이디어를 자유롭게 작성해주세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={submitting}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {submitting ? "등록 중..." : "등록"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 게시글 목록 */}
      {loading ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            불러오는 중...
          </CardContent>
        </Card>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            아직 등록된 아이디어가 없습니다.
            <br />
            첫 번째 아이디어를 등록해보세요!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            return (
              <Card key={post.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base">{post.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>
                          {post.user.name || "팀원"}
                          {post.user.department && ` (${post.user.department})`}
                        </span>
                        <span>·</span>
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                    </div>
                    {canDelete(post.user.id) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(post.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm whitespace-pre-wrap">{post.content}</p>

                  {/* 댓글 영역 (항상 표시) */}
                  <div className="border-t pt-3 space-y-3">
                    {post.comments && post.comments.length > 0 && (
                      <div className="space-y-2">
                        {post.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="flex items-start gap-2 bg-muted/50 rounded-lg p-2.5"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">
                                  {comment.post.name || "팀원"}
                                </span>
                                <span>·</span>
                                <span>{formatDate(comment.createdAt)}</span>
                              </div>
                              <p className="text-sm mt-0.5 whitespace-pre-wrap">
                                {comment.content}
                              </p>
                            </div>
                            {canDelete(comment.post.id) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeleteComment(comment.id, post.id)
                                }
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive shrink-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 댓글 입력 */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="댓글을 입력하세요..."
                        value={commentTexts[post.id] || ""}
                        onChange={(e) =>
                          setCommentTexts((prev) => ({
                            ...prev,
                            [post.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleComment(post.id);
                          }
                        }}
                        className="h-8 text-sm"
                      />
                      <Button
                        size="sm"
                        className="h-8 px-3"
                        onClick={() => handleComment(post.id)}
                        disabled={
                          commentSubmitting ||
                          !(commentTexts[post.id] || "").trim()
                        }
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
