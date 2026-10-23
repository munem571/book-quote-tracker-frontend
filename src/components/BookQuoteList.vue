<script setup>
const quotes = [
  {
    id: 1,
    bookTitle: 'Clean Code',
    passageText: 'Even bad code can function.',
    pageNumber: 14,
    category: 'INSPIRATION'
  },
  {
    id: 2,
    bookTitle: 'Der Erlkönig',
    passageText: 'Wer reitet so spät durch Nacht und Wind?',
    pageNumber: 1,
    category: 'KLASSIK'
  },
  {
    id: 3,
    bookTitle: '1984',
    passageText: 'Who controls the past controls the future.',
    pageNumber: 35,
    category: 'ROMAN'
  }
]
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