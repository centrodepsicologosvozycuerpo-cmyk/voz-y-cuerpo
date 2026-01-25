import { startOfDay, addDays, format } from 'date-fns'
import { utcToZonedTime } from 'date-fns-tz'

const TIMEZONE = 'America/Argentina/Buenos_Aires'

const from = startOfDay(new Date())
const to = addDays(from, 6)

console.log('🧪 TEST: Iteración de fechas\n')
console.log(`Desde: ${format(from, 'dd/MM/yyyy')}`)
console.log(`Hasta: ${format(to, 'dd/MM/yyyy')}\n`)

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

let date = new Date(from)
let iteration = 0

while (date <= to && iteration < 10) {
  iteration++
  const localDate = utcToZonedTime(date, TIMEZONE)
  const dayOfWeek = localDate.getDay()
  const dateStr = format(localDate, 'dd/MM/yyyy')
  
  console.log(`Iteración ${iteration}: ${dateStr} (${DAYS[dayOfWeek]}, dayOfWeek=${dayOfWeek})`)
  
  date = addDays(date, 1)
}


