'use client'
import { Card } from '@radix-ui/themes'
import { useUser } from '@stackframe/stack'

export const UserCard = () => {
  const user = useUser()
  return <Card>{user ? `Hello, ${user.displayName ?? 'anon'}` : 'You are not logged in'}</Card>
}
