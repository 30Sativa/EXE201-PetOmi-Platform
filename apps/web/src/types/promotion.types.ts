export type PromotionOffersResponse = {
  trialEnabled: boolean
  trialDays: number
  trialAlreadyUsed: boolean

  earlyBirdEnabled: boolean
  earlyBirdDiscountPercent: number
  earlyBirdCycles: number
  earlyBirdEligible: boolean

  referralEnabled: boolean
  referralBonusMessages: number
  referralCode: string
}

export type ReferralInfoResponse = {
  referralCode: string
  successfulReferrals: number
  totalBonusMessages: number
  bonusPerReferral: number
  referralEnabled: boolean
}

export type ActivateTrialResponse = {
  subscriptionId: string
  expiresAt: string
  trialDays: number
}
