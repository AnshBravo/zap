import { randomBytes } from "node:crypto";
import { prisma } from "../src/db/prisma.js";
import { hashPassword } from "../src/utils/password.js";

const demoUsers = [
  {
    id: "zap_seed_ari",
    username: "zap_seed_ari",
    email: "ari@zap-demo.example.test",
    bio: "Small experiments, shared in public.",
    avatarUrl: null,
  },
  {
    id: "zap_seed_mina",
    username: "zap_seed_mina",
    email: "mina@zap-demo.example.test",
    bio: "Collecting quiet corners and good light.",
    avatarUrl: null,
  },
  {
    id: "zap_seed_lee",
    username: "zap_seed_lee",
    email: "lee@zap-demo.example.test",
    bio: "Outdoors before the inbox wakes up.",
    avatarUrl: null,
  },
] as const;

const demoPosts = [
  {
    id: "zap_seed_post_01",
    authorId: "zap_seed_ari",
    content:
      "First sketch of the week. Keeping the idea small enough to finish. #buildinpublic",
    mediaUrl: "https://picsum.photos/seed/zap-seed-sketch/900/1100",
  },
  {
    id: "zap_seed_post_02",
    authorId: "zap_seed_mina",
    content:
      "The best part of a slow morning is noticing what was already there.",
    mediaUrl: "https://picsum.photos/seed/zap-seed-morning/900/1100",
  },
  {
    id: "zap_seed_post_03",
    authorId: "zap_seed_lee",
    content: "A few quiet miles before the day gets loud. #outside",
    mediaUrl:
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  },
  {
    id: "zap_seed_post_04",
    authorId: "zap_seed_ari",
    content: "What are you making this week? One sentence is enough to start.",
    mediaUrl: null,
  },
  {
    id: "zap_seed_post_05",
    authorId: "zap_seed_mina",
    content: "Found a little room for color in an otherwise monochrome week.",
    mediaUrl: "https://picsum.photos/seed/zap-seed-color/900/1100",
  },
] as const;

async function seed(): Promise<void> {
  if (process.env.ZAP_SEED_DEMO_DATA !== "1") {
    throw new Error(
      "Set ZAP_SEED_DEMO_DATA=1 to explicitly enable demo data seeding.",
    );
  }

  const passwordHash = await hashPassword(randomBytes(32).toString("hex"));

  await prisma.$transaction(
    async (tx) => {
      for (const user of demoUsers) {
        const [idOwner, usernameOwner, emailOwner] = await Promise.all([
          tx.user.findUnique({ where: { id: user.id }, select: { id: true } }),
          tx.user.findUnique({
            where: { username: user.username },
            select: { id: true },
          }),
          tx.user.findUnique({
            where: { email: user.email },
            select: { id: true },
          }),
        ]);

        if (
          (idOwner &&
            (!usernameOwner ||
              usernameOwner.id !== idOwner.id ||
              !emailOwner ||
              emailOwner.id !== idOwner.id)) ||
          (usernameOwner && usernameOwner.id !== user.id) ||
          (emailOwner && emailOwner.id !== user.id)
        ) {
          throw new Error(
            `A non-seed account conflicts with ${user.username}; no seed rows were written.`,
          );
        }

        await tx.user.upsert({
          where: { id: user.id },
          create: { ...user, passwordHash },
          update: {
            username: user.username,
            email: user.email,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
          },
        });
      }

      for (const post of demoPosts) {
        const existingPost = await tx.post.findUnique({
          where: { id: post.id },
          select: { authorId: true },
        });
        if (
          existingPost &&
          !demoUsers.some((user) => user.id === existingPost.authorId)
        ) {
          throw new Error(
            `A non-seed post conflicts with ${post.id}; no seed rows were written.`,
          );
        }

        await tx.post.upsert({
          where: { id: post.id },
          create: post,
          update: {
            authorId: post.authorId,
            content: post.content,
            mediaUrl: post.mediaUrl,
            mediaKey: null,
          },
        });
      }

      const likes = [
        { userId: "zap_seed_mina", postId: "zap_seed_post_01" },
        { userId: "zap_seed_lee", postId: "zap_seed_post_01" },
        { userId: "zap_seed_ari", postId: "zap_seed_post_02" },
        { userId: "zap_seed_mina", postId: "zap_seed_post_03" },
        { userId: "zap_seed_lee", postId: "zap_seed_post_04" },
      ];

      for (const like of likes) {
        await tx.like.upsert({
          where: { userId_postId: like },
          create: like,
          update: {},
        });
      }

      const comments = [
        {
          id: "zap_seed_comment_01",
          userId: "zap_seed_mina",
          postId: "zap_seed_post_01",
          content: "Keeping it focused makes it feel doable.",
        },
        {
          id: "zap_seed_comment_02",
          userId: "zap_seed_ari",
          postId: "zap_seed_post_03",
          content: "That is a good way to start the day.",
        },
        {
          id: "zap_seed_comment_03",
          userId: "zap_seed_lee",
          postId: "zap_seed_post_04",
          content: "A tiny photo journal app.",
        },
      ];

      for (const comment of comments) {
        const existingComment = await tx.comment.findUnique({
          where: { id: comment.id },
          select: { userId: true, postId: true },
        });
        if (
          existingComment &&
          (!demoUsers.some((user) => user.id === existingComment.userId) ||
            !demoPosts.some((post) => post.id === existingComment.postId))
        ) {
          throw new Error(
            `A non-seed comment conflicts with ${comment.id}; no seed rows were written.`,
          );
        }

        await tx.comment.upsert({
          where: { id: comment.id },
          create: comment,
          update: {
            userId: comment.userId,
            postId: comment.postId,
            content: comment.content,
          },
        });
      }

      const follows = [
        { followerId: "zap_seed_ari", followingId: "zap_seed_mina" },
        { followerId: "zap_seed_mina", followingId: "zap_seed_lee" },
        { followerId: "zap_seed_lee", followingId: "zap_seed_ari" },
      ];

      for (const follow of follows) {
        await tx.follows.upsert({
          where: { followerId_followingId: follow },
          create: follow,
          update: {},
        });
      }

      await tx.bookmark.upsert({
        where: {
          userId_postId: {
            userId: "zap_seed_ari",
            postId: "zap_seed_post_02",
          },
        },
        create: { userId: "zap_seed_ari", postId: "zap_seed_post_02" },
        update: {},
      });
    },
    { maxWait: 10000, timeout: 60000 },
  );

  console.log(
    `Demo seed complete: ${demoUsers.length} users, ${demoPosts.length} posts, likes, comments, follows, and a saved post.`,
  );
}

seed()
  .catch((error: unknown) => {
    console.error("Demo seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
