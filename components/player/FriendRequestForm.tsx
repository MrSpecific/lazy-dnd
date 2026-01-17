'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Text,
  TextField,
} from '@radix-ui/themes';
import { Form, InputLabel } from '@/components/form';
import { requestFriend, type RequestFriendState } from '@/data/connection/requestFriend';
import { searchUsers, type SearchUsersState } from '@/data/connection/searchUsers';

const statusLabelMap = {
  PENDING: 'Pending',
  ACCEPTED: 'Connected',
  BLOCKED: 'Blocked',
} as const;

export const FriendRequestForm = () => {
  const [query, setQuery] = useState('');
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  const [searchState, searchAction, searching] = useActionState<SearchUsersState, FormData>(
    searchUsers,
    { status: 'idle', results: [] },
  );
  const [requestState, requestAction, requesting] = useActionState<RequestFriendState, FormData>(
    requestFriend,
    { status: 'idle' },
  );

  useEffect(() => {
    if (requestState.status === 'success' && requestState.addresseeId) {
      setRequestedIds((prev) => new Set(prev).add(requestState.addresseeId as string));
    }
  }, [requestState]);

  const results = searchState.results ?? [];
  const requestedSet = useMemo(() => requestedIds, [requestedIds]);

  return (
    <Card>
      <Flex direction="column" gap="3">
        <Box>
          <Heading size="4">Find friends</Heading>
          <Text size="2" color="gray">
            Search by email or display name and send a friend request.
          </Text>
        </Box>

        <Form action={searchAction} showActions={false}>
          <Flex gap="2" align="end" wrap="wrap">
            <Box style={{ flexGrow: 1, minWidth: '240px' }}>
              <InputLabel label="Search" />
              <TextField.Root
                name="query"
                value={query}
                placeholder="name or email"
                onChange={(event) => setQuery(event.target.value)}
              />
            </Box>
            <Button type="submit" disabled={!query.trim() || searching}>
              {searching ? 'Searching…' : 'Search'}
            </Button>
          </Flex>
        </Form>

        {searchState.status === 'error' && (
          <Text color="red" size="2">
            {searchState.message ?? 'Failed to search.'}
          </Text>
        )}

        {searchState.status !== 'idle' && (
          <Flex direction="column" gap="2">
            {results.length ? (
              results.map((result) => {
                const statusLabel = result.connectionStatus
                  ? statusLabelMap[result.connectionStatus]
                  : requestedSet.has(result.id)
                    ? 'Requested'
                    : null;
                const isRequestable =
                  !statusLabel && !requesting && result.connectionStatus === null;
                const subtitle = [result.name, result.email].filter(Boolean).join(' • ');

                return (
                  <Card key={result.id} variant="surface">
                    <Flex align="center" justify="between" gap="2" wrap="wrap">
                      <Box>
                        <Heading size="3">{result.name ?? result.email ?? 'Unknown player'}</Heading>
                        {subtitle && (
                          <Text size="1" color="gray">
                            {subtitle}
                          </Text>
                        )}
                        {result.connectionStatus === 'PENDING' &&
                          result.connectionDirection === 'incoming' && (
                            <Text size="1" color="gray">
                              They sent you a request.
                            </Text>
                          )}
                      </Box>

                      <Flex align="center" gap="2">
                        {statusLabel && (
                          <Badge color="gray" variant="soft">
                            {statusLabel}
                          </Badge>
                        )}
                        <Form action={requestAction} showActions={false}>
                          <input type="hidden" name="addresseeId" value={result.id} />
                          <Button type="submit" disabled={!isRequestable}>
                            {requesting ? 'Sending…' : 'Request'}
                          </Button>
                        </Form>
                      </Flex>
                    </Flex>
                  </Card>
                );
              })
            ) : (
              <Text size="2" color="gray">
                No users match that search.
              </Text>
            )}
          </Flex>
        )}

        {requestState.status === 'error' && (
          <Text color="red" size="2">
            {requestState.message ?? 'Failed to send request.'}
          </Text>
        )}
      </Flex>
    </Card>
  );
};
