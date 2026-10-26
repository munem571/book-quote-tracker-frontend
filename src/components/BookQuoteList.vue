<script setup>
import { ref, onMounted } from 'vue'

// 1. Reaktives Array anlegen (startet leer).
const quotes = ref([])

// 2. Funktion zum Holen der Daten vom Backend
async function fetchQuotes() {
  try {
    const response = await fetch('https://webtech-backend-eo0l.onrender.com/api/v1/quotes')
    const data = await response.json()
    quotes.value = data
  } catch (error) {
    console.error('Fehler beim Laden der Zitate:', error)
  }
}

// 3. Beim Laden der Seite automatisch ausführen
onMounted(() => {
  fetchQuotes()
})
</script>

<template>
  <section>
    <h1>Meine Buchzitate</h1>

    <article v-for="quote in quotes" :key="quote.id">
      <h2>{{ quote.bookTitle }}</h2>
      <p>{{ quote.passageText }}</p>
      <p>Seite {{ quote.pageNumber }} · {{ quote.category }}</p>
    </article>
  </section>
</template>