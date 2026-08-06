export type DealStage = 'Discovery' | 'Proposal' | 'Negotiation' | 'Closed won';

export type StageFilter = DealStage | 'All stages';

export type Deal = {
  id: string;
  name: string;
  account: string;
  stage: DealStage;
  value: number;
};
