CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" VARCHAR(60) NOT NULL,
    "body" VARCHAR(1500) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommentLike" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "visitorId" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentLike_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Comment_postId_createdAt_idx"
    ON "Comment"("postId", "createdAt");

CREATE INDEX "Comment_parentId_idx"
    ON "Comment"("parentId");

CREATE UNIQUE INDEX "CommentLike_commentId_visitorId_key"
    ON "CommentLike"("commentId", "visitorId");

CREATE INDEX "CommentLike_commentId_idx"
    ON "CommentLike"("commentId");

ALTER TABLE "Comment"
    ADD CONSTRAINT "Comment_postId_fkey"
    FOREIGN KEY ("postId") REFERENCES "Post"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Comment"
    ADD CONSTRAINT "Comment_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "Comment"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommentLike"
    ADD CONSTRAINT "CommentLike_commentId_fkey"
    FOREIGN KEY ("commentId") REFERENCES "Comment"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
