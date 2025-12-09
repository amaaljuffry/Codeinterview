import { Card, Flex, Text } from '@radix-ui/themes'

/**
 * Feature card component for displaying feature highlights
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Lucide icon component
 * @param {string} props.title - Feature title
 * @param {string} props.description - Feature description
 */
export default function FeatureCard({ icon: Icon, title, description }) {
  return (
    <Card style={{ background: '#0a0a0a', border: '1px solid #27272a' }}>
      <Flex direction="column" p="2">
        <Icon className="w-8 h-8 mb-3 text-zinc-400" />
        <Text size="3" weight="medium" mb="1">{title}</Text>
        <Text size="2" color="gray">
          {description}
        </Text>
      </Flex>
    </Card>
  )
}
