"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type CommentItem = {
  id: string;
  postId: string;
  parentId: string | null;
  name: string;
  body: string;
  createdAt: string;
  likeCount: number;
  likedByVisitor: boolean;
};

type CommentSectionProps = {
  slug: string;
};

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="comment-heart-icon"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    </svg>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

export default function CommentSection({ slug }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [liking, setLiking] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadComments = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/posts/${encodeURIComponent(slug)}/comments`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Comments could not be loaded.");
      }

      setComments(Array.isArray(data.comments) ? data.comments : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Comments could not be loaded. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    let savedName = "";

    try {
      savedName = window.localStorage.getItem("amebo-comment-name") || "";
    } catch {
      // Comments remain usable if browser storage is unavailable.
    }

    if (savedName) setName(savedName);

    void loadComments();
  }, [loadComments]);

  async function submitComment(
    event: FormEvent<HTMLFormElement>,
    parentId: string | null
  ) {
    event.preventDefault();

    const currentBody = parentId ? replyBody.trim() : body.trim();
    const currentName = name.trim();

    setError("");
    setNotice("");

    if (currentName.length < 2 || currentBody.length < 2) {
      setError("Enter your name and a comment of at least two characters.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/posts/${encodeURIComponent(slug)}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: currentName,
            body: currentBody,
            parentId
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Your comment could not be submitted.");
      }

      try {
        window.localStorage.setItem("amebo-comment-name", currentName);
      } catch {
        // The comment has already been saved on the server.
      }

      if (parentId) {
        setReplyBody("");
        setReplyTo(null);
      } else {
        setBody("");
      }

      setNotice("Your comment has been posted.");
      await loadComments();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Your comment could not be submitted. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleLike(comment: CommentItem) {
    if (liking) return;

    setError("");
    setLiking(comment.id);

    try {
      const response = await fetch(
        `/api/comments/${encodeURIComponent(comment.id)}/like`,
        { method: "POST" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Your like could not be saved.");
      }

      setComments((current) =>
        current.map((item) =>
          item.id === comment.id
            ? {
                ...item,
                likedByVisitor: Boolean(data.liked),
                likeCount: Number(data.likeCount) || 0
              }
            : item
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Your like could not be saved. Please try again."
      );
    } finally {
      setLiking(null);
    }
  }

  function renderComment(comment: CommentItem, isReply = false) {
    const replies = comments.filter((item) => item.parentId === comment.id);

    return (
      <article
        key={comment.id}
        className={`comment-card${isReply ? " comment-card-reply" : ""}`}
      >
        <div className="comment-avatar" aria-hidden="true">
          {comment.name.trim().charAt(0).toUpperCase()}
        </div>

        <div className="comment-content">
          <div className="comment-author-row">
            <strong className="comment-author">{comment.name}</strong>
            <time
              className="comment-date"
              dateTime={comment.createdAt}
            >
              {formatDate(comment.createdAt)}
            </time>
          </div>

          <p className="comment-message">{comment.body}</p>

          <div className="comment-actions">
            <button
              type="button"
              className={`comment-like${comment.likedByVisitor ? " is-liked" : ""}`}
              onClick={() => void toggleLike(comment)}
              disabled={liking !== null}
              aria-label={
                comment.likedByVisitor ? "Unlike comment" : "Like comment"
              }
              aria-pressed={comment.likedByVisitor}
            >
              <HeartIcon filled={comment.likedByVisitor} />
              <span>{comment.likeCount}</span>
            </button>

            {!isReply && (
              <button
                type="button"
                className="comment-reply-button"
                onClick={() => {
                  setReplyTo(comment);
                  setReplyBody("");
                  setError("");
                  setNotice("");
                }}
              >
                Reply
              </button>
            )}
          </div>

          {replyTo?.id === comment.id && (
            <form
              className="comment-form comment-reply-form"
              onSubmit={(event) => void submitComment(event, comment.id)}
            >
              <label className="comment-label" htmlFor={`reply-${comment.id}`}>
                Your reply
              </label>
              <textarea
                id={`reply-${comment.id}`}
                className="comment-textarea"
                value={replyBody}
                onChange={(event) => setReplyBody(event.target.value)}
                maxLength={1500}
                rows={3}
                placeholder="Write a thoughtful reply..."
                required
              />
              <div className="comment-form-actions">
                <button
                  type="button"
                  className="comment-cancel-button"
                  onClick={() => setReplyTo(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="comment-submit-button"
                  disabled={submitting}
                >
                  {submitting ? "Posting..." : "Post reply"}
                </button>
              </div>
            </form>
          )}

          {replies.length > 0 && (
            <div className="comment-replies">
              {replies.map((reply) => renderComment(reply, true))}
            </div>
          )}
        </div>
      </article>
    );
  }

  const topLevelComments = comments.filter((comment) => !comment.parentId);

  return (
    <section className="comments-section" aria-labelledby="comments-heading">
      <div className="comments-heading-row">
        <div>
          <p className="eyebrow">JOIN THE CONVERSATION</p>
          <h2 id="comments-heading" className="comments-title">
            Reader comments
          </h2>
          <p className="comments-description">
            Share your thoughts. Keep the conversation useful and respectful.
          </p>
        </div>
        <span className="comments-count" aria-label={`${comments.length} comments`}>
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </span>
      </div>

      <form
        className="comment-form comment-main-form"
        onSubmit={(event) => void submitComment(event, null)}
      >
        <div className="comment-form-grid">
          <div className="comment-field">
            <label className="comment-label" htmlFor={`comment-name-${slug}`}>
              Display name
            </label>
            <input
              id={`comment-name-${slug}`}
              className="comment-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={60}
              minLength={2}
              autoComplete="nickname"
              placeholder="Your name"
              required
            />
          </div>

          <div className="comment-field">
            <label className="comment-label" htmlFor={`comment-body-${slug}`}>
              Your comment
            </label>
            <textarea
              id={`comment-body-${slug}`}
              className="comment-textarea"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={1500}
              minLength={2}
              rows={4}
              placeholder="What do you think about this story?"
              required
            />
          </div>
        </div>

        <div className="comment-form-actions">
          <span className="comment-character-count">{body.length}/1500</span>
          <button
            type="submit"
            className="comment-submit-button"
            disabled={submitting}
          >
            {submitting ? "Publishing..." : "Post comment"}
          </button>
        </div>
      </form>

      {error && (
        <p className="comment-feedback comment-feedback-error" role="alert">
          {error}
          <button type="button" onClick={() => setError("")} aria-label="Dismiss error">
            ×
          </button>
        </p>
      )}

      {notice && (
        <p className="comment-feedback comment-feedback-success" role="status">
          {notice}
        </p>
      )}

      <div className="comments-list" aria-live="polite">
        {loading ? (
          <div className="comment-skeleton-list" aria-label="Loading comments">
            {[1, 2, 3].map((item) => (
              <div className="comment-skeleton" key={item}>
                <span className="skeleton-avatar" />
                <div className="skeleton-lines">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            ))}
          </div>
        ) : topLevelComments.length ? (
          topLevelComments.map((comment) => renderComment(comment))
        ) : (
          <div className="comments-empty">
            <span className="comments-empty-mark" aria-hidden="true">
              <HeartIcon filled={false} />
            </span>
            <h3>Start the conversation</h3>
            <p>Be the first to share a thought about this story.</p>
          </div>
        )}
      </div>
    </section>
  );
}
