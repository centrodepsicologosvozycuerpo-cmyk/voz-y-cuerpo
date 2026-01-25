import { startOfDay, addDays, format } from 'date-fns'
import { utcToZonedTime } from 'date-fns-tz'

const TIMEZONE = 'America/Argentina/Buenos_Aires'

// Simular exactamente lo que hace getAvailableSlots
const from = startOfDay(new Date())
const fromLocal = utcToZonedTime(from, TIMEZONE)
const currentDate = startOfDay(fromLocal)

console.log('📅 Fechas:')
console.log(`  from: ${format(from, 'dd/MM/yyyy HH:mm:ss')}`)
console.log(`  fromLocal: ${format(fromLocal, 'dd/MM/yyyy HH:mm:ss')}`)
console.log(`  currentDate: ${format(currentDate, 'dd/MM/yyyy HH:mm:ss')}\n`)

let date = new Date(currentDate)
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

console.log('📅 Iteración (primeros 10 días):')
for (let i = 0; i < 10; i++) {
  const localDate = new Date(date)
  const dayOfWeek = localDate.getDay()
  const dateStr = format(localDate, 'dd/MM/yyyy')
  
  console.log(`  ${i + 1}. ${dateStr} (${DAYS[dayOfWeek]}, ${dayOfWeek})`)
  
  if (dateStr === '30/12/2025') {
    console.log(`     🎯 ENCONTRADO: Martes 30/12`)
  }
  
  date = addDays(date, 1)
}

