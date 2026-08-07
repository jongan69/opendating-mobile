// App-level message sync.
//
// Mounted once, above the tabs, so incoming messages reach the conversation
// log whether or not the matching chat screen happens to be open. Without
// it, a message only registered while you were already looking at that
// conversation — so the matches list showed "Say hello!" next to a thread
// that already had replies waiting.

import { useEffect } from 'react';
import { getOpenDatingClient } from '@/lib/opendating/open-dating-client';
import { recordConversationEntry } from './conversation-log';

export function useConversationSync(): void {
  useEffect(() => {
    return getOpenDatingClient().subscribeToMessages((msg) => {
      recordConversationEntry(msg.conversation_pubkey, msg);
    });
  }, []);
}
