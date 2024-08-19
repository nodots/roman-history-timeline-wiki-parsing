import { coordinatesResult, wikiMediaResult } from 'wikipedia'

export interface EventDetail {
  synopsis: string
  geooordinates?: coordinatesResult
  assets: EventAsset
}

export interface EventAsset {
  links: any[]
  images: any[]
  other: any[]
}

export interface TimelineEvent {
  year: number
  date: string
  overview: string
  assets: EventAsset
  detail?: EventDetail
}

export type Timeline = TimelineEvent[]

export interface TimelineProps {
  startYear?: number
  endYear?: number
}

export interface TimelineData {
  title: string
  content: string
  categories: any[]
  infobox: any[]
  links: string[]
  media: wikiMediaResult
  html: string
  intro: string
}
