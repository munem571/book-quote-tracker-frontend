<script setup>
import { ref, onMounted } from 'vue'

const apiUrl = 'https://webtech-backend-eo0l.onrender.com/api/v1/quotes'

const quotes = ref([])
const errorMessage = ref('')
const saving = ref(false)

const bookTitle = ref('')
const passageText = ref('')
const pageNumber = ref(1)
const category = ref('')

async function fetchQuotes() {
  errorMessage.value = ''

  try {
    const response = await fetch(apiUrl)

    if (!response.ok) {
      throw new Error('Zitate konnten nicht geladen werden.')
    }

    quotes.value = await response.json()
  } catch (error) {
    errorMessage.value = error.message
  }
}

async function saveQuote() {
  errorMessage.value = ''
  saving.value = true

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bookTitle: bookTitle.value.trim(),
        passageText: passageText.value.trim(),
        pageNumber: pageNumber.value,
        category: category.value.trim()
      })
    })

    if (!response.ok) {
      throw new Error('Das Zitat konnte nicht gespeichert werden.')
    }

    const savedQuote = await response.json()
    quotes.value.push(savedQuote)

    bookTitle.value = ''
    passageText.value = ''
    pageNumber.value = 1
    category.value = ''
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    saving.value = false
  }
}

onMounted(fetchQuotes)
</script>

<template>
  <section>
    <h1>Meine Buchzitate</h1>

    <form @submit.prevent="saveQuote">
      <h2>Neues Zitat hinzufügen</h2>

      <label for="bookTitle">Buchtitel</label>
      <input
          id="bookTitle"
          v-model="bookTitle"
          maxlength="255"
          required
      />

      <label for="passageText">Zitat / Textstelle</label>
      <textarea
          id="passageText"
          v-model="passageText"
          required
      ></textarea>

      <label for="pageNumber">Seitenzahl</label>
      <input
          id="pageNumber"
          v-model.number="pageNumber"
          type="number"
          min="1"
          step="1"
          required
      />

      <label for="category">Kategorie</label>
      <input
          id="category"
          v-model="category"
          maxlength="255"
          required
      />

      <button type="submit" :disabled="saving">
        {{ saving ? 'Wird gespeichert …' : 'Zitat speichern' }}
      </button>
    </form>

    <p v-if="errorMessage" role="alert">
      {{ errorMessage }}
    </p>

    <article v-for="quote in quotes" :key="quote.id">
      <h2>{{ quote.bookTitle }}</h2>
      <p>{{ quote.passageText }}</p>
      <p>Seite {{ quote.pageNumber }} · {{ quote.category }}</p>
    </article>
  </section>
</template>

<style scoped>
form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 24px 0;
}

input,
textarea,
button {
  padding: 10px;
  font: inherit;
}

textarea {
  min-height: 100px;
}

button {
  margin-top: 8px;
  cursor: pointer;
}

article {
  border: 1px solid #888;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}
</style>