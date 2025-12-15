import { Flex, Heading, Spinner } from '@radix-ui/themes';

export const FullPageLoader = ({ label = 'Loading…' }: { label?: string }) => {
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      gap="2"
      style={{ minHeight: '50vh' }}
    >
      <Spinner size="3" />
      <Heading size="3" color="gray">
        {label}
      </Heading>
    </Flex>
  );
};
