import { startOfDay, addDays, format } from 'date-fns'
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz'

const TIMEZONE = 'America/Argentina/Buenos_Aires'

// Simular lo que hace app/turnos/[slug]/page.tsx
const from = startOfDay(new Date())
const to = addDays(from, 21)

console.log('📅 Fechas originales (UTC):')
console.log(`  from: ${format(from, 'dd/MM/yyyy HH:mm:ss')}`)
console.log(`  to: ${format(to, 'dd/MM/yyyy HH:mm:ss')}\n`)

// Convertir a zona local
const fromLocal = utcToZonedTime(from, TIMEZONE)
const toLocal = utcToZonedTime(to, TIMEZONE)

console.log('📅 Fechas en zona local:')
console.log(`  fromLocal: ${format(fromLocal, 'dd/MM/yyyy HH:mm:ss')}`)
console.log(`  toLocal: ${format(toLocal, 'dd/MM/yyyy HH:mm:ss')}\n`)

// Calcular startOfDay en local
const currentDate = startOfDay(fromLocal)
const endDate = startOfDay(toLocal)

console.log('📅 startOfDay en local:')
console.log(`  currentDate: ${format(currentDate, 'dd/MM/yyyy HH:mm:ss')}`)
console.log(`  endDate: ${format(endDate, 'dd/MM/yyyy HH:mm:ss')}\n`)

// Iterar
let date = new Date(currentDate)
let iteration = 0

console.log('📅 Iteración (primeros 7 días):')
while (date <= endDate && iteration < 7) {
  iteration++
  const localDate = utcToZonedTime(date, TIMEZONE)
  const dayOfWeek = localDate.getDay()
  const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  
  console.log(`  ${iteration}. ${format(localDate, 'dd/MM/yyyy')} (${DAYS[dayOfWeek]}, ${dayOfWeek})`)
  
  date = addDays(date, 1)
}


