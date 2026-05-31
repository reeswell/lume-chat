import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { friendRoomId } from '../src/common/selects'

const prisma = new PrismaClient()
const defaultAvatar = ''
const defaultGroupAvatar = '/img/group.svg'

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10)

  const official = await prisma.user.upsert({
    where: { userName: 'vueChat' },
    update: { avatar: defaultAvatar },
    create: {
      userName: 'vueChat',
      passwordHash,
      nickname: 'LumeChat',
      avatar: defaultAvatar,
      signature: '系统通知与申请助手',
    },
  })

  const alice = await prisma.user.upsert({
    where: { userName: 'alice' },
    update: { avatar: defaultAvatar },
    create: {
      userName: 'alice',
      passwordHash,
      nickname: 'Alice',
      mobilePhone: '18800000001',
      avatar: defaultAvatar,
      signature: '保持在线，也保持好奇。',
    },
  })

  const bob = await prisma.user.upsert({
    where: { userName: 'bob' },
    update: { avatar: defaultAvatar },
    create: {
      userName: 'bob',
      passwordHash,
      nickname: 'Bob',
      mobilePhone: '18800000002',
      avatar: defaultAvatar,
      signature: '今天也适合发消息。',
    },
  })

  const roomId = [alice.id, bob.id].sort().join('-')
  await prisma.friend.upsert({
    where: { selfId_otherId: { selfId: alice.id, otherId: bob.id } },
    update: {},
    create: { selfId: alice.id, otherId: bob.id, roomId },
  })
  await prisma.friend.upsert({
    where: { selfId_otherId: { selfId: bob.id, otherId: alice.id } },
    update: {},
    create: { selfId: bob.id, otherId: alice.id, roomId },
  })

  await prisma.conversation.upsert({
    where: { ownerId_roomId: { ownerId: alice.id, roomId } },
    update: {},
    create: {
      ownerId: alice.id,
      roomId,
      title: bob.nickname,
      avatar: bob.avatar,
      type: 'friend',
      friendId: bob.id,
      lastMessage: '欢迎来到 LumeChat',
      lastMessageAt: new Date(),
    },
  })

  await prisma.conversation.upsert({
    where: { ownerId_roomId: { ownerId: bob.id, roomId } },
    update: {},
    create: {
      ownerId: bob.id,
      roomId,
      title: alice.nickname,
      avatar: alice.avatar,
      type: 'friend',
      friendId: alice.id,
      lastMessage: '欢迎来到 LumeChat',
      lastMessageAt: new Date(),
    },
  })

  for (const user of [alice, bob]) {
    const sysRoom = friendRoomId(user.id, official.id)
    await prisma.conversation.upsert({
      where: { ownerId_roomId: { ownerId: user.id, roomId: sysRoom } },
      update: {},
      create: {
        ownerId: user.id,
        roomId: sysRoom,
        title: official.nickname,
        avatar: official.avatar,
        type: 'system',
        friendId: official.id,
      },
    })
  }

  const group = await prisma.chatGroup.upsert({
    where: { groupCode: 'GENERAL' },
    update: { img: defaultGroupAvatar },
    create: {
      groupCode: 'GENERAL',
      title: 'General',
      desc: '默认群聊',
      img: defaultGroupAvatar,
      holderId: alice.id,
      holderName: alice.userName,
      userNum: 2,
      members: {
        create: [
          { userId: alice.id, userName: alice.userName, manager: true, holder: true, card: alice.nickname },
          { userId: bob.id, userName: bob.userName, card: bob.nickname },
        ],
      },
    },
  })

  for (const user of [alice, bob]) {
    await prisma.conversation.upsert({
      where: { ownerId_roomId: { ownerId: user.id, roomId: group.id } },
      update: {},
      create: {
        ownerId: user.id,
        roomId: group.id,
        title: group.title,
        avatar: group.img,
        type: group.type,
        groupId: group.id,
      },
    })
  }

  await prisma.message.createMany({
    data: [
      {
        roomId,
        senderId: alice.id,
        userName: alice.userName,
        nickname: alice.nickname,
        avatar: alice.avatar,
        content: '欢迎来到 LumeChat',
      },
      {
        roomId: group.id,
        senderId: bob.id,
        userName: bob.userName,
        nickname: bob.nickname,
        avatar: bob.avatar,
        content: 'General 群已经准备好了。',
      },
    ],
  })
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    // eslint-disable-next-line node/prefer-global/process
    process.exit(1)
  })
