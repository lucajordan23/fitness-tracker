export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('it-IT')
}

export const formatNumber = (num, decimals = 1) => {
  return Number(num).toFixed(decimals)
}

export const formatWeight = (kg) => {
  return `${formatNumber(kg, 1)} kg`
}

export const formatPercent = (value) => {
  return `${formatNumber(value, 1)}%`
}

export const formatKcal = (kcal) => {
  return `${Math.round(kcal)} kcal`
}
