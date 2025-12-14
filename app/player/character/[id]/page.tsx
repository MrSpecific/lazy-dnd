import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { Box, Heading, Section, Text } from '@radix-ui/themes';

export default async function CharacterPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const character = await prisma.character.findUnique({
    where: { id },
    include: {
      race: true,
      classLevels: {
        include: { class: true },
        orderBy: { level: 'desc' },
        take: 1,
      },
    },
  });

  if (!character) {
    notFound();
  }

  const primaryClass = character.classLevels[0]?.class;

  return (
    <Section>
      <Heading>{character.name}</Heading>
      <Box mt="2">
        <Text size="3">
          {primaryClass ? primaryClass.name : 'Unclassed'} {character.race?.name ?? ''}
        </Text>
      </Box>
    </Section>
  );
}
