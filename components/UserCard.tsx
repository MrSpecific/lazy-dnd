'use client'
import { Card } from '@radix-ui/themes'
import { useUser, UserAvatar } from '@stackframe/stack'

export const UserCard = () => {
  const user = useUser()

  if (!user) {
    return (
      <Card>
        <UserAvatar />
        <div>You are not logged in</div>
      </Card>
    )
  }

  return (
    <Card>
      <UserAvatar />
      {`Hello, ${user.displayName ?? 'anon'}`}
    </Card>
  )
}
