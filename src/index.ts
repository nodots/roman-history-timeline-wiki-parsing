import fs from 'fs'
import wiki, { html, infobox, intro, links, media } from 'wikipedia'
import { DOMParser } from 'xmldom'

interface EventMedia {
  links: HTMLLinkElement[]
  images: HTMLImageElement[]
  other: any[]
}

interface RtEvent {
  year: string
  date: string
  event: string
  description?: string
  eventMedia: EventMedia
}

const getOverview = async (endpoint: string) => {
  const pageKey = endpoint.split('/')[2]
  try {
    const detailPage = await wiki.page(pageKey)
    const detailOverview = await detailPage.intro()
    return detailOverview
  } catch (error) {
    console.error(error)
  }
}

const getRomanHistory = async () => {
  const romanHistory = await wiki.page('Timeline_of_Roman_history')

  return {
    pageId: romanHistory.pageid,
    title: romanHistory.title,
    content: await romanHistory.content(),
    // images: await romanHistory.images(),
    categories: await romanHistory.categories(),
    infobox: await romanHistory.infobox(),
    links: await romanHistory.links(),
    media: await romanHistory.media(),
    html: await romanHistory.html(),
    intro: await romanHistory.intro(),
  }
}

const parseEventContent = (cell: any) => {
  const eventMedia: EventMedia = {
    links: [],
    images: [],
    other: [],
  }
  if (typeof cell === 'object' && cell.childNodes.length > 0) {
    for (let i = 0; i < cell.childNodes.length; i++) {
      const child = cell.childNodes[i]
      switch (child.nodeName) {
        case 'a':
          const link = child as HTMLLinkElement
          eventMedia.links.push(link)
          break
        case 'img':
          const img = child as HTMLImageElement
          eventMedia.images.push(img)
          break
        default:
          eventMedia.other.push(child)
      }
    }
  }
  return eventMedia
}

const parseTable = async (table: HTMLTableElement) => {
  const tableClass = table.getAttribute('class')
  if (tableClass !== 'wikitable') {
    return
  }
  const tableDataArray: RtEvent[] = []
  try {
    const body = table.getElementsByTagName('tbody')[0]
    const rows = body.getElementsByTagName('tr')
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const cells = row.getElementsByTagName('td')
      if (cells.length >= 2) {
        const yearCell = cells[0]
        const dateCell = cells[1]
        const eventCell = cells[2]
        const eventMedia = parseEventContent(eventCell)

        if (eventMedia.links.length > 0) {
          const link = eventMedia.links[0].getAttribute('href')
          let description = ''
          if (link) {
            description = (await getOverview(link)) || ''
          }
          if (eventCell) {
            const encodedEvent = {
              year: yearCell.textContent ? yearCell.textContent : '',
              date: dateCell.textContent ? dateCell.textContent : '',
              event: eventCell.textContent ? eventCell.textContent : '',
              description,
              eventMedia,
            }
            tableDataArray.push(encodedEvent)
          }
        }
      }
    }
  } catch (error) {
    console.error(error)
  }
  return tableDataArray
}

const parseTables = async (html: string) => {
  const document = new DOMParser().parseFromString(html, 'text/html')
  const tables = document.getElementsByTagName('table')
  const events: RtEvent[] = []

  for (let i = 0; i < tables.length; i++) {
    const table = tables[i]
    const tableData = await parseTable(table)
    if (tableData) {
      events.push(...tableData)
    }
  }
  return events
}

getRomanHistory().then((data) => {
  parseTables(data.html).then((events) => {
    console.log(events)
  })
})
