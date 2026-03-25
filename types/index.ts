export type ReadingCategory =
  | 'personality' | 'career'  | 'wealth'   | 'love'
  | 'marriage'    | 'health'  | 'family'   | 'children'
  | 'mentor'      | 'destiny'

export type ReadingMode = 'personal' | 'compatibility' | 'idol'

export interface UserProfile {
  id: string
  email: string
  credits: number
  created_at: string
}

export interface SajuPillar {
  stem: string
  branch: string
  element: string
  polarity?: string
}

export interface SajuChart {
  year:  SajuPillar
  month: SajuPillar
  day:   SajuPillar
}

export interface Celebrity {
  id: number
  name: string
  group: string
  birth: string
  gender: string
  sign: string
}

export interface ReadingRequest {
  mode: ReadingMode
  language: string
  person1: {
    birthDate: string
    calendar: 'solar' | 'lunar'
    birthTime: string
    gender: string
    birthPlace: string
  }
  person2?: {
    birthDate: string
    calendar: 'solar' | 'lunar'
    birthTime: string
    gender: string
  }
  celebrity?: {
    name: string
    group: string
    birth: string
    gender: string
  }
  category?: ReadingCategory
}
