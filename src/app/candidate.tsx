import CandidateDetail from './candidate/[pubkey]';
import { useClientReady } from '@/lib/use-client-ready';

export default function StaticCandidateRoute() {
  return useClientReady() ? <CandidateDetail /> : null;
}
