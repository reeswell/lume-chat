-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "mobilePhone" TEXT,
    "avatar" TEXT NOT NULL DEFAULT '',
    "signature" TEXT NOT NULL DEFAULT '这个人很懒，暂时没有签名哦！',
    "nickname" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "province" TEXT NOT NULL DEFAULT '广东省',
    "city" TEXT NOT NULL DEFAULT '广州市',
    "gender" TEXT NOT NULL DEFAULT 'secret',
    "age" INTEGER NOT NULL DEFAULT 18,
    "signUpTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "friendId" TEXT,
    "groupId" TEXT,
    "lastMessage" TEXT NOT NULL DEFAULT '',
    "lastMessageAt" TIMESTAMP(3),
    "unread" INTEGER NOT NULL DEFAULT 0,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatGroup" (
    "id" TEXT NOT NULL,
    "groupCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "desc" TEXT NOT NULL DEFAULT '',
    "img" TEXT NOT NULL DEFAULT '/img/group.svg',
    "userNum" INTEGER NOT NULL DEFAULT 1,
    "type" TEXT NOT NULL DEFAULT 'group',
    "grades" TEXT NOT NULL DEFAULT '1',
    "joinApproval" BOOLEAN NOT NULL DEFAULT false,
    "holderId" TEXT NOT NULL,
    "holderName" TEXT NOT NULL,
    "createDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "manager" BOOLEAN NOT NULL DEFAULT false,
    "holder" BOOLEAN NOT NULL DEFAULT false,
    "card" TEXT,

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friend" (
    "id" TEXT NOT NULL,
    "selfId" TEXT NOT NULL,
    "otherId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "createDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Friend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "senderId" TEXT,
    "userName" TEXT NOT NULL DEFAULT '',
    "nickname" TEXT NOT NULL DEFAULT '',
    "avatar" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "style" TEXT NOT NULL DEFAULT 'mess',
    "type" TEXT NOT NULL DEFAULT 'message',
    "state" TEXT,
    "status" TEXT,
    "targetUserId" TEXT,
    "targetGroupId" TEXT,
    "friendRoom" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageRead" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_userName_key" ON "User"("userName");

-- CreateIndex
CREATE UNIQUE INDEX "User_mobilePhone_key" ON "User"("mobilePhone");

-- CreateIndex
CREATE INDEX "Conversation_roomId_idx" ON "Conversation"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_ownerId_roomId_key" ON "Conversation"("ownerId", "roomId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatGroup_groupCode_key" ON "ChatGroup"("groupCode");

-- CreateIndex
CREATE INDEX "ChatGroup_title_idx" ON "ChatGroup"("title");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_groupId_userId_key" ON "GroupMember"("groupId", "userId");

-- CreateIndex
CREATE INDEX "Friend_roomId_idx" ON "Friend"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "Friend_selfId_otherId_key" ON "Friend"("selfId", "otherId");

-- CreateIndex
CREATE INDEX "Message_roomId_createdAt_idx" ON "Message"("roomId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MessageRead_messageId_userId_key" ON "MessageRead"("messageId", "userId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatGroup" ADD CONSTRAINT "ChatGroup_holderId_fkey" FOREIGN KEY ("holderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ChatGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_selfId_fkey" FOREIGN KEY ("selfId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friend" ADD CONSTRAINT "Friend_otherId_fkey" FOREIGN KEY ("otherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageRead" ADD CONSTRAINT "MessageRead_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
