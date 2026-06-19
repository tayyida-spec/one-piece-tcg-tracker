export type CrackableCase = {
  id: string;
  cardName: string;
  cardId: string;
  series: string;
  quantity: number;
  suggestedTxn: string | null;
};

export type CaseCrackResult = {
  caseName: string;
  cardsAdded: number;
  totalUnits: number;
  referenceTxn: string | null;
  pricesUpdated: number;
};
