import { getEventDetail } from '.'
import { DOMParser } from 'xmldom'
import { EventAsset, EventDetail, TimelineData, TimelineEvent } from './Types'

const formatYear = (year: string) => {
  if (year.includes('BC')) {
    return parseInt(year.replace('BC', '')) * -1
  } else {
    return parseInt(year)
  }
}

const parseEventContent = (cell: any) => {
  const eventMedia: EventAsset = {
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

export const parseTable = async (
  table: HTMLTableElement
): Promise<TimelineEvent[] | void> => {
  const tableClass = table.getAttribute('class')
  if (tableClass !== 'wikitable') {
    return
  }
  const tableDataArray: TimelineEvent[] = []
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
        const assets = parseEventContent(eventCell)
        if (assets.links.length > 0) {
          const link = assets.links[0].getAttribute('href')
          if (eventCell) {
            let detail: EventDetail | undefined

            link ? (detail = await getEventDetail(link)) : undefined

            const encodedEvent = {
              year: formatYear(
                yearCell.textContent ? yearCell.textContent : ''
              ),
              date: dateCell.textContent ? dateCell.textContent : '',
              overview: eventCell.textContent ? eventCell.textContent : '',
              detail,
              assets,
            }
            // console.log(encodedEvent)
            tableDataArray.push(encodedEvent)
          }
        }
      }
    }
    // console.log(tableDataArray)
    return tableDataArray
  } catch (error) {
    console.error(error)
  }
}

// export const getTimelineFromTables = async (html: string) => {
//   const document = new DOMParser().parseFromString(html, 'text/html')
//   const tables = document.getElementsByTagName('table')
//   const timeline: TimelineEvent[] = []

//   for (let i = 0; i < tables.length; i++) {
//     const table = tables[i]
//     const events = await parseTable(table)
//     events && timeline.push(...events)
//   }
//   return timeline
// }
