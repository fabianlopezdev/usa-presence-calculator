import { H1, Paragraph, YStack } from 'tamagui';

export default function HomeScreen() {
  return (
    <YStack f={1} ai="center" jc="center" p="$4" bg="$background">
      <H1 mb="$2">USA Presence Calculator</H1>
      <Paragraph theme="alt1" size="$6">
        Track your path to citizenship
      </Paragraph>
    </YStack>
  );
}
