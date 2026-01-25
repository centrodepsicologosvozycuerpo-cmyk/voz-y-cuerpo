import { addMinutes, setHours, setMinutes, differenceInMinutes, startOfDay } from 'date-fns'
import { utcToZonedTime } from 'date-fns-tz'

const TIMEZONE = 'America/Argentina/Buenos_Aires'

// Simular cálculo de slots para un rango
function calculateSlotsForRange(
  date: Date,
  startTime: string,
  endTime: string,
  slotMinutes: number,
  bufferMinutes: number
) {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)

  const localDate = utcToZonedTime(date, TIMEZONE)
  let slotStart = setMinutes(setHours(localDate, startHour), startMin)
  let slotEnd = setMinutes(setHours(localDate, endHour), endMin)

  const slots: string[] = []
  let iteration = 0

  while (slotStart < slotEnd && iteration < 20) {
    iteration++
    const slotEndTime = addMinutes(slotStart, slotMinutes)

    if (slotEndTime > slotEnd) {
      console.log(`  ⚠️ Slot ${slotEndTime.toISOString()} excede endTime ${slotEnd.toISOString()}, deteniendo`)
      break
    }

    slots.push(slotStart.toISOString())
    console.log(`  Slot ${slots.length}: ${slotStart.toISOString()} - ${slotEndTime.toISOString()}`)

    slotStart = addMinutes(slotEndTime, bufferMinutes)
  }

  return slots
}

console.log('🧪 TEST: Cálculo de slots para rango 09:00-18:00, slot 50min, buffer 10min\n')
const testDate = startOfDay(new Date())
const slots = calculateSlotsForRange(testDate, '09:00', '18:00', 50, 10)
console.log(`\n✅ Total slots generados: ${slots.length} (esperado: 9)`)

console.log('\n🧪 TEST: Cálculo de slots para rango 09:00-12:00, slot 50min, buffer 10min\n')
const slots2 = calculateSlotsForRange(testDate, '09:00', '12:00', 50, 10)
console.log(`\n✅ Total slots generados: ${slots2.length} (esperado: 3)`)

console.log('\n🧪 TEST: Cálculo de slots para rango 14:00-15:00, slot 50min, buffer 10min\n')
const slots3 = calculateSlotsForRange(testDate, '14:00', '15:00', 50, 10)
console.log(`\n✅ Total slots generados: ${slots3.length} (esperado: 1)`)


