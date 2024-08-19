import wiki, { Page } from 'wikipedia'
import { parseTable } from './helpers'
import { coordinatesResult } from 'wikipedia'
import {
  EventAsset,
  EventDetail,
  Timeline,
  TimelineData,
  TimelineEvent,
} from './Types'
import { DOMParser } from 'xmldom'
import { writeFile } from 'fs'

const getEventAssets = async (page: Page): Promise<EventAsset> => {
  return {
    links: await page.links(),
    images: await page.images(),
    other: [await page.media()],
  }
}

const getTimelineDataFromWiki = async (): Promise<TimelineData> => {
  const timeline = await wiki.page('Timeline_of_Roman_history')
  const content = await timeline.content()
  const categories = await timeline.categories()
  const infobox = await timeline.infobox()
  const links = await timeline.links()
  const media = await timeline.media()
  const html = await timeline.html()
  const intro = await timeline.intro()
  return {
    title: timeline.title,
    content,
    categories,
    infobox,
    links,
    media,
    html,
    intro,
  }
}

export const getEventDetail = async (query: string): Promise<EventDetail> => {
  const eventDetail: EventDetail = {
    synopsis: '',
    assets: {
      links: [],
      images: [],
      other: [],
    },
  }
  try {
    const search = await wiki.search(query)
    const key = search.results[0].title

    const childPage = await wiki.page(key)

    const assets = await getEventAssets(childPage)
    eventDetail.synopsis = await childPage.intro()
    eventDetail.geooordinates = await childPage.coordinates()
    eventDetail.assets = assets
  } catch (error) {
    // console.error(error)
  }
  return eventDetail
}

const buildMapUrl = (coordinates: coordinatesResult | undefined) => {
  const lat = coordinates?.lat || 33.09
  const lon = coordinates?.lon || 41.89
  const url = `https://www.openhistoricalmap.org/?mlat=${lat}&mlon=${lon}&zoom=13#map=17/41.89511/12.47703&layers=&daterange=-43-03-01,-3-03-31`
  return url
}

const saveEvent = async (event: TimelineEvent) => {
  try {
    const jsonEvent = {
      year: event.year,
      date: event.date,
      title: event.overview,
      synopsis: event.detail?.synopsis,
      geocoordinates: event.detail?.geooordinates,
      mapUrl: buildMapUrl(event.detail?.geooordinates),
    }
    writeFile(
      'timeline.json',
      JSON.stringify(jsonEvent, null, 2) + ',\n',
      { flag: 'a' },
      (err) => {
        if (err) {
          console.error(err)
        }
      }
    )
  } catch (e) {
    console.warn(e)
  }
}

const main = () => {
  getTimelineDataFromWiki().then((wikiData) => {
    const rawHtml = wikiData.html
    const document = new DOMParser().parseFromString(rawHtml, 'text/html')
    const tables = document.getElementsByTagName('table')
    const timeline: Timeline = []
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i]
      if (table.getAttribute('class') === 'wikitable') {
        parseTable(table).then((events) => {
          events?.forEach(async (event) => {
            await saveEvent(event)
          })
        })
      }
    }
  })
}

// const timeline: Timeline = []
// getTimelineDataFromWiki().then((data) => {
//   console.log(data.title)
//   getTimelineFromTables(data.html, startYear, endYear).then((events) => {
//     events && timeline.push(...events)
//   })
// })
// console.log(`Timeline:`, timeline)
// return timeline

main()
