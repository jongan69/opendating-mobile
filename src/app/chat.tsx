import ChatScreen from './chat/[pubkey]';
import { useClientReady } from '@/lib/use-client-ready';

export default function StaticChatRoute() {
  return useClientReady() ? <ChatScreen /> : null;
}
